import { Card, Tabs, Typography, Empty, Badge } from 'antd';
import { CalendarOutlined } from '@ant-design/icons';
import { differenceInDays, parseISO } from 'date-fns';

const { Text } = Typography;

const UpcomingWorkCard = ({ upcomingTasks, unscheduledTasks }) => {
    const getDaysUntilDue = (dueDate) => {
        try {
            return differenceInDays(parseISO(dueDate), new Date());
        } catch {
            return null;
        }
    };

    const getUrgencyColor = (daysUntil) => {
        if (daysUntil <= 0) return '#ff5630';
        if (daysUntil <= 1) return '#ff5630';
        if (daysUntil <= 3) return '#ffab00';
        if (daysUntil <= 7) return '#ffab00';
        return '#0052cc';
    };

    const TaskRow = ({ task, showDueDate = true }) => (
        <div
            style={{
                padding: '6px 0',
                borderBottom: '1px solid #f0f0f0',
                cursor: 'pointer',
                transition: 'background 0.2s',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                borderRadius: '4px',
                paddingLeft: '6px',
                paddingRight: '6px',
                marginLeft: '-6px',
                marginRight: '-6px'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f9f9f9'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
        >
            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Text
                        style={{
                            fontSize: '11px',
                            fontWeight: 600,
                            color: '#0052cc',
                            minWidth: '55px',
                            flexShrink: 0
                        }}
                    >
                        {task.key || 'TASK'}
                    </Text>
                    <Text
                        ellipsis
                        style={{ fontSize: '12px', color: '#262626', flex: 1 }}
                    >
                        {task.title}
                    </Text>
                </div>
            </div>
            {showDueDate && task.dueDate && (
                <Badge
                    count={getDaysUntilDue(task.dueDate)}
                    style={{
                        backgroundColor: getUrgencyColor(getDaysUntilDue(task.dueDate)),
                        color: '#fff',
                        fontSize: '9px',
                        fontWeight: 700,
                        minWidth: '24px',
                        height: '18px',
                        lineHeight: '18px',
                        borderRadius: '3px',
                        flexShrink: 0
                    }}
                    showZero
                />
            )}
        </div>
    );

    const tabItems = [
        {
            key: 'due_soon',
            label: (
                <span style={{ fontSize: '12px', fontWeight: 500 }}>
                    Due Soon ({upcomingTasks?.length || 0})
                </span>
            ),
            children: (
                <div style={{ marginTop: 6 }}>
                    {upcomingTasks && upcomingTasks.length > 0 ? (
                        <div>
                            {upcomingTasks.map((task, idx) => (
                                <TaskRow key={idx} task={task} showDueDate={true} />
                            ))}
                        </div>
                    ) : (
                        <div style={{
                            textAlign: 'center',
                            padding: '12px 0',
                            color: '#8c8c8c'
                        }}>
                            <CalendarOutlined style={{ fontSize: '20px', marginBottom: 6, opacity: 0.35, display: 'block' }} />
                            <Text type="secondary" style={{ fontSize: '11px', display: 'block' }}>
                                No deadlines this week.
                            </Text>
                        </div>
                    )}
                </div>
            )
        },
        {
            key: 'no_due_date',
            label: (
                <span style={{ fontSize: '12px', fontWeight: 500 }}>
                    No Due Date ({unscheduledTasks?.length || 0})
                </span>
            ),
            children: (
                <div style={{ marginTop: 6 }}>
                    {unscheduledTasks && unscheduledTasks.length > 0 ? (
                        <div>
                            {unscheduledTasks.map((task, idx) => (
                                <TaskRow key={idx} task={task} showDueDate={false} />
                            ))}
                        </div>
                    ) : (
                        <div style={{
                            textAlign: 'center',
                            padding: '12px 0',
                            color: '#8c8c8c'
                        }}>
                            <CalendarOutlined style={{ fontSize: '20px', marginBottom: 6, opacity: 0.35, display: 'block' }} />
                            <Text type="secondary" style={{ fontSize: '11px', display: 'block' }}>
                                All tasks scheduled
                            </Text>
                        </div>
                    )}
                </div>
            )
        }
    ];

    return (
        <Card
            title={
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <CalendarOutlined style={{ fontSize: 13 }} />
                    <Text strong style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        Upcoming Work
                    </Text>
                </div>
            }
            style={{
                boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                borderRadius: 8,
                border: '1px solid #f0f0f0'
            }}
            styles={{ body: { padding: '10px' } }}
        >
            <Tabs
                items={tabItems}
                size="small"
                tabBarStyle={{
                    marginBottom: '8px'
                }}
            />
        </Card>
    );
};

export default UpcomingWorkCard;
