import { useState } from 'react';
import { Box, IconButton, Stack, Tooltip, Typography, alpha } from '@mui/material';
import ContentCopyRoundedIcon from '@mui/icons-material/ContentCopyRounded';
import CheckRoundedIcon from '@mui/icons-material/CheckRounded';
import type { PnlComputed } from '../types/pnl';
import { useColors } from '../theme/theme';
import { fmtMillions, PESO } from '../utils/format';
import { useCopyCard } from '../hooks/useCopyCard';

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
          py: 1.5,
          fontSize: 13,
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
        <Box sx={{ flex: 1, height: 10, background: alpha(colors.ink, 0.06), borderRadius: 99, mx: 1.5, overflow: 'hidden' }}>
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
  const { cardRef, copyBtnRef, hovered, setHovered, copied, handleCopy } = useCopyCard();

  const ratio = data.current.totalRev > 0 ? (data.current.totalMargin / data.current.totalRev) * 100 : 0;
  const ratioPrior = data.prior.totalRev > 0 ? (data.prior.totalMargin / data.prior.totalRev) * 100 : 0;
  const ratioDelta = ratio - ratioPrior;
  const arrowUp = ratioDelta >= 0;

  const radius = 86;
  const circumference = 2 * Math.PI * radius;
  const arcLen = (Math.max(0, Math.min(100, ratio)) / 100) * circumference;

  const c = data.inputs.current;
  const p = data.inputs.prior;
  const maxBar = Math.max(data.current.opMargin, c.deprec, c.interest, c.nonOpRev, c.rfsc, 1);

  function chg(curr: number, prev: number) {
    if (curr === 0 && prev === 0) return 'no data to compare';
    const diff = curr - prev;
    if (diff === 0) return 'unchanged vs prior';
    const pct = Math.abs(prev) > 0 ? (Math.abs(diff) / Math.abs(prev)) * 100 : 0;
    return `${diff > 0 ? 'up' : 'down'} ${PESO}${fmtMillions(Math.abs(diff))}M (${pct.toFixed(1)}%) vs prior`;
  }

  const opMarginRatio = data.current.totalRev > 0 ? (data.current.opMargin / data.current.totalRev) * 100 : 0;
  const donutDescription = (ratio === 0 && ratioPrior === 0)
    ? 'No data recorded for this period. Margin ratio measures how much of each peso earned is retained after all deductions.'
    : `${ratio.toFixed(1)}% margin ratio this period — ${
        ratioDelta === 0 ? 'unchanged vs prior' :
        `${arrowUp ? 'up' : 'down'} ${Math.abs(ratioDelta).toFixed(1)} pp vs prior`
      }. Measures how much of each peso earned is retained after all deductions.`;

  return (
    <Box
      ref={cardRef}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      sx={{ position: 'relative', background: colors.panel, border: `1px solid ${colors.border}`, borderRadius: '18px', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', p: 3, boxShadow: `0 20px 60px -20px ${alpha(colors.ink, 0.15)}` }}
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
          <svg viewBox="0 0 220 220" style={{ width: '100%', maxWidth: 220, height: 'auto', display: 'block' }}>
            <defs>
              <linearGradient id="g-arc1" x1="0" x2="1" y1="0" y2="1">
                <stop offset="0%" stopColor={colors.accent} />
                <stop offset="100%" stopColor={colors.accent2} />
              </linearGradient>
            </defs>
            <circle cx="110" cy="110" r={radius} fill="none" stroke={alpha(colors.ink, 0.08)} strokeWidth="16" />
            <circle cx="110" cy="110" r={radius} fill="none" stroke="url(#g-arc1)" strokeWidth="16"
              strokeDasharray={`${arcLen} ${circumference}`} strokeLinecap="round"
              transform="rotate(-90 110 110)" style={{ transition: 'stroke-dasharray 0.6s ease' }} />
            <text x="110" y="102" textAnchor="middle" fontFamily="Inter" fontSize="10" fill={colors.inkDim} letterSpacing="1.4">
              MARGIN RATIO
            </text>
            <text x="110" y="140" textAnchor="middle" fontFamily="Instrument Serif" fontSize="44" fill={colors.ink}>
              {ratio.toFixed(1)}%
            </text>
            <text x="110" y="154" textAnchor="middle" fontFamily="JetBrains Mono" fontSize="11"
              fill={arrowUp ? colors.accent2 : colors.danger}>
              {arrowUp ? '▲ ' : '▼ '}{Math.abs(ratioDelta).toFixed(1)} pp
            </text>
          </svg>
        </Stack>
      </Tooltip>

      <BarRow label="Operating Margin" value={data.current.opMargin} maxValue={maxBar} tone="success"
        description={
          data.current.opMargin === 0 && data.prior.opMargin === 0
            ? 'No data recorded for this period.'
            : `${PESO}${fmtMillions(data.current.opMargin)}M (${opMarginRatio.toFixed(1)}% of revenue) — ${chg(data.current.opMargin, data.prior.opMargin)}. ${
                data.current.opMargin === data.prior.opMargin ? 'Flat vs prior period.' :
                'Revenue after power and O&M, before non-cash charges and financing.'
              }`
        }
        onHover={setHover} />
      <BarRow label="Less: Deprec." value={c.deprec} maxValue={maxBar} tone="danger"
        description={
          c.deprec === 0 && p.deprec === 0
            ? 'No data recorded for this period.'
            : `${PESO}${fmtMillions(c.deprec)}M non-cash depreciation — ${chg(c.deprec, p.deprec)}. ${
                c.deprec === p.deprec ? 'Unchanged vs prior. ' : ''
              }No cash impact; reduces reported margin only.`
        }
        onHover={setHover} />
      <BarRow label="Less: Interest" value={c.interest} maxValue={maxBar} tone="danger"
        description={
          c.interest === 0 && p.interest === 0
            ? 'No data recorded for this period.'
            : `${PESO}${fmtMillions(c.interest)}M financing cost — ${chg(c.interest, p.interest)}. ${
                c.interest === p.interest ? 'Financing cost unchanged vs prior.' :
                c.interest < p.interest ? 'Declining interest signals debt paydown progress.' :
                'Increased vs prior — check outstanding debt levels.'
              }`
        }
        onHover={setHover} />
      <BarRow label="+ Non-Op Rev" value={c.nonOpRev} maxValue={maxBar} tone="success"
        description={
          c.nonOpRev === 0 && p.nonOpRev === 0
            ? 'No data recorded for this period.'
            : `${PESO}${fmtMillions(c.nonOpRev)}M — ${chg(c.nonOpRev, p.nonOpRev)}. ${
                c.nonOpRev === p.nonOpRev ? 'Unchanged vs prior. ' : ''
              }Miscellaneous income from non-core activities such as rental and interest earned.`
        }
        onHover={setHover} />
      <BarRow label="+ RFSC" value={c.rfsc} maxValue={maxBar} tone="warning"
        description={
          c.rfsc === 0 && p.rfsc === 0
            ? 'No data recorded for this period.'
            : `${PESO}${fmtMillions(c.rfsc)}M — ${chg(c.rfsc, p.rfsc)}. ${
                c.rfsc === p.rfsc ? 'RFSC contribution unchanged vs prior.' :
                'Regulatory RFSC contribution added to net margin to arrive at total margin.'
              }`
        }
        onHover={setHover} />
    </Box>
  );
}
