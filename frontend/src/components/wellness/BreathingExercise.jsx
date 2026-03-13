import { useState, useEffect, useRef } from 'react';
import { Box, Typography, Button, Card, CardContent, IconButton, LinearProgress, useTheme } from '@mui/material';
import { PlayArrow, Pause, Refresh } from '@mui/icons-material';

// Breathing exercise patterns (in seconds)
const EXERCISES = {
    '4-7-8': {
        name: '4-7-8 Relaxing Breath',
        description: 'Reduces anxiety and helps you fall asleep',
        phases: [
            { name: 'Inhale', duration: 4, color: '#4f46e5' },
            { name: 'Hold', duration: 7, color: '#8b5cf6' },
            { name: 'Exhale', duration: 8, color: '#06b6d4' }
        ],
        cycles: 4
    },
    'box': {
        name: 'Box Breathing',
        description: 'Used by Navy SEALs for focus and calm',
        phases: [
            { name: 'Inhale', duration: 4, color: '#4f46e5' },
            { name: 'Hold', duration: 4, color: '#8b5cf6' },
            { name: 'Exhale', duration: 4, color: '#06b6d4' },
            { name: 'Hold', duration: 4, color: '#ec4899' }
        ],
        cycles: 4
    },
    'quick': {
        name: 'Quick Calm',
        description: '2-minute stress relief',
        phases: [
            { name: 'Inhale', duration: 3, color: '#4f46e5' },
            { name: 'Exhale', duration: 5, color: '#06b6d4' }
        ],
        cycles: 6
    }
};

