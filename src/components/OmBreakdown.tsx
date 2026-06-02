import { Box, IconButton, Stack, Typography, alpha } from '@mui/material';
import ContentCopyRoundedIcon from '@mui/icons-material/ContentCopyRounded';
import CheckRoundedIcon from '@mui/icons-material/CheckRounded';
import type { PnlComputed } from '../types/pnl';
import { useColors } from '../theme/theme';
import { fmtMillions, PESO } from '../utils/format';
import { useCopyCard } from '../hooks/useCopyCard';

interface Props {
  data: PnlComputed;
}

function Delta({ delta, prior, inverseGood = false }: { delta: number; prior: number; inverseGood?: boolean }) {
  const colors = useColors();
  const pct = Math.abs(prior) > 0 ? (Math.abs(delta) / Math.abs(prior)) * 100 : 0;
  const isZero = delta === 0;
  const isGood = inverseGood ? delta <= 0 : delta >= 0;
  const color = isZero ? colors.inkSoft : isGood ? colors.accent2 : colors.danger;
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
  currLabel: string; priorLabel: string;
  scale: number; color: string;
}) {
  const colors = useColors();
  const pctCurr  = scale > 0 ? Math.min((currValue  / scale) * 100, 100) : 0;
  const pctPrior = scale > 0 ? Math.min((priorValue / scale) * 100, 100) : 0;

  const singleMonth = !priorLabel;
  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1.25}>
        <Typography sx={{ fontSize: 13, fontWeight: 500 }}>{label}</Typography>
        {!singleMonth && <Delta delta={currValue - priorValue} prior={priorValue} inverseGood />}
      </Stack>

      <Stack direction="row" alignItems="center" gap={1.5} mb={singleMonth ? 0 : 0.75}>
        <Typography sx={{ fontSize: 11, fontWeight: 600, color: colors.ink, width: 90, flexShrink: 0 }}>
          {currLabel}
        </Typography>
        <Box sx={{ flex: 1, height: 22, background: alpha(colors.ink, 0.06), borderRadius: 99, overflow: 'hidden' }}>
          <Box sx={{
            height: '100%', width: `${pctCurr}%`, borderRadius: 99,
            background: `linear-gradient(90deg, ${color}, ${alpha(color, 0.65)})`,
            transition: 'width 0.6s ease',
          }} />
        </Box>
        <Typography sx={{ fontSize: 12.5, fontFamily: '"JetBrains Mono", monospace', width: 80, textAlign: 'right', flexShrink: 0, fontWeight: 600 }}>
          {PESO}{fmtMillions(currValue)}M
        </Typography>
      </Stack>

      {!singleMonth && (
        <Stack direction="row" alignItems="center" gap={1.5}>
          <Typography sx={{ fontSize: 11, color: colors.inkSoft, width: 90, flexShrink: 0 }}>
            {priorLabel}
          </Typography>
          <Box sx={{ flex: 1, height: 14, background: alpha(colors.ink, 0.05), borderRadius: 99, overflow: 'hidden' }}>
            <Box sx={{
              height: '100%', width: `${pctPrior}%`, borderRadius: 99,
              background: alpha(color, 0.3),
              transition: 'width 0.6s ease',
            }} />
          </Box>
          <Typography sx={{ fontSize: 12, fontFamily: '"JetBrains Mono", monospace', width: 80, textAlign: 'right', flexShrink: 0, color: 'text.secondary' }}>
            {PESO}{fmtMillions(priorValue)}M
          </Typography>
        </Stack>
      )}
    </Box>
  );
}

