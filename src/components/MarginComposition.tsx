import { useState } from 'react';
import { Box, Stack, Tooltip, Typography, alpha } from '@mui/material';
import type { PnlComputed } from '../types/pnl';
import { useColors } from '../theme/theme';
import { fmtMillions, PESO } from '../utils/format';

interface MarginCompositionProps {
  data: PnlComputed;
}

interface BarRowProps {
  label: string;
  value: number;
  maxValue: number;
  tone: 'success' | 'danger' | 'primary' | 'warning';
  description: string;
  onHover: (label: string | null) => void;
}

function ChartTooltip({ label, description }: { label: string; description: string }) {
  return (
    <Box sx={{ p: 0.25 }}>
      <Typography sx={{ fontSize: 12.5, fontWeight: 600, mb: 0.5 }}>{label}</Typography>
      <Typography sx={{ fontSize: 11.5, lineHeight: 1.6, opacity: 0.85 }}>{description}</Typography>
    </Box>
  );
}

function tooltipSx(colors: ReturnType<typeof useColors>) {
  return {
    tooltip: { sx: { background: alpha(colors.ink, 0.93), backdropFilter: 'blur(16px)', border: `1px solid ${colors.borderStrong}`, borderRadius: '10px', p: 1.5, maxWidth: 240 } },
    arrow: { sx: { color: alpha(colors.ink, 0.93) } },
  };
}

function BarRow({ label, value, maxValue, tone, description, onHover }: BarRowProps) {
  const colors = useColors();
  const pct = Math.max(0, Math.min(100, (value / maxValue) * 100));
  const colorMap = { success: colors.accent2, danger: colors.danger, primary: colors.accent, warning: colors.accent3 };
  const color = colorMap[tone];

  return (
    <Tooltip
      title={<ChartTooltip label={label} description={description} />}
      placement="left"
      arrow
      enterDelay={250}
      slotProps={tooltipSx(colors)}
    >
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        sx={{
          py: 1.1,
          fontSize: 12.5,
          borderBottom: `1px dashed ${colors.border}`,
          cursor: 'pointer',
          transition: 'background 0.2s',
          '&:last-of-type': { borderBottom: 'none' },
          '&:hover': { background: alpha(colors.ink, 0.03) },
        }}
        onMouseEnter={() => onHover(label)}
        onMouseLeave={() => onHover(null)}
      >
        <Box sx={{ flex: '0 0 130px', color: 'text.secondary' }}>{label}</Box>
        <Box sx={{ flex: 1, height: 6, background: alpha(colors.ink, 0.06), borderRadius: 99, mx: 1.5, overflow: 'hidden' }}>
          <Box sx={{ height: '100%', width: `${pct}%`, background: `linear-gradient(90deg, ${color}, ${alpha(color, 0.3)})`, borderRadius: 99, transition: 'width 0.6s ease' }} />
        </Box>
        <Box sx={{ flex: '0 0 90px', textAlign: 'right', fontFamily: '"JetBrains Mono", monospace', fontSize: 12 }}>
          {PESO}{fmtMillions(value)}M
        </Box>
      </Stack>
    </Tooltip>
  );
}