const BreathingExercise = () => {
    const [selectedExercise, setSelectedExercise] = useState('4-7-8');
    const [isRunning, setIsRunning] = useState(false);
    const [currentPhase, setCurrentPhase] = useState(0);
    const [currentCycle, setCurrentCycle] = useState(0);
    const [phaseProgress, setPhaseProgress] = useState(0);
    const [circleScale, setCircleScale] = useState(1);
    const intervalRef = useRef(null);
    const exercise = EXERCISES[selectedExercise];
    const theme = useTheme();
    const isDark = theme.palette.mode === 'dark';

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, []);

    // Animation loop
    useEffect(() => {
        if (!isRunning) return;

        const phase = exercise.phases[currentPhase];
        const totalMs = phase.duration * 1000;
        const intervalMs = 50;
        let elapsed = 0;

        intervalRef.current = setInterval(() => {
            elapsed += intervalMs;
            const progress = (elapsed / totalMs) * 100;
            setPhaseProgress(progress);

            // Animate circle based on phase
            if (phase.name === 'Inhale') {
                setCircleScale(1 + (elapsed / totalMs) * 0.5);
            } else if (phase.name === 'Exhale') {
                setCircleScale(1.5 - (elapsed / totalMs) * 0.5);
            }

            if (elapsed >= totalMs) {
                clearInterval(intervalRef.current);

                // Move to next phase or cycle
                const nextPhase = currentPhase + 1;
                if (nextPhase >= exercise.phases.length) {
                    const nextCycle = currentCycle + 1;
                    if (nextCycle >= exercise.cycles) {
                        // Exercise complete
                        setIsRunning(false);
                        setCurrentPhase(0);
                        setCurrentCycle(0);
                        setPhaseProgress(0);
                        setCircleScale(1);
                    } else {
                        setCurrentCycle(nextCycle);
                        setCurrentPhase(0);
                        setPhaseProgress(0);
                    }
                } else {
                    setCurrentPhase(nextPhase);
                    setPhaseProgress(0);
                }
            }
        }, intervalMs);

        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [isRunning, currentPhase, currentCycle, exercise]);

    const handleStart = () => {
        setIsRunning(true);
        setCurrentPhase(0);
        setCurrentCycle(0);
        setPhaseProgress(0);
    };

    const handlePause = () => {
        setIsRunning(false);
        if (intervalRef.current) clearInterval(intervalRef.current);
    };

    const handleReset = () => {
        setIsRunning(false);
        setCurrentPhase(0);
        setCurrentCycle(0);
        setPhaseProgress(0);
        setCircleScale(1);
        if (intervalRef.current) clearInterval(intervalRef.current);
    };

    const phase = exercise.phases[currentPhase];

    return (
        <Box sx={{ maxWidth: 500, mx: 'auto', textAlign: 'center' }}>
            {/* Exercise Selector */}
            <Box sx={{ display: 'flex', gap: 1, mb: 4, justifyContent: 'center', flexWrap: 'wrap' }}>
                {Object.entries(EXERCISES).map(([key, ex]) => (
                    <Button
                        key={key}
                        variant={selectedExercise === key ? 'contained' : 'outlined'}
                        onClick={() => {
                            if (!isRunning) setSelectedExercise(key);
                        }}
                        disabled={isRunning}
                        sx={{
                            borderRadius: 3,
                            textTransform: 'none',
                            ...(selectedExercise === key && {
                                background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
                                boxShadow: isDark ? '0 10px 22px rgba(79, 70, 229, 0.35)' : 'none'
                            }),
                            ...(selectedExercise !== key && {
                                borderColor: isDark ? 'rgba(148, 163, 184, 0.45)' : undefined,
                                color: isDark ? '#cbd5e1' : undefined,
                                '&:hover': {
                                    borderColor: isDark ? '#818cf8' : undefined,
                                    backgroundColor: isDark ? 'rgba(129, 140, 248, 0.14)' : undefined
                                }
                            })
                        }}
                    >
                        {ex.name}
                    </Button>
                ))}
            </Box>

            {/* Exercise Description */}
            <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
                {exercise.description}
            </Typography>

            {/* Breathing Circle */}
            <Box
                sx={{
                    position: 'relative',
                    width: 250,
                    height: 250,
                    mx: 'auto',
                    mb: 4,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}
            >
                {/* Outer ring */}
                <Box
                    sx={{
                        position: 'absolute',
                        width: '100%',
                        height: '100%',
                        borderRadius: '50%',
                        border: '2px solid',
                        borderColor: 'divider',
                        opacity: 0.3
                    }}
                />

                {/* Animated circle */}
                <Box
                    sx={{
                        width: 150,
                        height: 150,
                        borderRadius: '50%',
                        background: isRunning
                            ? `linear-gradient(135deg, ${phase.color}40 0%, ${phase.color}80 100%)`
                            : isDark
                                ? 'linear-gradient(135deg, rgba(51,65,85,0.5) 0%, rgba(71,85,105,0.5) 100%)'
                                : 'linear-gradient(135deg, #e2e8f0 0%, #cbd5e1 100%)',
                        border: `4px solid ${isRunning ? phase.color : isDark ? '#64748b' : '#94a3b8'}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexDirection: 'column',
                        transform: `scale(${circleScale})`,
                        transition: 'transform 0.3s ease-out, background 0.3s, border-color 0.3s',
                        boxShadow: isRunning ? `0 0 40px ${phase.color}40` : 'none'
                    }}
                >
                    {isRunning ? (
                        <>
                            <Typography variant="h6" fontWeight={700} color={phase.color}>
                                {phase.name}
                            </Typography>
                            <Typography variant="h4" fontWeight={700} color={phase.color}>
                                {Math.ceil(phase.duration - (phaseProgress / 100) * phase.duration)}
                            </Typography>
                        </>
                    ) : (
                        <Typography variant="h6" color="text.secondary">
                            Ready
                        </Typography>
                    )}
                </Box>
            </Box>

            {/* Progress */}
            {isRunning && (
                <Box sx={{ mb: 3 }}>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        Cycle {currentCycle + 1} of {exercise.cycles}
                    </Typography>
                    <LinearProgress
                        variant="determinate"
                        value={((currentCycle * exercise.phases.length + currentPhase + phaseProgress / 100) /
                            (exercise.cycles * exercise.phases.length)) * 100}
                        sx={{
                            height: 8,
                            borderRadius: 4,
                            bgcolor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
                            '& .MuiLinearProgress-bar': {
                                background: isDark
                                    ? 'linear-gradient(90deg, #818cf8 0%, #22d3ee 100%)'
                                    : 'linear-gradient(90deg, #4f46e5 0%, #06b6d4 100%)',
                                borderRadius: 4
                            }
                        }}
                    />
                </Box>
            )}

            {/* Controls */}
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
                {!isRunning ? (
                    <Button
                        variant="contained"
                        size="large"
                        startIcon={<PlayArrow />}
                        onClick={handleStart}
                        sx={{
                            px: 4,
                            py: 1.5,
                            borderRadius: 3,
                            background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
                            boxShadow: '0 10px 20px -5px rgba(79, 70, 229, 0.4)'
                        }}
                    >
                        Start Exercise
                    </Button>
                ) : (
                    <>
                        <IconButton
                            onClick={handlePause}
                            sx={{
                                bgcolor: 'warning.main',
                                color: 'white',
                                boxShadow: isDark ? '0 8px 18px rgba(245, 158, 11, 0.25)' : 'none',
                                '&:hover': { bgcolor: 'warning.dark' }
                            }}
                        >
                            <Pause />
                        </IconButton>
                        <IconButton
                            onClick={handleReset}
                            sx={{
                                bgcolor: 'error.main',
                                color: 'white',
                                boxShadow: isDark ? '0 8px 18px rgba(239, 68, 68, 0.24)' : 'none',
                                '&:hover': { bgcolor: 'error.dark' }
                            }}
                        >
                            <Refresh />
                        </IconButton>
                    </>
                )}
            </Box>

            {/* Tips */}
            <Card sx={{ mt: 4, bgcolor: isDark ? 'rgba(129, 140, 248, 0.1)' : 'rgba(79, 70, 229, 0.05)', border: '1px solid', borderColor: isDark ? 'rgba(129, 140, 248, 0.2)' : 'rgba(79, 70, 229, 0.1)' }}>
                <CardContent>
                    <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                        💡 Tips for better results
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        • Find a quiet, comfortable place to sit<br />
                        • Keep your back straight but relaxed<br />
                        • Breathe through your nose if possible<br />
                        • Focus on the rhythm, let thoughts pass
                    </Typography>
                </CardContent>
            </Card>
        </Box>
    );
};

export default BreathingExercise;
