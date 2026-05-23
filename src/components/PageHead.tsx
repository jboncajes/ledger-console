import { useRef } from 'react';
import {
  Box,
  Button,
  ButtonGroup,
  Chip,
  IconButton,
  Stack,
  Tooltip,
  Typography,
  alpha,
  keyframes,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import FileDownloadRoundedIcon from '@mui/icons-material/FileDownloadRounded';
import FileUploadRoundedIcon from '@mui/icons-material/FileUploadRounded';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import type { PeriodView } from '../types/pnl';
import { useColors } from '../theme/theme';

const PERIODS: PeriodView[] = ['MoM', 'QoQ', 'YTD', 'YoY'];

const PERIOD_META: Record<PeriodView, { title: string; body: string }> = {
  MoM: {
    title: 'Month-over-Month',
    body: 'Compares the most recent month against the one immediately before it. Best for spotting short-term changes in revenue and cost.',
  },
  QoQ: {
    title: 'Quarter-over-Quarter',
    body: 'Sums the last 3 months and compares against the 3 months before that. Smooths single-month spikes and gives a cleaner trend view.',
  },
  YTD: {
    title: 'Year-to-Date',
    body: 'Accumulates January through the current month and compares against the same range in the prior year. Useful for full-year trajectory.',
  },
  YoY: {
    title: 'Year-over-Year',
    body: 'Compares the current month against the same month from the previous year. Useful for seasonal performance analysis.',
  },
};

interface PageHeadProps {
  currentLabel: string;
  priorLabel?: string;
  activePeriod: PeriodView;
  onPeriodChange: (p: PeriodView) => void;
  hidePeriodSelector?: boolean;
  onOpenDrawer: () => void;
  onExport: () => void;
  onImport: (file: File) => void;
  onDownloadTemplate: () => void;
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
  hidePeriodSelector = false,
  onOpenDrawer,
  onExport,
  onImport,
  onDownloadTemplate,
}: PageHeadProps) {
  const colors = useColors();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onImport(file);
    e.target.value = '';
  };

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

  const iconOnlySx = {
    width: 36,
    height: 36,
    background: colors.panel,
    border: `1px solid ${colors.border}`,
    borderRadius: '10px',
    color: 'text.primary',
    '&:hover': { background: colors.panelStrong, borderColor: colors.borderStrong },
  } as const;

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 18) return 'Good afternoon';
    return 'Good evening';
  })();

  return (
    <Stack
      direction={{ xs: 'column', sm: 'row' }}
      alignItems={{ xs: 'flex-start', sm: 'flex-end' }}
      justifyContent="space-between"
      gap={{ xs: 2, sm: 3 }}
      flexWrap="wrap"
    >
      <Box>
        <Stack direction="row" alignItems="center" gap={1.5} flexWrap="wrap">
          <Typography
            component="h1"
            variant="h1"
            sx={{ fontSize: { xs: '1.7rem', sm: '2.4rem' }, lineHeight: 1.1 }}
          >
            {greeting}, Zaii!
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
        {!hidePeriodSelector && priorLabel && (
          <Typography sx={{ color: 'text.secondary', fontSize: { xs: 12, sm: 13 }, mt: 0.75 }}>
            Comparing{' '}
            <Box component="strong" sx={{ color: 'text.primary' }}>{currentLabel}</Box>{' '}
            vs{' '}
            <Box component="strong" sx={{ color: 'text.primary' }}>{priorLabel}</Box>{' '}
            · Source: Manual entry
          </Typography>
        )}
        {hidePeriodSelector && (
          <Typography sx={{ color: 'text.secondary', fontSize: { xs: 12, sm: 13 }, mt: 0.75 }}>
            Viewing <Box component="strong" sx={{ color: 'text.primary' }}>{currentLabel}</Box>{' '}
            · Source: Manual entry
          </Typography>
        )}
      </Box>

      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx"
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />

      <Stack direction="row" gap={1} flexWrap="wrap" alignItems="center">
        {!hidePeriodSelector && (
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
                px: { xs: 1.25, sm: 1.75 },
                py: 0.75,
                fontSize: { xs: 11, sm: 12 },
                borderRadius: '7px !important',
                color: 'text.secondary',
                fontWeight: 500,
                '&:hover': { background: alpha(colors.ink, 0.04) },
              },
            }}
          >
            {PERIODS.map((p) => (
              <Tooltip
                key={p}
                placement="bottom"
                arrow
                enterDelay={350}
                title={
                  <Box sx={{ p: 0.25 }}>
                    <Typography sx={{ fontSize: 12.5, fontWeight: 600, mb: 0.5 }}>{PERIOD_META[p].title}</Typography>
                    <Typography sx={{ fontSize: 11.5, lineHeight: 1.6, opacity: 0.85 }}>{PERIOD_META[p].body}</Typography>
                  </Box>
                }
                slotProps={{
                  tooltip: { sx: { background: alpha(colors.ink, 0.93), backdropFilter: 'blur(16px)', border: `1px solid ${alpha(colors.ink, 0.2)}`, borderRadius: '10px', p: 1.5, maxWidth: 240 } },
                  arrow: { sx: { color: alpha(colors.ink, 0.93) } },
                }}
              >
                <Button
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
              </Tooltip>
            ))}
          </ButtonGroup>
        )}

        {isMobile ? (
          /* Icon-only buttons on mobile */
          <>
            <Tooltip title="Download template" arrow>
              <IconButton sx={iconOnlySx} onClick={onDownloadTemplate}>
                <FileDownloadRoundedIcon sx={{ fontSize: 18 }} />
              </IconButton>
            </Tooltip>
            <Tooltip title="Import Excel" arrow>
              <IconButton sx={iconOnlySx} onClick={() => fileInputRef.current?.click()}>
                <FileUploadRoundedIcon sx={{ fontSize: 18 }} />
              </IconButton>
            </Tooltip>
            <Tooltip title="Export Excel" arrow>
              <IconButton sx={iconOnlySx} onClick={onExport}>
                <FileDownloadRoundedIcon sx={{ fontSize: 18 }} />
              </IconButton>
            </Tooltip>
            <IconButton
              onClick={onOpenDrawer}
              sx={{
                width: 36,
                height: 36,
                borderRadius: '10px',
                background: `linear-gradient(135deg, ${colors.accent}, ${colors.accent2})`,
                color: '#fff',
                '&:hover': { background: `linear-gradient(135deg, ${colors.accent}, ${colors.accent2})`, filter: 'brightness(1.05)' },
              }}
            >
              <AddRoundedIcon sx={{ fontSize: 20 }} />
            </IconButton>
          </>
        ) : (
          /* Full-label buttons on sm+ */
          <>
            <Tooltip
              title="Download a blank Excel template pre-filled with all month columns and zero amounts."
              placement="bottom"
              arrow
              enterDelay={350}
              slotProps={{
                tooltip: { sx: { background: alpha(colors.ink, 0.93), backdropFilter: 'blur(16px)', border: `1px solid ${alpha(colors.ink, 0.2)}`, borderRadius: '10px', p: 1.5, maxWidth: 220, fontSize: 12 } },
                arrow: { sx: { color: alpha(colors.ink, 0.93) } },
              }}
            >
              <Button startIcon={<FileDownloadRoundedIcon sx={{ fontSize: 15 }} />} sx={controlBtnSx} onClick={onDownloadTemplate}>
                Download Format
              </Button>
            </Tooltip>

            <Button startIcon={<FileUploadRoundedIcon sx={{ fontSize: 15 }} />} sx={controlBtnSx} onClick={() => fileInputRef.current?.click()}>
              Import Excel
            </Button>

            <Button startIcon={<FileDownloadRoundedIcon sx={{ fontSize: 15 }} />} sx={controlBtnSx} onClick={onExport}>
              Export Excel
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
          </>
        )}
      </Stack>
    </Stack>
  );
}
