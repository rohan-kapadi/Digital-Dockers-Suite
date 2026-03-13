import { useState, useCallback, useRef } from 'react';
import axios from 'axios';

/**
 * Custom Hook: useSubTasks
 * Manages all subtask operations with proper error handling and loading states
 * 
 * Returns: {
 *   children: Array,
 *   storyPoints: Object,
 *   stats: Object,
 *   isLoading: Boolean,
 *   error: String | null,
 *   actions: {
 *     fetchChildren,
 *     fetchStoryPoints,
 *     updateChildStatus,
 *     createSubtask,
 *     deleteChild,
 *     moveChild,
 *     detachChild,
 *     bulkUpdateStatus,
 *     clearError
 *   }
 * }
 */
export const useSubTasks = (parentTaskId) => {
  const [children, setChildren] = useState([]);
  const [storyPoints, setStoryPoints] = useState({
    own: 0,
    children: 0,
    total: 0,
    hasChildren: false
  });
  const [stats, setStats] = useState({
    total: 0,
    done: 0,
    inProgress: 0,
    pending: 0
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const abortControllerRef = useRef(null);

  const handleError = useCallback((err, defaultMessage) => {
    const message =
      err.response?.data?.message ||
      err.response?.data?.error ||
      defaultMessage;
    setError(message);
    console.error('SubTask Error:', err);
  }, []);

  /**
   * Fetch children for parent task
   */
  const fetchChildren = useCallback(
    async (options = {}) => {
      const { skip = 0, limit = 50, status = null } = options;

      setIsLoading(true);
      setError(null);

      try {
        const params = { skip, limit };
        if (status) params.status = status;

        const response = await axios.get(
          `/api/work-items/${parentTaskId}/subtasks`,
          {
            params,
            withCredentials: true,
            signal: abortControllerRef.current?.signal
          }
        );

        if (response.data.success) {
          setChildren(response.data.children || []);

          // Update stats
          const childrenList = response.data.children || [];
          setStats({
            total: response.data.total || childrenList.length,
            done: childrenList.filter(c => c.status === 'done').length,
            inProgress: childrenList.filter(c => c.status === 'in_progress').length,
            pending: childrenList.filter(c => c.status === 'todo').length
          });

          return response.data;
        }
      } catch (err) {
        if (err.code !== 'CANCELLED') {
          handleError(err, 'Failed to fetch subtasks');
        }
      } finally {
        setIsLoading(false);
      }
    },
    [parentTaskId, handleError]
  );

  /**
   * Fetch story points breakdown
   */
  const fetchStoryPoints = useCallback(async () => {
    try {
      const response = await axios.get(
        `/api/work-items/${parentTaskId}/story-points`,
        {
          withCredentials: true,
          signal: abortControllerRef.current?.signal
        }
      );

      if (response.data.success) {
        setStoryPoints(response.data);
        return response.data;
      }
    } catch (err) {
      if (err.code !== 'CANCELLED') {
        handleError(err, 'Failed to fetch story points');
      }
    }
  }, [parentTaskId, handleError]);

  /**
   * Update child status (triggers parent auto-update)
   */
  const updateChildStatus = useCallback(
    async (childId, newStatus) => {
      setError(null);

      try {
        const response = await axios.patch(
          `/api/work-items/${childId}/status`,
          { status: newStatus },
          {
            withCredentials: true,
            signal: abortControllerRef.current?.signal
          }
        );

        if (response.data.success) {
          // Update local state optimistically
          setChildren(prev =>
            prev.map(child =>
              child._id === childId ? { ...child, status: newStatus } : child
            )
          );

          // Refresh stats
          await fetchChildren();
          await fetchStoryPoints();

          return response.data;
        }
      } catch (err) {
        handleError(err, 'Failed to update subtask status');
        throw err;
      }
    },
    [fetchChildren, fetchStoryPoints, handleError]
  );

  /**
   * Create new subtask
   */
  const createSubtask = useCallback(
    async (subtaskData) => {
      setError(null);

      try {
        const response = await axios.post(
          `/api/work-items/${parentTaskId}/subtasks`,
          subtaskData,
          {
            withCredentials: true,
            signal: abortControllerRef.current?.signal
          }
        );

        if (response.data.success) {
          // Refresh children and stats
          await fetchChildren();
          await fetchStoryPoints();
          return response.data;
        }
      } catch (err) {
        handleError(err, 'Failed to create subtask');
        throw err;
      }
    },
    [parentTaskId, fetchChildren, fetchStoryPoints, handleError]
  );

  /**
   * Delete subtask
   */
  const deleteChild = useCallback(
    async (childId) => {
      setError(null);

      try {
        const response = await axios.delete(
          `/api/work-items/${childId}`,
          {
            withCredentials: true,
            signal: abortControllerRef.current?.signal
          }
        );

        if (response.data.success) {
          setChildren(prev => prev.filter(c => c._id !== childId));
          await fetchChildren();
          await fetchStoryPoints();
          return response.data;
        }
      } catch (err) {
        handleError(err, 'Failed to delete subtask');
        throw err;
      }
    },
    [fetchChildren, fetchStoryPoints, handleError]
  );

  /**
   * Move child to different parent
   */
  const moveChild = useCallback(
    async (childId, newParentId) => {
      setError(null);

      try {
        const response = await axios.post(
          `/api/work-items/${childId}/move/${newParentId}`,
          {},
          {
            withCredentials: true,
            signal: abortControllerRef.current?.signal
          }
        );

        if (response.data.success) {
          // Remove from current children
          setChildren(prev => prev.filter(c => c._id !== childId));
          await fetchChildren();
          await fetchStoryPoints();
          return response.data;
        }
      } catch (err) {
        handleError(err, 'Failed to move subtask');
        throw err;
      }
    },
    [fetchChildren, fetchStoryPoints, handleError]
  );

  /**
   * Detach child from parent (make it standalone)
   */
  const detachChild = useCallback(
    async (childId) => {
      setError(null);

      try {
        const response = await axios.post(
          `/api/work-items/${childId}/detach`,
          {},
          {
            withCredentials: true,
            signal: abortControllerRef.current?.signal
          }
        );

        if (response.data.success) {
          setChildren(prev => prev.filter(c => c._id !== childId));
          await fetchChildren();
          await fetchStoryPoints();
          return response.data;
        }
      } catch (err) {
        handleError(err, 'Failed to detach subtask');
        throw err;
      }
    },
    [fetchChildren, fetchStoryPoints, handleError]
  );

  /**
   * Bulk update children status
   */
  const bulkUpdateStatus = useCallback(
    async (newStatus) => {
      setError(null);

      try {
        const response = await axios.post(
          `/api/work-items/${parentTaskId}/subtasks/bulk-status`,
          { status: newStatus },
          {
            withCredentials: true,
            signal: abortControllerRef.current?.signal
          }
        );

        if (response.data.success) {
          await fetchChildren();
          await fetchStoryPoints();
          return response.data;
        }
      } catch (err) {
        handleError(err, 'Failed to bulk update statuses');
        throw err;
      }
    },
    [parentTaskId, fetchChildren, fetchStoryPoints, handleError]
  );

  /**
   * Clear error message
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Cleanup on unmount
   */
  const cleanup = useCallback(() => {
    abortControllerRef.current?.abort();
  }, []);

  return {
    // State
    children,
    storyPoints,
    stats,
    isLoading,
    error,

    // Actions
    actions: {
      fetchChildren,
      fetchStoryPoints,
      updateChildStatus,
      createSubtask,
      deleteChild,
      moveChild,
      detachChild,
      bulkUpdateStatus,
      clearError
    },

    // Lifecycle
    cleanup
  };
};

export default useSubTasks;
