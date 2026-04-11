
import { useState } from 'react';
import { Row, Col, Card, Typography, Button, Empty, Tag, Avatar, Space, Skeleton, Grid, Form, Input, Select, Modal, Popconfirm, Tooltip, message } from 'antd';
import { PlusOutlined, TeamOutlined, SettingOutlined, ProjectOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useProject } from '../context/ProjectContext';
import { useThemeMode } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import projectService from '../services/projectService';

const { Title, Text, Paragraph } = Typography;
const { useBreakpoint } = Grid;

const ProjectsListPage = () => {
    const navigate = useNavigate();
    const { projects, isLoading, switchProject, refreshProjects, currentProject } = useProject();
    const { user } = useAuth();
    const { mode } = useThemeMode();
    const isDark = mode === 'dark';
    const screens = useBreakpoint();

    const isMobile = !screens.md;
    const isProjectAdmin = user?.role === 'admin';
    const cardBorderColor = isDark ? '#30363d' : '#e1e4e8';
    const secondaryTextColor = isDark ? '#8b949e' : '#626f86';
    const [editOpen, setEditOpen] = useState(false);
    const [editingProject, setEditingProject] = useState(null);
    const [savingProject, setSavingProject] = useState(false);
    const [deletingProjectId, setDeletingProjectId] = useState(null);
    const [form] = Form.useForm();


    const handleProjectClick = (project) => {
        switchProject(project._id);
        navigate('/dashboard');
    };

    const handleOpenEdit = (project) => {
        setEditingProject(project);
        form.setFieldsValue({
            name: project.name,
            key: project.key,
            description: project.description,
            projectType: project.projectType || 'scrum',
        });
        setEditOpen(true);
    };

    const handleUpdateProject = async (values) => {
        if (!editingProject?._id) return;

        setSavingProject(true);
        try {
            await projectService.updateProject(editingProject._id, {
                name: values.name,
                key: values.key?.toUpperCase(),
                description: values.description,
                projectType: values.projectType,
            });
            message.success('Project updated successfully');
            setEditOpen(false);
            setEditingProject(null);
            await refreshProjects();
        } catch (error) {
            message.error(error.response?.data?.message || 'Failed to update project');
        } finally {
            setSavingProject(false);
        }
    };

    const handleDeleteProject = async (project) => {
        setDeletingProjectId(project._id);
        try {
            await projectService.deleteProject(project._id);
            message.success('Project deleted successfully');

            if (currentProject?._id === project._id) {
                navigate('/dashboard/projects');
            }

            await refreshProjects();
        } catch (error) {
            message.error(error.response?.data?.message || 'Failed to delete project');
        } finally {
            setDeletingProjectId(null);
        }
    };

    const getProjectTypeColor = (type) => {
        switch (type) {
            case 'scrum': return 'blue';
            case 'kanban': return 'green';
            default: return 'default';
        }
    };

    const getProjectGradient = (index) => {
        const gradients = [
            'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
            'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
            'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
            'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
            'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)',
        ];
        return gradients[index % gradients.length];
    };

    if (isLoading) {
        return (
            <div style={{ maxWidth: 1200, margin: '0 auto', padding: isMobile ? '16px' : '24px' }}>
                <div style={{ marginBottom: 24 }}>
                    <Skeleton.Input active size="large" style={{ width: 200, marginBottom: 8 }} />
                    <Skeleton.Input active size="small" style={{ width: 300 }} />
                </div>
                <Row gutter={[24, 24]}>
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                        <Col xs={24} sm={12} lg={8} key={i}>
                            <Card style={{ height: 180 }}>
                                <Skeleton avatar active paragraph={{ rows: 2 }} />
                            </Card>
                        </Col>
                    ))}
                </Row>
            </div>
        );
    }

    return (
        <div style={{
            maxWidth: 1200,
            margin: '0 auto',
            padding: isMobile ? '16px' : '24px',
            animation: 'fadeIn 0.3s ease-out',
            color: isDark ? '#e6edf3' : undefined,
        }}>
            <div style={{
                display: 'flex',
                flexDirection: isMobile ? 'column' : 'row',
                justifyContent: 'space-between',
                alignItems: isMobile ? 'stretch' : 'center',
                marginBottom: 24,
                gap: isMobile ? 16 : 0,
            }}>
                <div>
                    <Title level={2} style={{ margin: 0, fontSize: isMobile ? '24px' : '28px' }}>
                        Projects
                    </Title>
                    <Text type="secondary" style={{ fontSize: isMobile ? '13px' : '14px' }}>
                        View and manage all your projects
                    </Text>
                    {isProjectAdmin && (
                        <div style={{ marginTop: 6 }}>
                            <Tag color="blue" style={{ margin: 0 }}>Admin controls enabled</Tag>
                        </div>
                    )}
                </div>
                {isProjectAdmin && (
                    <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        size={isMobile ? 'large' : 'middle'}
                        onClick={() => navigate('/dashboard')}
                        style={{
                            borderRadius: 8,
                            fontWeight: 500,
                            boxShadow: isDark
                                ? '0 2px 10px rgba(47, 129, 247, 0.35)'
                                : '0 2px 8px rgba(0, 82, 204, 0.25)',
                        }}
                    >
                        Create Project
                    </Button>
                )}
            </div>

            {projects.length === 0 ? (
                <Card style={{
                    textAlign: 'center',
                    padding: isMobile ? '32px 16px' : '48px 24px',
                    borderRadius: 12,
                    border: `2px dashed ${cardBorderColor}`,
                    background: isDark
                        ? 'linear-gradient(135deg, #161b22 0%, #1c2128 100%)'
                        : 'linear-gradient(135deg, #f8f9fa 0%, #f0f2f5 100%)',
                }}>
                    <ProjectOutlined
                        style={{
                            fontSize: 48,
                            color: isDark ? '#6e7681' : '#bfbfbf',
                            marginBottom: 16,
                        }}
                    />
                    <Empty
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                        description={
                            <span style={{ color: secondaryTextColor, fontSize: '14px' }}>
                                No projects yet. <br />
                                {isProjectAdmin
                                    ? 'Create your first project to get started!'
                                    : 'Ask an admin to create a project to get started!'}
                            </span>
                        }
                    >
                        {isProjectAdmin && (
                            <Button type="primary" icon={<PlusOutlined />} size="large" style={{ marginTop: 8 }}>
                                Create Project
                            </Button>
                        )}
                    </Empty>
                </Card>
            ) : (
                <Row gutter={[isMobile ? 16 : 24, isMobile ? 16 : 24]}>
                    {projects.map((project, index) => (
                        <Col xs={24} sm={12} lg={8} xl={8} key={project._id}>
                            <Card
                                hoverable
                                onClick={() => handleProjectClick(project)}
                                style={{
                                    height: '100%',
                                    borderRadius: 12,
                                    overflow: 'hidden',
                                    border: `1px solid ${cardBorderColor}`,
                                    background: isDark ? '#161b22' : '#fff',
                                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                }}
                                styles={{
                                    body: { padding: isMobile ? 16 : 20 },
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.transform = 'translateY(-6px)';
                                    e.currentTarget.style.boxShadow = isDark
                                        ? '0 12px 24px rgba(0, 0, 0, 0.5)'
                                        : '0 12px 24px rgba(0, 0, 0, 0.12)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.transform = 'translateY(0)';
                                    e.currentTarget.style.boxShadow = 'none';
                                }}
                                actions={[
                                    <Space key="members">
                                        <TeamOutlined />
                                        <span>{project.members?.length || 0}</span>
                                    </Space>,
                                    ...(isProjectAdmin
                                        ? [
                                            <Button
                                                key="edit"
                                                type="text"
                                                icon={<EditOutlined />}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleOpenEdit(project);
                                                }}
                                            >
                                                <Tooltip title="Edit project details">
                                                    <span>Edit</span>
                                                </Tooltip>
                                            </Button>,
                                            <Popconfirm
                                                key="delete"
                                                title="Delete this project?"
                                                description="This will permanently remove project data, including tasks and sprints."
                                                okText="Delete"
                                                okButtonProps={{ danger: true, loading: deletingProjectId === project._id }}
                                                onConfirm={(e) => {
                                                    e?.stopPropagation?.();
                                                    return handleDeleteProject(project);
                                                }}
                                                onCancel={(e) => e?.stopPropagation?.()}
                                            >
                                                <Button
                                                    type="text"
                                                    danger
                                                    icon={<DeleteOutlined />}
                                                    loading={deletingProjectId === project._id}
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    <Tooltip title="Delete project and its associated data">
                                                        <span>Delete</span>
                                                    </Tooltip>
                                                </Button>
                                            </Popconfirm>,
                                        ]
                                        : [
                                            <SettingOutlined key="settings" onClick={(e) => {
                                                e.stopPropagation();
                                                switchProject(project._id);
                                                navigate('/dashboard/settings');
                                            }} />,
                                        ]),
                                ]}
                            >
                                <Card.Meta
                                    avatar={
                                        <Avatar
                                            style={{
                                                background: getProjectGradient(index),
                                                fontSize: isMobile ? 16 : 18,
                                                width: isMobile ? 44 : 48,
                                                height: isMobile ? 44 : 48,
                                                lineHeight: isMobile ? '44px' : '48px',
                                                fontWeight: 700,
                                                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
                                            }}
                                        >
                                            {project.key?.[0] || project.name?.[0]}
                                        </Avatar>
                                    }
                                    title={
                                        <div style={{
                                            display: 'flex',
                                            flexDirection: isMobile ? 'column' : 'row',
                                            alignItems: isMobile ? 'flex-start' : 'center',
                                            gap: 8,
                                        }}>
                                            <span style={{
                                                fontSize: isMobile ? '15px' : '16px',
                                                fontWeight: 600,
                                                color: isDark ? '#e6edf3' : '#161b22',
                                            }}>
                                                {project.name}
                                            </span>
                                            <Tag
                                                color={getProjectTypeColor(project.projectType)}
                                                style={{
                                                    margin: 0,
                                                    borderRadius: 4,
                                                    fontSize: '11px',
                                                    textTransform: 'uppercase',
                                                    fontWeight: 600,
                                                }}
                                            >
                                                {project.projectType || 'scrum'}
                                            </Tag>
                                        </div>
                                    }
                                    description={
                                        <>
                                            <Text
                                                type="secondary"
                                                strong
                                                style={{
                                                    fontSize: '12px',
                                                    color: isDark ? '#79c0ff' : '#0052CC',
                                                    background: isDark
                                                        ? 'rgba(47, 129, 247, 0.18)'
                                                        : 'rgba(0, 82, 204, 0.08)',
                                                    padding: '2px 6px',
                                                    borderRadius: 4,
                                                }}
                                            >
                                                {project.key}
                                            </Text>
                                            <Paragraph
                                                type="secondary"
                                                ellipsis={{ rows: 2 }}
                                                style={{ marginTop: 8, marginBottom: 0, fontSize: '13px' }}
                                            >
                                                {project.description || 'No description'}
                                            </Paragraph>
                                        </>
                                    }
                                />
                            </Card>
                        </Col>
                    ))}
                </Row>
            )}

            <Modal
                title="Edit Project"
                open={editOpen}
                onCancel={() => {
                    setEditOpen(false);
                    setEditingProject(null);
                }}
                footer={null}
                destroyOnHidden
            >
                <Form form={form} layout="vertical" onFinish={handleUpdateProject}>
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
                        <Input maxLength={10} style={{ textTransform: 'uppercase' }} />
                    </Form.Item>
                    <Form.Item name="description" label="Description">
                        <Input.TextArea rows={3} placeholder="Describe the project" />
                    </Form.Item>
                    <Form.Item name="projectType" label="Project Type" initialValue="scrum">
                        <Select>
                            <Select.Option value="scrum">Scrum</Select.Option>
                            <Select.Option value="kanban">Kanban</Select.Option>
                            <Select.Option value="business">Business</Select.Option>
                        </Select>
                    </Form.Item>
                    <Form.Item style={{ marginBottom: 0 }}>
                        <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
                            <Button onClick={() => setEditOpen(false)}>Cancel</Button>
                            <Button type="primary" htmlType="submit" loading={savingProject}>Save Changes</Button>
                        </Space>
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};

export default ProjectsListPage;

