import { useRef, useState } from 'react';
import { Box, IconButton, LinearProgress, Stack, Tooltip, Typography, alpha, keyframes } from '@mui/material';
import ContentCopyRoundedIcon from '@mui/icons-material/ContentCopyRounded';
import CheckRoundedIcon from '@mui/icons-material/CheckRounded';
import html2canvas from 'html2canvas';
import type { PnlComputed } from '../types/pnl';
import { useColors } from '../theme/theme';
import { fmtMillions, fmtPctDelta, PESO } from '../utils/format';

const rise = keyframes`
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
`;

interface KpiGridProps {
  data: PnlComputed;
}

interface KpiCardProps {
  label: string;
  curr: number;
  prior: number;
  description: string;
  inverseGood?: boolean;
  netMarginMode?: boolean;
  chart: React.ReactNode;
  meterPct: number;
  meterColor?: 'primary' | 'warning' | 'success';
  delay: number;
}

function CardTooltip({ label, description }: { label: string; description: string }) {
  return (
    <Box sx={{ p: 0.25 }}>
      <Typography sx={{ fontSize: 12.5, fontWeight: 600, mb: 0.5 }}>{label}</Typography>
      <Typography sx={{ fontSize: 11.5, lineHeight: 1.6, opacity: 0.85 }}>{description}</Typography>
    </Box>
  );
}

function KpiCard({
  label, curr, prior, description,
  inverseGood, netMarginMode, chart, meterPct, meterColor = 'primary', delay,
}: KpiCardProps) {
  const colors = useColors();
  const cardRef = useRef<HTMLDivElement>(null);
  const copyBtnRef = useRef<HTMLButtonElement>(null);
  const [hovered, setHovered] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!cardRef.current) return;
    try {
      // Build the blob promise BEFORE calling clipboard.write so the capture
      // runs in the background while the browser still sees this as a direct
      // user-gesture response — fixes "subsequent copies silently rejected" bug.
      const blobPromise = html2canvas(cardRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: null,
        ignoreElements: (el) =>
          el === copyBtnRef.current || (copyBtnRef.current?.contains(el) ?? false),
      }).then(
        (canvas) =>
          new Promise<Blob>((resolve, reject) => {
            canvas.toBlob((blob) => {
              if (blob) resolve(blob);
              else reject(new Error('No blob'));
            }, 'image/png');
          }),
      );

      // clipboard.write called synchronously — keeps user-gesture context alive
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': blobPromise })]);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Copy failed', err);
    }
  };

  const delta = curr - prior;
  let deltaText = fmtPctDelta(curr, prior);
  let deltaState: 'up' | 'down' | 'warn' = 'up';

  if (netMarginMode) {
    if (prior < 0 && curr >= 0) { deltaText = '▲ to profit'; deltaState = 'up'; }
    else if (prior >= 0 && curr < 0) { deltaText = '▼ to loss'; deltaState = 'down'; }
    else { deltaState = delta >= 0 ? 'up' : 'down'; }
  } else if (inverseGood) {
    deltaState = delta > 0 ? 'warn' : 'up';
  } else {
    deltaState = delta >= 0 ? 'up' : 'down';
  }

  const deltaColor = { up: colors.accent2, down: colors.danger, warn: colors.accent3 }[deltaState];
  const meterGradient = {
    primary: `linear-gradient(90deg, ${colors.accent}, ${colors.accent2})`,
    warning: `linear-gradient(90deg, ${colors.accent3}, ${alpha(colors.accent3, 0.5)})`,
    success: `linear-gradient(90deg, ${colors.accent2}, ${colors.accent})`,
  }[meterColor];

  return (
    <Tooltip
      title={<CardTooltip label={label} description={description} />}
      placement="top"
      arrow
      enterDelay={300}
      slotProps={{
        tooltip: {
          sx: {
            background: alpha(colors.ink, 0.93),
            backdropFilter: 'blur(16px)',
            border: `1px solid ${colors.borderStrong}`,
            borderRadius: '10px',
            p: 1.5,
            maxWidth: 260,
          },
        },
        arrow: { sx: { color: alpha(colors.ink, 0.93) } },
      }}
    >
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
          cursor: 'default',
          transition: 'transform 0.25s, border-color 0.25s, box-shadow 0.25s',
          animation: `${rise} 0.6s ease both`,
          animationDelay: `${delay}s`,
          boxShadow: `0 20px 60px -20px ${alpha(colors.ink, 0.15)}`,
          '&:hover': {
            transform: 'translateY(-2px)',
            borderColor: colors.borderStrong,
            boxShadow: `0 30px 80px -30px ${alpha(colors.ink, 0.2)}`,
          },
        }}
      >
        <IconButton
          ref={copyBtnRef}
          onClick={handleCopy}
          onMouseEnter={(e) => e.stopPropagation()}
          size="small"
          sx={{
            position: 'absolute',
            top: 12,
            right: 12,
            width: 28,
            height: 28,
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
        <Typography sx={{ fontSize: 11.5, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '1.2px', fontWeight: 500, mb: 1.75 }}>
          {label}
        </Typography>

        <Box sx={{ fontFamily: '"Instrument Serif", serif', fontSize: 52, lineHeight: 1, letterSpacing: '-1px', mb: 1.25 }}>
          <Box component="span" sx={{ fontSize: 22, color: 'text.secondary', mr: 0.5, fontFamily: 'inherit' }}>{PESO}</Box>
          {fmtMillions(curr)}
          <Box component="span" sx={{ fontSize: 28, color: 'text.secondary' }}>M</Box>
        </Box>

        <Stack direction="row" alignItems="center" gap={1.25} sx={{ fontSize: 12, mb: 2.5 }}>
          <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.4, px: 0.9, py: 0.25, borderRadius: '6px', fontWeight: 600, fontSize: 11.5, fontFamily: '"JetBrains Mono", monospace', background: alpha(deltaColor, 0.12), color: deltaColor }}>
            {deltaText}
          </Box>
          <Typography component="span" sx={{ color: colors.inkSoft, fontSize: 11.5 }}>
            vs prior · {PESO}{fmtMillions(prior)}M
          </Typography>
        </Stack>

        {/* Full-width chart area */}
        <Box sx={{ width: '100%', mb: 1.75 }}>{chart}</Box>

        <LinearProgress
          variant="determinate"
          value={Math.max(2, Math.min(100, meterPct))}
          sx={{
            height: 8, borderRadius: 99,
            background: alpha(colors.ink, 0.06),
            '& .MuiLinearProgress-bar': { background: meterGradient, borderRadius: 99, transition: 'transform 0.6s ease' },
          }}
        />
      </Box>
    </Tooltip>
  );
}

