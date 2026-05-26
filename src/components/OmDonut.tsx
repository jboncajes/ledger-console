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

const R = 80, SW = 24, CX = 105, CY = 105;
const CIRCUMFERENCE = 2 * Math.PI * R;
const GAP = CIRCUMFERENCE * (2.5 / 360);

function buildSegs(values: number[], total: number) {
  let accumulated = 0;
  return values.map((value) => {
    const fraction = total > 0 ? value / total : 0;
    const arcLength = fraction * CIRCUMFERENCE;
    const dashLength = Math.max(0, arcLength - GAP);
    const offset = CIRCUMFERENCE / 4 - accumulated;
    accumulated += arcLength;
    return { fraction, dashLength, offset };
  });
}

function DonutSvg({
  segs, colors: segColors, total, label, isCurrent, inkColors,
}: {
  segs: ReturnType<typeof buildSegs>;
  colors: string[];
  total: number;
  label: string;
  isCurrent: boolean;
  inkColors: { ink: string; inkSoft: string; inkDim: string };
}) {
  return (
    <Stack alignItems="center" gap={0.75}>
      <Box
        component="svg"
        viewBox="0 0 210 210"
        sx={{ width: '100%', maxWidth: 200, height: 'auto', display: 'block', opacity: isCurrent ? 1 : 0.55 }}
      >
        <circle cx={CX} cy={CY} r={R} fill="none"
          stroke={alpha(inkColors.ink, 0.07)} strokeWidth={SW} />
        {segs.map((seg, i) => (
          <circle key={i}
            cx={CX} cy={CY} r={R}
            fill="none"
            stroke={segColors[i]}
            strokeWidth={SW}
            strokeDasharray={`${seg.dashLength} ${CIRCUMFERENCE - seg.dashLength}`}
            strokeDashoffset={seg.offset}
            strokeLinecap="butt"
          />
        ))}
        <text x={CX} y={CY - 8} textAnchor="middle" fontSize="8.5"
          fill={inkColors.inkSoft} fontFamily="Inter, sans-serif">Total Operating and Maintenance</text>
        <text x={CX} y={CY + 7} textAnchor="middle" fontSize="13" fontWeight="700"
          fill={isCurrent ? inkColors.ink : inkColors.inkDim}
          fontFamily="JetBrains Mono, monospace">
          {PESO}{fmtMillions(total)}M
        </text>
      </Box>
      <Typography sx={{
        fontSize: 11, fontWeight: isCurrent ? 600 : 400,
        color: isCurrent ? 'text.primary' : inkColors.inkSoft,
      }}>
        {label}
      </Typography>
    </Stack>
  );
}

export function OmDonut({ data }: Props) {
  const colors = useColors();
  const { cardRef, copyBtnRef, hovered, setHovered, copied, handleCopy } = useCopyCard();

  const pi = data.inputs.prior;
  const ci = data.inputs.current;
  const omPrior = data.prior.om;
  const omCurr  = data.current.om;
  const priorLabel = data.inputs.priorLabel;
  const currLabel  = data.inputs.currentLabel;

  const SEGMENTS = [
    { key: 'distrib' as const, label: 'Distribution',   color: colors.accent  },
    { key: 'supply'  as const, label: 'Supply',          color: colors.accent2 },
    { key: 'meter'   as const, label: 'Metering',        color: colors.accent3 },
    { key: 'adg'     as const, label: 'Admin & General', color: colors.danger  },
  ];

  const segColors = SEGMENTS.map((s) => s.color);
  const priorVals = SEGMENTS.map((s) => pi[s.key]);
  const currVals  = SEGMENTS.map((s) => ci[s.key]);

  const priorSegs = buildSegs(priorVals, omPrior);
  const currSegs  = buildSegs(currVals,  omCurr);

  const inkColors = { ink: colors.ink, inkSoft: colors.inkSoft, inkDim: colors.inkDim };

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

      <Typography sx={{ fontFamily: '"Instrument Serif", serif', fontSize: { xs: 18, sm: 22 }, letterSpacing: '-0.3px' }}>
        Operating and Maintenance Composition
      </Typography>
      <Typography sx={{ fontSize: 12.5, color: 'text.secondary', mt: 0.5 }}>
        Component share · {priorLabel} vs {currLabel}
      </Typography>

      {/* Side-by-side donuts */}
      <Stack direction="row" justifyContent="center" gap={{ xs: 2, sm: 4 }} sx={{ mt: 2.5 }}>
        <DonutSvg segs={priorSegs} colors={segColors} total={omPrior}
          label={priorLabel} isCurrent={false} inkColors={inkColors} />
        <DonutSvg segs={currSegs} colors={segColors} total={omCurr}
          label={currLabel} isCurrent inkColors={inkColors} />
      </Stack>

      {/* Comparison legend */}
      <Stack gap={1.25} sx={{ mt: 2.5, pt: 2, borderTop: `1px solid ${colors.border}` }}>
        {/* Column headers */}
        <Stack direction="row" alignItems="center">
          <Box sx={{ flex: 1 }} />
          <Typography sx={{ fontSize: 10.5, color: colors.inkSoft, width: 46, textAlign: 'right' }}>
            {priorLabel.split(' ')[0]}
          </Typography>
          <Box sx={{ width: 20 }} />
          <Typography sx={{ fontSize: 10.5, fontWeight: 600, color: colors.ink, width: 46, textAlign: 'right' }}>
            {currLabel.split(' ')[0]}
          </Typography>
          <Box sx={{ width: 80 }} />
        </Stack>

        {SEGMENTS.map((seg, i) => {
          const priorPct = omPrior > 0 ? (priorVals[i] / omPrior) * 100 : 0;
          const currPct  = omCurr  > 0 ? (currVals[i]  / omCurr)  * 100 : 0;
          const delta    = currVals[i] - priorVals[i];
          const isGood   = delta <= 0;
          const deltaColor = delta === 0 ? colors.inkSoft : isGood ? colors.accent2 : colors.danger;

          return (
            <Stack key={seg.key} direction="row" alignItems="center" gap={0}>
              <Stack direction="row" alignItems="center" gap={0.75} sx={{ flex: 1, minWidth: 0 }}>
                <Box sx={{ width: 9, height: 9, borderRadius: '3px', background: seg.color, flexShrink: 0 }} />
                <Typography sx={{ fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {seg.label}
                </Typography>
              </Stack>
              <Typography sx={{ fontSize: 11.5, color: colors.inkSoft, fontFamily: '"JetBrains Mono", monospace', width: 46, textAlign: 'right' }}>
                {priorPct.toFixed(1)}%
              </Typography>
              <Typography sx={{ fontSize: 11, color: colors.borderStrong, width: 20, textAlign: 'center' }}>→</Typography>
              <Typography sx={{ fontSize: 12, fontWeight: 600, fontFamily: '"JetBrains Mono", monospace', width: 46, textAlign: 'right' }}>
                {currPct.toFixed(1)}%
              </Typography>
              <Box sx={{
                ml: 1, px: 0.75, py: 0.1, borderRadius: '5px', flexShrink: 0, width: 72,
                background: alpha(deltaColor, 0.12), color: deltaColor,
                fontSize: 10.5, fontWeight: 600, fontFamily: '"JetBrains Mono", monospace',
                textAlign: 'center',
              }}>
                {delta === 0 ? '—' : `${delta > 0 ? '▲' : '▼'} ${PESO}${fmtMillions(Math.abs(delta))}M`}
              </Box>
            </Stack>
          );
        })}
      </Stack>
    </Box>
  );
}
