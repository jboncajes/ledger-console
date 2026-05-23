import { Box, Stack, Typography, alpha, keyframes } from '@mui/material';
import type { DsmPeriodComputed } from '../types/pnl';
import { useColors } from '../theme/theme';
import { fmtMillions, fmtPctDelta, PESO } from '../utils/format';

const rise = keyframes`
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
`;

interface Props { data: DsmPeriodComputed; }

function BarChart({ prior, curr, priorColor, currColor, priorLabel, currLabel }: {
  prior: number; curr: number;
  priorColor: string; currColor: string;
  priorLabel: string; currLabel: string;
}) {
  const maxV  = Math.max(Math.abs(prior), Math.abs(curr), 1);
  const BAR_H = 80, BASE = 96;
  const pH = Math.max(4, (Math.abs(prior) / maxV) * BAR_H);
  const cH = Math.max(4, (Math.abs(curr)  / maxV) * BAR_H);
  const pgId = `dsm-p-${priorColor}`;
  const cgId = `dsm-c-${currColor}`;
  return (
    <svg width="100%" height="120" viewBox="0 0 260 120" preserveAspectRatio="xMidYMid meet">
      <defs>
        <linearGradient id={pgId} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={priorColor} stopOpacity="0.55" />
          <stop offset="100%" stopColor={priorColor} stopOpacity="0.25" />
        </linearGradient>
        <linearGradient id={cgId} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={currColor} stopOpacity="1" />
          <stop offset="100%" stopColor={currColor} stopOpacity="0.6" />
        </linearGradient>
      </defs>
      <rect x="22"  y={BASE - pH} width="96" height={pH} rx="7" fill={`url(#${pgId})`} />
      <text x="70"  y={BASE - pH - 7}  textAnchor="middle" fontFamily="JetBrains Mono, monospace" fontSize="14" fill={priorColor} opacity="0.85">{fmtMillions(prior)}M</text>
      <text x="70"  y="114" textAnchor="middle" fontFamily="Inter, sans-serif" fontSize="13" fill={priorColor} opacity="0.7">{priorLabel}</text>
      <rect x="142" y={BASE - cH} width="96" height={cH} rx="7" fill={`url(#${cgId})`} />
      <text x="190" y={BASE - cH - 7}  textAnchor="middle" fontFamily="JetBrains Mono, monospace" fontSize="14" fill={currColor}>{fmtMillions(curr)}M</text>
      <text x="190" y="114" textAnchor="middle" fontFamily="Inter, sans-serif" fontSize="13" fill={currColor} opacity="0.85">{currLabel}</text>
      <line x1="10" x2="250" y1={BASE} y2={BASE} stroke={currColor} strokeWidth="1.5" opacity="0.18" />
    </svg>
  );
}

function KpiCard({ label, curr, prior, inverseGood = false, color, delay, chart }: {
  label: string; curr: number; prior: number;
  inverseGood?: boolean; color: string; delay: number;
  chart: React.ReactNode;
}) {
  const colors = useColors();
  const delta = curr - prior;
  const deltaText = fmtPctDelta(curr, prior);
  let deltaColor = colors.accent2;
  if (delta === 0) deltaColor = colors.inkSoft;
  else if (inverseGood) deltaColor = delta > 0 ? colors.danger : colors.accent2;
  else deltaColor = delta >= 0 ? colors.accent2 : colors.danger;

  return (
    <Box sx={{
      background: colors.panel,
      border: `1px solid ${colors.border}`,
      borderRadius: '18px',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      p: 3.25,
      animation: `${rise} 0.6s ease both`,
      animationDelay: `${delay}s`,
      boxShadow: `0 20px 60px -20px ${alpha(colors.ink, 0.15)}`,
      transition: 'transform 0.25s, box-shadow 0.25s',
      '&:hover': { transform: 'translateY(-2px)', boxShadow: `0 30px 80px -30px ${alpha(colors.ink, 0.2)}` },
    }}>
      <Typography sx={{ fontSize: 11.5, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '1.2px', fontWeight: 500, mb: 1.75 }}>
        {label}
      </Typography>
      <Box sx={{ fontFamily: '"Instrument Serif", serif', fontSize: 52, lineHeight: 1, letterSpacing: '-1px', mb: 1.25 }}>
        <Box component="span" sx={{ fontSize: 22, color: 'text.secondary', mr: 0.5, fontFamily: 'inherit' }}>{PESO}</Box>
        {fmtMillions(curr)}
        <Box component="span" sx={{ fontSize: 28, color: 'text.secondary' }}>M</Box>
      </Box>
      <Stack direction="row" alignItems="center" gap={1.25} sx={{ mb: 2.5 }}>
        <Box component="span" sx={{
          display: 'inline-flex', alignItems: 'center', gap: 0.4,
          px: 0.9, py: 0.25, borderRadius: '6px', fontWeight: 600,
          fontSize: 11.5, fontFamily: '"JetBrains Mono", monospace',
          background: alpha(deltaColor, 0.12), color: deltaColor,
        }}>
          {deltaText}
        </Box>
        <Typography component="span" sx={{ color: colors.inkSoft, fontSize: 11.5 }}>
          vs prior · {PESO}{fmtMillions(prior)}M
        </Typography>
      </Stack>
      <Box sx={{ width: '100%', mb: 1.75 }}>{chart}</Box>
      <Box sx={{ height: 8, borderRadius: 99, background: `linear-gradient(90deg, ${color}, ${alpha(color, 0.3)})` }} />
    </Box>
  );
}

export function DsmKpiGrid({ data }: Props) {
  const colors = useColors();
  const { prior, current, inputs } = data;
  const pl = inputs.priorLabel.split(' ')[0];
  const cl = inputs.currentLabel.split(' ')[0];

  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2, '@media (max-width: 900px)': { gridTemplateColumns: '1fr' } }}>
      <KpiCard
        label="Total DSM Revenue" curr={current.totalRev} prior={prior.totalRev}
        color={colors.accent2} delay={0.05}
        chart={<BarChart prior={prior.totalRev} curr={current.totalRev} priorColor={colors.accent2} currColor={colors.accent2} priorLabel={pl} currLabel={cl} />}
      />
      <KpiCard
        label="Total DSM Expenses" curr={current.totalExp} prior={prior.totalExp}
        inverseGood color={colors.danger} delay={0.1}
        chart={<BarChart prior={prior.totalExp} curr={current.totalExp} priorColor={colors.danger} currColor={colors.danger} priorLabel={pl} currLabel={cl} />}
      />
      <KpiCard
        label="Net Savings" curr={current.netSavings} prior={prior.netSavings}
        color={current.netSavings >= 0 ? colors.accent : colors.danger} delay={0.15}
        chart={<BarChart prior={prior.netSavings} curr={current.netSavings} priorColor={colors.accent} currColor={current.netSavings >= 0 ? colors.accent : colors.danger} priorLabel={pl} currLabel={cl} />}
      />
    </Box>
  );
}
