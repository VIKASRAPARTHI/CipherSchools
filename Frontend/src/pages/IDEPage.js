import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Sandpack } from '@codesandbox/sandpack-react';
import axios from 'axios';
import { toast } from 'sonner';
import { Button } from '../components/ui/button';
import { Switch } from '../components/ui/switch';
import { Label } from '../components/ui/label';
import FileExplorer from '../components/FileExplorer';
import { FiArrowLeft, FiSave, FiMoon, FiSun, FiSettings, FiDownload, FiUpload } from 'react-icons/fi';
import { Popover, PopoverContent, PopoverTrigger } from '../components/ui/popover';
import { exportService } from '../services/advancedApi';

const API_URL = `${process.env.REACT_APP_BACKEND_URL}/api`;

function IDEPage() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [files, setFiles] = useState([]);
  const [sandpackFiles, setSandpackFiles] = useState({});
  const [loading, setLoading] = useState(true);
  const [isDarkTheme, setIsDarkTheme] = useState(true);
  const [autoSave, setAutoSave] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchProjectData();
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      setIsDarkTheme(savedTheme === 'dark');
    }
    const savedAutoSave = localStorage.getItem('autoSave');
    if (savedAutoSave) {
      setAutoSave(savedAutoSave === 'true');
    }
  }, [projectId]);

  useEffect(() => {
    if (autoSave && sandpackFiles && Object.keys(sandpackFiles).length > 0) {
      const timer = setTimeout(() => {
        handleSaveProject(true);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [sandpackFiles, autoSave]);

  const fetchProjectData = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      const [projectRes, filesRes] = await Promise.all([
        axios.get(`${API_URL}/projects/${projectId}`, { headers }),
        axios.get(`${API_URL}/files/project/${projectId}`, { headers })
      ]);

      setProject(projectRes.data);
      setFiles(filesRes.data);

      const fileMap = {};
      filesRes.data
        .filter(f => f.type === 'file')
        .forEach(file => {
          fileMap[file.path] = file.content;
        });
      setSandpackFiles(fileMap);
    } catch (error) {
      toast.error('Failed to load project');
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProject = async (isAutoSave = false) => {
    if (saving) return;
    setSaving(true);

    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      const updatePromises = files
        .filter(f => f.type === 'file' && sandpackFiles[f.path] !== undefined)
        .map(file => {
          if (file.content !== sandpackFiles[file.path]) {
            return axios.put(
              `${API_URL}/files/${file._id}`,
              { content: sandpackFiles[file.path] },
              { headers }
            );
          }
          return null;
        })
        .filter(Boolean);

      if (updatePromises.length > 0) {
        await Promise.all(updatePromises);
        if (!isAutoSave) {
          toast.success('Project saved successfully!');
        }
        await fetchProjectData();
      } else if (!isAutoSave) {
        toast.info('No changes to save');
      }
    } catch (error) {
      toast.error('Failed to save project');
    } finally {
      setSaving(false);
    }
  };

  const handleFileCreate = async (fileName, fileType, parentPath) => {
    try {
      const token = localStorage.getItem('token');
      const newPath = parentPath ? `${parentPath}/${fileName}` : `/${fileName}`;
      
      const newFile = {
        name: fileName,
        type: fileType,
        content: fileType === 'file' ? '' : undefined,
        path: newPath,
        projectId,
        parentId: null
      };

      const response = await axios.post(`${API_URL}/files`, newFile, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setFiles([...files, response.data]);
      if (fileType === 'file') {
        setSandpackFiles({ ...sandpackFiles, [newPath]: '' });
      }
      toast.success(`${fileType === 'file' ? 'File' : 'Folder'} created successfully`);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to create file');
    }
  };

  const handleFileDelete = async (fileId, filePath, fileType) => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_URL}/files/${fileId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setFiles(files.filter(f => f._id !== fileId));
      if (fileType === 'file') {
        const newFiles = { ...sandpackFiles };
        delete newFiles[filePath];
        setSandpackFiles(newFiles);
      }
      toast.success('Deleted successfully');
    } catch (error) {
      toast.error('Failed to delete');
    }
  };

  const handleFileRename = async (fileId, newName) => {
    try {
      const token = localStorage.getItem('token');
      await axios.patch(`${API_URL}/files/${fileId}/rename`, { name: newName }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      await fetchProjectData();
      toast.success('Renamed successfully');
    } catch (error) {
      toast.error('Failed to rename');
    }
  };

  const handleExportProject = async () => {
    try {
      toast.info('Exporting project...');
      await exportService.exportProjectAsZip(projectId);
      toast.success('Project exported as ZIP successfully!');
    } catch (error) {
      toast.error(error.message || 'Failed to export project');
    }
  };

  const handleImportProject = async (event) => {
    try {
      const file = event.target.files[0];
      if (!file) return;

      toast.info('Importing project...');
      const formData = new FormData();
      formData.append('file', file);
      
      const result = await exportService.importProjectFromZip(projectId, formData);
      toast.success('Project imported successfully!');
      await fetchProjectData();
      // Reset the input value
      event.target.value = '';
    } catch (error) {
      toast.error(error.message || 'Failed to import project');
      // Reset the input value
      event.target.value = '';
    }
  };

  const toggleTheme = () => {
    const newTheme = !isDarkTheme;
    setIsDarkTheme(newTheme);
    localStorage.setItem('theme', newTheme ? 'dark' : 'light');
  };

  const toggleAutoSave = () => {
    const newAutoSave = !autoSave;
    setAutoSave(newAutoSave);
    localStorage.setItem('autoSave', newAutoSave.toString());
    toast.success(`Autosave ${newAutoSave ? 'enabled' : 'disabled'}`);
  };

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loader"></div>
        <p>Loading IDE...</p>
      </div>
    );
  }

  return (
    <div className="ide-page" data-testid="ide-page">
      <div className="ide-header">
        <div className="header-left">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/dashboard')}
            className="back-button"
            data-testid="back-button"
          >
            <FiArrowLeft /> Back
          </Button>
          <div className="project-info">
            <h1 className="project-title">{project?.name}</h1>
            {saving && <span className="saving-indicator">Saving...</span>}
          </div>
        </div>
        <div className="header-right">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="icon" data-testid="settings-button">
                <FiSettings />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="settings-popover">
              <div className="settings-content">
                <h3 className="settings-title">Settings</h3>
                <div className="setting-item">
                  <div className="setting-label">
                    <Label htmlFor="theme-switch">Theme</Label>
                    <span className="setting-description">
                      {isDarkTheme ? 'Dark' : 'Light'} mode
                    </span>
                  </div>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={toggleTheme}
                    id="theme-switch"
                    data-testid="theme-toggle"
                  >
                    {isDarkTheme ? <FiMoon /> : <FiSun />}
                  </Button>
                </div>
                <div className="setting-item">
                  <div className="setting-label">
                    <Label htmlFor="autosave-switch">Autosave</Label>
                    <span className="setting-description">
                      Save changes automatically
                    </span>
                  </div>
                  <Switch
                    id="autosave-switch"
                    checked={autoSave}
                    onCheckedChange={toggleAutoSave}
                    data-testid="autosave-toggle"
                  />
                </div>
              </div>
            </PopoverContent>
          </Popover>
          <Button 
            onClick={handleExportProject}
            variant="outline"
            size="sm"
            className="export-button"
            data-testid="export-button"
            title="Export project as ZIP"
          >
            <FiDownload /> Export
          </Button>
          <Button 
            variant="outline"
            size="sm"
            className="import-button"
            data-testid="import-button"
            title="Import project from ZIP"
            onClick={() => document.getElementById('import-file-input').click()}
          >
            <FiUpload /> Import
          </Button>
          <input
            id="import-file-input"
            type="file"
            accept=".zip"
            onChange={handleImportProject}
            style={{ display: 'none' }}
            data-testid="import-file-input"
          />
          <Button 
            onClick={() => handleSaveProject(false)}
            className="save-button"
            disabled={saving}
            data-testid="save-button"
          >
            <FiSave /> {saving ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </div>

      <div className="ide-content">
        <div className="file-explorer-panel">
          <FileExplorer
            files={files}
            onFileCreate={handleFileCreate}
            onFileDelete={handleFileDelete}
            onFileRename={handleFileRename}
          />
        </div>
        <div className="code-editor-panel">
          {Object.keys(sandpackFiles).length > 0 ? (
            <Sandpack
              template="react"
              theme={isDarkTheme ? 'dark' : 'light'}
              files={sandpackFiles}
              options={{
                showNavigator: true,
                showTabs: true,
                showLineNumbers: true,
                showInlineErrors: true,
                wrapContent: true,
                editorHeight: 'calc(100vh - 60px)',
                editorWidthPercentage: 55,
              }}
              customSetup={{
                dependencies: {
                  'react': '^18.2.0',
                  'react-dom': '^18.2.0'
                }
              }}
            />
          ) : (
            <div className="empty-editor">
              <p>No files in this project</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default IDEPage;