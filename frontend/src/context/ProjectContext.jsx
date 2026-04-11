import { createContext, useContext, useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import projectService from '../services/projectService';
import sprintService from '../services/sprintService';

const ProjectContext = createContext();

// eslint-disable-next-line react-refresh/only-export-components
export const useProject = () => useContext(ProjectContext);

export const ProjectProvider = ({ children }) => {
    const { user } = useAuth();
    const socketRef = useRef(null);
    const currentProjectRef = useRef(null);
    const [projects, setProjects] = useState([]);
    const [currentProject, setCurrentProject] = useState(null);
    const [sprints, setSprints] = useState([]);
    const [activeSprint, setActiveSprint] = useState(null);
    const [selectedSprintId, setSelectedSprintId] = useState('general');
    const [loading, setLoading] = useState(false);
    const [syncTrigger, setSyncTrigger] = useState(0);

    // Initial Load - only when user is authenticated
    useEffect(() => {
        if (user) {
            loadProjects();
        }
    }, [user]);

    useEffect(() => {
        currentProjectRef.current = currentProject;
    }, [currentProject]);

    // Setup Global Socket Listeners for Cross-Tab Sync
    useEffect(() => {
        if (!user) {
            if (socketRef.current) {
                socketRef.current.disconnect();
                socketRef.current = null;
            }
            return;
        }

        const socketUrl = import.meta.env.VITE_WS_URL || import.meta.env.VITE_API_URL || "/";
        const socket = io(socketUrl, {
            withCredentials: true,
            path: '/socket.io',
            transports: ['websocket', 'polling'],
            reconnection: true,
        });
        socketRef.current = socket;

        const triggerRefresh = (msg) => {
            console.log(`🔄 SYNC: ${msg}`);
            setSyncTrigger(prev => prev + 1);
        };

        socket.on('project:refresh', () => {
            triggerRefresh('Reloading Projects');
            loadProjects();
        });

        socket.on('sprint:created', () => {
             triggerRefresh('Reloading Sprints');
               if (currentProjectRef.current) loadSprints(currentProjectRef.current._id);
        });

        // Trigger global refresh for tasks/metrics/workloads
        socket.on('task:created', () => triggerRefresh('Task Created'));
        socket.on('task:updated', () => triggerRefresh('Task Updated'));
        socket.on('task:deleted', () => triggerRefresh('Task Deleted'));

        return () => {
            if (socketRef.current) {
                socketRef.current.disconnect();
                socketRef.current = null;
            }
        };
    }, [user]);

    // Expose refreshBoard as a way for components to manually trigger sync
    const refreshBoard = () => {
        setSyncTrigger(prev => prev + 1);
        if (currentProject) loadSprints(currentProject._id);
    };

    // Load Sprints when project changes
    useEffect(() => {
        if (currentProject) {
            loadSprints(currentProject._id);
            setSelectedSprintId('general'); // Reset to general on project change
        } else {
            setSprints([]);
            setActiveSprint(null);
        }
    }, [currentProject]);

    const loadProjects = async () => {
        setLoading(true);
        try {
            const data = await projectService.getAllProjects();
            setProjects(data);
            if (data.length > 0 && !currentProject) {
                // Default to first project or saved pref
                setCurrentProject(data[0]);
            }
            return data;
        } catch (error) {
            console.error("Failed to load projects", error);
            return [];
        } finally {
            setLoading(false);
        }
    };

    const loadSprints = async (projectId) => {
        try {
            const data = await sprintService.getSprintsByProject(projectId);
            setSprints(data);
            const active = data.find(s => s.status === 'active') || data.find(s => s.status === 'future');
            setActiveSprint(active || null);
        } catch (error) {
            console.error("Failed to load sprints", error);
        }
    };

    const switchProject = async (projectId, projectsOverride = null) => {
        const listToSearch = projectsOverride || projects;
        let proj = listToSearch.find(p => p._id === projectId);
        
        if (!proj) {
            try {
                const freshProject = await projectService.getProjectById(projectId);
                if (freshProject) {
                    proj = freshProject;
                    setProjects(prev => {
                        const exists = prev.find(p => p._id === freshProject._id);
                        if (exists) return prev;
                        return [freshProject, ...prev];
                    });
                }
            } catch (err) {
                console.error("Failed to fetch project by ID:", err);
            }
        }
        
        if (proj) {
            setCurrentProject(proj);
            setSelectedSprintId('general'); // Reset filter
            return proj;
        }
        return null;
    };



    const refreshProjects = async () => {
        return await loadProjects();
    };

    return (
        <ProjectContext.Provider value={{
            projects,
            currentProject,
            sprints,
            activeSprint,
            selectedSprintId,
            syncTrigger, // Crucial for global sync reactivity
            setSelectedSprintId,
            isLoading: loading,
            switchProject,
            setActiveSprint,
            refreshBoard,
            refreshProjects
        }}>
            {children}
        </ProjectContext.Provider>
    );
};
