import { useState } from 'react';
import {
  Box,
  Button,
  IconButton,
  InputAdornment,
  Stack,
  TextField,
  Typography,
  alpha,
} from '@mui/material';
import VisibilityRoundedIcon from '@mui/icons-material/VisibilityRounded';
import VisibilityOffRoundedIcon from '@mui/icons-material/VisibilityOffRounded';
import { LedgerLogo } from './LedgerLogo';
import { useColors } from '../theme/theme';
import { login } from '../auth';
import type { AuthUser } from '../auth';

interface LoginPageProps {
  onLogin: (user: AuthUser) => void;
}

export function LoginPage({ onLogin }: LoginPageProps) {
  const colors = useColors();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) return;
    setError('');
    setLoading(true);
    setTimeout(() => {
      const user = login(username, password);
      if (user) {
        onLogin(user);
      } else {
        setError('Invalid username or password.');
        setLoading(false);
      }
    }, 380);
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: `radial-gradient(ellipse at 65% 25%, ${alpha(colors.accent, 0.13)}, transparent 55%),
                     radial-gradient(ellipse at 15% 75%, ${alpha(colors.accent2, 0.09)}, transparent 50%)`,
      }}
    >
      <Box
        component="form"
        onSubmit={handleSubmit}
        sx={{
          width: '100%',
          maxWidth: 420,
          mx: 2,
          background: colors.panel,
          border: `1px solid ${colors.border}`,
          borderRadius: '22px',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          p: '40px 44px',
          boxShadow: `0 32px 80px -20px ${alpha(colors.ink, 0.18)}`,
        }}
      >
        <Stack alignItems="center" sx={{ mb: 4 }}>
          <LedgerLogo size={40} />
          <Typography sx={{ fontFamily: '"Instrument Serif", serif', fontSize: 27, mt: 1.75, letterSpacing: '-0.3px', lineHeight: 1.1 }}>
            Ledger Console
          </Typography>
          <Typography sx={{ fontSize: 13, color: 'text.secondary', mt: 0.6 }}>
            Sign in to continue
          </Typography>
        </Stack>

        <Stack gap={2.25}>
          <TextField
            label="Username"
            value={username}
            onChange={(e) => { setUsername(e.target.value); setError(''); }}
            autoFocus
            fullWidth
            size="small"
            autoComplete="username"
            sx={fieldSx(colors)}
          />

          <TextField
            label="Password"
            type={showPw ? 'text' : 'password'}
            value={password}
            onChange={(e) => { setPassword(e.target.value); setError(''); }}
            fullWidth
            size="small"
            autoComplete="current-password"
            sx={fieldSx(colors)}
            slotProps={{
              input: {
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      size="small"
                      onClick={() => setShowPw((v) => !v)}
                      edge="end"
                      sx={{ color: colors.inkDim, mr: -0.5 }}
                    >
                      {showPw
                        ? <VisibilityOffRoundedIcon sx={{ fontSize: 18 }} />
                        : <VisibilityRoundedIcon sx={{ fontSize: 18 }} />}
                    </IconButton>
                  </InputAdornment>
                ),
              },
            }}
          />

          {error && (
            <Typography sx={{ fontSize: 12.5, color: colors.danger, mt: -0.75, ml: 0.25 }}>
              {error}
            </Typography>
          )}

          <Button
            type="submit"
            variant="contained"
            disabled={loading || !username || !password}
            sx={{
              mt: 0.25,
              py: 1.3,
              background: `linear-gradient(135deg, ${colors.accent}, ${colors.accent2})`,
              color: '#fff',
              fontSize: 14,
              fontWeight: 600,
              borderRadius: '10px',
              letterSpacing: '0.2px',
              boxShadow: `0 8px 24px -8px ${alpha(colors.accent, 0.4)}`,
              '&:hover': {
                background: `linear-gradient(135deg, ${colors.accent}, ${colors.accent2})`,
                filter: 'brightness(1.07)',
              },
              '&.Mui-disabled': { opacity: 0.55, color: '#fff' },
            }}
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </Button>
        </Stack>

        <Typography sx={{ textAlign: 'center', fontSize: 11, color: colors.inkSoft, mt: 3.5, fontStyle: 'italic', fontFamily: '"Instrument Serif", serif' }}>
          Ledger Console · Finance Dashboard
        </Typography>
      </Box>
    </Box>
  );
}

function fieldSx(colors: ReturnType<typeof useColors>) {
  return {
    '& .MuiOutlinedInput-root': {
      borderRadius: '10px',
      '& fieldset': { borderColor: colors.border },
      '&:hover fieldset': { borderColor: colors.borderStrong },
      '&.Mui-focused fieldset': { borderColor: colors.accent },
    },
    '& .MuiInputLabel-root.Mui-focused': { color: colors.accent },
  };
}
