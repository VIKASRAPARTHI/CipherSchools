const express = require('express');
const router = express.Router();
const Project = require('../models/Project');
const File = require('../models/File');
const auth = require('../middleware/auth');

// Get all projects for user
router.get('/', auth, async (req, res) => {
  try {
    const projects = await Project.find({ userId: req.user.id })
      .sort({ lastModified: -1 });
    res.json(projects);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get single project
router.get('/:id', auth, async (req, res) => {
  try {
    const project = await Project.findOne({ 
      _id: req.params.id,
      userId: req.user.id 
    });
    
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    res.json(project);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create project with default files
router.post('/', auth, async (req, res) => {
  try {
    const { name, description, template } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'Project name is required' });
    }

    // Create project
    const project = new Project({
      name,
      description: description || '',
      userId: req.user.id,
      template: template || 'react'
    });
    
    await project.save();

    // Create default React files
    const defaultFiles = [
      {
        name: 'App.js',
        type: 'file',
        content: `export default function App() {
  return (
    <div className="App">
      <h1>Hello CipherStudio!</h1>
      <p>Start building your React app here.</p>
    </div>
  );
}`,
        path: '/App.js',
        projectId: project._id,
        parentId: null,
        language: 'javascript'
      },
      {
        name: 'index.js',
        type: 'file',
        content: `import React, { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";

import App from "./App";

const root = createRoot(document.getElementById("root"));
root.render(
  <StrictMode>
    <App />
  </StrictMode>
);`,
        path: '/index.js',
        projectId: project._id,
        parentId: null,
        language: 'javascript'
      },
      {
        name: 'styles.css',
        type: 'file',
        content: `.App {
  font-family: sans-serif;
  text-align: center;
  padding: 2rem;
}

h1 {
  color: #2563eb;
  margin-bottom: 1rem;
}

p {
  color: #64748b;
  font-size: 1.125rem;
}`,
        path: '/styles.css',
        projectId: project._id,
        parentId: null,
        language: 'css'
      },
      {
        name: 'package.json',
        type: 'file',
        content: `{
  "name": "${name.toLowerCase().replace(/\s+/g, '-')}",
  "version": "1.0.0",
  "description": "${description || 'A React project'}",
  "main": "index.js",
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  }
}`,
        path: '/package.json',
        projectId: project._id,
        parentId: null,
        language: 'json'
      },
      {
        name: 'public',
        type: 'folder',
        content: '',
        path: '/public',
        projectId: project._id,
        parentId: null
      },
      {
        name: 'index.html',
        type: 'file',
        content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${name}</title>
</head>
<body>
  <div id="root"></div>
</body>
</html>`,
        path: '/public/index.html',
        projectId: project._id,
        parentId: null,
        language: 'html'
      }
    ];

    await File.insertMany(defaultFiles);

    res.status(201).json(project);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update project
router.put('/:id', auth, async (req, res) => {
  try {
    const { name, description } = req.body;
    
    const project = await Project.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { 
        name, 
        description,
        lastModified: Date.now()
      },
      { new: true }
    );
    
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    res.json(project);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete project
router.delete('/:id', auth, async (req, res) => {
  try {
    const project = await Project.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.id
    });
    
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Delete all files associated with the project
    await File.deleteMany({ projectId: req.params.id });
    
    res.json({ message: 'Project deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;