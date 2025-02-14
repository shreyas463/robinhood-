'use client';

import { useState } from 'react';
import { Box, Button, Container, Paper, TextField, Typography, Alert } from '@mui/material';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login, register } = useAuth();
  const router = useRouter();

  const validateForm = () => {
    if (!username || username.trim().length < 3) {
      setError('Username must be at least 3 characters long');
      return false;
    }
    if (!password || password.length < 6) {
      setError('Password must be at least 6 characters long');
      return false;
    }
    if (!isLogin && (!email || !email.includes('@'))) {
      setError('Please enter a valid email address');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!validateForm()) {
      return;
    }
    
    try {
      if (isLogin) {
        await login(username, password);
      } else {
        await register(username, email, password);
      }
      router.push('/');
    } catch (err: any) {
      setError(err.message || (isLogin ? 'Invalid username or password' : 'Registration failed'));
    }
  };

  return (
    <Box 
      sx={{ 
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: '#1E2132',
        p: 3
      }}
    >
      <Container maxWidth="sm">
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Typography 
            variant="h3" 
            component="h1" 
            sx={{ 
              color: 'white',
              fontWeight: 'bold',
              mb: 2
            }}
          >
            RobinHood Clone
          </Typography>
          <Typography 
            variant="h6" 
            sx={{ 
              color: 'grey.400',
              mb: 4
            }}
          >
            Your Modern Trading Platform
          </Typography>
        </Box>

        <Paper 
          elevation={3} 
          sx={{ 
            p: 4, 
            bgcolor: '#2A2D3E',
            borderRadius: 2,
            border: '1px solid',
            borderColor: 'rgba(255, 255, 255, 0.1)'
          }}
        >
          <Box sx={{ 
            display: 'flex', 
            gap: 2, 
            mb: 4,
            borderBottom: 1,
            borderColor: 'rgba(255, 255, 255, 0.1)',
            pb: 2
          }}>
            <Button
              fullWidth
              variant={isLogin ? "contained" : "text"}
              onClick={() => {
                setIsLogin(true);
                setError('');
              }}
              sx={{
                py: 1.5,
                bgcolor: isLogin ? '#69f0ae' : 'transparent',
                color: isLogin ? '#1E2132' : 'grey.400',
                '&:hover': {
                  bgcolor: isLogin ? '#4caf50' : 'rgba(255, 255, 255, 0.1)'
                }
              }}
            >
              Login
            </Button>
            <Button
              fullWidth
              variant={!isLogin ? "contained" : "text"}
              onClick={() => {
                setIsLogin(false);
                setError('');
              }}
              sx={{
                py: 1.5,
                bgcolor: !isLogin ? '#69f0ae' : 'transparent',
                color: !isLogin ? '#1E2132' : 'grey.400',
                '&:hover': {
                  bgcolor: !isLogin ? '#4caf50' : 'rgba(255, 255, 255, 0.1)'
                }
              }}
            >
              Register
            </Button>
          </Box>
          
          {error && (
            <Alert 
              severity="error" 
              sx={{ 
                mb: 3,
                bgcolor: 'rgba(211, 47, 47, 0.1)',
                color: '#ff5252',
                '& .MuiAlert-icon': { color: '#ff5252' }
              }}
            >
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <TextField
              label="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              fullWidth
              required
              variant="outlined"
              sx={{
                '& .MuiOutlinedInput-root': {
                  bgcolor: '#1E2132',
                  '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.1)' },
                  '&:hover fieldset': { borderColor: 'rgba(255, 255, 255, 0.2)' },
                  '&.Mui-focused fieldset': { borderColor: '#69f0ae' }
                },
                '& .MuiInputLabel-root': { color: 'grey.400' },
                '& .MuiInputBase-input': { color: 'white' }
              }}
            />
            
            {!isLogin && (
              <TextField
                label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                fullWidth
                required
                variant="outlined"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    bgcolor: '#1E2132',
                    '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.1)' },
                    '&:hover fieldset': { borderColor: 'rgba(255, 255, 255, 0.2)' },
                    '&.Mui-focused fieldset': { borderColor: '#69f0ae' }
                  },
                  '& .MuiInputLabel-root': { color: 'grey.400' },
                  '& .MuiInputBase-input': { color: 'white' }
                }}
              />
            )}
            
            <TextField
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              fullWidth
              required
              variant="outlined"
              sx={{
                '& .MuiOutlinedInput-root': {
                  bgcolor: '#1E2132',
                  '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.1)' },
                  '&:hover fieldset': { borderColor: 'rgba(255, 255, 255, 0.2)' },
                  '&.Mui-focused fieldset': { borderColor: '#69f0ae' }
                },
                '& .MuiInputLabel-root': { color: 'grey.400' },
                '& .MuiInputBase-input': { color: 'white' }
              }}
            />
            
            <Button 
              type="submit" 
              variant="contained" 
              size="large"
              sx={{
                mt: 2,
                bgcolor: '#69f0ae',
                color: '#1E2132',
                '&:hover': {
                  bgcolor: '#4caf50',
                },
                py: 1.5,
                fontSize: '1.1rem'
              }}
            >
              {isLogin ? 'Login' : 'Create Account'}
            </Button>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
} 