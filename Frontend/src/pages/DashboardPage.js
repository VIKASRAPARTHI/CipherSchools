import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { FiCode, FiPlus, FiTrash2, FiLogOut, FiFolder, FiClock, FiUser } from 'react-icons/fi';

const API_URL = `${process.env.REACT_APP_BACKEND_URL}/api`;

function DashboardPage() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newProject, setNewProject] = useState({ name: '', description: '' });
  const [user, setUser] = useState(null);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/projects`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProjects(response.data);
    } catch (error) {
      toast.error('Failed to fetch projects');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = async (e) => {
    e.preventDefault();
    
    if (!newProject.name.trim()) {
      toast.error('Project name is required');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API_URL}/projects`, newProject, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      toast.success('Project created successfully!');
      setProjects([response.data, ...projects]);
      setCreateDialogOpen(false);
      setNewProject({ name: '', description: '' });
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to create project');
    }
  };

  const handleDeleteProject = async (projectId, projectName) => {
    if (!window.confirm(`Are you sure you want to delete "${projectName}"?`)) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_URL}/projects/${projectId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      toast.success('Project deleted successfully');
      setProjects(projects.filter(p => p._id !== projectId));
    } catch (error) {
      toast.error('Failed to delete project');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    toast.success('Logged out successfully');
    window.location.href = '/auth';
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    
    return date.toLocaleDateString();
  };

  return (
    <div className="dashboard-page" data-testid="dashboard-page">
      <div className="dashboard-header">
        <div className="header-left">
          <div className="logo-section">
            <img src="/logo1.png" alt="Logo" className="logo-image" />
          </div>
        </div>
        <div className="header-right">
          <div className="user-info">
            <FiUser className="user-icon" />
            <span className="username">{user?.username}</span>
          </div>
          <Button 
            variant="outline" 
            onClick={handleLogout}
            className="logout-button"
            data-testid="logout-button"
          >
            <FiLogOut /> Logout
          </Button>
        </div>
      </div>

      <div className="dashboard-content">
        <div className="content-header">
          <div>
            <h2 className="section-title">My Projects</h2>
            <p className="section-description">Create and manage your React projects</p>
          </div>
          <Button 
            onClick={() => setCreateDialogOpen(true)}
            className="create-button" 
            data-testid="create-project-button"
          >
            <FiPlus /> New Project
          </Button>
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogContent className="dialog-content">
              <DialogHeader>
                <DialogTitle>Create New Project</DialogTitle>
                <DialogDescription>
                  Start building your next React application
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateProject} className="create-form">
                <div className="form-group">
                  <Label htmlFor="project-name">Project Name</Label>
                  <Input
                    id="project-name"
                    placeholder="My Awesome App"
                    value={newProject.name}
                    onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                    required
                    data-testid="project-name-input"
                  />
                </div>
                <div className="form-group">
                  <Label htmlFor="project-description">Description (Optional)</Label>
                  <Input
                    id="project-description"
                    placeholder="A brief description of your project"
                    value={newProject.description}
                    onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                    data-testid="project-description-input"
                  />
                </div>
                <Button type="submit" className="submit-button" data-testid="create-project-submit">
                  Create Project
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {loading ? (
          <div className="loading-container">
            <div className="loader"></div>
            <p>Loading projects...</p>
          </div>
        ) : projects.length === 0 ? (
          <div className="empty-state" data-testid="empty-state">
            <FiFolder className="empty-icon" />
            <h3>No projects yet</h3>
            <p>Create your first project to get started</p>
            <Button 
              onClick={() => setCreateDialogOpen(true)} 
              className="empty-create-button"
            >
              <FiPlus /> Create Project
            </Button>
          </div>
        ) : (
          <div className="projects-grid">
            {projects.map(project => (
              <Card key={project._id} className="project-card" data-testid="project-card">
                <CardHeader>
                  <div className="card-header-content">
                    <div>
                      <CardTitle className="project-name">{project.name}</CardTitle>
                      <CardDescription className="project-description">
                        {project.description || 'No description'}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="project-meta">
                    <div className="meta-item">
                      <FiClock className="meta-icon" />
                      <span>{formatDate(project.lastModified)}</span>
                    </div>
                  </div>
                  <div className="card-actions">
                    <Button
                      onClick={() => navigate(`/ide/${project._id}`)}
                      className="open-button"
                      data-testid="open-project-button"
                    >
                      <FiCode /> Open IDE
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => handleDeleteProject(project._id, project.name)}
                      className="delete-button"
                      data-testid="delete-project-button"
                    >
                      <FiTrash2 /> Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default DashboardPage;