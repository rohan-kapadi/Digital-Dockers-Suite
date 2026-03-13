import React, { useState } from 'react';
import { Trash2 } from 'lucide-react';
import workLogService from '../../services/workLogService';
import './WorkLogs.css';

/**
 * WorkLogList
 * Displays list of work logs for a ticket
 * Shows time, user, type, and allows editing/deletion
 */
const WorkLogList = ({ logs = [], onDeleted }) => {
  const [deleting, setDeleting] = useState(null);
  const [error, setError] = useState(null);

  const handleDelete = async (workLogId) => {
    if (!window.confirm('Are you sure you want to delete this work log?')) {
      return;
    }

    try {
      setDeleting(workLogId);
      setError(null);

      await workLogService.deleteWorkLog(workLogId);

      if (onDeleted) {
        onDeleted();
      }
    } catch (err) {
      setError(`Failed to delete: ${err.message}`);
      console.error('Failed to delete work log:', err);
    } finally {
      setDeleting(null);
    }
  };

  const formatDuration = (minutes) => {
    if (!minutes) return '0m';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const formatDateTime = (date) => {
    const d = new Date(date);
    return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (logs.length === 0) {
    return null;
  }

  return (
    <div className="work-log-list">
      {error && (
        <div className="work-log-alert work-log-alert-error work-log-alert-compact">
          {error}
        </div>
      )}

      {logs.map((log) => (
        <div key={log._id} className="work-log-item">
          <div className="work-log-item-info">
            <div className="work-log-item-header">
              <span className="work-log-item-duration">
                ⏱️ {formatDuration(log.durationMinutes)}
              </span>
              <span className={`work-log-item-type ${log.logType === 'TIMER' ? 'timer' : 'manual'}`}>
                {log.logType === 'TIMER' ? 'Timer' : 'Manual'}
              </span>
              {!log.billable && (
                <span className="work-log-chip work-log-chip-non-billable">
                  Non-billable
                </span>
              )}
            </div>

            {log.description && (
              <div className="work-log-item-description">
                "{log.description}"
              </div>
            )}

            <div className="work-log-item-meta">
              <span>
                👤 {log.userId?.name || 'Unknown'}
              </span>
              <span>
                📅 {formatDateTime(log.createdAt)}
              </span>
              {log.status && log.status !== 'STOPPED' && (
                <span className={`work-log-chip work-log-chip-status ${log.status === 'APPROVED' ? 'approved' : 'pending'}`}>
                  {log.status}
                </span>
              )}
            </div>
          </div>

          <div className="work-log-item-actions">
            <button
              className="work-log-item-action-btn delete"
              onClick={() => handleDelete(log._id)}
              disabled={deleting === log._id}
              title="Delete work log"
            >
              {deleting === log._id ? '...' : <Trash2 size={14} />}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default WorkLogList;
