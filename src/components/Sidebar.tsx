import { useState } from 'react';
import { Box, Button, Stack, Typography, alpha } from '@mui/material';
import HomeRoundedIcon from '@mui/icons-material/HomeRounded';
import InsightsRoundedIcon from '@mui/icons-material/InsightsRounded';
import GridViewRoundedIcon from '@mui/icons-material/GridViewRounded';
import QueryStatsRoundedIcon from '@mui/icons-material/QueryStatsRounded';
import Inventory2RoundedIcon from '@mui/icons-material/Inventory2Rounded';
import DescriptionRoundedIcon from '@mui/icons-material/DescriptionRounded';
import AutoAwesomeRoundedIcon from '@mui/icons-material/AutoAwesomeRounded';
import VerifiedRoundedIcon from '@mui/icons-material/VerifiedRounded';
import { LedgerLogo } from './LedgerLogo';
import { customColors } from '../theme/theme';

interface SidebarProps {
  onOpenDrawer: () => void;
}

const workspace = [
  { id: 'overview', label: 'Overview', icon: <HomeRoundedIcon fontSize="small" /> },
  { id: 'performance', label: 'Performance', icon: <InsightsRoundedIcon fontSize="small" />, badge: 3 },
  { id: 'operations', label: 'Operations', icon: <GridViewRoundedIcon fontSize="small" /> },
  { id: 'forecasting', label: 'Forecasting', icon: <QueryStatsRoundedIcon fontSize="small" /> },
  { id: 'assets', label: 'Assets', icon: <Inventory2RoundedIcon fontSize="small" /> },
];

const insights = [
  { id: 'reports', label: 'Reports', icon: <DescriptionRoundedIcon fontSize="small" /> },
  { id: 'automations', label: 'Automations', icon: <AutoAwesomeRoundedIcon fontSize="small" /> },
  { id: 'compliance', label: 'Compliance', icon: <VerifiedRoundedIcon fontSize="small" /> },
];

export function Sidebar({ onOpenDrawer }: SidebarProps) {
  const [active, setActive] = useState('overview');

  const renderItem = (item: typeof workspace[number]) => {
    const isActive = active === item.id;
    return (
      <Box
        key={item.id}
        role="button"
        tabIndex={0}
        onClick={() => setActive(item.id)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setActive(item.id);
          }
        }}
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          px: 1.5,
          py: 1.1,
          borderRadius: '10px',
          cursor: 'pointer',
          color: isActive ? 'text.primary' : 'text.secondary',
          fontSize: 13.5,
          fontWeight: 500,
          position: 'relative',
          transition: 'all 0.2s ease',
          background: isActive
            ? `linear-gradient(90deg, ${alpha(customColors.accent, 0.16)}, ${alpha(customColors.accent, 0.02)})`
            : 'transparent',
          '&:hover': {
            background: alpha(customColors.ink, 0.04),
            color: 'text.primary',
          },
          '&::before': isActive
            ? {
                content: '""',
                position: 'absolute',
                left: 0,
                top: 8,
                bottom: 8,
                width: 2,
                background: customColors.accent,
                borderRadius: '0 2px 2px 0',
              }
            : {},
        }}
      >
        {item.icon}
        <Box component="span" sx={{ flex: 1 }}>
          {item.label}
        </Box>
        {'badge' in item && item.badge ? (
          <Box
            component="span"
            sx={{
              fontSize: 10,
              px: 0.9,
              py: 0.25,
              background: alpha(customColors.accent3, 0.15),
              color: customColors.accent3,
              borderRadius: 99,
              fontWeight: 600,
            }}
          >
            {item.badge}
          </Box>
        ) : null}
      </Box>
    );
  };

  return (
    <Box
      component="aside"
      sx={{
        borderRight: `1px solid ${customColors.border}`,
        background: `linear-gradient(180deg, ${alpha('#ffffff', 0.6)}, ${alpha('#ffffff', 0.3)})`,
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        p: '22px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: 3.5,
        position: 'sticky',
        top: 0,
        height: '100vh',
        zIndex: 2,
      }}
    >
      <Stack
        direction="row"
        alignItems="center"
        gap={1.5}
        sx={{ pb: 2.25, borderBottom: `1px solid ${customColors.border}`, px: 1 }}
      >
        <LedgerLogo size={34} />
        <Box sx={{ lineHeight: 1.1 }}>
          <Typography sx={{ fontFamily: '"Instrument Serif", serif', fontSize: 19, letterSpacing: '0.2px' }}>
            Ledger Console
          </Typography>
          <Typography
            sx={{
              fontSize: 10,
              textTransform: 'uppercase',
              letterSpacing: '1.6px',
              color: customColors.inkSoft,
              mt: '2px',
            }}
          >
            Finance · v1.0
          </Typography>
        </Box>
      </Stack>

      <Box>
        <Typography
          sx={{
            fontSize: 10,
            textTransform: 'uppercase',
            letterSpacing: '1.4px',
            color: customColors.inkSoft,
            px: 1.5,
            pb: 1,
          }}
        >
          Workspace
        </Typography>
        <Stack gap={0.25}>{workspace.map(renderItem)}</Stack>
      </Box>

      <Box>
        <Typography
          sx={{
            fontSize: 10,
            textTransform: 'uppercase',
            letterSpacing: '1.4px',
            color: customColors.inkSoft,
            px: 1.5,
            pb: 1,
          }}
        >
          Insights
        </Typography>
        <Stack gap={0.25}>{insights.map(renderItem)}</Stack>
      </Box>

      <Box
        sx={{
          mt: 'auto',
          border: `1px solid ${customColors.border}`,
          borderRadius: '14px',
          p: 1.75,
          background: alpha('#ffffff', 0.5),
        }}
      >
        <Typography sx={{ fontSize: 13, fontWeight: 600 }}>Need fresh data?</Typography>
        <Typography sx={{ fontSize: 11.5, color: 'text.secondary', my: '4px 10px', lineHeight: 1.5 }}>
          Input or update your monthly P&L figures to refresh every visual instantly.
        </Typography>
        <Button
          fullWidth
          variant="contained"
          onClick={onOpenDrawer}
          sx={{
            mt: 1.25,
            py: 1,
            background: `linear-gradient(135deg, ${customColors.accent}, ${customColors.accent2})`,
            color: '#fff',
            fontSize: 12,
            fontWeight: 600,
            borderRadius: '8px',
            '&:hover': {
              background: `linear-gradient(135deg, ${customColors.accent}, ${customColors.accent2})`,
              filter: 'brightness(1.05)',
            },
          }}
        >
          Open data input →
        </Button>
      </Box>
    </Box>
  );
}
