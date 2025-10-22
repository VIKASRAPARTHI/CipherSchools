import React, { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { FiFile, FiFolder, FiPlus, FiTrash2, FiEdit2, FiFolderPlus } from 'react-icons/fi';

function FileExplorer({ files, onFileCreate, onFileDelete, onFileRename, onFileSelect, selectedFileId }) {
  const [expanded, setExpanded] = useState({});
  const [creating, setCreating] = useState(null);
  const [creatingType, setCreatingType] = useState('file');
  const [newName, setNewName] = useState('');
  const [renaming, setRenaming] = useState(null);
  const [renameValue, setRenameValue] = useState('');

  const toggleFolder = (path) => {
    setExpanded(prev => ({ ...prev, [path]: !prev[path] }));
  };

  const startCreating = (parentPath, type) => {
    setCreating(parentPath || '/');
    setCreatingType(type);
    setNewName('');
  };

  const handleCreate = () => {
    if (!newName.trim()) return;
    onFileCreate(newName, creatingType, creating === '/' ? '' : creating);
    setCreating(null);
    setNewName('');
  };

  const startRenaming = (file) => {
    setRenaming(file._id);
    setRenameValue(file.name);
  };

  const handleRename = (fileId) => {
    if (!renameValue.trim()) return;
    onFileRename(fileId, renameValue);
    setRenaming(null);
    setRenameValue('');
  };

  const buildTree = (files) => {
    const root = [];
    const lookup = {};

    files.forEach(file => {
      lookup[file.path] = { ...file, children: [] };
    });

    files.forEach(file => {
      const pathParts = file.path.split('/').filter(Boolean);
      if (pathParts.length === 1) {
        root.push(lookup[file.path]);
      } else {
        const parentPath = '/' + pathParts.slice(0, -1).join('/');
        if (lookup[parentPath]) {
          lookup[parentPath].children.push(lookup[file.path]);
        }
      }
    });

    return root;
  };

  const renderFile = (file, depth = 0) => {
    const isFolder = file.type === 'folder';
    const isExpanded = expanded[file.path];
    const isRenaming = renaming === file._id;

    return (
      <div key={file._id} className="file-item-container">
        <div 
          className="file-item" 
          style={{ paddingLeft: `${depth * 16 + 12}px` }}
          data-testid={isFolder ? "folder-item" : "file-item"}
        >
          <div className="file-main" onClick={() => isFolder && toggleFolder(file.path)}>
            {isFolder ? (
              <FiFolder className={`file-icon folder-icon ${isExpanded ? 'expanded' : ''}`} />
            ) : (
              <FiFile className="file-icon" />
            )}
            {isRenaming ? (
              <Input
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                onBlur={() => handleRename(file._id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleRename(file._id);
                  if (e.key === 'Escape') setRenaming(null);
                }}
                autoFocus
                className="rename-input"
                data-testid="rename-input"
              />
            ) : (
              <span className="file-name" title={file.name}>{file.name}</span>
            )}
          </div>
          <div className="file-actions">
            {isFolder && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => startCreating(file.path, 'file')}
                  className="action-button"
                  title="New file"
                  data-testid="create-file-button"
                >
                  <FiPlus />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => startCreating(file.path, 'folder')}
                  className="action-button"
                  title="New folder"
                  data-testid="create-folder-button"
                >
                  <FiFolderPlus />
                </Button>
              </>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => startRenaming(file)}
              className="action-button"
              title="Rename"
              data-testid="rename-button"
            >
              <FiEdit2 />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onFileDelete(file._id, file.path, file.type)}
              className="action-button delete-button"
              title="Delete"
              data-testid="delete-file-button"
            >
              <FiTrash2 />
            </Button>
          </div>
        </div>
        
        {isFolder && isExpanded && file.children && file.children.length > 0 && (
          <div className="folder-children">
            {file.children.map(child => renderFile(child, depth + 1))}
          </div>
        )}

        {creating === file.path && (
          <div className="create-input-container" style={{ paddingLeft: `${(depth + 1) * 16 + 12}px` }}>
            <div className="create-input-wrapper">
              {creatingType === 'folder' ? <FiFolder className="file-icon" /> : <FiFile className="file-icon" />}
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onBlur={handleCreate}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleCreate();
                  if (e.key === 'Escape') setCreating(null);
                }}
                placeholder={`New ${creatingType}...`}
                autoFocus
                className="create-input"
                data-testid="create-name-input"
              />
            </div>
          </div>
        )}
      </div>
    );
  };

  const tree = buildTree(files);

  return (
    <div className="file-explorer" data-testid="file-explorer">
      <div className="explorer-header">
        <h3 className="explorer-title">Files</h3>
        <div className="explorer-actions">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => startCreating('/', 'file')}
            className="header-action"
            title="New file"
            data-testid="root-create-file"
          >
            <FiPlus />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => startCreating('/', 'folder')}
            className="header-action"
            title="New folder"
            data-testid="root-create-folder"
          >
            <FiFolderPlus />
          </Button>
        </div>
      </div>
      
      <div className="files-list">
        {tree.map(file => renderFile(file))}
        {creating === '/' && (
          <div className="create-input-container" style={{ paddingLeft: '12px' }}>
            <div className="create-input-wrapper">
              {creatingType === 'folder' ? <FiFolder className="file-icon" /> : <FiFile className="file-icon" />}
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onBlur={handleCreate}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleCreate();
                  if (e.key === 'Escape') setCreating(null);
                }}
                placeholder={`New ${creatingType}...`}
                autoFocus
                className="create-input"
                data-testid="create-name-input"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default FileExplorer;