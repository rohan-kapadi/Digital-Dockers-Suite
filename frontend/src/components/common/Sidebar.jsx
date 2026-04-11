import { Layout, Menu, theme, Drawer, Grid, Badge, Tooltip } from 'antd';
import {
    ProjectOutlined,
    UnorderedListOutlined,
    CalendarOutlined,
    TeamOutlined,
    FileTextOutlined,
    SettingOutlined,
    DashboardOutlined,
    MessageOutlined,
    ApartmentOutlined,
    HeartOutlined,
    InboxOutlined,
    BarChartOutlined,
    UsergroupAddOutlined,
    MailOutlined,
    FilePptOutlined,
    SafetyCertificateOutlined,
    AppstoreOutlined,
    RocketOutlined,
    CloseOutlined,
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useThemeMode } from '../../context/ThemeContext';
import { useProject } from '../../context/ProjectContext';

const { Sider } = Layout;
const { useBreakpoint } = Grid;

// Page label map (shared with breadcrumb)
const PAGE_LABELS = {
    '/dashboard': { label: 'Summary', icon: <DashboardOutlined /> },
    '/dashboard/tasks': { label: 'Board', icon: <UnorderedListOutlined /> },
    '/dashboard/backlog': { label: 'Backlog', icon: <InboxOutlined /> },
    '/dashboard/roadmap': { label: 'Roadmap', icon: <CalendarOutlined /> },
    '/dashboard/reports': { label: 'Reports', icon: <BarChartOutlined /> },
    '/dashboard/meetings': { label: 'Meetings', icon: <MessageOutlined /> },
    '/dashboard/documents': { label: 'Documents', icon: <FileTextOutlined /> },
    '/dashboard/settings': { label: 'Settings', icon: <SettingOutlined /> },
    '/dashboard/organization': { label: 'Team', icon: <ApartmentOutlined /> },
    '/dashboard/email-generator': { label: 'AI Email', icon: <MailOutlined /> },
    '/dashboard/ppt-generator': { label: 'AI PPT', icon: <FilePptOutlined /> },
    '/dashboard/chat': { label: 'Chat', icon: <MessageOutlined /> },
    '/dashboard/wellness': { label: 'Wellness', icon: <HeartOutlined /> },
    '/dashboard/tech-debt': { label: 'Code Health', icon: <SafetyCertificateOutlined /> },
    '/dashboard/ai-architect': { label: 'AI Architect', icon: <RocketOutlined /> },
};

