const express = require('express');
const router = express.Router();
const File = require('../models/File');
const Project = require('../models/Project');
const auth = require('../middleware/auth');

// Get all files for a project
router.get('/project/:projectId', auth, async (req, res) => {
  try {
    // Verify project ownership
    const project = await Project.findOne({
      _id: req.params.projectId,
      userId: req.user.id
    });
    
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const files = await File.find({ projectId: req.params.projectId })
      .sort({ path: 1 });
    
    res.json(files);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get single file
router.get('/:id', auth, async (req, res) => {
  try {
    const file = await File.findById(req.params.id);
    
    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    // Verify project ownership
    const project = await Project.findOne({
      _id: file.projectId,
      userId: req.user.id
    });
    
    if (!project) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    res.json(file);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create file or folder
router.post('/', auth, async (req, res) => {
  try {
    const { name, type, content, path, projectId, parentId, language } = req.body;
    
    if (!name || !type || !path || !projectId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Verify project ownership
    const project = await Project.findOne({
      _id: projectId,
      userId: req.user.id
    });
    
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Check if file already exists
    const existingFile = await File.findOne({ projectId, path });
    if (existingFile) {
      return res.status(400).json({ error: 'File already exists at this path' });
    }

    const file = new File({
      name,
      type,
      content: content || '',
      path,
      projectId,
      parentId: parentId || null,
      language: language || 'javascript'
    });
    
    await file.save();

    // Update project last modified
    await Project.findByIdAndUpdate(projectId, { lastModified: Date.now() });
    
    res.status(201).json(file);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update file
router.put('/:id', auth, async (req, res) => {
  try {
    const { name, content, path, language } = req.body;
    
    const file = await File.findById(req.params.id);
    
    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    // Verify project ownership
    const project = await Project.findOne({
      _id: file.projectId,
      userId: req.user.id
    });
    
    if (!project) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Update fields
    if (name !== undefined) file.name = name;
    if (content !== undefined) file.content = content;
    if (path !== undefined) file.path = path;
    if (language !== undefined) file.language = language;
    
    await file.save();

    // Update project last modified
    await Project.findByIdAndUpdate(file.projectId, { lastModified: Date.now() });
    
    res.json(file);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Rename file or folder
router.patch('/:id/rename', auth, async (req, res) => {
  try {
    const { name } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }

    const file = await File.findById(req.params.id);
    
    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    // Verify project ownership
    const project = await Project.findOne({
      _id: file.projectId,
      userId: req.user.id
    });
    
    if (!project) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const oldPath = file.path;
    const pathParts = oldPath.split('/');
    pathParts[pathParts.length - 1] = name;
    const newPath = pathParts.join('/');

    file.name = name;
    file.path = newPath;
    await file.save();

    // If it's a folder, update all children paths
    if (file.type === 'folder') {
      const children = await File.find({
        projectId: file.projectId,
        path: { $regex: `^${oldPath}/` }
      });

      for (const child of children) {
        child.path = child.path.replace(oldPath, newPath);
        await child.save();
      }
    }

    // Update project last modified
    await Project.findByIdAndUpdate(file.projectId, { lastModified: Date.now() });
    
    res.json(file);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete file or folder
router.delete('/:id', auth, async (req, res) => {
  try {
    const file = await File.findById(req.params.id);
    
    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    // Verify project ownership
    const project = await Project.findOne({
      _id: file.projectId,
      userId: req.user.id
    });
    
    if (!project) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // If it's a folder, delete all children
    if (file.type === 'folder') {
      await File.deleteMany({
        projectId: file.projectId,
        path: { $regex: `^${file.path}/` }
      });
    }

    await File.findByIdAndDelete(req.params.id);

    // Update project last modified
    await Project.findByIdAndUpdate(file.projectId, { lastModified: Date.now() });
    
    res.json({ message: 'File deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;