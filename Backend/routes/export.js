const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const multer = require('multer');
const JSZip = require('jszip');
const Project = require('../models/Project');
const File = require('../models/File');

// Multer setup for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit
});

// Export project as ZIP
router.get('/:projectId/export', auth, async (req, res) => {
  try {
    const project = await Project.findById(req.params.projectId);

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Verify project ownership
    if (project.userId.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    // Fetch all files in project
    const files = await File.find({ projectId: req.params.projectId });

    // Create ZIP archive
    const zip = new JSZip();

    // Add files to ZIP, organizing by folder structure
    files.forEach(file => {
      if (file.type === 'file') {
        const fullPath = `${file.path}/${file.name}`.replace(/^\//, '');
        const content = file.content || '';
        zip.file(fullPath, content);
      }
    });

    // Generate ZIP buffer
    const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' });

    // Send as downloadable file
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${project.name}.zip"`);
    res.send(zipBuffer);
  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({ error: 'Export failed', details: error.message });
  }
});

// Import project from ZIP
router.post('/:projectId/import', auth, upload.single('file'), async (req, res) => {
  try {
    const project = await Project.findById(req.params.projectId);

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Verify project ownership
    if (project.userId.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No file provided' });
    }

    // Parse ZIP file
    const zip = new JSZip();
    await zip.loadAsync(req.file.buffer);

    const importedFiles = [];
    const filePromises = [];

    // Extract files from ZIP
    zip.forEach((relativePath, zipEntry) => {
      if (!zipEntry.dir) {
        filePromises.push(
          zipEntry.async('string').then(content => {
            const pathParts = relativePath.split('/');
            const fileName = pathParts.pop();
            const filePath = '/' + pathParts.join('/');

            return {
              fileName,
              filePath: filePath === '/' ? '' : filePath,
              content
            };
          })
        );
      }
    });

    const extractedFiles = await Promise.all(filePromises);

    // Create file documents in database
    for (const file of extractedFiles) {
      try {
        // Check if file already exists
        const existingFile = await File.findOne({
          projectId: req.params.projectId,
          name: file.fileName,
          path: file.filePath
        });

        if (existingFile) {
          // Update existing file
          existingFile.content = file.content;
          await existingFile.save();
          importedFiles.push(existingFile);
        } else {
          // Create new file
          const newFile = new File({
            name: file.fileName,
            type: 'file',
            content: file.content,
            path: file.filePath,
            projectId: req.params.projectId,
            language: getLanguageFromExtension(file.fileName)
          });
          await newFile.save();
          importedFiles.push(newFile);
        }
      } catch (fileError) {
        console.error(`Error importing file ${file.fileName}:`, fileError);
      }
    }

    // Update project lastModified
    project.lastModified = new Date();
    await project.save();

    res.json({
      message: 'Project imported successfully',
      filesImported: importedFiles.length,
      files: importedFiles.map(f => ({
        _id: f._id,
        name: f.name,
        path: f.path,
        type: f.type
      }))
    });
  } catch (error) {
    console.error('Import error:', error);
    res.status(500).json({ error: 'Import failed', details: error.message });
  }
});

// Get project statistics
router.get('/:projectId/stats', auth, async (req, res) => {
  try {
    const project = await Project.findById(req.params.projectId);

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Verify project ownership
    if (project.userId.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const files = await File.find({ projectId: req.params.projectId });

    const stats = {
      totalFiles: files.filter(f => f.type === 'file').length,
      totalFolders: files.filter(f => f.type === 'folder').length,
      totalSize: files.reduce((sum, f) => sum + (f.content?.length || 0), 0),
      languages: {},
      createdAt: project.createdAt,
      lastModified: project.lastModified
    };

    // Count files by language
    files.forEach(file => {
      if (file.type === 'file' && file.language) {
        stats.languages[file.language] = (stats.languages[file.language] || 0) + 1;
      }
    });

    res.json(stats);
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({ error: 'Failed to get stats', details: error.message });
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
