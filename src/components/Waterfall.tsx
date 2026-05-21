import { useState } from 'react';
import { Box, Stack, Typography, alpha } from '@mui/material';
import type { PnlComputed } from '../types/pnl';
import { useColors } from '../theme/theme';
import { fmtAbsDelta, fmtMillions, PESO } from '../utils/format';

interface WaterfallProps {
  data: PnlComputed;
}

interface Step {
  label: string;
  value: number;
  kind: 'inflow' | 'outflow' | 'subtotal';
  runningTo: number;
  description: string;
}

function buildSteps(data: PnlComputed): Step[] {
  const c = data.inputs.current;
  const totalRev = c.opRev + c.othRev;
  const opMargin = totalRev - c.power - c.om;
  const netOpMargin = opMargin - c.deprec - c.interest;
  const netMargin = netOpMargin + c.nonOpRev - c.nonOpExp;
  const totalMargin = netMargin + c.rfsc;

  return [
    { label: 'Total Revenue', value: totalRev, kind: 'subtotal', runningTo: totalRev, description: 'Opening figure — all revenue streams combined (operating tariffs + other income). This is the basis for every deduction that follows.' },
    { label: 'Power', value: -c.power, kind: 'outflow', runningTo: totalRev - c.power, description: 'Largest cost driver. Electricity purchased from the grid for distribution, typically 70–75% of revenue. Closely tracks consumption volume and spot market prices.' },
    { label: 'O&M', value: -c.om, kind: 'outflow', runningTo: opMargin, description: 'Operating and maintenance expense — labor, contracted services, materials, and infrastructure upkeep. Relatively stable but watch for cost creep.' },
    { label: 'Op. Margin', value: opMargin, kind: 'subtotal', runningTo: opMargin, description: 'Revenue minus all direct operating costs. A positive and growing operating margin signals healthy core efficiency before financing and non-cash charges.' },
    { label: 'Deprec.', value: -c.deprec, kind: 'outflow', runningTo: opMargin - c.deprec, description: 'Non-cash charge for the wear and aging of fixed assets. Reduces reported margin but has no impact on cash flow. Based on the fixed asset register.' },
    { label: 'Interest', value: -c.interest, kind: 'outflow', runningTo: netOpMargin, description: 'Financing costs on outstanding borrowings. Declining with debt paydown is a positive sign; a key lever for improving net operating margin.' },
    { label: '+ Non-Op', value: c.nonOpRev - c.nonOpExp, kind: 'inflow', runningTo: netMargin, description: 'Net non-operating items — miscellaneous income (e.g., rental, interest income) less non-operating expenses. Smaller and less predictable than core revenue.' },
    { label: '+ RFSC', value: c.rfsc, kind: 'inflow', runningTo: totalMargin, description: 'Reinvestment Fund for Stranded Contracts (RFSC) — a regulatory obligation added back to margins. Represents recovery of stranded contract costs per ERC rules.' },
    { label: 'Total Margin', value: totalMargin, kind: 'subtotal', runningTo: totalMargin, description: 'Final bottom line — total margin gross of RFSC. This is the primary performance measure for the period, combining all operating and non-operating flows.' },
  ];
}

