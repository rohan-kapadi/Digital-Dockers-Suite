import api from './api';

const projectService = {
    // Get user's projects
    getProjects: async () => {
        const response = await api.get('/projects');
        return response.data;
    },

    // Alias for compatibility
    getAllProjects: async () => {
        const response = await api.get('/projects');
        return response.data;
    },

    // Create a new project
    createProject: async (projectData) => {
        const response = await api.post('/projects', projectData);
        return response.data;
    },

    // Get project details
    getProjectById: async (projectId) => {
        const response = await api.get(`/projects/${projectId}`);
        return response.data;
    },

    // Update project (admin only)
    updateProject: async (projectId, projectData) => {
        const response = await api.put(`/projects/${projectId}`, projectData);
        return response.data;
    },

    // Partial update project (admin only)
    patchProject: async (projectId, projectData) => {
        const response = await api.patch(`/projects/${projectId}`, projectData);
        return response.data;
    },

    // Delete project (admin only)
    deleteProject: async (projectId) => {
        const response = await api.delete(`/projects/${projectId}`);
        return response.data;
    },
};

export default projectService;
