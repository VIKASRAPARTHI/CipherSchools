const mongoose = require('mongoose');

const fileSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    required: true,
    enum: ['file', 'folder']
  },
  content: {
    type: String,
    default: ''
  },
  path: {
    type: String,
    required: true
  },
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true
  },
  parentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'File',
    default: null
  },
  language: {
    type: String,
    default: 'javascript'
  },
  s3Key: {
    type: String,
    default: null,
    description: 'AWS S3 key for file storage (optional)'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

fileSchema.index({ projectId: 1, parentId: 1 });
fileSchema.index({ projectId: 1, path: 1 }, { unique: true });

module.exports = mongoose.model('File', fileSchema);