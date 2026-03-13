import { useState } from 'react';
import { Segmented, Space } from 'antd';
import { BgColorsOutlined, TeamOutlined } from '@ant-design/icons';
import TaskBoard from './TaskBoard';
import ScrumBoard from './ScrumBoard';
import './TasksPage.css';

/**
 * TasksPage - Main container for task board views
 * 
 * Features:
 * - Toggle between Kanban and Scrum board views
 * - Maintains board type state
 * - Routes to appropriate board component
 * 
 * @component
 */
const TasksPage = () => {
    const [boardType, setBoardType] = useState('kanban'); // 'kanban' or 'scrum'

    return (
        <div className="tasks-page-container">
            {/* Page Header with Toggle */}
            <div className="tasks-page-header">
                <div className="header-content">
                    <h1>Tasks & Board</h1>

                    {/* Board Type Selector */}
                    <div className="board-toggle-section">
                        <Segmented
                            value={boardType}
                            onChange={setBoardType}
                            options={[
                                {
                                    label: (
                                        <Space size={8}>
                                            <BgColorsOutlined />
                                            <span>Kanban</span>
                                        </Space>
                                    ),
                                    value: 'kanban',
                                },
                                {
                                    label: (
                                        <Space size={8}>
                                            <TeamOutlined />
                                            <span>Scrum</span>
                                        </Space>
                                    ),
                                    value: 'scrum',
                                },
                            ]}
                            style={{
                                padding: '6px',
                                backgroundColor: 'var(--surface-tertiary, #f5f5f5)',
                                border: '1px solid var(--border-surface, #dfe1e6)',
                                borderRadius: '6px',
                            }}
                        />

                        {/* Info Text */}
                        <div className="toggle-info">
                            {boardType === 'kanban' ? (
                                <span>Showing all tasks across all sprints</span>
                            ) : (
                                <span>Showing tasks from selected sprint only</span>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Board Content */}
            <div className="tasks-page-content">
                {boardType === 'kanban' ? (
                    <TaskBoard />
                ) : (
                    <ScrumBoard />
                )}
            </div>
        </div>
    );
};

export default TasksPage;
