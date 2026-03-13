import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { Box, CircularProgress, Typography } from '@mui/material';

const GoogleCallback = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { setUserFromGoogle } = useAuth();

    useEffect(() => {
        const userStr = searchParams.get('user');

        const completeGoogleLogin = async () => {
            try {
                if (userStr) {
                    const user = JSON.parse(decodeURIComponent(userStr));
                    localStorage.removeItem('token');
                    localStorage.setItem('user', JSON.stringify(user));
                    setUserFromGoogle(user);
                    navigate('/dashboard', { replace: true });
                    return;
                }

                const { data: user } = await api.get('/auth/me');
                localStorage.removeItem('token');
                localStorage.setItem('user', JSON.stringify(user));
                setUserFromGoogle(user);
                navigate('/dashboard', { replace: true });
            } catch (error) {
                console.error('Google login callback failed:', error);
                navigate('/login', { replace: true });
            }
        };

        completeGoogleLogin();
    }, [searchParams, navigate, setUserFromGoogle]);

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
            <CircularProgress />
            <Typography sx={{ mt: 2 }}>Signing you in...</Typography>
        </Box>
    );
};

export default GoogleCallback;
