import { Box, IconButton, Stack, Typography, alpha } from '@mui/material';
import ContentCopyRoundedIcon from '@mui/icons-material/ContentCopyRounded';
import CheckRoundedIcon from '@mui/icons-material/CheckRounded';
import type { DsmPeriodComputed } from '../types/pnl';
import { useColors } from '../theme/theme';
import { fmtMillions, PESO } from '../utils/format';
import { useCopyCard } from '../hooks/useCopyCard';

interface Props { data: DsmPeriodComputed; }

function Delta({ delta, prior }: { delta: number; prior: number }) {
  const colors = useColors();
  const pct = Math.abs(prior) > 0 ? (Math.abs(delta) / Math.abs(prior)) * 100 : 0;
  const isZero = delta === 0;
  const color = isZero ? colors.inkSoft : delta > 0 ? colors.danger : colors.accent2;
  return (
    <Box sx={{
      display: 'inline-flex', alignItems: 'center', gap: 0.4,
      px: 0.9, py: 0.25, borderRadius: '6px', flexShrink: 0,
      fontSize: 11, fontWeight: 600, fontFamily: '"JetBrains Mono", monospace',
      background: alpha(color, 0.12), color,
    }}>
      {isZero ? '—' : delta > 0 ? '▲' : '▼'}
      {!isZero && ` ${PESO}${fmtMillions(Math.abs(delta))}M (${pct.toFixed(1)}%)`}
    </Box>
  );
}

function MetricRow({ label, currValue, priorValue, currLabel, priorLabel, scale, color }: {
  label: string; currValue: number; priorValue: number;
  currLabel: string; priorLabel: string; scale: number; color: string;
}) {
  const colors = useColors();
  const pctCurr  = scale > 0 ? Math.min((currValue  / scale) * 100, 100) : 0;
  const pctPrior = scale > 0 ? Math.min((priorValue / scale) * 100, 100) : 0;
  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
        <Typography sx={{ fontSize: 13, fontWeight: 500 }}>{label}</Typography>
        <Delta delta={currValue - priorValue} prior={priorValue} />
      </Stack>
      <Stack direction="row" alignItems="center" gap={1.5} mb={0.75}>
        <Typography sx={{ fontSize: 11, fontWeight: 600, color: colors.ink, width: 90, flexShrink: 0 }}>{currLabel}</Typography>
        <Box sx={{ flex: 1, height: 22, background: alpha(colors.ink, 0.06), borderRadius: 99, overflow: 'hidden' }}>
          <Box sx={{ height: '100%', width: `${pctCurr}%`, borderRadius: 99, background: `linear-gradient(90deg, ${color}, ${alpha(color, 0.65)})`, transition: 'width 0.6s ease' }} />
        </Box>
        <Typography sx={{ fontSize: 12.5, fontFamily: '"JetBrains Mono", monospace', width: 80, textAlign: 'right', flexShrink: 0, fontWeight: 600 }}>
          {PESO}{fmtMillions(currValue)}M
        </Typography>
      </Stack>
      <Stack direction="row" alignItems="center" gap={1.5}>
        <Typography sx={{ fontSize: 11, color: colors.inkSoft, width: 90, flexShrink: 0 }}>{priorLabel}</Typography>
        <Box sx={{ flex: 1, height: 14, background: alpha(colors.ink, 0.05), borderRadius: 99, overflow: 'hidden' }}>
          <Box sx={{ height: '100%', width: `${pctPrior}%`, borderRadius: 99, background: alpha(color, 0.3), transition: 'width 0.6s ease' }} />
        </Box>
        <Typography sx={{ fontSize: 12, fontFamily: '"JetBrains Mono", monospace', width: 80, textAlign: 'right', flexShrink: 0, color: 'text.secondary' }}>
          {PESO}{fmtMillions(priorValue)}M
        </Typography>
      </Stack>
    </Box>
  );
}

