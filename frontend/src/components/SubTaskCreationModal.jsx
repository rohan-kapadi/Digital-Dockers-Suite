import React, { useState } from 'react';
import axios from 'axios';
import '../styles/SubTaskCreationModal.css';

/**
 * SubTaskCreationModal Component
 * Modal dialog for creating new subtasks
 * Features:
 * - Form validation
 * - Required field validation
 * - Story points input
 * - Assignment to team member
 * - Loading and error states
 * - Keyboard accessibility (Escape to close)
 */
const SubTaskCreationModal = ({ parentTaskId, parentTask, onClose }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    storyPoints: 0,
    assignedTo: '',
    priority: 'medium',
    dueDate: ''
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [validation, setValidation] = useState({});

  /**
   * Validate form data
   */
  const validateForm = () => {
    const errors = {};

    if (!formData.title.trim()) {
      errors.title = 'Title is required';
    }

    if (formData.storyPoints < 0) {
      errors.storyPoints = 'Story points cannot be negative';
    }

    if (formData.dueDate && new Date(formData.dueDate) < new Date()) {
      errors.dueDate = 'Due date cannot be in the past';
    }

    setValidation(errors);
    return Object.keys(errors).length === 0;
  };

  /**
   * Handle input change
   */
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear validation error for this field on change
    if (validation[name]) {
      setValidation(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  /**
   * Handle form submission
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // Validate form
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const response = await axios.post(
        `/api/work-items/${parentTaskId}/subtasks`,
        {
          title: formData.title.trim(),
          description: formData.description.trim(),
          storyPoints: parseInt(formData.storyPoints, 10),
          assignedTo: formData.assignedTo || undefined,
          priority: formData.priority,
          dueDate: formData.dueDate || undefined
        },
        {
          withCredentials: true
        }
      );

      if (response.data.success) {
        // Reset form
        setFormData({
          title: '',
          description: '',
          storyPoints: 0,
          assignedTo: '',
          priority: 'medium',
          dueDate: ''
        });

        // Close modal with success flag
        onClose(true);
      }
    } catch (err) {
      console.error('Error creating subtask:', err);

      // Handle error messages
      if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else if (err.response?.data?.error) {
        setError(err.response.data.error);
      } else {
        setError('Failed to create subtask. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handle modal close and keyboard events
   */
  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      onClose(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={() => onClose(false)}>
      <div
        className="modal-dialog"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-labelledby="modal-title"
        aria-modal="true"
        onKeyDown={handleKeyDown}
      >
        {/* Modal Header */}
        <div className="modal-header">
          <h2 id="modal-title" className="modal-title">
            Create Sub-Task for {parentTask?.title}
          </h2>
          <button
            className="modal-close-btn"
            onClick={() => onClose(false)}
            aria-label="Close modal"
            title="Close (Esc)"
          >
            ×
          </button>
        </div>

        {/* Error message */}
        {error && (
          <div className="modal-error" role="alert">
            <span className="error-icon">⚠️</span>
            <span className="error-text">{error}</span>
            <button
              className="error-dismiss"
              onClick={() => setError(null)}
              aria-label="Dismiss error"
            >
              ×
            </button>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="modal-form">
          {/* Title field */}
          <div className="form-group">
            <label htmlFor="title" className="form-label">
              Title <span className="required">*</span>
            </label>
            <input
              type="text"
              id="title"
              name="title"
              className={`form-input ${validation.title ? 'is-invalid' : ''}`}
              value={formData.title}
              onChange={handleInputChange}
              placeholder="Enter subtask title"
              maxLength={255}
              aria-required="true"
              aria-invalid={!!validation.title}
              aria-describedby={validation.title ? 'title-error' : undefined}
              disabled={isLoading}
              autoFocus
            />
            {validation.title && (
              <span id="title-error" className="form-error">
                {validation.title}
              </span>
            )}
            <span className="form-hint">Max 255 characters</span>
          </div>

          {/* Description field */}
          <div className="form-group">
            <label htmlFor="description" className="form-label">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              className="form-textarea"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Enter subtask description (optional)"
              rows={4}
              maxLength={2000}
              disabled={isLoading}
            />
            <span className="form-hint">
              {formData.description.length}/2000 characters
            </span>
          </div>

          {/* Two column layout for smaller fields */}
          <div className="form-row">
            {/* Story Points field */}
            <div className="form-group">
              <label htmlFor="storyPoints" className="form-label">
                Story Points
              </label>
              <input
                type="number"
                id="storyPoints"
                name="storyPoints"
                className={`form-input ${validation.storyPoints ? 'is-invalid' : ''}`}
                value={formData.storyPoints}
                onChange={handleInputChange}
                placeholder="0"
                min="0"
                max="100"
                aria-invalid={!!validation.storyPoints}
                aria-describedby={validation.storyPoints ? 'storyPoints-error' : undefined}
                disabled={isLoading}
              />
              {validation.storyPoints && (
                <span id="storyPoints-error" className="form-error">
                  {validation.storyPoints}
                </span>
              )}
              <span className="form-hint">0-100</span>
            </div>

            {/* Priority field */}
            <div className="form-group">
              <label htmlFor="priority" className="form-label">
                Priority
              </label>
              <select
                id="priority"
                name="priority"
                className="form-select"
                value={formData.priority}
                onChange={handleInputChange}
                disabled={isLoading}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
          </div>

          {/* Two column layout for assignment and due date */}
          <div className="form-row">
            {/* Assigned To field */}
            <div className="form-group">
              <label htmlFor="assignedTo" className="form-label">
                Assign To
              </label>
              <input
                type="text"
                id="assignedTo"
                name="assignedTo"
                className="form-input"
                value={formData.assignedTo}
                onChange={handleInputChange}
                placeholder="User ID or email (optional)"
                disabled={isLoading}
              />
              <span className="form-hint">Optional - assign to team member</span>
            </div>

            {/* Due Date field */}
            <div className="form-group">
              <label htmlFor="dueDate" className="form-label">
                Due Date
              </label>
              <input
                type="date"
                id="dueDate"
                name="dueDate"
                className={`form-input ${validation.dueDate ? 'is-invalid' : ''}`}
                value={formData.dueDate}
                onChange={handleInputChange}
                disabled={isLoading}
                aria-invalid={!!validation.dueDate}
                aria-describedby={validation.dueDate ? 'dueDate-error' : undefined}
              />
              {validation.dueDate && (
                <span id="dueDate-error" className="form-error">
                  {validation.dueDate}
                </span>
              )}
            </div>
          </div>

          {/* Form Actions */}
          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => onClose(false)}
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <span className="spinner-small"></span>
                  Creating...
                </>
              ) : (
                'Create Sub-Task'
              )}
            </button>
          </div>
        </form>

        {/* Helpful info section */}
        <div className="modal-info">
          <p>
            <strong>Parent:</strong> {parentTask?.issueKey} - {parentTask?.title}
          </p>
          <p className="info-hint">
            This subtask will inherit the project context from its parent task. You can update
            additional details after creation.
          </p>
        </div>
      </div>
    </div>
  );
};

export default SubTaskCreationModal;
