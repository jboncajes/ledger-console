import { useState } from 'react';
import { Box, IconButton, Stack, Typography, alpha } from '@mui/material';
import ContentCopyRoundedIcon from '@mui/icons-material/ContentCopyRounded';
import CheckRoundedIcon from '@mui/icons-material/CheckRounded';
import type { SlMonthRecord } from '../types/pnl';
import { useColors } from '../theme/theme';
import { fmtMillions, PESO } from '../utils/format';
import { computeSlValues } from '../utils/sl';
import { useCopyCard } from '../hooks/useCopyCard';

const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

interface BarChartProps {
  months: SlMonthRecord[];
  year: number;
  title: string;
  subtitle: string;
  getValue: (m: SlMonthRecord) => number;
  color: string;
}

function SlBarChart({ months, year, title, subtitle, getValue, color }: BarChartProps) {
  const colors = useColors();
  const [hover, setHover] = useState<number | null>(null);
  const { cardRef, copyBtnRef, hovered, setHovered, copied, handleCopy } = useCopyCard();

  const sorted = [...months].sort((a, b) => a.month - b.month);
  const points = sorted.map((m) => ({
    label: MONTH_SHORT[m.month - 1],
    fullLabel: m.label.split(' ')[0],
    value: m.inputs.kwhPurchased > 0 ? getValue(m) : null,
  }));

  const W = 560, H = 260, PX = 58, PT = 20, PB = 36;
  const cW = W - PX * 2;
  const cH = H - PT - PB;

  const vals = points.map((p) => p.value ?? 0);
  const minY = Math.min(0, ...vals);
  const maxY = Math.max(0, ...vals, 1);
  const yRange = maxY - minY || 1;

  const yS = (v: number) => PT + cH - ((v - minY) / yRange) * cH;
  const zeroY = yS(0);

  const barW = (cW / Math.max(points.length, 1)) * 0.65;
  const xS = (i: number) => PX + (i + 0.5) * (cW / Math.max(points.length, 1));

  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((t) => ({
    t,
    val: minY + (1 - t) * yRange,
    y: PT + cH * t,
  }));

  const hp = hover !== null ? points[hover] : null;

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
        sx={{ position: 'absolute', top: 12, right: 12, width: 28, height: 28, opacity: hovered ? 1 : 0, pointerEvents: hovered ? 'auto' : 'none', transition: 'opacity 0.18s', background: alpha(colors.panel, 0.95), border: `1px solid ${colors.border}`, borderRadius: '8px', zIndex: 1, '&:hover': { background: alpha(colors.ink, 0.08), borderColor: colors.borderStrong } }}>
        {copied ? <CheckRoundedIcon sx={{ fontSize: 13, color: colors.accent2 }} /> : <ContentCopyRoundedIcon sx={{ fontSize: 13 }} />}
      </IconButton>

      <Box>
        <Typography sx={{ fontFamily: '"Instrument Serif", serif', fontSize: { xs: 16, sm: 20 }, letterSpacing: '-0.3px' }}>
          {title}{' '}
          <Box component="em" sx={{ fontStyle: 'italic', color, fontSize: { xs: 14, sm: 17 } }}>· {year}</Box>
        </Typography>
        <Typography sx={{ fontSize: 12, color: 'text.secondary', mt: 0.5 }}>{subtitle}</Typography>
      </Box>

      {/* Hover tooltip */}
      <Box sx={{ minHeight: 36, mt: 1.5, mb: 0.5, px: 1.5, py: hp?.value != null ? 1 : 0, borderRadius: '10px', border: hp?.value != null ? `1px solid ${alpha(color, 0.2)}` : '1px solid transparent', background: hp?.value != null ? alpha(color, 0.06) : 'transparent', transition: 'all 0.18s ease' }}>
        {hp?.value != null && (
          <Stack direction="row" gap={2} alignItems="center">
            <Typography sx={{ fontSize: 12.5, fontWeight: 600, fontFamily: '"Instrument Serif", serif' }}>{hp.fullLabel} {year}</Typography>
            <Stack direction="row" alignItems="center" gap={0.75}>
              <Box sx={{ width: 7, height: 7, borderRadius: '50%', background: color }} />
              <Typography sx={{ fontSize: 11.5, fontFamily: '"JetBrains Mono", monospace', fontWeight: 600, color: hp.value < 0 ? colors.danger : color }}>
                {hp.value < 0 ? '−' : ''}{PESO}{fmtMillions(Math.abs(hp.value))}M
              </Typography>
            </Stack>
          </Stack>
        )}
      </Box>

      <Box sx={{ overflowX: 'auto', overflowY: 'hidden' }}>
        <Box component="svg" viewBox={`0 0 ${W} ${H}`}
          sx={{ display: 'block', minWidth: W, width: '100%', height: H }}
          onMouseLeave={() => setHover(null)}>

          {/* Y gridlines */}
          {yTicks.map(({ t, val, y }) => (
            <g key={t}>
              <line x1={PX} x2={W - PX} y1={y} y2={y} stroke={alpha(colors.ink, 0.06)} strokeWidth="1" />
              <text x={PX - 6} y={y + 4} textAnchor="end" fontSize="9.5"
                fill={colors.inkDim} fontFamily="JetBrains Mono, monospace">
                {val < 0 ? '−' : ''}{PESO}{fmtMillions(Math.abs(val))}M
              </text>
            </g>
          ))}

          {/* Zero baseline */}
          {minY < 0 && (
            <line x1={PX} x2={W - PX} y1={zeroY} y2={zeroY}
              stroke={alpha(colors.ink, 0.2)} strokeWidth="1" strokeDasharray="6 3" />
          )}

          {/* Bars */}
          {points.map((p, i) => {
            if (p.value === null) return null;
            const isNeg = p.value < 0;
            const barH = Math.abs(yS(p.value) - zeroY);
            const barY = isNeg ? zeroY : yS(p.value);
            const barColor = isNeg ? colors.danger : color;
            const isHovered = hover === i;
            return (
              <rect key={i}
                x={xS(i) - barW / 2} y={barY}
                width={barW} height={Math.max(barH, 2)}
                rx="3" ry="3"
                fill={alpha(barColor, isHovered ? 0.9 : 0.7)}
                style={{ transition: 'fill 0.15s' }}
              />
            );
          })}

          {/* Hover hit areas */}
          {points.map((p, i) => {
            if (p.value === null) return null;
            const slotW = cW / Math.max(points.length, 1);
            return (
              <rect key={i}
                x={xS(i) - slotW / 2} y={PT}
                width={slotW} height={cH + PB}
                fill="transparent" style={{ cursor: 'crosshair' }}
                onMouseEnter={() => setHover(i)}
              />
            );
          })}

          {/* X labels */}
          {points.map((p, i) => (
            <text key={i} x={xS(i)} y={H - 6} textAnchor="middle" fontSize="10.5"
              fill={hover === i ? color : colors.inkDim}
              fontFamily="Inter, sans-serif"
              style={{ transition: 'fill 0.15s', fontWeight: hover === i ? 600 : 400 }}>
              {p.label}
            </text>
          ))}
        </Box>
      </Box>
    </Box>
  );
}

interface Props {
  months: SlMonthRecord[];
  year: number;
}

export function SlForgoneChart({ months, year }: Props) {
  const colors = useColors();
  return (
    <SlBarChart
      months={months}
      year={year}
      title="Monthly Foregone Revenue"
      subtitle="Revenue foregone due to SL exceeding the cap"
      getValue={(m) => computeSlValues(m.inputs).foregoneRevenuePesos}
      color={colors.accent3 ?? '#F59E0B'}
    />
  );
}

export function SlSystemLossChart({ months, year }: Props) {
  const colors = useColors();
  return (
    <SlBarChart
      months={months}
      year={year}
      title="Monthly System Loss"
      subtitle="System loss in pesos for the period"
      getValue={(m) => computeSlValues(m.inputs).systemLossPesos}
      color={colors.danger}
    />
  );
}
