import { Box, Stack, Typography, alpha } from '@mui/material';
import TrendingUpRoundedIcon from '@mui/icons-material/TrendingUpRounded';
import BoltRoundedIcon from '@mui/icons-material/BoltRounded';
import BuildRoundedIcon from '@mui/icons-material/BuildRounded';
import AccountBalanceRoundedIcon from '@mui/icons-material/AccountBalanceRounded';
import type { PnlComputed } from '../types/pnl';
import { useColors } from '../theme/theme';
import { fmtMillions, PESO } from '../utils/format';

interface TripleGridProps {
  data: PnlComputed;
}

export function TripleGrid({ data }: TripleGridProps) {
  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: 2,
        '@media (max-width: 1200px)': { gridTemplateColumns: '1fr' },
      }}
    >
      <RevenueMix data={data} />
      <CostBreakdown data={data} />
      <ActivityFeed data={data} />
    </Box>
  );
}

function CardShell({ children }: { children: React.ReactNode }) {
  const colors = useColors();
  return (
    <Box
      sx={{
        background: colors.panel,
        border: `1px solid ${colors.border}`,
        borderRadius: '18px',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        p: 3.25,
        boxShadow: `0 20px 60px -20px ${alpha(colors.ink, 0.15)}`,
      }}
    >
      {children}
    </Box>
  );
}

function RevenueMix({ data }: TripleGridProps) {
  const colors = useColors();
  const c = data.inputs.current;
  const total = c.opRev + c.othRev;
  const opShare = total > 0 ? (c.opRev / total) * 100 : 0;
  const othShare = total > 0 ? (c.othRev / total) * 100 : 0;

  return (
    <CardShell>
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
        <Box>
          <Typography sx={{ fontFamily: '"Instrument Serif", serif', fontSize: 18 }}>Revenue mix</Typography>
          <Typography sx={{ fontSize: 12, color: 'text.secondary', mt: 0.4 }}>Operating + other</Typography>
        </Box>
        <Box
          sx={{
            background: alpha(colors.accent2, 0.12),
            color: colors.accent2,
            px: 1, py: 0.4, borderRadius: 99,
            fontSize: 11, fontWeight: 600,
            display: 'inline-flex', alignItems: 'center', gap: 0.3,
          }}
        >
          <TrendingUpRoundedIcon sx={{ fontSize: 14 }} />
        </Box>
      </Stack>

      <Box sx={{ display: 'flex', height: 22, mt: 3, borderRadius: 99, overflow: 'hidden' }}>
        <Box sx={{ width: `${opShare}%`, background: `linear-gradient(90deg, ${colors.accent}, ${colors.accent2})`, transition: 'width 0.6s ease' }} />
        <Box sx={{ width: `${othShare}%`, background: alpha(colors.accent3, 0.7), transition: 'width 0.6s ease' }} />
      </Box>

      <Stack direction="row" justifyContent="space-between" sx={{ mt: 1.5, fontSize: 12 }}>
        <Stack>
          <Stack direction="row" alignItems="center" gap={0.75}>
            <Box sx={{ width: 8, height: 8, borderRadius: '2px', background: colors.accent }} />
            <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>Operating</Typography>
          </Stack>
          <Typography sx={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 13, mt: 0.5 }}>
            {PESO}{fmtMillions(c.opRev)}M
          </Typography>
          <Typography sx={{ fontSize: 11, color: colors.inkSoft }}>{opShare.toFixed(1)}%</Typography>
        </Stack>
        <Stack alignItems="flex-end">
          <Stack direction="row" alignItems="center" gap={0.75}>
            <Box sx={{ width: 8, height: 8, borderRadius: '2px', background: colors.accent3 }} />
            <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>Other</Typography>
          </Stack>
          <Typography sx={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 13, mt: 0.5 }}>
            {PESO}{fmtMillions(c.othRev)}M
          </Typography>
          <Typography sx={{ fontSize: 11, color: colors.inkSoft }}>{othShare.toFixed(1)}%</Typography>
        </Stack>
      </Stack>
    </CardShell>
  );
}

function CostBreakdown({ data }: TripleGridProps) {
  const colors = useColors();
  const c = data.inputs.current;
  const items = [
    { label: 'Power Purchased', value: c.power, icon: <BoltRoundedIcon sx={{ fontSize: 14 }} />, tone: colors.accent },
    { label: 'O&M Expense', value: c.om, icon: <BuildRoundedIcon sx={{ fontSize: 14 }} />, tone: colors.accent3 },
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
  const omDelta = data.inputs.current.om - data.inputs.prior.om;

  const toneColor: Record<string, string> = {
    green: colors.accent2,
    red: colors.danger,
    amber: colors.accent3,
    blue: colors.accent,
  };

  const events = [
    { icon: 'M', label: 'Margin shift', meta: `Total margin moved ${delta >= 0 ? 'up' : 'down'} this period`, value: `${delta >= 0 ? '+' : '−'}${PESO}${fmtMillions(Math.abs(delta))}M`, tone: delta >= 0 ? 'green' : 'red' },
    { icon: 'R', label: 'Revenue growth', meta: 'Operating revenue versus prior period', value: `${revDelta >= 0 ? '+' : '−'}${PESO}${fmtMillions(Math.abs(revDelta))}M`, tone: revDelta >= 0 ? 'green' : 'red' },
    { icon: 'O', label: 'O&M variance', meta: 'Operating & maintenance versus plan', value: `${omDelta >= 0 ? '+' : '−'}${PESO}${fmtMillions(Math.abs(omDelta))}M`, tone: omDelta > 0 ? 'amber' : 'green' },
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
