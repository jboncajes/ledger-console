import { Box, IconButton, Stack, Typography, alpha } from '@mui/material';
import BoltRoundedIcon from '@mui/icons-material/BoltRounded';
import BuildRoundedIcon from '@mui/icons-material/BuildRounded';
import AccountBalanceRoundedIcon from '@mui/icons-material/AccountBalanceRounded';
import ContentCopyRoundedIcon from '@mui/icons-material/ContentCopyRounded';
import CheckRoundedIcon from '@mui/icons-material/CheckRounded';
import type { PnlComputed } from '../types/pnl';
import { useColors } from '../theme/theme';
import { fmtMillions, PESO } from '../utils/format';
import { useCopyCard } from '../hooks/useCopyCard';

interface TripleGridProps {
  data: PnlComputed;
}

export function TripleGrid({ data }: TripleGridProps) {
  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: 2,
        '@media (max-width: 1200px)': { gridTemplateColumns: '1fr' },
      }}
    >
      <CostBreakdown data={data} />
      <ActivityFeed data={data} />
    </Box>
  );
}

function CardShell({ children }: { children: React.ReactNode }) {
  const colors = useColors();
  const { cardRef, copyBtnRef, hovered, setHovered, copied, handleCopy } = useCopyCard();
  return (
    <Box
      ref={cardRef}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      sx={{
        position: 'relative',
        background: colors.panel,
        border: `1px solid ${colors.border}`,
        borderRadius: '18px',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        p: 3.25,
        boxShadow: `0 20px 60px -20px ${alpha(colors.ink, 0.15)}`,
      }}
    >
      <IconButton
        ref={copyBtnRef}
        onClick={handleCopy}
        onMouseEnter={(e) => e.stopPropagation()}
        size="small"
        sx={{
          position: 'absolute', top: 12, right: 12,
          width: 28, height: 28,
          opacity: hovered ? 1 : 0,
          pointerEvents: hovered ? 'auto' : 'none',
          transition: 'opacity 0.18s',
          background: alpha(colors.panel, 0.95),
          border: `1px solid ${colors.border}`,
          borderRadius: '8px',
          zIndex: 1,
          '&:hover': { background: alpha(colors.ink, 0.08), borderColor: colors.borderStrong },
        }}
      >
        {copied
          ? <CheckRoundedIcon sx={{ fontSize: 13, color: colors.accent2 }} />
          : <ContentCopyRoundedIcon sx={{ fontSize: 13 }} />}
      </IconButton>
      {children}
    </Box>
  );
}

function CostBreakdown({ data }: TripleGridProps) {
  const colors = useColors();
  const c = data.inputs.current;
  const om = data.current.om;
  const items = [
    { label: 'Total Power Purchased', value: c.power, icon: <BoltRoundedIcon sx={{ fontSize: 14 }} />, tone: colors.accent },
    { label: 'Total Operating and Maintenance Expenses', value: om, icon: <BuildRoundedIcon sx={{ fontSize: 14 }} />, tone: colors.accent3 },
    { label: 'Depreciation', value: c.deprec, icon: <AccountBalanceRoundedIcon sx={{ fontSize: 14 }} />, tone: colors.danger },
    { label: 'Interest', value: c.interest, icon: <AccountBalanceRoundedIcon sx={{ fontSize: 14 }} />, tone: colors.inkSoft },
  ];
  const total = items.reduce((sum, i) => sum + i.value, 0);

  return (
    <CardShell>
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
        <Box>
          <Typography sx={{ fontFamily: '"Instrument Serif", serif', fontSize: 18 }}>Cost breakdown</Typography>
          <Typography sx={{ fontSize: 12, color: 'text.secondary', mt: 0.4 }}>Current period costs</Typography>
        </Box>
      </Stack>
      <Stack gap={1.25} sx={{ mt: 2.5 }}>
        {items.map((it) => {
          const pct = total > 0 ? (it.value / total) * 100 : 0;
          return (
            <Box key={it.label}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ fontSize: 12, mb: 0.5 }}>
                <Stack direction="row" alignItems="center" gap={0.75}>
                  <Box
                    sx={{
                      width: 22, height: 22, borderRadius: '6px',
                      background: alpha(it.tone, 0.12), color: it.tone,
                      display: 'grid', placeItems: 'center',
                    }}
                  >
                    {it.icon}
                  </Box>
                  <Typography sx={{ fontSize: 12.5 }}>{it.label}</Typography>
                </Stack>
                <Typography sx={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 12 }}>
                  {PESO}{fmtMillions(it.value)}M · {pct.toFixed(0)}%
                </Typography>
              </Stack>
              <Box sx={{ height: 8, background: alpha(colors.ink, 0.06), borderRadius: 99, overflow: 'hidden' }}>
                <Box
                  sx={{
                    height: '100%', width: `${pct}%`,
                    background: `linear-gradient(90deg, ${it.tone}, ${alpha(it.tone, 0.4)})`,
                    transition: 'width 0.6s ease',
                  }}
                />
              </Box>
            </Box>
          );
        })}
      </Stack>
    </CardShell>
  );
}