// ── Sidebar ───────────────────────────────────────────────────────────────────
const Sidebar = ({ mobileOpen, setMobileOpen, collapsed }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useAuth();
    const { mode } = useThemeMode();
    const { currentProject } = useProject();
    const isDark = mode === 'dark';
    const screens = useBreakpoint();
    const isMobile = !screens.md;

    const { token: { colorBgContainer, colorBorderSecondary } } = theme.useToken();

    // Collapsed state for desktop only
    const isCollapsed = isMobile ? false : collapsed;

    const handleNav = (key) => {
        navigate(key);
        if (isMobile) setMobileOpen(false);
    };

    // ── Nav items ─────────────────────────────────────────────────────────────
    const items = [
        {
            key: 'project-group',
            label: 'PROJECT',
            type: 'group',
            children: [
                { key: '/dashboard', icon: <DashboardOutlined />, label: 'Summary' },
                { key: '/dashboard/tasks', icon: <UnorderedListOutlined />, label: 'Board' },
                { key: '/dashboard/backlog', icon: <InboxOutlined />, label: 'Backlog' },
                { key: '/dashboard/roadmap', icon: <CalendarOutlined />, label: 'Roadmap' },
                { key: '/dashboard/reports', icon: <BarChartOutlined />, label: 'Reports' },
                { key: '/dashboard/tech-debt', icon: <SafetyCertificateOutlined />, label: 'Code Health' },
            ],
        },
        { type: 'divider' },
        {
            key: 'apps-toolkit',
            label: 'Apps & Toolkit',
            icon: <AppstoreOutlined />,
            children: [
                { key: '/dashboard/meetings', icon: <MessageOutlined />, label: 'Meetings' },
                { key: '/dashboard/documents', icon: <FileTextOutlined />, label: 'Documents' },
                { key: '/dashboard/email-generator', icon: <MailOutlined />, label: 'AI Email' },
                { key: '/dashboard/ppt-generator', icon: <FilePptOutlined />, label: 'AI PPT Generator' },
                { key: '/dashboard/chat', icon: <MessageOutlined />, label: 'Chat' },
                { key: '/dashboard/organization', icon: <ApartmentOutlined />, label: 'Team' },
                { key: '/dashboard/wellness', icon: <HeartOutlined />, label: 'Wellness' },
                { key: '/dashboard/ai-architect', icon: <RocketOutlined />, label: 'AI Architect' },
            ],
        },
        { type: 'divider' },
        ...(user?.role === 'admin' ? [
            {
                key: 'admin-group',
                label: 'ADMIN',
                type: 'group',
                children: [
                    { key: '/dashboard/team-management', icon: <UsergroupAddOutlined />, label: 'Team Management' },
                ],
            },
            { type: 'divider' },
        ] : []),
        { key: '/dashboard/settings', icon: <SettingOutlined />, label: 'Settings' },
    ];

    // ── Menu content ──────────────────────────────────────────────────────────
    const MenuContent = (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
            <div style={{ flex: 1, overflowY: 'auto' }}>
                <Menu
                    mode="inline"
                    selectedKeys={[location.pathname]}
                    style={{ borderRight: 0 }}
                    items={items}
                    onClick={({ key }) => handleNav(key)}
                />
            </div>
        </div>
    );

    return (
        <>
            {/* Mobile Drawer */}
            {isMobile && (
                <Drawer
                    placement="left"
                    onClose={() => setMobileOpen(false)}
                    open={mobileOpen}
                    size={280}
                    styles={{
                        body: { padding: 0, background: isDark ? 'var(--surface-primary)' : '#fff', display: 'flex', flexDirection: 'column' },
                        header: {
                            padding: 0,
                            minHeight: 0,
                            borderBottom: 'none',
                            background: isDark ? 'var(--surface-primary)' : '#fff',
                        },
                    }}
                    title={
                        <div style={{ padding: '20px 20px 12px', borderBottom: `1px solid ${isDark ? '#30363d' : '#E5E7EB'}` }}>
                            <div style={{ fontSize: 17, fontWeight: 700, color: isDark ? '#a5b4fc' : '#3B82F6', letterSpacing: '-0.3px' }}>
                                Digital Dockers
                            </div>
                            {currentProject && (
                                <div style={{ fontSize: 12, color: isDark ? '#8b949e' : '#6B7280', marginTop: 2 }}>
                                    {currentProject.name}
                                </div>
                            )}
                        </div>
                    }
                    closeIcon={<CloseOutlined />}
                >
                    {MenuContent}
                </Drawer>
            )}

            {/* Desktop/Tablet Sider */}
            {!isMobile && (
                <Sider
                    trigger={null}
                    collapsible
                    collapsed={isCollapsed}
                    width={240}
                    collapsedWidth={72}
                    style={{
                        background: colorBgContainer,
                        borderRight: `1px solid ${colorBorderSecondary}`,
                        overflowX: 'hidden',
                        overflowY: 'auto',
                        height: 'calc(100vh - 60px)',
                        position: 'fixed',
                        left: 0,
                        top: 60,
                        zIndex: 900,
                        transition: 'all 0.25s cubic-bezier(0.4,0,0.2,1)',
                        boxShadow: isDark ? '8px 0 24px rgba(2,6,23,0.45)' : 'none',
                        display: 'flex',
                        flexDirection: 'column',
                    }}
                >
                    <div style={{ position: 'relative', height: '100%', display: 'flex', flexDirection: 'column' }}>
                        {MenuContent}
                    </div>
                </Sider>
            )}
        </>
    );
};


export default Sidebar;
