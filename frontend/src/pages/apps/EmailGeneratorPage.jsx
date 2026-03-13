import { useState, useEffect } from 'react';
import { Typography, Row, Col, Card, Table, Tag, Tooltip } from 'antd';
import { MailOutlined, HistoryOutlined, ClockCircleOutlined } from '@ant-design/icons';
import EmailGeneratorForm from '../../components/common/EmailGeneratorForm';
import emailService from '../../services/emailService';
import { useThemeMode } from '../../context/ThemeContext';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

const EmailGeneratorPage = () => {
    const { mode } = useThemeMode();
    const isDark = mode === 'dark';
    const [sentEmails, setSentEmails] = useState([]);
    const [loading, setLoading] = useState(false);

    const fetchHistory = async () => {
        setLoading(true);
        try {
            // Fetch last 5 emails as per requirements
            const data = await emailService.getSentEmails(5);
            setSentEmails(data);
        } catch (error) {
            console.error('Failed to fetch email history:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchHistory();
    }, []);

    const columns = [
        {
            title: 'Receiver',
            dataIndex: 'receiver',
            key: 'receiver',
            ellipsis: true,
            render: (text) => <Tooltip title={text}>{text}</Tooltip>
        },
        {
            title: 'Subject',
            dataIndex: 'subject',
            key: 'subject',
            ellipsis: true,
            render: (text) => <Text strong>{text}</Text>
        },
        {
            title: 'When',
            dataIndex: 'sentAt',
            key: 'sentAt',
            width: 150,
            render: (date) => (
                <div style={{ fontSize: 13 }}>
                    <div>{dayjs(date).format('D MMM YYYY')}</div>
                    <div style={{ color: isDark ? '#8b949e' : '#888' }}>{dayjs(date).format('h:mm A')}</div>
                </div>
            )
        }
    ];

    return (
        <div style={{ maxWidth: 1200, margin: '0 auto', color: isDark ? '#e6edf3' : undefined }}>
            {/* Header */}
            <div style={{ marginBottom: 32 }}>
                <Title level={2} style={{
                    margin: 0,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    color: isDark ? '#e6edf3' : undefined,
                }}>
                    <span style={{
                        display: 'flex',
                        padding: 8,
                        background: isDark ? 'rgba(47, 129, 247, 0.16)' : 'rgba(0, 82, 204, 0.1)',
                        borderRadius: 8,
                        color: isDark ? '#79c0ff' : '#0052CC'
                    }}>
                        <MailOutlined />
                    </span>
                    AI Email Generator
                </Title>
                <Text type="secondary" style={{ fontSize: 16, marginTop: 8, display: 'block' }}>
                    Generate professional, persuasive, or friendly emails instantly using AI.
                </Text>
            </div>

            <Row gutter={[24, 24]}>
                <Col xs={24} lg={14}>
                    <EmailGeneratorForm onEmailSent={fetchHistory} />

                    {/* Recent Sent Emails Panel */}
                    <Card
                        title={<><HistoryOutlined /> Recent Sent Emails</>}
                        style={{
                            marginTop: 24,
                            borderRadius: 12,
                            boxShadow: isDark
                                ? '0 6px 20px rgba(0,0,0,0.45)'
                                : '0 4px 20px rgba(0,0,0,0.05)',
                            borderColor: isDark ? '#30363d' : undefined,
                        }}
                        styles={{ body: { padding: 0 } }}
                    >
                        <Table
                            dataSource={sentEmails}
                            columns={columns}
                            rowKey="_id"
                            pagination={false}
                            loading={loading}
                            locale={{ emptyText: 'No emails sent yet' }}
                        />
                    </Card>
                </Col>

                <Col xs={24} lg={10}>
                    {/* Instructions / Tips Panel */}
                    <div style={{
                        background: isDark
                            ? 'linear-gradient(135deg, #161b22 0%, #1f2a33 100%)'
                            : 'linear-gradient(135deg, #f0f5ff 0%, #f6ffed 100%)',
                        padding: 24,
                        borderRadius: 12,
                        minHeight: 400,
                        border: isDark ? '1px solid #30363d' : '1px solid rgba(0,0,0,0.05)',
                    }}>
                        <Title level={4} style={{ marginTop: 0, color: isDark ? '#e6edf3' : undefined }}>💡 Pro Tips</Title>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                            <div>
                                <Text strong>🎯 Be Specific</Text>
                                <p style={{ color: isDark ? '#8b949e' : '#666', margin: '4px 0 0' }}>
                                    Include key details like dates, names, and specific outcomes you want.
                                </p>
                            </div>

                            <div>
                                <Text strong>🎭 Choose the Right Tone</Text>
                                <p style={{ color: isDark ? '#8b949e' : '#666', margin: '4px 0 0' }}>
                                    - <b>Professional:</b> For formal business requests<br />
                                    - <b>Friendly:</b> For team updates or casual check-ins<br />
                                    - <b>Persuasive:</b> When asking for approvals or resources
                                </p>
                            </div>

                            <div>
                                <Text strong>⚡ Example Prompts</Text>
                                <div style={{
                                    background: isDark ? 'rgba(33, 38, 45, 0.8)' : 'rgba(255,255,255,0.6)',
                                    padding: 12,
                                    borderRadius: 8,
                                    marginTop: 8,
                                    fontSize: 13,
                                    border: `1px solid ${isDark ? '#30363d' : 'rgba(0,0,0,0.05)'}`,
                                    color: isDark ? '#e6edf3' : undefined,
                                }}>
                                    "Write a follow-up email to the client regarding the Q1 marketing report sent last Tuesday."
                                </div>
                                <div style={{
                                    background: isDark ? 'rgba(33, 38, 45, 0.8)' : 'rgba(255,255,255,0.6)',
                                    padding: 12,
                                    borderRadius: 8,
                                    marginTop: 8,
                                    fontSize: 13,
                                    border: `1px solid ${isDark ? '#30363d' : 'rgba(0,0,0,0.05)'}`,
                                    color: isDark ? '#e6edf3' : undefined,
                                }}>
                                    "Draft a polite decline for the invitation to speak at the upcoming conference due to schedule conflicts."
                                </div>
                            </div>
                        </div>
                    </div>
                </Col>
            </Row>
        </div>
    );
};

export default EmailGeneratorPage;