function chg(curr: number, prev: number): string {
  const d = curr - prev;
  const pct = Math.abs(prev) > 0 ? (Math.abs(d) / Math.abs(prev)) * 100 : 0;
  return `${d >= 0 ? 'up' : 'down'} ${PESO}${fmtMillions(Math.abs(d))}M (${pct.toFixed(1)}%) vs prior`;
}

/** Comparison bar chart — prior (left) vs current (right) */
function BarChart({ prior, curr, priorColor, currColor, priorLabel = 'Prior', currLabel = 'Current' }: {
  prior: number; curr: number;
  priorColor: string; currColor: string;
  priorLabel?: string; currLabel?: string;
}) {
  const maxV = Math.max(Math.abs(prior), Math.abs(curr), 1);
  const BAR_H = 80; // max bar height in the 120px viewbox
  const priorH = Math.max(4, (Math.abs(prior) / maxV) * BAR_H);
  const currH = Math.max(4, (Math.abs(curr) / maxV) * BAR_H);
  const BASE = 96; // y-axis baseline

  return (
    <svg width="100%" height="120" viewBox="0 0 260 120" preserveAspectRatio="xMidYMid meet">
      <defs>
        <linearGradient id="kpi-prior-grad" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={priorColor} stopOpacity="0.55" />
          <stop offset="100%" stopColor={priorColor} stopOpacity="0.25" />
        </linearGradient>
        <linearGradient id="kpi-curr-grad" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={currColor} stopOpacity="1" />
          <stop offset="100%" stopColor={currColor} stopOpacity="0.6" />
        </linearGradient>
      </defs>

      {/* Prior bar */}
      <rect x="22" y={BASE - priorH} width="96" height={priorH} rx="7"
        fill="url(#kpi-prior-grad)" />
      <text x="70" y={BASE - priorH - 7} textAnchor="middle"
        fontFamily="JetBrains Mono, monospace" fontSize="11" fill={priorColor} opacity="0.85">
        {fmtMillions(prior)}M
      </text>
      <text x="70" y="114" textAnchor="middle"
        fontFamily="Inter, sans-serif" fontSize="10.5" fill={priorColor} opacity="0.7">
        {priorLabel}
      </text>

      {/* Current bar */}
      <rect x="142" y={BASE - currH} width="96" height={currH} rx="7"
        fill="url(#kpi-curr-grad)" />
      <text x="190" y={BASE - currH - 7} textAnchor="middle"
        fontFamily="JetBrains Mono, monospace" fontSize="11" fill={currColor}>
        {fmtMillions(curr)}M
      </text>
      <text x="190" y="114" textAnchor="middle"
        fontFamily="Inter, sans-serif" fontSize="10.5" fill={currColor} opacity="0.85">
        {currLabel}
      </text>

      {/* Baseline */}
      <line x1="10" x2="250" y1={BASE} y2={BASE} stroke={currColor} strokeWidth="1.5" opacity="0.18" />
    </svg>
  );
}

