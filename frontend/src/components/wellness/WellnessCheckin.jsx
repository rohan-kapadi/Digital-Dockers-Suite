import { Box, Typography, Paper, useTheme } from '@mui/material';
import { Air } from '@mui/icons-material';
import BreathingExercise from './BreathingExercise';

const WellnessCheckin = () => {
    const theme = useTheme();
    const isDark = theme.palette.mode === 'dark';

    return (
        <Box sx={{ p: 3, maxWidth: 800, mx: 'auto' }}>
            {/* Header */}
            <Box sx={{ mb: 4, textAlign: 'center' }}>
                <Typography
                    variant="h4"
                    fontWeight={700}
                    sx={{
                        background: isDark
                            ? 'linear-gradient(135deg, #818cf8 0%, #22d3ee 100%)'
                            : 'linear-gradient(135deg, #4f46e5 0%, #06b6d4 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        mb: 1
                    }}
                >
                    🧘 Wellness Center
                </Typography>
                <Typography variant="body1" color="text.secondary">
                    Take a moment to care for yourself
                </Typography>
            </Box>

            {/* Wellness Content */}
            <Box sx={{ mt: 3 }}>
                <Paper
                    elevation={isDark ? 0 : 1}
                    sx={{
                        p: 4,
                        borderRadius: 3,
                        border: isDark ? '1px solid' : 'none',
                        borderColor: 'divider',
                        bgcolor: isDark ? 'rgba(15, 23, 42, 0.58)' : 'background.paper',
                        boxShadow: isDark ? '0 12px 28px rgba(2, 6, 23, 0.42)' : 'none'
                    }}
                >
                    <Typography variant="h6" gutterBottom sx={{ mb: 3, textAlign: 'center' }}>
                        🌬️ Breathing Exercises
                    </Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
                        <Air color="primary" />
                    </Box>
                    <BreathingExercise />
                </Paper>
            </Box>
        </Box>
    );
};

export default WellnessCheckin;