function ActivityFeed({ data }: TripleGridProps) {
  const colors = useColors();
  const delta = data.current.totalMargin - data.prior.totalMargin;
  const revDelta = data.current.totalRev - data.prior.totalRev;
  const omDelta = data.current.om - data.prior.om;

  const toneColor: Record<string, string> = {
    green: colors.accent2,
    red: colors.danger,
    amber: colors.accent3,
    blue: colors.accent,
  };

  const events = [
    { icon: 'M', label: 'Margin shift', meta: `Total margin moved ${delta >= 0 ? 'up' : 'down'} this period`, value: `${delta >= 0 ? '+' : '−'}${PESO}${fmtMillions(Math.abs(delta))}M`, tone: delta >= 0 ? 'green' : 'red' },
    { icon: 'R', label: 'Revenue growth', meta: 'Operating revenue versus prior period', value: `${revDelta >= 0 ? '+' : '−'}${PESO}${fmtMillions(Math.abs(revDelta))}M`, tone: revDelta >= 0 ? 'green' : 'red' },
    { icon: 'O', label: 'Total Operating and Maintenance Expenses variance', meta: 'Operating and maintenance versus plan', value: `${omDelta >= 0 ? '+' : '−'}${PESO}${fmtMillions(Math.abs(omDelta))}M`, tone: omDelta > 0 ? 'amber' : 'green' },
    { icon: 'I', label: 'Interest savings', meta: 'Year-on-year interest expense delta', value: `−${PESO}${fmtMillions(Math.abs(data.inputs.current.interest - data.inputs.prior.interest))}M`, tone: 'green' as const },
  ];

  return (
    <CardShell>
      <Box>
        <Typography sx={{ fontFamily: '"Instrument Serif", serif', fontSize: 18 }}>Recent activity</Typography>
        <Typography sx={{ fontSize: 12, color: 'text.secondary', mt: 0.4 }}>Auto-generated from inputs</Typography>
      </Box>
      <Stack sx={{ mt: 1.5 }}>
        {events.map((e, i) => (
          <Stack
            key={i}
            direction="row"
            gap={1.5}
            sx={{
              py: 1.75,
              borderBottom: `1px solid ${colors.border}`,
              '&:last-of-type': { borderBottom: 'none' },
              cursor: 'default',
              transition: 'background 0.2s',
              '&:hover': { background: alpha(colors.ink, 0.03) },
            }}
          >
            <Box
              sx={{
                width: 38, height: 38, flexShrink: 0, borderRadius: '10px',
                background: alpha(toneColor[e.tone], 0.12), color: toneColor[e.tone],
                display: 'grid', placeItems: 'center',
                fontFamily: '"JetBrains Mono", monospace', fontSize: 11, fontWeight: 600,
              }}
            >
              {e.icon}
            </Box>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography sx={{ fontSize: 13, fontWeight: 500 }}>{e.label}</Typography>
              <Typography sx={{ fontSize: 11.5, color: colors.inkSoft, mt: 0.25 }}>{e.meta}</Typography>
            </Box>
            <Typography sx={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 12, color: 'text.secondary' }}>
              {e.value}
            </Typography>
          </Stack>
        ))}
      </Stack>
    </CardShell>
  );
}