export function DsmRevenueBreakdown({ data }: Props) {
  const colors = useColors();
  const { cardRef, copyBtnRef, hovered, setHovered, copied, handleCopy } = useCopyCard();
  const pi = data.inputs.prior;
  const ci = data.inputs.current;
  const pl = data.inputs.priorLabel;
  const cl = data.inputs.currentLabel;

  const ROWS = [
    { label: 'Distribution',           curr: ci.distribRev,    prior: pi.distribRev,    color: colors.accent  },
    { label: 'Supply',                  curr: ci.supplyRev,     prior: pi.supplyRev,     color: colors.accent2 },
    { label: 'Metering',                curr: ci.meterRev,      prior: pi.meterRev,      color: colors.accent3 },
    { label: 'Other Operating',         curr: ci.otherOpRev,    prior: pi.otherOpRev,    color: colors.inkDim  },
    { label: 'Other Non-Operating',     curr: ci.otherNonOpRev, prior: pi.otherNonOpRev, color: colors.inkSoft },
  ];
  const scale = Math.max(...ROWS.flatMap((r) => [r.curr, r.prior]), 1);

  return (
    <Box
      ref={cardRef}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      sx={{ position: 'relative', background: colors.panel, border: `1px solid ${colors.border}`, borderRadius: '18px', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', p: 3, boxShadow: `0 20px 60px -20px ${alpha(colors.ink, 0.15)}` }}
    >
      <IconButton ref={copyBtnRef} onClick={handleCopy} onMouseEnter={(e) => e.stopPropagation()} size="small"
        sx={{ position: 'absolute', top: 12, right: 12, width: 28, height: 28, opacity: hovered ? 1 : 0, pointerEvents: hovered ? 'auto' : 'none', transition: 'opacity 0.18s', background: alpha(colors.panel, 0.95), border: `1px solid ${colors.border}`, borderRadius: '8px', zIndex: 1, '&:hover': { background: alpha(colors.ink, 0.08), borderColor: colors.borderStrong } }}>
        {copied ? <CheckRoundedIcon sx={{ fontSize: 13, color: colors.accent2 }} /> : <ContentCopyRoundedIcon sx={{ fontSize: 13 }} />}
      </IconButton>
      <Typography sx={{ fontFamily: '"Instrument Serif", serif', fontSize: { xs: 18, sm: 22 }, letterSpacing: '-0.3px' }}>Revenue Breakdown</Typography>
      <Typography sx={{ fontSize: 12.5, color: 'text.secondary', mt: 0.5 }}>{pl} vs {cl} · DSM revenue components</Typography>
      <Stack gap={3} sx={{ mt: 3 }}>
        {ROWS.map((r) => <MetricRow key={r.label} label={r.label} currValue={r.curr} priorValue={r.prior} currLabel={cl} priorLabel={pl} scale={scale} color={r.color} />)}
      </Stack>
    </Box>
  );
}

export function DsmExpenseBreakdown({ data }: Props) {
  const colors = useColors();
  const { cardRef, copyBtnRef, hovered, setHovered, copied, handleCopy } = useCopyCard();
  const pi = data.inputs.prior;
  const ci = data.inputs.current;
  const pl = data.inputs.priorLabel;
  const cl = data.inputs.currentLabel;

  const ROWS = [
    { label: 'Distribution',           curr: ci.distribExp, prior: pi.distribExp, color: colors.accent  },
    { label: 'Supply',                  curr: ci.supplyExp,  prior: pi.supplyExp,  color: colors.accent2 },
    { label: 'Metering',                curr: ci.meterExp,   prior: pi.meterExp,   color: colors.accent3 },
    { label: 'Admin & General',         curr: ci.adgExp,     prior: pi.adgExp,     color: colors.danger  },
  ];
  const scale = Math.max(...ROWS.flatMap((r) => [r.curr, r.prior]), 1);

  return (
    <Box
      ref={cardRef}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      sx={{ position: 'relative', background: colors.panel, border: `1px solid ${colors.border}`, borderRadius: '18px', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', p: 3, boxShadow: `0 20px 60px -20px ${alpha(colors.ink, 0.15)}` }}
    >
      <IconButton ref={copyBtnRef} onClick={handleCopy} onMouseEnter={(e) => e.stopPropagation()} size="small"
        sx={{ position: 'absolute', top: 12, right: 12, width: 28, height: 28, opacity: hovered ? 1 : 0, pointerEvents: hovered ? 'auto' : 'none', transition: 'opacity 0.18s', background: alpha(colors.panel, 0.95), border: `1px solid ${colors.border}`, borderRadius: '8px', zIndex: 1, '&:hover': { background: alpha(colors.ink, 0.08), borderColor: colors.borderStrong } }}>
        {copied ? <CheckRoundedIcon sx={{ fontSize: 13, color: colors.accent2 }} /> : <ContentCopyRoundedIcon sx={{ fontSize: 13 }} />}
      </IconButton>
      <Typography sx={{ fontFamily: '"Instrument Serif", serif', fontSize: { xs: 18, sm: 22 }, letterSpacing: '-0.3px' }}>Expense Breakdown</Typography>
      <Typography sx={{ fontSize: 12.5, color: 'text.secondary', mt: 0.5 }}>{pl} vs {cl} · DSM expense components</Typography>
      <Stack gap={3} sx={{ mt: 3 }}>
        {ROWS.map((r) => <MetricRow key={r.label} label={r.label} currValue={r.curr} priorValue={r.prior} currLabel={cl} priorLabel={pl} scale={scale} color={r.color} />)}
      </Stack>
    </Box>
  );
}
