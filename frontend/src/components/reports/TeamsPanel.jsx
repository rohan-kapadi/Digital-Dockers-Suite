import { Card, Avatar, Typography, Skeleton, Tooltip, Badge } from 'antd';
import { TeamOutlined, UserOutlined, ProjectOutlined, CheckCircleOutlined } from '@ant-design/icons';
import PropTypes from 'prop-types';
import { useThemeMode } from '../../context/ThemeContext';

const { Text, Title } = Typography;

/**
 * TeamsPanel - Horizontal scrollable team cards for filtering analytics
 */
const TeamsPanel = ({ teams, selectedTeamId, onTeamSelect, loading }) => {
    const { mode } = useThemeMode();
    const isDark = mode === 'dark';

    if (loading) {
        return (
            <div style={{
                display: 'flex',
                gap: 16,
                overflowX: 'auto',
                padding: '16px 0',
                marginBottom: 24
            }}>
                {[1, 2, 3, 4].map(i => (
                    <Card key={i} style={{ minWidth: 220, flex: '0 0 auto' }}>
                        <Skeleton active paragraph={{ rows: 2 }} />
                    </Card>
                ))}
            </div>
        );
    }

    const allTeamsCard = {
        _id: null,
        name: 'All Teams',
        isAllTeams: true,
        stats: teams.reduce((acc, team) => ({
            totalTasks: acc.totalTasks + (team.stats?.totalTasks || 0),
            completedTasks: acc.completedTasks + (team.stats?.completedTasks || 0),
            activeSprints: acc.activeSprints + (team.stats?.activeSprints || 0),
            activeProjects: acc.activeProjects + (team.stats?.activeProjects || 0)
        }), { totalTasks: 0, completedTasks: 0, activeSprints: 0, activeProjects: 0 }),
        memberCount: teams.reduce((acc, team) => acc + (team.members?.length || 0), 0)
    };

    // Calculate completion rate for all teams
    allTeamsCard.stats.completionRate = allTeamsCard.stats.totalTasks > 0
        ? Math.round((allTeamsCard.stats.completedTasks / allTeamsCard.stats.totalTasks) * 100)
        : 0;

    const allCards = [allTeamsCard, ...teams];

    return (
        <div style={{ marginBottom: 24 }}>
            <Title
                level={5}
                style={{
                    marginBottom: 12,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    color: isDark ? '#e6edf3' : undefined,
                }}
            >
                <TeamOutlined />
                Select Team
            </Title>
            <div style={{
                display: 'flex',
                gap: 16,
                overflowX: 'auto',
                padding: '8px 4px',
                scrollBehavior: 'smooth'
            }}>
                {allCards.map(team => {
                    const isSelected = team._id === selectedTeamId || (team._id === null && selectedTeamId === null);
                    const completionRate = team.stats?.completionRate || 0;

                    return (
                        <Card
                            key={team._id || 'all'}
                            hoverable
                            onClick={() => onTeamSelect(team._id)}
                            style={{
                                minWidth: 220,
                                flex: '0 0 auto',
                                cursor: 'pointer',
                                border: isSelected
                                    ? `2px solid ${isDark ? '#58a6ff' : '#0052CC'}`
                                    : `1px solid ${isDark ? '#30363d' : '#d9d9d9'}`,
                                background: isSelected
                                    ? isDark
                                        ? 'linear-gradient(135deg, #1c2128 0%, #21262d 100%)'
                                        : 'linear-gradient(135deg, #f0f5ff 0%, #ffffff 100%)'
                                    : isDark
                                        ? '#161b22'
                                        : '#fff',
                                boxShadow: isSelected
                                    ? isDark
                                        ? '0 4px 16px rgba(0, 0, 0, 0.45)'
                                        : '0 4px 12px rgba(0, 82, 204, 0.15)'
                                    : undefined,
                                transition: 'all 0.2s ease'
                            }}
                            styles={{ body: { padding: 16 } }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                                <Avatar
                                    size={40}
                                    style={{
                                        backgroundColor: team.isAllTeams ? '#0052CC' : (team.color || '#6554C0'),
                                        flexShrink: 0
                                    }}
                                    icon={team.isAllTeams ? <TeamOutlined /> : null}
                                    src={team.lead?.profileInfo?.avatar}
                                >
                                    {!team.isAllTeams && !team.lead?.profileInfo?.avatar && (team.name?.[0] || 'T')}
                                </Avatar>
                                <div style={{ overflow: 'hidden' }}>
                                    <Text strong style={{
                                        display: 'block',
                                        whiteSpace: 'nowrap',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        color: isDark ? '#e6edf3' : undefined,
                                    }}>
                                        {team.name}
                                    </Text>
                                    {team.lead && !team.isAllTeams && (
                                        <Text type="secondary" style={{ fontSize: 12 }}>
                                            Lead: {team.lead.fullName?.split(' ')[0] || 'Unassigned'}
                                        </Text>
                                    )}
                                    {team.isAllTeams && (
                                        <Text type="secondary" style={{ fontSize: 12 }}>
                                            {teams.length} teams
                                        </Text>
                                    )}
                                </div>
                            </div>

                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: '1fr 1fr',
                                gap: 8,
                                fontSize: 12
                            }}>
                                <Tooltip title="Team Members">
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                        <UserOutlined style={{ color: isDark ? '#8b949e' : '#8c8c8c' }} />
                                        <span>{team.memberCount || team.members?.length || 0}</span>
                                    </div>
                                </Tooltip>
                                <Tooltip title="Active Projects">
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                        <ProjectOutlined style={{ color: isDark ? '#8b949e' : '#8c8c8c' }} />
                                        <span>{team.stats?.activeProjects || 0}</span>
                                    </div>
                                </Tooltip>
                                <Tooltip title="Completion Rate">
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 4,
                                        gridColumn: 'span 2'
                                    }}>
                                        <CheckCircleOutlined style={{
                                            color: completionRate >= 50 ? '#52c41a' : '#faad14'
                                        }} />
                                        <span style={{
                                            color: completionRate >= 50 ? '#52c41a' : '#faad14',
                                            fontWeight: 600
                                        }}>
                                            {completionRate}% complete
                                        </span>
                                    </div>
                                </Tooltip>
                            </div>
                        </Card>
                    );
                })}
            </div>
        </div>
    );
};

TeamsPanel.propTypes = {
    teams: PropTypes.array.isRequired,
    selectedTeamId: PropTypes.string,
    onTeamSelect: PropTypes.func.isRequired,
    loading: PropTypes.bool
};

TeamsPanel.defaultProps = {
    teams: [],
    selectedTeamId: null,
    loading: false
};

export default TeamsPanel;