export function MarginComposition({ data }: MarginCompositionProps) {
  const colors = useColors();
  const [, setHover] = useState<string | null>(null);

  const ratio = data.current.totalRev > 0 ? (data.current.totalMargin / data.current.totalRev) * 100 : 0;
  const ratioPrior = data.prior.totalRev > 0 ? (data.prior.totalMargin / data.prior.totalRev) * 100 : 0;
  const ratioDelta = ratio - ratioPrior;
  const arrowUp = ratioDelta >= 0;

  const radius = 68;
  const circumference = 2 * Math.PI * radius;
  const arcLen = (Math.max(0, Math.min(100, ratio)) / 100) * circumference;

  const c = data.inputs.current;
  const maxBar = Math.max(data.current.opMargin, c.deprec, c.interest, c.nonOpRev, c.rfsc, 1);

  const donutDescription = `Total margin as a percentage of total revenue — how much of each peso earned is retained after all deductions. ${ratioDelta !== 0 ? `${arrowUp ? 'Up' : 'Down'} ${Math.abs(ratioDelta).toFixed(1)} pp vs prior period.` : ''}`;

  return (
    <Box sx={{ background: colors.panel, border: `1px solid ${colors.border}`, borderRadius: '18px', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', p: 3, boxShadow: `0 20px 60px -20px ${alpha(colors.ink, 0.15)}` }}>
      <Box>
        <Typography sx={{ fontFamily: '"Instrument Serif", serif', fontSize: 22, letterSpacing: '-0.3px' }}>
          Margin{' '}
          <Box component="em" sx={{ fontStyle: 'italic', color: colors.accent }}>composition</Box>
        </Typography>
        <Typography sx={{ fontSize: 12.5, color: 'text.secondary', mt: 0.5 }}>
          Current period · all values {PESO}M
        </Typography>
      </Box>

      <Tooltip
        title={<ChartTooltip label="Margin Ratio" description={donutDescription} />}
        placement="top"
        arrow
        enterDelay={250}
        slotProps={tooltipSx(colors)}
      >
        <Stack alignItems="center" justifyContent="center" sx={{ py: 2, cursor: 'default' }}>
          <svg width="180" height="180" viewBox="0 0 180 180">
            <defs>
              <linearGradient id="g-arc1" x1="0" x2="1" y1="0" y2="1">
                <stop offset="0%" stopColor={colors.accent} />
                <stop offset="100%" stopColor={colors.accent2} />
              </linearGradient>
            </defs>
            <circle cx="90" cy="90" r={radius} fill="none" stroke={alpha(colors.ink, 0.08)} strokeWidth="14" />
            <circle cx="90" cy="90" r={radius} fill="none" stroke="url(#g-arc1)" strokeWidth="14"
              strokeDasharray={`${arcLen} ${circumference}`} strokeLinecap="round"
              transform="rotate(-90 90 90)" style={{ transition: 'stroke-dasharray 0.6s ease' }} />
            <text x="90" y="84" textAnchor="middle" fontFamily="Inter" fontSize="10" fill={colors.inkDim} letterSpacing="1.4">
              MARGIN RATIO
            </text>
            <text x="90" y="118" textAnchor="middle" fontFamily="Instrument Serif" fontSize="36" fill={colors.ink}>
              {ratio.toFixed(1)}%
            </text>
            <text x="90" y="128" textAnchor="middle" fontFamily="JetBrains Mono" fontSize="10"
              fill={arrowUp ? colors.accent2 : colors.danger}>
              {arrowUp ? '▲ ' : '▼ '}{Math.abs(ratioDelta).toFixed(1)} pp
            </text>
          </svg>
        </Stack>
      </Tooltip>

      <BarRow label="Operating Margin" value={data.current.opMargin} maxValue={maxBar} tone="success"
        description="Revenue minus power and O&M costs — core operational efficiency before non-cash charges and financing costs."
        onHover={setHover} />
      <BarRow label="Less: Deprec." value={c.deprec} maxValue={maxBar} tone="danger"
        description="Non-cash charge for fixed asset depreciation. Reduces reported margin but does not affect cash flow."
        onHover={setHover} />
      <BarRow label="Less: Interest" value={c.interest} maxValue={maxBar} tone="danger"
        description="Financing cost on outstanding debt. Declining interest signals progress in debt paydown and widens net operating margin."
        onHover={setHover} />
      <BarRow label="+ Non-Op Rev" value={c.nonOpRev} maxValue={maxBar} tone="success"
        description="Miscellaneous income from non-core activities (interest earned, rental, etc.) added to reach net margin."
        onHover={setHover} />
      <BarRow label="+ RFSC" value={c.rfsc} maxValue={maxBar} tone="warning"
        description="Reinvestment Fund for Stranded Contracts — regulatory obligation per ERC rules added to net margin to arrive at total margin."
        onHover={setHover} />
    </Box>
  );
}