/** Area / line chart for net margin */
function AreaChart({ prior, curr, color }: { prior: number; curr: number; color: string }) {
  const isPositive = curr >= 0;
  const baseline = isPositive ? 96 : 16;
  const maxAbs = Math.max(Math.abs(prior), Math.abs(curr), 1);
  const priorY = isPositive
    ? 96 - (Math.abs(prior) / maxAbs) * 76
    : 16 + (Math.abs(prior) / maxAbs) * 76;
  const currY = isPositive
    ? 96 - (Math.abs(curr) / maxAbs) * 76
    : 16 + (Math.abs(curr) / maxAbs) * 76;

  const path = `M 0 ${baseline} L 0 ${priorY} C 80 ${priorY} 180 ${currY} 260 ${currY} L 260 ${baseline} Z`;
  const line = `M 0 ${priorY} C 80 ${priorY} 180 ${currY} 260 ${currY}`;

  return (
    <svg width="100%" height="120" viewBox="0 0 260 120" preserveAspectRatio="xMidYMid meet">
      <defs>
        <linearGradient id="kpi-area-grad" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.5" />
          <stop offset="100%" stopColor={color} stopOpacity="0.04" />
        </linearGradient>
      </defs>
      <path d={path} fill="url(#kpi-area-grad)" />
      <path d={line} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
      {/* Prior point */}
      <circle cx="0" cy={priorY} r="4.5" fill={color} opacity="0.5" />
      <text x="14" y={priorY - 7} fontFamily="JetBrains Mono, monospace" fontSize="11" fill={color} opacity="0.75">
        {fmtMillions(prior)}M
      </text>
      {/* Current point */}
      <circle cx="260" cy={currY} r="5.5" fill={color} />
      <text x="246" y={currY - 9} textAnchor="end" fontFamily="JetBrains Mono, monospace" fontSize="11" fill={color}>
        {fmtMillions(curr)}M
      </text>
      {/* Zero line */}
      <line x1="0" x2="260" y1={baseline} y2={baseline} stroke={color} strokeWidth="1.5" opacity="0.15" />
    </svg>
  );
}

export function KpiGrid({ data }: KpiGridProps) {
  const colors = useColors();
  const { prior, current } = data;
  const ci = data.inputs.current;
  const pi = data.inputs.prior;

  const powRatio = current.totalRev > 0 ? (ci.power / current.totalRev) * 100 : 0;

  const torDesc = `${PESO}${fmtMillions(current.totalRev)}M this period — ${chg(current.totalRev, prior.totalRev)}. ${current.totalRev >= prior.totalRev ? 'Revenue is tracking ahead of the prior period.' : 'Revenue contracted — check tariff collection rates and consumption volume.'}`;
  const powDesc = `${PESO}${fmtMillions(ci.power)}M this period (${powRatio.toFixed(1)}% of revenue) — ${chg(ci.power, pi.power)}. ${ci.power > pi.power ? 'Rising power costs are compressing margins.' : 'Lower power costs are supporting margin expansion.'}`;
  const omDesc = `${PESO}${fmtMillions(ci.om)}M this period — ${chg(ci.om, pi.om)}. ${ci.om > pi.om ? 'Costs rose vs prior — review labor and contracted services for overruns.' : 'Costs held below prior period.'}`;
  const nmDesc = `${PESO}${fmtMillions(current.netMargin)}M this period — ${chg(current.netMargin, prior.netMargin)}. ${current.netMargin >= 0 ? 'Positive net margin — revenue covers all operating, financing, and non-cash charges.' : 'Negative net margin — total deductions exceeded revenue this period.'}`;

  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 2, '@media (max-width: 1200px)': { gridTemplateColumns: 'repeat(2, 1fr)' }, '@media (max-width: 700px)': { gridTemplateColumns: '1fr' } }}>
      <KpiCard
        label="Total Operating Revenue"
        curr={current.totalRev} prior={prior.totalRev}
        description={torDesc}
        chart={<BarChart prior={prior.totalRev} curr={current.totalRev} priorColor={colors.accent} currColor={colors.accent} />}
        meterPct={(current.totalRev / 350_000_000) * 100}
        delay={0.05}
      />

      <KpiCard
        label="Power Purchased"
        curr={ci.power} prior={pi.power}
        inverseGood
        description={powDesc}
        chart={<BarChart prior={pi.power} curr={ci.power} priorColor={colors.accent2} currColor={colors.accent2} />}
        meterPct={(ci.power / 250_000_000) * 100}
        meterColor="success"
        delay={0.1}
      />

      <KpiCard
        label="Operating and Maintenance"
        curr={ci.om} prior={pi.om}
        inverseGood
        description={omDesc}
        chart={<BarChart prior={pi.om} curr={ci.om} priorColor={colors.accent3} currColor={colors.accent3} />}
        meterPct={(ci.om / 50_000_000) * 100}
        meterColor="warning"
        delay={0.15}
      />

      <KpiCard
        label="Net Margin"
        curr={current.netMargin} prior={prior.netMargin}
        netMarginMode
        description={nmDesc}
        chart={<AreaChart prior={prior.netMargin} curr={current.netMargin} color={current.netMargin >= 0 ? colors.accent2 : colors.danger} />}
        meterPct={(Math.abs(current.netMargin) / 30_000_000) * 100}
        delay={0.2}
      />
    </Box>
  );
}
