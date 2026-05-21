import {
  Box,
  Button,
  ButtonGroup,
  Chip,
  Stack,
  Typography,
  alpha,
  keyframes,
} from '@mui/material';
import FileDownloadRoundedIcon from '@mui/icons-material/FileDownloadRounded';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import type { PeriodView } from '../types/pnl';
import { useColors } from '../theme/theme';

const PERIODS: PeriodView[] = ['MoM', 'QoQ', 'YTD'];

interface PageHeadProps {
  currentLabel: string;
  priorLabel: string;
  activePeriod: PeriodView;
  onPeriodChange: (p: PeriodView) => void;
  onOpenDrawer: () => void;
  onExport: () => void;
}

const pulse = keyframes`
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
`;

export function PageHead({
  currentLabel,
  priorLabel,
  activePeriod,
  onPeriodChange,
  onOpenDrawer,
  onExport,
}: PageHeadProps) {
  const colors = useColors();

  const controlBtnSx = {
    py: 1,
    px: 1.75,
    background: colors.panel,
    border: `1px solid ${colors.border}`,
    borderRadius: '10px',
    fontSize: 12.5,
    color: 'text.primary',
    backdropFilter: 'blur(20px)',
    '&:hover': {
      background: colors.panelStrong,
      borderColor: colors.borderStrong,
    },
  } as const;

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 18) return 'Good afternoon';
    return 'Good evening';
  })();

  return (
    <Stack
      direction="row"
      alignItems="flex-end"
      justifyContent="space-between"
      gap={3}
      flexWrap="wrap"
    >
      <Box>
        <Stack direction="row" alignItems="center" gap={1.5} flexWrap="wrap">
          <Typography component="h1" variant="h1" sx={{ fontSize: '2.4rem', lineHeight: 1.1 }}>
            {greeting}, Aya!
          </Typography>
          <Chip
            label="LIVE"
            size="small"
            sx={{
              height: 22,
              fontSize: 11,
              fontWeight: 500,
              letterSpacing: 0.3,
              color: colors.accent2,
              background: alpha(colors.accent2, 0.12),
              border: `1px solid ${alpha(colors.accent2, 0.3)}`,
              '& .MuiChip-label': { display: 'flex', alignItems: 'center', gap: 0.75 },
              '&::before': {
                content: '""',
                display: 'inline-block',
                width: 6,
                height: 6,
                background: colors.accent2,
                borderRadius: '50%',
                boxShadow: `0 0 8px ${colors.accent2}`,
                animation: `${pulse} 1.8s ease-in-out infinite`,
                ml: 1,
              },
            }}
          />
        </Stack>
        <Typography sx={{ color: 'text.secondary', fontSize: 13, mt: 0.75 }}>
          Comparing{' '}
          <Box component="strong" sx={{ color: 'text.primary' }}>
            {currentLabel}
          </Box>{' '}
          vs{' '}
          <Box component="strong" sx={{ color: 'text.primary' }}>
            {priorLabel}
          </Box>{' '}
          · Source: Manual entry
        </Typography>
      </Box>

      <Stack direction="row" gap={1} flexWrap="wrap">
        <ButtonGroup
          sx={{
            background: colors.panel,
            border: `1px solid ${colors.border}`,
            borderRadius: '10px',
            p: 0.4,
            backdropFilter: 'blur(20px)',
            '& .MuiButton-root': {
              border: 'none',
              minWidth: 'auto',
              px: 1.75,
              py: 0.75,
              fontSize: 12,
              borderRadius: '7px !important',
              color: 'text.secondary',
              fontWeight: 500,
              '&:hover': { background: alpha(colors.ink, 0.04) },
            },
          }}
        >
          {PERIODS.map((p) => (
            <Button
              key={p}
              onClick={() => onPeriodChange(p)}
              sx={{
                ...(activePeriod === p && {
                  background: `${alpha(colors.ink, 0.06)} !important`,
                  color: 'text.primary !important',
                  fontWeight: '600 !important',
                }),
              }}
            >
              {p}
            </Button>
          ))}
        </ButtonGroup>

        <Button
          startIcon={<FileDownloadRoundedIcon sx={{ fontSize: 15 }} />}
          sx={controlBtnSx}
          onClick={onExport}
        >
          Export CSV
        </Button>

        <Button
          startIcon={<AddRoundedIcon sx={{ fontSize: 15 }} />}
          variant="contained"
          onClick={onOpenDrawer}
          sx={{
            py: 1,
            px: 2,
            background: `linear-gradient(135deg, ${colors.accent}, ${colors.accent2})`,
            color: '#fff',
            fontSize: 12.5,
            fontWeight: 600,
            borderRadius: '10px',
            '&:hover': {
              background: `linear-gradient(135deg, ${colors.accent}, ${colors.accent2})`,
              filter: 'brightness(1.05)',
            },
          }}
        >
          Input data
        </Button>
      </Stack>
    </Stack>
  );
}
