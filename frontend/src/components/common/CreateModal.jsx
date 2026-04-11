import { useState, useEffect } from 'react';
import { Modal, Tabs, Form, Input, Select, DatePicker, InputNumber, Button, message, Avatar, Space, Spin, Divider } from 'antd';
import { UserOutlined, CalendarOutlined, BulbOutlined } from '@ant-design/icons';
import { useProject } from '../../context/ProjectContext';
import projectService from '../../services/projectService';
import sprintService from '../../services/sprintService';
import taskService from '../../services/taskService';
import userService from '../../services/userService';
import { useAuth } from '../../context/AuthContext';

const { TextArea } = Input;
const { Option } = Select;

const CreateModal = ({ open, onClose }) => {
    const [activeTab, setActiveTab] = useState('issue');
    const [loading, setLoading] = useState(false);
    const [users, setUsers] = useState([]);
    const [usersLoading, setUsersLoading] = useState(false);
    const { user } = useAuth();
    const { currentProject, sprints, refreshBoard, refreshProjects } = useProject();
    const [projectForm] = Form.useForm();
    const [issueForm] = Form.useForm();
    const [sprintForm] = Form.useForm();
    const isProjectAdmin = user?.role === 'admin';

    // Fetch users when modal opens
    useEffect(() => {
        if (open) {
            fetchUsers();
        }
    }, [open]);

    const fetchUsers = async () => {
        setUsersLoading(true);
        try {
            const data = await userService.getUsers();
            setUsers(data);
        } catch (error) {
            console.error('Failed to load users:', error);
        } finally {
            setUsersLoading(false);
        }
    };

    const handleCreateProject = async (values) => {
        setLoading(true);
        try {
            await projectService.createProject(values);
            message.success('Project created successfully');
            projectForm.resetFields();
            refreshProjects && refreshProjects(); // Refresh the projects list
            onClose();
        } catch (error) {
            message.error(error.response?.data?.message || 'Failed to create project');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateIssue = async (values) => {
        if (!currentProject?._id) {
            message.error('Please select a project first');
            return;
        }
        setLoading(true);
        try {
            await taskService.createTask({
                ...values,
                projectId: currentProject._id,
                deadline: values.deadline?.toISOString(),
                sprintId: values.sprintId,
            });
            message.success('Issue created! AI analysis applied if available.');
            issueForm.resetFields();
            refreshBoard && refreshBoard();
            onClose();
        } catch (error) {
            message.error(error.response?.data?.message || 'Failed to create issue');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateSprint = async (values) => {
        if (!currentProject?._id) {
            message.error('Please select a project first');
            return;
        }
        setLoading(true);
        try {
            const sprintData = {
                ...values,
                projectId: currentProject._id,
                startDate: values.dateRange?.[0]?.toISOString(),
                endDate: values.dateRange?.[1]?.toISOString()
            };
            delete sprintData.dateRange;
            await sprintService.createSprint(sprintData);
            message.success('Sprint created successfully');
            sprintForm.resetFields();
            refreshBoard && refreshBoard();
            onClose();
        } catch (error) {
            message.error(error.response?.data?.message || 'Failed to create sprint');
        } finally {
            setLoading(false);
        }
    };

    const tabItems = [
        {
            key: 'issue',
            label: 'Issue',
            children: (
                <Form form={issueForm} layout="vertical" onFinish={handleCreateIssue}>
                    <Form.Item name="title" label="Summary" rules={[{ required: true, message: 'Please enter a title' }]}>
                        <Input placeholder="What needs to be done?" size="large" />
                    </Form.Item>

                    <Form.Item name="description" label="Description">
                        <TextArea
                            rows={3}
                            placeholder="Add a description... (AI will analyze this for time breakdown)"
                            showCount
                            maxLength={2000}
                        />
                    </Form.Item>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                        <Form.Item name="issueType" label="Issue Type" initialValue="task">
                            <Select>
                                <Option value="story">📖 Story</Option>
                                <Option value="task">✅ Task</Option>
                                <Option value="bug">🐛 Bug</Option>
                                <Option value="subtask">📋 Subtask</Option>
                            </Select>
                        </Form.Item>

                        <Form.Item name="priority" label="Priority" initialValue="medium">
                            <Select>
                                <Option value="highest">🔴 Highest</Option>
                                <Option value="high">🟠 High</Option>
                                <Option value="medium">🟡 Medium</Option>
                                <Option value="low">🟢 Low</Option>
                                <Option value="lowest">⚪ Lowest</Option>
                            </Select>
                        </Form.Item>
                    </div>

                    <Form.Item
                        name="assignedTo"
                        label={<Space><UserOutlined />Assignee(s)</Space>}
                    >
                        <Select
                            mode="multiple"
                            placeholder="Select team members"
                            loading={usersLoading}
                            allowClear
                            optionFilterProp="label"
                            notFoundContent={usersLoading ? <Spin size="small" /> : 'No users found'}
                        >
                            {users.map(user => (
                                <Option key={user._id} value={user._id} label={user.fullName}>
                                    <Space>
                                        <Avatar size="small" style={{ backgroundColor: '#0052CC' }}>
                                            {user.fullName?.[0]?.toUpperCase()}
                                        </Avatar>
                                        <span>{user.fullName}</span>
                                        <span style={{ color: '#999', fontSize: 12 }}>({user.role})</span>
                                    </Space>
                                </Option>
                            ))}
                        </Select>
                    </Form.Item>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                        <Form.Item
                            name="deadline"
                            label={<Space><CalendarOutlined />Deadline</Space>}
                        >
                            <DatePicker
                                style={{ width: '100%' }}
                                showTime
                                format="YYYY-MM-DD HH:mm"
                                placeholder="Select deadline"
                            />
                        </Form.Item>

                        <Form.Item name="storyPoints" label="Story Points">
                            <InputNumber min={0} max={100} placeholder="0" style={{ width: '100%' }} />
                        </Form.Item>
                    </div>

                    <Form.Item name="sprintId" label="Sprint">
                        <Select placeholder="Backlog" allowClear>
                            {sprints?.filter(s => s.status !== 'closed').map(sprint => (
                                <Option key={sprint._id} value={sprint._id}>
                                    {sprint.name} {sprint.status === 'active' && '(Active)'}
                                </Option>
                            ))}
                        </Select>
                    </Form.Item>

                    <Divider style={{ margin: '16px 0' }} />

                    <div style={{ background: '#f5f7fa', padding: 12, borderRadius: 8, marginBottom: 16 }}>
                        <Space>
                            <BulbOutlined style={{ color: '#0052CC' }} />
                            <span style={{ fontSize: 13, color: '#5E6C84' }}>
                                AI will analyze your task and suggest time estimates & dependencies
                            </span>
                        </Space>
                    </div>

                    <Form.Item style={{ marginBottom: 0 }}>
                        <Button type="primary" htmlType="submit" loading={loading} block size="large">
                            Create Issue
                        </Button>
                    </Form.Item>
                </Form>
            )
        },
        ...(isProjectAdmin ? [{
            key: 'project',
            label: 'Project',
            children: (
                <Form form={projectForm} layout="vertical" onFinish={handleCreateProject}>
                    <Form.Item name="name" label="Project Name" rules={[{ required: true }]}>
                        <Input placeholder="e.g., Mobile App Redesign" size="large" />
                    </Form.Item>
                    <Form.Item
                        name="key"
                        label="Project Key"
                        extra="Use only letters A-Z, 2-10 characters"
                        rules={[
                            { required: true, message: 'Please enter a project key' },
                            {
                                pattern: /^[A-Z]{2,10}$/,
                                message: 'Must be 2-10 uppercase letters only (A-Z, no numbers or special characters)'
                            }
                        ]}
                        validateTrigger={['onChange', 'onBlur']}
                    >
                        <Input
                            placeholder="e.g., PROJ or EDUGAMES"
                            style={{ textTransform: 'uppercase' }}
                            maxLength={10}
                            showCount
                        />
                    </Form.Item>
                    <Form.Item name="description" label="Description">
                        <TextArea rows={3} placeholder="Describe the project..." />
                    </Form.Item>
                    <Form.Item name="type" label="Project Type" initialValue="scrum">
                        <Select>
                            <Option value="scrum">Scrum</Option>
                            <Option value="kanban">Kanban</Option>
                        </Select>
                    </Form.Item>
                    <Form.Item>
                        <Button type="primary" htmlType="submit" loading={loading} block size="large">
                            Create Project
                        </Button>
                    </Form.Item>
                </Form>
            )
        }] : []),
        {
            key: 'sprint',
            label: 'Sprint',
            children: (
                <Form form={sprintForm} layout="vertical" onFinish={handleCreateSprint}>
                    <Form.Item name="name" label="Sprint Name" rules={[{ required: true }]}>
                        <Input placeholder="e.g., Sprint 1" size="large" />
                    </Form.Item>
                    <Form.Item name="goal" label="Sprint Goal">
                        <TextArea rows={2} placeholder="What do we want to achieve?" />
                    </Form.Item>
                    <Form.Item name="dateRange" label="Duration">
                        <DatePicker.RangePicker style={{ width: '100%' }} />
                    </Form.Item>
                    <Form.Item>
                        <Button type="primary" htmlType="submit" loading={loading} block size="large">
                            Create Sprint
                        </Button>
                    </Form.Item>
                </Form>
            )
        }
    ];

    return (
        <Modal
            title="Create"
            open={open}
            onCancel={onClose}
            footer={null}
            width={560}
            destroyOnHidden
            centered
        >
            <Tabs
                activeKey={activeTab}
                onChange={setActiveTab}
                items={tabItems}
            />
        </Modal>
    );
};

export default CreateModal;

