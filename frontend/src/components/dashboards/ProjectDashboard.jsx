import { useState, useEffect } from 'react';
import { Row, Col, Card, Typography, Avatar, Progress, Tag, Spin, Empty, message, Modal, theme, Button, Select, Dropdown, Form, Input } from 'antd';
import { RiseOutlined, FireOutlined, CheckCircleOutlined, ClockCircleOutlined, ArrowUpOutlined, ArrowDownOutlined, PlusOutlined, SettingOutlined, FilterOutlined, EditOutlined, DeleteOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement } from 'chart.js';
import { Doughnut, Line } from 'react-chartjs-2';
import { useProject } from '../../context/ProjectContext';
import projectStatsService from '../../services/projectStatsService';
import searchService from '../../services/searchService';
import projectService from '../../services/projectService';
import userService from '../../services/userService';
import ForYouSection from './ForYouSection';
import UpcomingWorkCard from './UpcomingWorkCard';
import StatusOverview from './StatusOverview';
import TypesOfWorkCard from './TypesOfWorkCard';
import SprintBurndownChart from '../charts/SprintBurndownChart';
import SmartReassignmentDashboard from './SmartReassignmentDashboard';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import './dashboard.css';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement);

const { Title, Text } = Typography;

const ProjectDashboard = () => {
    const { currentProject, sprints, selectedSprintId, setSelectedSprintId, syncTrigger, refreshProjects, switchProject } = useProject();
    const { user } = useAuth();
    const navigate = useNavigate();
    const { token } = theme.useToken();
    const isProjectAdmin = user?.role === 'admin';
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState(null);
    // New state for Jira-style features
    const [forYouData, setForYouData] = useState(null);
    const [upcomingData, setUpcomingData] = useState(null);
    // Smart Reassignment modal state
    const [showReassignmentModal, setShowReassignmentModal] = useState(false);
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [leadModalOpen, setLeadModalOpen] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);
    const [usersLoading, setUsersLoading] = useState(false);
    const [projectUsers, setProjectUsers] = useState([]);
    const [editForm] = Form.useForm();
    const [leadForm] = Form.useForm();

    useEffect(() => {
        if (currentProject?._id) {
            loadDashboardData(selectedSprintId);
            return;
        }

        setLoading(false);
        setStats(null);
        setForYouData(null);
        setUpcomingData(null);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentProject, sprints, selectedSprintId, syncTrigger]);

    const loadDashboardData = async (sprintId) => {
        setLoading(true);
        try {
            // Load all data in parallel from database/API
            const [statsData, assignedTasks] = await Promise.all([
                projectStatsService.getProjectStats(currentProject._id, sprintId),
                searchService.getAssignedToMe(10)
            ]);

            setStats(statsData);

            // Build ForYou section data from real database
            const forYouData = {
                assignedIssues: assignedTasks || []
            };
            setForYouData(forYouData);

            // Build upcoming tasks data from project stats (team-wide from backend)
            setUpcomingData({
                upcomingTasks: statsData.upcomingTasks || [],
                unscheduledTasks: statsData.unscheduledTasks || []
            });

            // Load burndown if there's an active sprint
        } catch (error) {
            console.error('Error loading dashboard data:', error);
            message.error('Failed to load dashboard data');
        } finally {
            setLoading(false);
        }
    };

    const fetchUsers = async () => {
        setUsersLoading(true);
        try {
            const users = await userService.getUsers();
            setProjectUsers(users || []);
        } catch (error) {
            console.error('Failed to load users:', error);
            message.error('Failed to load users');
        } finally {
            setUsersLoading(false);
        }
    };

    const openEditModal = () => {
        if (!currentProject?._id) return;
        editForm.setFieldsValue({
            name: currentProject.name,
            key: currentProject.key,
            description: currentProject.description,
            projectType: currentProject.projectType || 'scrum',
        });
        setEditModalOpen(true);
    };

    const handleUpdateProject = async (values) => {
        if (!currentProject?._id) return;
        setActionLoading(true);
        try {
            await projectService.updateProject(currentProject._id, {
                name: values.name,
                key: values.key?.toUpperCase(),
                description: values.description,
                projectType: values.projectType,
            });
            await refreshProjects();
            await switchProject(currentProject._id);
            await loadDashboardData(selectedSprintId);
            message.success('Project updated');
            setEditModalOpen(false);
        } catch (error) {
            message.error(error.response?.data?.message || 'Failed to update project');
        } finally {
            setActionLoading(false);
        }
    };

    const openLeadModal = async () => {
        if (!isProjectAdmin) {
            message.warning('Only admins can assign project lead');
            return;
        }

        if (!projectUsers.length) {
            await fetchUsers();
        }

        leadForm.setFieldsValue({ lead: currentProject?.lead?._id || undefined });
        setLeadModalOpen(true);
    };

    const handleAssignLead = async (values) => {
        if (!currentProject?._id) return;
        setActionLoading(true);
        try {
            await projectService.patchProject(currentProject._id, {
                lead: values.lead,
            });
            await refreshProjects();
            await switchProject(currentProject._id);
            await loadDashboardData(selectedSprintId);
            message.success('Project lead updated');
            setLeadModalOpen(false);
        } catch (error) {
            message.error(error.response?.data?.message || 'Failed to assign lead');
        } finally {
            setActionLoading(false);
        }
    };

    const handleDeleteProject = () => {
        if (!currentProject?._id) return;

        Modal.confirm({
            title: 'Delete this project?',
            icon: <ExclamationCircleOutlined />,
            content: 'This will permanently remove project data, including tasks and sprints.',
            okText: 'Delete',
            okButtonProps: { danger: true },
            cancelText: 'Cancel',
            onOk: async () => {
                try {
                    await projectService.deleteProject(currentProject._id);
                    const updatedProjects = await refreshProjects();

                    if (updatedProjects?.length > 0) {
                        await switchProject(updatedProjects[0]._id, updatedProjects);
                        navigate('/dashboard');
                    } else {
                        navigate('/dashboard/projects');
                    }

                    message.success('Project deleted');
                } catch (error) {
                    message.error(error.response?.data?.message || 'Failed to delete project');
                }
            },
        });
    };

    const projectSettingsItems = [
        {
            key: 'edit',
            icon: <EditOutlined />,
            label: 'Edit Project',
            onClick: openEditModal,
        },
        {
            type: 'divider',
        },
        {
            key: 'delete',
            icon: <DeleteOutlined />,
            label: 'Delete Project',
            danger: true,
            onClick: handleDeleteProject,
        },
    ];

    // Chart data configuration
    const statusChartData = stats ? {
        labels: ['To Do', 'In Progress', 'Review', 'Done'],
        datasets: [{
            data: [
                stats.statusBreakdown?.todo || 0,
                stats.statusBreakdown?.in_progress || 0,
                stats.statusBreakdown?.review || 0,
                stats.statusBreakdown?.done || 0
            ],
            backgroundColor: ['#dfe1e6', '#0052cc', '#ff5630', '#00875a'],
            borderWidth: 0,
        }]
    } : null;

    // Sprint velocity chart data - Shows progress across sprint
    const sprintVelocityData = stats && stats.activeSprint && stats.totalStoryPoints > 0 ? {
        labels: ['Planned', 'Completed', 'In Progress', 'Remaining'],
        datasets: [{
            label: 'Story Points',
            data: [
                stats.totalStoryPoints || 0,
                stats.completedStoryPoints || 0,
                stats.inProgressStoryPoints || 0,
                (stats.totalStoryPoints - stats.completedStoryPoints - stats.inProgressStoryPoints) || 0
            ],
            backgroundColor: ['#dfe1e6', '#00875a', '#0052cc', '#ff5630'],
            borderColor: ['#626f86', '#00875a', '#0052cc', '#ff5630'],
            borderWidth: 2,
            fill: false,
            tension: 0.4,
            borderRadius: 4,
            pointRadius: 5,
            pointBackgroundColor: ['#626f86', '#00875a', '#0052cc', '#ff5630'],
            pointBorderColor: '#fff',
            pointBorderWidth: 2
        }]
    } : null;

    // Derived synchronized metrics
    const displayTotalCount = stats ? ((stats.statusBreakdown?.todo || 0) + (stats.statusBreakdown?.in_progress || 0) + (stats.statusBreakdown?.review || 0) + (stats.statusBreakdown?.done || 0)) || stats.totalTasks || 0 : 0;
    const displayDoneCount = stats ? (stats.statusBreakdown?.done || stats.issuesDone || 0) : 0;
    const syncedProgress = displayTotalCount > 0 ? Math.round((displayDoneCount / displayTotalCount) * 100) : (stats?.sprintProgress || 0);

    if (loading) {
        return (
            <div className="dashboard-container" style={{ padding: 24 }}>
                {/* Header skeleton */}
                <div style={{ marginBottom: 32 }}>
                    <div className="skeleton-line" style={{ width: '40%', height: 28 }}></div>
                    <div className="skeleton-line short" style={{ marginTop: 8 }}></div>
                </div>
                {/* KPI row skeleton */}
                <Row gutter={[16, 16]} style={{ marginBottom: 32 }}>
                    {[1, 2, 3, 4].map(i => (
                        <Col xs={24} sm={12} lg={6} key={i}>
                            <div className="skeleton-card" style={{ height: 100, padding: 16 }}>
                                <div className="skeleton-line short" style={{ marginBottom: 8 }}></div>
                                <div className="skeleton-line" style={{ width: '60%', height: 24 }}></div>
                            </div>
                        </Col>
                    ))}
                </Row>
                {/* Charts row skeleton */}
                <Row gutter={[24, 24]}>
                    <Col xs={24} lg={16}>
                        <div className="skeleton-card" style={{ height: 300, marginBottom: 24 }}></div>
                        <Row gutter={[24, 24]}>
                            <Col xs={24} md={12}>
                                <div className="skeleton-card" style={{ height: 200 }}></div>
                            </Col>
                            <Col xs={24} md={12}>
                                <div className="skeleton-card" style={{ height: 200 }}></div>
                            </Col>
                        </Row>
                    </Col>
                    <Col xs={24} lg={8}>
                        <div className="skeleton-card" style={{ height: 250, marginBottom: 24 }}></div>
                        <div className="skeleton-card" style={{ height: 200 }}></div>
                    </Col>
                </Row>
            </div>
        );
    }

    if (!currentProject?._id) {
        return (
            <Card style={{ margin: 24 }}>
                <Empty
                    description={
                        user?.role === 'admin'
                            ? 'No project selected. Create a project to load the dashboard.'
                            : 'No project available yet. Ask an admin to create a project.'
                    }
                />
            </Card>
        );
    }

    return (
        <div className="dashboard-container">
            {/* Header */}
            <div className="dashboard-header dashboard-hero" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
                <div>
                    <Title level={2} style={{ marginTop: 0, marginBottom: 4 }}>Project Overview: {currentProject?.name || 'No Project Selected'}</Title>
                    <Typography.Text type="secondary" className="dashboard-project-meta">
                        <span>
                            Lead: {currentProject?.lead?.fullName || 'Unassigned'}
                            {isProjectAdmin && (
                                <a
                                    href="#"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        openLeadModal();
                                    }}
                                    style={{ fontSize: '13px', marginLeft: 8, textDecoration: 'underline' }}
                                >
                                    {currentProject?.lead?.fullName ? 'Change' : 'Assign'}
                                </a>
                            )}
                        </span>
                        <span style={{ margin: '0 8px' }}>•</span>
                        <span>Key: {currentProject?.key}</span>
                        <span style={{ margin: '0 8px' }}>•</span>
                        <span>Type: {currentProject?.projectType || 'Scrum'}</span>
                    </Typography.Text>
                </div>
                <div className="dashboard-toolbar" style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    <div className="dashboard-scope-picker" style={{ marginRight: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Text strong style={{ fontSize: '12px', color: token.colorTextSecondary }}>View Scope:</Text>
                        <Select
                            value={selectedSprintId}
                            onChange={setSelectedSprintId}
                            className="dashboard-scope-select"
                            placeholder="Select Sprint"
                            suffixIcon={<FilterOutlined />}
                        >
                            <Select.Option value="general">🌐 General (Project Wide)</Select.Option>
                            {sprints.map(s => (
                                <Select.Option key={s._id} value={s._id}>
                                    🏃 {s.name} ({s.status})
                                </Select.Option>
                            ))}
                        </Select>
                    </div>
                    {isProjectAdmin ? (
                        <Dropdown menu={{ items: projectSettingsItems }} trigger={['click']}>
                            <Button icon={<SettingOutlined />}>Settings</Button>
                        </Dropdown>
                    ) : (
                        <Button icon={<SettingOutlined />} onClick={() => navigate('/dashboard/settings')}>Settings</Button>
                    )}
                    <Button type="primary" icon={<PlusOutlined />} onClick={() => message.info('Create task opened')}>Create Issue</Button>
                </div>
            </div>

            {/* For You Section */}
            {forYouData && (
                <div className="for-you-section" style={{ marginBottom: 32 }}>
                    <div className="for-you-title">For You</div>
                    <ForYouSection assignedIssues={forYouData.assignedIssues} />
                </div>
            )}

            {/* KPI Metrics Section */}
            <Row gutter={[16, 16]} style={{ marginBottom: 32 }}>
                <Col xs={24} sm={12} lg={6}>
                    <div className="kpi-card">
                        <div className="kpi-icon" style={{ color: '#ff5630' }}>
                            <FireOutlined />
                        </div>
                        <div className="kpi-content">
                        <div className="kpi-label">{selectedSprintId === 'general' ? 'Project Completion' : 'Sprint Progress'}</div>
                            <div className="kpi-value" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                {syncedProgress}%
                                <span style={{ fontSize: 13, color: '#10B981', display: 'flex', alignItems: 'center', fontWeight: 600 }}>
                                    <ArrowUpOutlined style={{ fontSize: 12, marginRight: 2 }} /> 4%
                                </span>
                            </div>
                            <div className="kpi-progress" style={{ marginTop: 8 }}>
                                <Progress
                                    percent={syncedProgress}
                                    showInfo={false}
                                    strokeColor="#ff5630"
                                    size="small"
                                />
                            </div>
                        </div>
                    </div>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <div className="kpi-card">
                        <div className="kpi-icon" style={{ color: '#00875a' }}>
                            <CheckCircleOutlined />
                        </div>
                        <div className="kpi-content">
                            <div className="kpi-label">Completed</div>
                            <div className="kpi-value" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                {displayDoneCount}
                                <span style={{ fontSize: 13, color: '#10B981', display: 'flex', alignItems: 'center', fontWeight: 600 }}>
                                    <ArrowUpOutlined style={{ fontSize: 12, marginRight: 2 }} /> 12%
                                </span>
                            </div>
                            <div style={{ fontSize: 12, color: token.colorTextSecondary, marginTop: 4 }}>
                                of {displayTotalCount} total
                            </div>
                        </div>
                    </div>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <div className="kpi-card">
                        <div className="kpi-icon" style={{ color: '#ffab00' }}>
                            <ClockCircleOutlined />
                        </div>
                        <div className="kpi-content">
                            <div className="kpi-label">Days Remaining</div>
                            <div className="kpi-value" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                {stats?.daysRemaining || 0}
                            </div>
                            <div style={{ fontSize: 12, color: token.colorTextSecondary, marginTop: 4 }}>
                                in sprint
                            </div>
                        </div>
                    </div>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <div className="kpi-card">
                        <div className="kpi-icon" style={{ color: '#0052cc' }}>
                            <RiseOutlined />
                        </div>
                        <div className="kpi-content">
                            <div className="kpi-label">Velocity</div>
                            <div className="kpi-value" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                {stats?.velocity || 0}
                                <span style={{ fontSize: 13, color: '#EF4444', display: 'flex', alignItems: 'center', fontWeight: 600 }}>
                                    <ArrowDownOutlined style={{ fontSize: 12, marginRight: 2 }} /> 2%
                                </span>
                            </div>
                            <div style={{ fontSize: 12, color: token.colorTextSecondary, marginTop: 4 }}>
                                points/day
                            </div>
                        </div>
                    </div>
                </Col>
            </Row>

            <Modal
                title="Edit Project"
                open={editModalOpen}
                onCancel={() => setEditModalOpen(false)}
                footer={null}
                destroyOnHidden
            >
                <Form form={editForm} layout="vertical" onFinish={handleUpdateProject}>
                    <Form.Item name="name" label="Project Name" rules={[{ required: true, message: 'Please enter a project name' }]}>
                        <Input placeholder="Project name" />
                    </Form.Item>
                    <Form.Item
                        name="key"
                        label="Project Key"
                        rules={[
                            { required: true, message: 'Please enter a project key' },
                            { pattern: /^[A-Z]{2,10}$/, message: 'Must be 2-10 uppercase letters only' },
                        ]}
                    >
                        <Input maxLength={10} style={{ textTransform: 'uppercase' }} placeholder="PROJECTKEY" />
                    </Form.Item>
                    <Form.Item name="description" label="Description">
                        <Input.TextArea rows={3} placeholder="Describe this project" />
                    </Form.Item>
                    <Form.Item name="projectType" label="Project Type">
                        <Select>
                            <Select.Option value="scrum">Scrum</Select.Option>
                            <Select.Option value="kanban">Kanban</Select.Option>
                            <Select.Option value="business">Business</Select.Option>
                        </Select>
                    </Form.Item>
                    <Form.Item style={{ marginBottom: 0 }}>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                            <Button onClick={() => setEditModalOpen(false)}>Cancel</Button>
                            <Button type="primary" htmlType="submit" loading={actionLoading}>Save</Button>
                        </div>
                    </Form.Item>
                </Form>
            </Modal>

            <Modal
                title="Assign Project Lead"
                open={leadModalOpen}
                onCancel={() => setLeadModalOpen(false)}
                footer={null}
                destroyOnHidden
            >
                <Form form={leadForm} layout="vertical" onFinish={handleAssignLead}>
                    <Form.Item name="lead" label="Lead" rules={[{ required: true, message: 'Please select a lead' }]}>
                        <Select
                            placeholder="Select project lead"
                            loading={usersLoading}
                            showSearch
                            optionFilterProp="label"
                            options={projectUsers.map((u) => ({ value: u._id, label: `${u.fullName} (${u.role})` }))}
                        />
                    </Form.Item>
                    <Form.Item style={{ marginBottom: 0 }}>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                            <Button onClick={() => setLeadModalOpen(false)}>Cancel</Button>
                            <Button type="primary" htmlType="submit" loading={actionLoading}>Save</Button>
                        </div>
                    </Form.Item>
                </Form>
            </Modal>

            <Row gutter={[24, 24]} style={{ marginBottom: 32 }}>
                {/* Main Content: Charts & Activity */}
                <Col xs={24} lg={16}>
                    {/* Sprint Burndown Chart */}
                    {stats?.activeSprint && (
                        <div style={{ marginBottom: 24 }}>
                            <SprintBurndownChart
                                sprintId={stats.activeSprint._id}
                                sprintName={stats.activeSprint.name}
                            />
                        </div>
                    )}
                    {!stats?.activeSprint && (
                        <Card style={{ marginBottom: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
                            <Empty description="No active sprint" />
                        </Card>
                    )}

                    <Row gutter={[24, 24]}>
                        <Col xs={24} md={12}>
                            <div className="chart-card">
                                <div className="ant-card-head">
                                    <Typography.Text strong>Issue Status</Typography.Text>
                                </div>
                                <div className="ant-card-body">
                                    <div className="chart-container">
                                        {statusChartData ? (
                                            <Doughnut data={statusChartData} options={{ maintainAspectRatio: false }} />
                                        ) : (
                                            <Empty description="No data" />
                                        )}
                                    </div>
                                </div>
                            </div>
                        </Col>
                        <Col xs={24} md={12}>
                            <div className="chart-card">
                                <div className="ant-card-head">
                                    <Typography.Text strong>Sprint Velocity</Typography.Text>
                                </div>
                                <div className="ant-card-body">
                                    <div className="chart-container">
                                        {sprintVelocityData ? (
                                            <Line
                                                data={sprintVelocityData}
                                                options={{
                                                    maintainAspectRatio: false,
                                                    responsive: true,
                                                    plugins: {
                                                        legend: {
                                                            display: true,
                                                            position: 'top',
                                                        }
                                                    },
                                                    scales: {
                                                        y: {
                                                            beginAtZero: true
                                                        }
                                                    }
                                                }}
                                            />
                                        ) : (
                                            <Empty description="No sprint data" />
                                        )}
                                    </div>
                                </div>
                            </div>
                        </Col>
                    </Row>
                    <Row gutter={[24, 24]} style={{ marginTop: 24 }}>
                        <Col xs={24}>
                            <Card
                                className="team-workload-card"
                                title={
                                    <div>
                                        <Typography.Text strong style={{ fontSize: '13px', color: token.colorText, fontWeight: 600 }}>
                                            Team workload
                                        </Typography.Text>
                                        <div style={{ fontSize: '12px', color: token.colorTextSecondary, marginTop: 2 }}>
                                            Monitor the capacity of your team.{' '}
                                            <a href="#" onClick={(e) => {
                                                e.preventDefault();
                                                setShowReassignmentModal(true);
                                            }} style={{ color: token.colorPrimary, textDecoration: 'none', fontWeight: 500 }}>
                                                Reassign work items to get the right balance
                                            </a>
                                        </div>
                                    </div>
                                }
                                style={{
                                    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                                    borderRadius: 8,
                                    border: `1px solid ${token.colorBorderSecondary}`
                                }}
                                styles={{ body: { padding: '16px 0' } }}
                            >
                                {stats?.workload?.length > 0 ? (
                                    <div>
                                        {/* Header Row */}
                                        <div style={{ display: 'flex', paddingLeft: 16, paddingRight: 16, marginBottom: 8, gap: 24 }}>
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <Text type="secondary" strong style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px', color: token.colorTextSecondary }}>
                                                    Assignee
                                                </Text>
                                            </div>
                                            <div style={{ flex: 1.5 }}>
                                                <Text type="secondary" strong style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px', color: token.colorTextSecondary }}>
                                                    Work distribution
                                                </Text>
                                            </div>
                                        </div>

                                        {/* Data Rows */}
                                        {(stats.workload || []).map((item, idx) => {
                                            const maxPoints = Math.max(...(stats.workload || []).map(w => w.points || 0), 1);
                                            const percentage = (item.points / maxPoints) * 100;
                                            return (
                                                <div
                                                    key={idx}
                                                    style={{
                                                        display: 'flex',
                                                        flexDirection: 'column',
                                                        paddingLeft: 16,
                                                        paddingRight: 16,
                                                        paddingTop: 12,
                                                        paddingBottom: 12,
                                                        borderBottom: idx < (stats.workload || []).length - 1 ? `1px solid ${token.colorBorderSecondary}` : 'none',
                                                        gap: 8
                                                    }}
                                                >
                                                    {/* Row: Avatar + Name + Points Bar */}
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
                                                        {/* Assignee Column */}
                                                        <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
                                                            <Avatar
                                                                size={32}
                                                                style={{ backgroundColor: '#0052cc', fontSize: '12px', fontWeight: 700, flexShrink: 0 }}
                                                            >
                                                                {item.name?.[0]?.toUpperCase()}
                                                            </Avatar>
                                                            <Text
                                                                ellipsis
                                                                style={{ fontSize: '13px', color: token.colorText, fontWeight: 500 }}
                                                            >
                                                                {item.name}
                                                            </Text>
                                                        </div>

                                                        {/* Work Distribution Column */}
                                                        <div style={{ flex: 1.5, display: 'flex', alignItems: 'center', gap: 8 }}>
                                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                                <div style={{
                                                                    height: '8px',
                                                                    backgroundColor: '#dfe1e6',
                                                                    borderRadius: '4px',
                                                                    overflow: 'hidden'
                                                                }}>
                                                                    <div style={{
                                                                        height: '100%',
                                                                        backgroundColor: '#626f86',
                                                                        width: `${percentage}%`,
                                                                        transition: 'width 0.3s ease',
                                                                        borderRadius: '4px'
                                                                    }}></div>
                                                                </div>
                                                            </div>
                                                            <Text
                                                                strong
                                                                style={{ fontSize: '12px', color: token.colorText, minWidth: 60, textAlign: 'right', flexShrink: 0 }}
                                                            >
                                                                {item.points || 0} of {maxPoints || 0} pts ({Math.round(percentage)}%)
                                                            </Text>
                                                        </div>
                                                    </div>

                                                    {/* Row: Task title chips */}
                                                    {item.tasks && item.tasks.length > 0 && (
                                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, paddingLeft: 42 }}>
                                                            {item.tasks.map((taskTitle, tIdx) => (
                                                                <Tag key={tIdx} color="blue" style={{ fontSize: 11, margin: 0, borderRadius: 4 }}>
                                                                    {taskTitle.length > 40 ? taskTitle.slice(0, 37) + '...' : taskTitle}
                                                                </Tag>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div style={{ textAlign: 'center', padding: '32px 16px', color: '#8c8c8c' }}>
                                        <Text type="secondary" style={{ fontSize: '12px' }}>No workload data</Text>
                                    </div>
                                )}
                            </Card>
                        </Col>
                    </Row>
                </Col>

                <Col xs={24} lg={8}>
                    {/* Status Overview */}
                    {stats && (
                        <div style={{ marginBottom: 24 }}>
                            <StatusOverview stats={stats} />
                        </div>
                    )}

                    {/* Types of Work */}
                    {currentProject?._id && (
                        <div style={{ marginBottom: 24 }}>
                            <TypesOfWorkCard projectId={currentProject._id} />
                        </div>
                    )}

                    {/* Upcoming & Unscheduled Work */}
                    {upcomingData && (
                        <div style={{ marginBottom: 24 }}>
                            <UpcomingWorkCard
                                upcomingTasks={upcomingData.upcomingTasks}
                                unscheduledTasks={upcomingData.unscheduledTasks}
                            />
                        </div>
                    )}
                </Col>
            </Row>

            {/* Smart Reassignment Modal */}
            <Modal
                title="Smart Reassignment Assistant"
                open={showReassignmentModal}
                onCancel={() => setShowReassignmentModal(false)}
                width={1200}
                footer={[
                    <button
                        key="close"
                        onClick={() => setShowReassignmentModal(false)}
                        style={{
                            padding: '8px 16px',
                            backgroundColor: '#f0f0f0',
                            border: '1px solid #d9d9d9',
                            borderRadius: 6,
                            cursor: 'pointer',
                            fontSize: '14px',
                            fontWeight: 500
                        }}
                    >
                        Close
                    </button>
                ]}
                styles={{ body: { padding: 0 } }}
            >
                <SmartReassignmentDashboard sprintId={stats?.activeSprint?._id} />
            </Modal>
        </div>
    );
};

export default ProjectDashboard;

