const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const s3Service = require('../services/s3Service');
const File = require('../models/File');
const Project = require('../models/Project');

// Upload file to S3
router.post('/upload', auth, async (req, res) => {
  try {
    const { projectId, fileName, filePath, content } = req.body;

    // Verify project ownership
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    if (project.userId.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    // Upload to S3
  const s3Key = `projects/${projectId}${filePath}/${fileName}`;
  await s3Service.uploadFile(s3Key, content);

  // Get signed URL
  const downloadUrl = await s3Service.getFileUrl(s3Key);

    // Update or create file document with s3Key
    let file = await File.findOne({
      projectId,
      name: fileName,
      path: filePath
    });

    if (file) {
      file.s3Key = s3Key;
      file.content = null; // Don't store content in DB if using S3
      await file.save();
    } else {
      file = new File({
        name: fileName,
        type: 'file',
        projectId,
        path: filePath,
        s3Key,
        content: null,
        language: getLanguageFromExtension(fileName)
      });
      await file.save();
    }

    res.json({
      message: 'File uploaded successfully',
      file: {
        _id: file._id,
        name: file.name,
        type: file.type,
        path: file.path,
        s3Key: file.s3Key,
        downloadUrl,
        language: file.language
      }
    });
  } catch (error) {
    console.error('S3 upload error:', error);
    res.status(500).json({ error: 'Upload failed', details: error.message });
  }
});

// Download file from S3
router.get('/download/:fileId', auth, async (req, res) => {
  try {
    const file = await File.findById(req.params.fileId);

    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    // Verify project access
    const project = await Project.findById(file.projectId);
    if (project.userId.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    // If file has s3Key, download from S3
    if (file.s3Key) {
      const content = await s3Service.downloadFile(file.s3Key);
      res.setHeader('Content-Type', 'application/octet-stream');
      res.setHeader('Content-Disposition', `attachment; filename="${file.name}"`);
      res.send(content);
    } else if (file.content) {
      // Fallback to DB content
      res.setHeader('Content-Type', 'application/octet-stream');
      res.setHeader('Content-Disposition', `attachment; filename="${file.name}"`);
      res.send(file.content);
    } else {
      res.status(404).json({ error: 'File content not found' });
    }
  } catch (error) {
    console.error('Download error:', error);
    res.status(500).json({ error: 'Download failed', details: error.message });
  }
});

// Delete file from S3
router.delete('/delete/:fileId', auth, async (req, res) => {
  try {
    const file = await File.findById(req.params.fileId);

    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    // Verify project access
    const project = await Project.findById(file.projectId);
    if (project.userId.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    // Delete from S3 if exists
    if (file.s3Key) {
      await s3Service.deleteFile(file.s3Key);
    }

    // Delete from database
    await File.findByIdAndDelete(req.params.fileId);

    res.json({ message: 'File deleted successfully' });
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ error: 'Delete failed', details: error.message });
  }
});

// Get signed URL for file
router.get('/url/:fileId', auth, async (req, res) => {
  try {
    const file = await File.findById(req.params.fileId);

    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    // Verify project access
    const project = await Project.findById(file.projectId);
    if (project.userId.toString() !== req.userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    if (!file.s3Key) {
      return res.status(400).json({ error: 'File not stored in S3' });
    }

    const url = await s3Service.getFileUrl(file.s3Key);
    res.json({ url, expiresIn: 3600 });
  } catch (error) {
    console.error('URL generation error:', error);
    res.status(500).json({ error: 'Failed to generate URL', details: error.message });
  }
});

// Helper function to get language from file extension
function getLanguageFromExtension(fileName) {
  const ext = fileName.split('.').pop()?.toLowerCase();
  const languageMap = {
    js: 'javascript',
    jsx: 'javascript',
    ts: 'typescript',
    tsx: 'typescript',
    py: 'python',
    java: 'java',
    cpp: 'cpp',
    c: 'c',
    html: 'html',
    css: 'css',
    scss: 'scss',
    less: 'less',
    json: 'json',
    xml: 'xml',
    yaml: 'yaml',
    yml: 'yaml',
    sql: 'sql',
    md: 'markdown',
    txt: 'plaintext'
  };

  return languageMap[ext] || 'plaintext';
}

module.exports = router;
