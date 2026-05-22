import { useState } from 'react';
import {
  Avatar,
  Box,
  IconButton,
  ListItemIcon,
  Menu,
  MenuItem,
  Stack,
  Tooltip,
  Typography,
  alpha,
} from '@mui/material';
import DarkModeRoundedIcon from '@mui/icons-material/DarkModeRounded';
import LightModeRoundedIcon from '@mui/icons-material/LightModeRounded';
import LogoutRoundedIcon from '@mui/icons-material/LogoutRounded';
import { LedgerLogo } from './LedgerLogo';
import { useColors } from '../theme/theme';
import type { AuthUser } from '../auth';

interface TopbarProps {
  darkMode: boolean;
  onToggleDark: () => void;
  user: AuthUser;
  onLogoutRequest: () => void;
}

export function Topbar({ darkMode, onToggleDark, user, onLogoutRequest }: TopbarProps) {
  const colors = useColors();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const menuOpen = Boolean(anchorEl);

  const iconBtnSx = {
    width: 36,
    height: 36,
    borderRadius: '10px',
    background: colors.panel,
    border: `1px solid ${colors.border}`,
    color: colors.inkDim,
    '&:hover': { background: colors.panelStrong },
  };

  return (
    <Stack
      direction="row"
      alignItems="center"
      sx={{
        px: 4,
        py: 1.75,
        borderBottom: `1px solid ${colors.border}`,
        background: colors.panelStrong,
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        position: 'sticky',
        top: 0,
        zIndex: 10,
      }}
    >
      <Stack direction="row" alignItems="center" gap={1.25}>
        <LedgerLogo size={32} />
        <Box sx={{ lineHeight: 1.15 }}>
          <Typography sx={{ fontFamily: '"Instrument Serif", serif', fontSize: 17, letterSpacing: '0.2px', lineHeight: 1.1 }}>
            Ledger Console
          </Typography>
          <Typography sx={{ fontSize: 9.5, textTransform: 'uppercase', letterSpacing: '1.5px', color: colors.inkSoft }}>
            Finance · v0.0
          </Typography>
        </Box>
      </Stack>

      <Stack direction="row" alignItems="center" gap={1.5} sx={{ ml: 'auto' }}>
        <Tooltip title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'} arrow>
          <IconButton onClick={onToggleDark} sx={iconBtnSx}>
            {darkMode
              ? <LightModeRoundedIcon sx={{ fontSize: 18 }} />
              : <DarkModeRoundedIcon sx={{ fontSize: 18 }} />}
          </IconButton>
        </Tooltip>

        <Stack
          direction="row"
          alignItems="center"
          gap={1.25}
          onClick={(e) => setAnchorEl(e.currentTarget)}
          sx={{
            px: 1.25,
            pl: 0.5,
            py: 0.5,
            borderRadius: '99px',
            background: colors.panel,
            border: `1px solid ${menuOpen ? colors.borderStrong : colors.border}`,
            cursor: 'pointer',
            transition: 'background 0.2s, border-color 0.2s',
            '&:hover': { background: colors.panelStrong },
          }}
        >
          <Avatar
            sx={{
              width: 28,
              height: 28,
              background: `linear-gradient(135deg, ${colors.accent}, ${colors.accent2})`,
              fontSize: 11,
              fontWeight: 600,
            }}
          >
            {user.username[0].toUpperCase()}
          </Avatar>
          <Box>
            <Typography sx={{ fontSize: 12.5, fontWeight: 500, lineHeight: 1.2 }}>{user.username}</Typography>
            <Typography sx={{ fontSize: 10.5, color: colors.inkSoft, lineHeight: 1.2 }}>Admin</Typography>
          </Box>
        </Stack>

        <Menu
          anchorEl={anchorEl}
          open={menuOpen}
          onClose={() => setAnchorEl(null)}
          transformOrigin={{ horizontal: 'right', vertical: 'top' }}
          anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
          slotProps={{
            paper: {
              sx: {
                mt: 1,
                minWidth: 180,
                background: colors.panel,
                backdropFilter: 'blur(20px)',
                border: `1px solid ${colors.border}`,
                borderRadius: '12px',
                boxShadow: `0 16px 40px -8px ${alpha(colors.ink, 0.2)}`,
                '& .MuiList-root': { p: 0.75 },
              },
            },
          }}
        >
          <Box sx={{ px: 2, py: 1.25, borderBottom: `1px solid ${colors.border}`, mb: 0.5 }}>
            <Typography sx={{ fontSize: 13, fontWeight: 600 }}>{user.username}</Typography>
            <Typography sx={{ fontSize: 11.5, color: 'text.secondary' }}>Administrator</Typography>
          </Box>

          <MenuItem
            onClick={() => { setAnchorEl(null); onLogoutRequest(); }}
            sx={{
              borderRadius: '8px',
              fontSize: 13,
              color: colors.danger,
              gap: 1,
              '&:hover': { background: alpha(colors.danger, 0.08) },
            }}
          >
            <ListItemIcon sx={{ minWidth: 'auto', color: 'inherit' }}>
              <LogoutRoundedIcon sx={{ fontSize: 16 }} />
            </ListItemIcon>
            Sign out
          </MenuItem>
        </Menu>
      </Stack>
    </Stack>
  );
}
