import {
  Avatar,
  Box,
  IconButton,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material';
import DarkModeRoundedIcon from '@mui/icons-material/DarkModeRounded';
import LightModeRoundedIcon from '@mui/icons-material/LightModeRounded';
import { LedgerLogo } from './LedgerLogo';
import { useColors } from '../theme/theme';

interface TopbarProps {
  darkMode: boolean;
  onToggleDark: () => void;
}

export function Topbar({ darkMode, onToggleDark }: TopbarProps) {
  const colors = useColors();

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
            Finance · v1.0
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
          sx={{
            px: 1.25,
            pl: 0.5,
            py: 0.5,
            borderRadius: '99px',
            background: colors.panel,
            border: `1px solid ${colors.border}`,
            cursor: 'pointer',
            transition: 'background 0.2s',
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
            A
          </Avatar>
          <Box>
            <Typography sx={{ fontSize: 12.5, fontWeight: 500, lineHeight: 1.2 }}>Aya</Typography>
            <Typography sx={{ fontSize: 10.5, color: colors.inkSoft, lineHeight: 1.2 }}>
              Admin
            </Typography>
          </Box>
        </Stack>
      </Stack>
    </Stack>
  );
}