export function OmBreakdown({ data }: Props) {
  const colors = useColors();
  const { cardRef, copyBtnRef, hovered, setHovered, copied, handleCopy } = useCopyCard();

  const pi = data.inputs.prior;
  const ci = data.inputs.current;
  const priorLabel = data.inputs.priorLabel;
  const currLabel  = data.inputs.currentLabel;

  const omPrior = data.prior.om;
  const omCurr  = data.current.om;
  const omDelta = omCurr - omPrior;
  const omPct   = Math.abs(omPrior) > 0 ? (Math.abs(omDelta) / Math.abs(omPrior)) * 100 : 0;

  const ROWS = [
    { key: 'distrib', label: 'Distribution',        curr: ci.distrib, prior: pi.distrib, color: colors.accent  },
    { key: 'supply',  label: 'Supply',               curr: ci.supply,  prior: pi.supply,  color: colors.accent2 },
    { key: 'meter',   label: 'Metering',             curr: ci.meter,   prior: pi.meter,   color: colors.accent3 },
    { key: 'adg',     label: 'Admin & General',      curr: ci.adg,     prior: pi.adg,     color: colors.danger  },
  ];

  const scale = Math.max(...ROWS.flatMap((r) => [r.curr, r.prior]), 1);

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
        p: 3,
        boxShadow: `0 20px 60px -20px ${alpha(colors.ink, 0.15)}`,
      }}
    >
      <IconButton ref={copyBtnRef} onClick={handleCopy} onMouseEnter={(e) => e.stopPropagation()} size="small"
        sx={{
          position: 'absolute', top: 12, right: 12, width: 28, height: 28,
          opacity: hovered ? 1 : 0, pointerEvents: hovered ? 'auto' : 'none',
          transition: 'opacity 0.18s', background: alpha(colors.panel, 0.95),
          border: `1px solid ${colors.border}`, borderRadius: '8px', zIndex: 1,
          '&:hover': { background: alpha(colors.ink, 0.08), borderColor: colors.borderStrong },
        }}>
        {copied ? <CheckRoundedIcon sx={{ fontSize: 13, color: colors.accent2 }} /> : <ContentCopyRoundedIcon sx={{ fontSize: 13 }} />}
      </IconButton>

      {/* Header */}
      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems="flex-start" gap={1}>
        <Box>
          <Typography sx={{ fontFamily: '"Instrument Serif", serif', fontSize: { xs: 18, sm: 22 }, letterSpacing: '-0.3px' }}>
            Operating and Maintenance Breakdown
          </Typography>
          <Typography sx={{ fontSize: 12.5, color: 'text.secondary', mt: 0.5 }}>
            Operating and Maintenance components{priorLabel ? ' · period comparison' : ''}
          </Typography>
        </Box>
        <Stack alignItems={{ xs: 'flex-start', sm: 'flex-end' }} gap={0.3} sx={{ flexShrink: 0, pt: { sm: 0.5 } }}>
          <Box sx={{
            display: 'inline-flex', alignItems: 'center', gap: 0.5,
            px: 1.25, py: 0.4, borderRadius: '8px', fontSize: 13, fontWeight: 700,
            fontFamily: '"JetBrains Mono", monospace',
            background: omDelta <= 0 ? alpha(colors.accent2, 0.12) : alpha(colors.danger, 0.12),
            color: omDelta <= 0 ? colors.accent2 : colors.danger,
          }}>
            {omDelta <= 0 ? '▼' : '▲'} {PESO}{fmtMillions(Math.abs(omDelta))}M ({omPct.toFixed(1)}%)
          </Box>
          <Typography sx={{ fontSize: 10.5, color: colors.inkSoft }}>total O&M change</Typography>
        </Stack>
      </Stack>

      {/* Color legend */}
      <Stack direction="row" gap={1.5} flexWrap="wrap" sx={{ mt: 1.5 }}>
        {ROWS.map((r) => (
          <Stack key={r.key} direction="row" alignItems="center" gap={0.6} sx={{ fontSize: 11, color: 'text.secondary' }}>
            <Box sx={{ width: 10, height: 10, borderRadius: '3px', background: r.color }} />
            <span>{r.label}</span>
          </Stack>
        ))}
      </Stack>

      {/* Metric rows */}
      <Stack gap={3} sx={{ mt: 2.5 }}>
        {ROWS.map((r) => (
          <MetricRow
            key={r.key}
            label={r.label}
            currValue={r.curr} priorValue={r.prior}
            currLabel={currLabel} priorLabel={priorLabel}
            scale={scale} color={r.color}
          />
        ))}
      </Stack>

      {/* Total Operating and Maintenance footer */}
      <Box sx={{ mt: 3, pt: 2.5, borderTop: `1px solid ${colors.border}` }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography sx={{ fontSize: 12.5, color: 'text.secondary' }}>
            Total Operating and Maintenance
          </Typography>
          <Stack direction="row" gap={1.5} alignItems="center">
            <Stack alignItems="flex-end">
              <Typography sx={{ fontSize: 10.5, color: colors.inkSoft }}>{priorLabel}</Typography>
              <Typography sx={{ fontSize: 13.5, fontFamily: '"JetBrains Mono", monospace', color: colors.inkDim }}>
                {PESO}{fmtMillions(omPrior)}M
              </Typography>
            </Stack>
            <Typography sx={{ fontSize: 14, color: colors.borderStrong, mt: 1.5 }}>→</Typography>
            <Stack alignItems="flex-end">
              <Typography sx={{ fontSize: 10.5, fontWeight: 600, color: colors.ink }}>{currLabel}</Typography>
              <Typography sx={{
                fontSize: 13.5, fontFamily: '"JetBrains Mono", monospace', fontWeight: 700,
                color: omDelta <= 0 ? colors.accent2 : colors.danger,
              }}>
                {PESO}{fmtMillions(omCurr)}M
              </Typography>
            </Stack>
          </Stack>
        </Stack>
      </Box>
    </Box>
  );
}
