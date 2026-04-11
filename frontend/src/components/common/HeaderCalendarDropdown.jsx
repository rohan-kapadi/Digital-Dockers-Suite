import React, { useState, useMemo, useCallback } from 'react';
import { Dropdown, Button, Tag, Empty, Badge, Tooltip, Spin } from 'antd';
import { CalendarOutlined, ClockCircleOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { useNavigate } from 'react-router-dom';
import { useProject } from '../../context/ProjectContext';
import taskService from '../../services/taskService';
import api from '../../services/api';
import './HeaderCalendarDropdown.css';

const HeaderCalendarDropdown = () => {
    const navigate = useNavigate();
    const { currentProject } = useProject();
    const [selectedDate, setSelectedDate] = useState(dayjs());
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [workItems, setWorkItems] = useState([]);

    const fetchDynamicItems = useCallback(async () => {
        setLoading(true);
        try {
            const taskFilters = currentProject?._id ? { projectId: currentProject._id } : {};
            const [tasksResponse, meetingsResponse] = await Promise.all([
                taskService.getTasks(taskFilters),
                api.get('/meetings?type=upcoming'),
            ]);

            const tasks = Array.isArray(tasksResponse?.tasks) ? tasksResponse.tasks : (Array.isArray(tasksResponse) ? tasksResponse : []);
            const meetings = Array.isArray(meetingsResponse?.data) ? meetingsResponse.data : [];

            const normalizedTasks = tasks
                .filter((task) => task?.dueDate)
                .map((task) => ({
                    id: `task-${task._id}`,
                    date: dayjs(task.dueDate),
                    title: task.title || task.key || 'Untitled Task',
                    priority: task.priority || 'medium',
                    status: task.status === 'done' ? 'completed' : task.status === 'in_progress' ? 'in-progress' : 'pending',
                    source: 'task',
                }))
                .filter((item) => item.date.isValid());

            const normalizedMeetings = meetings
                .filter((meeting) => meeting?.scheduledAt)
                .map((meeting) => ({
                    id: `meeting-${meeting._id}`,
                    date: dayjs(meeting.scheduledAt),
                    title: meeting.title || 'Meeting',
                    priority: 'medium',
                    status: meeting.status === 'completed' ? 'completed' : meeting.status === 'in_progress' ? 'in-progress' : 'pending',
                    source: 'meeting',
                }))
                .filter((item) => item.date.isValid());

            setWorkItems([...normalizedTasks, ...normalizedMeetings]);
        } catch (error) {
            console.error('Failed to fetch calendar items', error);
            setWorkItems([]);
        } finally {
            setLoading(false);
        }
    }, [currentProject?._id]);

    const todayWorkItems = useMemo(() => {
        return workItems.filter(item => item.date.isSame(dayjs(), 'day'));
    }, [workItems]);

    const upcomingWorkItems = useMemo(() => {
        return workItems
            .filter(item => item.date.isAfter(dayjs(), 'day'))
            .sort((a, b) => a.date.valueOf() - b.date.valueOf())
            .slice(0, 3);
    }, [workItems]);

    const getPriorityColor = (priority) => {
        const colors = { high: 'red', medium: 'orange', low: 'green' };
        return colors[priority] || 'default';
    };

    const getStatusIcon = (status) => {
        if (status === 'completed') return '✓';
        if (status === 'in-progress') return '⟳';
        return '●';
    };

    const miniCalendarDays = () => {
        const startDate = selectedDate.startOf('month').startOf('week');
        const endDate = selectedDate.endOf('month').endOf('week');
        const days = [];
        let currentDate = startDate.clone();

        while (currentDate.isBefore(endDate)) {
            days.push(currentDate.clone());
            currentDate = currentDate.add(1, 'day');
        }

        return days;
    };

    const calendarContent = (
        <div className="header-calendar-dropdown">
            {/* Mini Calendar */}
            <div className="mini-calendar">
                <div className="calendar-header">
                    <span className="month-year">{selectedDate.format('MMMM YYYY')}</span>
                    <div className="nav-buttons">
                        <Button
                            type="text"
                            size="small"
                            onClick={() => setSelectedDate(selectedDate.subtract(1, 'month'))}
                            icon="←"
                        />
                        <Button
                            type="text"
                            size="small"
                            onClick={() => setSelectedDate(dayjs())}
                        >
                            Today
                        </Button>
                        <Button
                            type="text"
                            size="small"
                            onClick={() => setSelectedDate(selectedDate.add(1, 'month'))}
                            icon="→"
                        />
                    </div>
                </div>

                {/* Weekday Headers */}
                <div className="weekdays">
                    {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, idx) => (
                        <div key={`weekday-${idx}`} className="weekday">
                            {day}
                        </div>
                    ))}
                </div>

                {/* Calendar Days */}
                <div className="days-grid">
                    {miniCalendarDays().map((day, idx) => {
                        const isCurrentMonth = day.month() === selectedDate.month();
                        const isToday = day.isSame(dayjs(), 'day');
                        const hasWork = workItems.some(item => item.date.isSame(day, 'day'));

                        return (
                            <div
                                key={idx}
                                className={`day ${isCurrentMonth ? '' : 'other-month'} ${isToday ? 'today' : ''}`}
                                onClick={() => navigate('/dashboard/work-planner')}
                            >
                                <span className="day-number">{day.date()}</span>
                                {hasWork && <div className="work-indicator"></div>}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Today's Work */}
            <div className="work-section">
                <div className="section-header">
                    <ClockCircleOutlined /> Today
                    <Badge count={todayWorkItems.length} style={{ backgroundColor: '#1890ff' }} />
                </div>
                {loading ? (
                    <div style={{ textAlign: 'center', padding: '12px 0' }}><Spin size="small" /></div>
                ) : todayWorkItems.length > 0 ? (
                    <div className="calendar-work-list">
                        {todayWorkItems.map((item) => (
                            <div
                                key={item.id}
                                className="calendar-work-item"
                                onClick={() => navigate('/dashboard/work-planner')}
                                style={{ cursor: 'pointer', padding: '8px 4px' }}
                            >
                                <Tooltip title={item.title}>
                                    <div className="calendar-work-row">
                                        <span className="status-icon">{getStatusIcon(item.status)}</span>
                                        <span className="calendar-work-title">
                                            {item.title}
                                        </span>
                                        <Tag color="blue" className="calendar-priority-tag">
                                            {item.source}
                                        </Tag>
                                        <Tag color={getPriorityColor(item.priority)} className="calendar-priority-tag">
                                            {item.priority}
                                        </Tag>
                                    </div>
                                </Tooltip>
                            </div>
                        ))}
                    </div>
                ) : (
                    <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No work today" style={{ margin: '8px 0' }} />
                )}
            </div>

            {/* Upcoming Work */}
            <div className="work-section">
                <div className="section-header">
                    <CalendarOutlined /> Upcoming
                    <Badge count={upcomingWorkItems.length} style={{ backgroundColor: '#faad14' }} />
                </div>
                {loading ? (
                    <div style={{ textAlign: 'center', padding: '12px 0' }}><Spin size="small" /></div>
                ) : upcomingWorkItems.length > 0 ? (
                    <div className="calendar-work-list">
                        {upcomingWorkItems.map((item) => (
                            <div
                                key={item.id}
                                className="calendar-work-item compact"
                                onClick={() => navigate('/dashboard/work-planner')}
                                style={{ cursor: 'pointer', padding: '8px 4px' }}
                            >
                                <Tooltip title={`${item.date.format('MMM DD')} - ${item.title}`}>
                                    <div className="calendar-work-row">
                                        <Tag color="blue" className="calendar-date-tag">
                                            {item.date.format('MMM DD')}
                                        </Tag>
                                        <Tag color="geekblue" className="calendar-priority-tag">{item.source}</Tag>
                                        <span className="calendar-work-title">
                                            {item.title}
                                        </span>
                                    </div>
                                </Tooltip>
                            </div>
                        ))}
                    </div>
                ) : (
                    <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No upcoming work" style={{ margin: '8px 0' }} />
                )}
            </div>

            {/* Footer */}
            <div className="calendar-footer">
                <Button
                    type="primary"
                    block
                    size="small"
                    onClick={() => navigate('/dashboard/work-planner')}
                >
                    View Full Planner
                </Button>
            </div>
        </div>
    );

    return (
        <Dropdown
            popupRender={() => calendarContent}
            trigger={['click']}
            placement="bottomRight"
            open={open}
            onOpenChange={(nextOpen) => {
                setOpen(nextOpen);
                if (nextOpen) {
                    fetchDynamicItems();
                }
            }}
        >
            <Button
                type="text"
                icon={<CalendarOutlined className="header-calendar-trigger-icon" />}
                title="Work Planner"
                className="header-calendar-trigger"
            >
                {todayWorkItems.length > 0 && (
                    <Badge
                        count={todayWorkItems.length}
                        style={{
                            backgroundColor: '#ff4d4f',
                            position: 'absolute',
                            top: -2,
                            right: -6
                        }}
                    />
                )}
            </Button>
        </Dropdown>
    );
};

export default HeaderCalendarDropdown;