export function Waterfall({ data }: WaterfallProps) {
  const colors = useColors();
  const steps = buildSteps(data);
  const [hover, setHover] = useState<number | null>(null);

  const w = 800, h = 280, padX = 40, padY = 30;
  const chartW = w - padX * 2;
  const chartH = h - padY * 2;
  const slot = chartW / steps.length;
  const barW = slot * 0.62;

  const maxVal = Math.max(...steps.map((s) => s.runningTo), data.inputs.current.opRev + data.inputs.current.othRev);
  const minVal = Math.min(...steps.map((s) => s.runningTo), 0);
  const yRange = maxVal - minVal || 1;
  const yScale = (v: number) => padY + chartH - ((v - minVal) / yRange) * chartH;

  const positions = steps.map((s, i) => {
    let start: number, end: number;
    if (s.kind === 'subtotal') { start = 0; end = s.runningTo; }
    else { const prev = i === 0 ? 0 : steps[i - 1].runningTo; start = prev; end = s.runningTo; }
    return { top: yScale(Math.max(start, end)), bottom: yScale(Math.min(start, end)), start, end };
  });

  const delta = data.current.totalMargin - data.prior.totalMargin;
  const deltaUp = delta >= 0;
  const hoveredStep = hover !== null ? steps[hover] : null;

  return (
    <Box
      sx={{
        background: colors.panel,
        border: `1px solid ${colors.border}`,
        borderRadius: '18px',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        p: 3,
        boxShadow: `0 20px 60px -20px ${alpha(colors.ink, 0.15)}`,
      }}
    >
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
        <Box>
          <Typography sx={{ fontFamily: '"Instrument Serif", serif', fontSize: 22, letterSpacing: '-0.3px' }}>
            P&L Waterfall{' '}
            <Box component="em" sx={{ fontStyle: 'italic', color: colors.accent }}>· current period</Box>
          </Typography>
          <Typography sx={{ fontSize: 12.5, color: 'text.secondary', mt: 0.5 }}>
            How total revenue flows down to total margin
          </Typography>
        </Box>
        <Stack direction="row" gap={2} sx={{ fontSize: 11.5, color: 'text.secondary' }}>
          <LegendDot color={colors.accent} label="Inflow" />
          <LegendDot color={colors.danger} label="Outflow" />
          <LegendDot color={colors.accent2} label="Subtotal" />
        </Stack>
      </Stack>

      <Stack direction="row" gap={3.5} sx={{ mt: 2.5, mb: 1.5, alignItems: 'baseline' }}>
        <Box sx={{ fontFamily: '"Instrument Serif", serif', fontSize: 44, letterSpacing: '-0.8px', lineHeight: 1 }}>
          {PESO}{fmtMillions(data.current.totalMargin)}M
        </Box>
        <Typography sx={{ fontSize: 12.5, color: 'text.secondary' }}>
          Total Margin (Gross of RFSC) ·{' '}
          <Box component="strong" sx={{ color: deltaUp ? colors.accent2 : colors.danger, fontFamily: '"JetBrains Mono", monospace', fontWeight: 500 }}>
            {fmtAbsDelta(data.current.totalMargin, data.prior.totalMargin)} vs prior
          </Box>
        </Typography>
      </Stack>

      {/* Hover description panel */}
      <Box
        sx={{
          minHeight: 48,
          mb: 1,
          px: 1.75,
          py: hoveredStep ? 1.25 : 0,
          borderRadius: '10px',
          border: hoveredStep ? `1px solid ${alpha(colors.accent, 0.2)}` : '1px solid transparent',
          background: hoveredStep ? alpha(colors.accent, 0.06) : 'transparent',
          transition: 'all 0.2s ease',
          overflow: 'hidden',
        }}
      >
        {hoveredStep && (
          <Stack direction="row" gap={1.5} alignItems="flex-start">
            <Box
              sx={{
                mt: 0.25,
                width: 8,
                height: 8,
                flexShrink: 0,
                borderRadius: '2px',
                background: hoveredStep.kind === 'inflow' ? colors.accent : hoveredStep.kind === 'outflow' ? colors.danger : colors.accent2,
              }}
            />
            <Box>
              <Typography sx={{ fontSize: 12.5, fontWeight: 600, mb: 0.35 }}>
                {hoveredStep.label}
                <Box component="span" sx={{ ml: 1.5, fontFamily: '"JetBrains Mono", monospace', fontSize: 11.5, fontWeight: 500, color: 'text.secondary' }}>
                  {hoveredStep.kind === 'outflow' ? '−' : '+'}{PESO}{fmtMillions(Math.abs(hoveredStep.value))}M
                </Box>
              </Typography>
              <Typography sx={{ fontSize: 12, color: 'text.secondary', lineHeight: 1.55 }}>
                {hoveredStep.description}
              </Typography>
            </Box>
          </Stack>
        )}
      </Box>

      <Box component="svg" viewBox={`0 0 ${w} ${h}`} width="100%" height={h} sx={{ display: 'block' }}>
        {[0, 0.25, 0.5, 0.75, 1].map((p) => (
          <line key={p} x1={padX} x2={w - padX} y1={padY + chartH * p} y2={padY + chartH * p}
            stroke={alpha(colors.ink, 0.06)} strokeWidth="1" />
        ))}
        <line x1={padX} x2={w - padX} y1={yScale(0)} y2={yScale(0)}
          stroke={alpha(colors.ink, 0.18)} strokeWidth="1" />

        {steps.map((s, i) => {
          const x = padX + slot * i + (slot - barW) / 2;
          const { top, bottom } = positions[i];
          const height = Math.max(2, bottom - top);
          const color = s.kind === 'inflow' ? colors.accent : s.kind === 'outflow' ? colors.danger : colors.accent2;
          const isHover = hover === i;
          return (
            <g key={i} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)} style={{ cursor: 'pointer' }}>
              <rect x={x} y={top} width={barW} height={height} rx="4"
                fill={color} opacity={isHover ? 1 : 0.82} style={{ transition: 'opacity 0.2s' }} />
              {i < steps.length - 1 && (
                <line x1={x + barW} x2={x + slot}
                  y1={s.kind === 'subtotal' && positions[i + 1].start !== 0 ? yScale(s.runningTo) : positions[i].top}
                  y2={s.kind === 'subtotal' && positions[i + 1].start !== 0 ? yScale(s.runningTo) : positions[i].top}
                  stroke={alpha(colors.ink, 0.2)} strokeWidth="1" strokeDasharray="3 3" />
              )}
              <text x={x + barW / 2} y={h - 10} textAnchor="middle" fontSize="10"
                fill={isHover ? color : colors.inkDim} fontFamily="Inter, sans-serif"
                style={{ transition: 'fill 0.15s', fontWeight: isHover ? 600 : 400 }}>
                {s.label}
              </text>
            </g>
          );
        })}
      </Box>
    </Box>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <Stack direction="row" alignItems="center" gap={0.75}>
      <Box sx={{ width: 8, height: 8, borderRadius: '2px', background: color }} />
      <span>{label}</span>
    </Stack>
  );
}
