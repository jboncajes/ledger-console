import { Box, LinearProgress, Stack, Tooltip, Typography, alpha, keyframes } from '@mui/material';
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
  code: string;
  curr: number;
  prior: number;
  description: string;
  inverseGood?: boolean;
  netMarginMode?: boolean;
  sparkline: React.ReactNode;
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
  label, code, curr, prior, description,
  inverseGood, netMarginMode, sparkline, meterPct, meterColor = 'primary', delay,
}: KpiCardProps) {
  const colors = useColors();
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
    warning: `linear-gradient(90deg, ${colors.accent3}, ${alpha(colors.accent3, 0.3)})`,
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
            maxWidth: 250,
          },
        },
        arrow: { sx: { color: alpha(colors.ink, 0.93) } },
      }}
    >
      <Box
        sx={{
          background: colors.panel,
          border: `1px solid ${colors.border}`,
          borderRadius: '18px',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          p: 2.75,
          position: 'relative',
          overflow: 'hidden',
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
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={1.75}>
          <Typography sx={{ fontSize: 11.5, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '1.2px', fontWeight: 500 }}>
            {label}
          </Typography>
          <Box sx={{ fontSize: 10, px: 1, py: 0.4, borderRadius: 99, background: alpha(colors.ink, 0.06), color: colors.inkSoft, fontFamily: '"JetBrains Mono", monospace' }}>
            {code}
          </Box>
        </Stack>

        <Box sx={{ fontFamily: '"Instrument Serif", serif', fontSize: 38, lineHeight: 1, letterSpacing: '-0.8px', mb: 1 }}>
          <Box component="span" sx={{ fontSize: 16, color: 'text.secondary', mr: 0.5, fontFamily: 'inherit' }}>{PESO}</Box>
          {fmtMillions(curr)}
          <Box component="span" sx={{ fontSize: 20, color: 'text.secondary' }}>M</Box>
        </Box>

        <Stack direction="row" alignItems="center" gap={1.25} sx={{ fontSize: 12 }}>
          <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.4, px: 0.9, py: 0.25, borderRadius: '6px', fontWeight: 600, fontSize: 11.5, fontFamily: '"JetBrains Mono", monospace', background: alpha(deltaColor, 0.12), color: deltaColor }}>
            {deltaText}
          </Box>
          <Typography component="span" sx={{ color: colors.inkSoft, fontSize: 11.5 }}>
            vs prior · {PESO}{fmtMillions(prior)}M
          </Typography>
        </Stack>

        <Box sx={{ position: 'absolute', right: 18, bottom: 48, opacity: 0.85 }}>{sparkline}</Box>

        <LinearProgress
          variant="determinate"
          value={Math.max(2, Math.min(100, meterPct))}
          sx={{
            mt: 1.25, height: 6, borderRadius: 99,
            background: alpha(colors.ink, 0.06),
            '& .MuiLinearProgress-bar': { background: meterGradient, borderRadius: 99, transition: 'transform 0.6s ease' },
          }}
        />
      </Box>
    </Tooltip>
  );
}

export function KpiGrid({ data }: KpiGridProps) {
  const colors = useColors();
  const { prior, current } = data;

  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 2, '@media (max-width: 1200px)': { gridTemplateColumns: 'repeat(2, 1fr)' }, '@media (max-width: 700px)': { gridTemplateColumns: '1fr' } }}>
      <KpiCard
        label="Total Operating Revenue" code="L-01"
        curr={current.totalRev} prior={prior.totalRev}
        description="Combined operating and other revenue — the top line before any deductions. Driven by energy sales volume and applicable tariff rates."
        sparkline={
          <svg width="80" height="40" viewBox="0 0 80 40">
            <defs>
              <linearGradient id="bg1" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor={colors.accent} stopOpacity="0.9" />
                <stop offset="100%" stopColor={colors.accent} stopOpacity="0.2" />
              </linearGradient>
            </defs>
            <rect x="14" y="20" width="20" height="18" rx="3" fill={alpha(colors.ink, 0.08)} />
            <rect x="46" y="4" width="20" height="34" rx="3" fill="url(#bg1)" />
          </svg>
        }
        meterPct={(current.totalRev / 350_000_000) * 100}
        delay={0.05}
      />

      <KpiCard
        label="Power Purchased" code="L-02"
        curr={data.inputs.current.power} prior={data.inputs.prior.power}
        inverseGood
        description="Largest variable cost — electricity purchased from the grid for distribution. Typically 70–75% of total revenue; increases compress margins unless offset by revenue growth."
        sparkline={
          <svg width="80" height="40" viewBox="0 0 80 40">
            <defs>
              <linearGradient id="ln1" x1="0" x2="1" y1="0" y2="0">
                <stop offset="0%" stopColor={colors.accent2} />
                <stop offset="100%" stopColor={colors.accent} />
              </linearGradient>
            </defs>
            <polyline points="0,30 14,28 28,24 42,22 56,14 70,8 80,4" fill="none" stroke="url(#ln1)" strokeWidth="1.8" strokeLinejoin="round" />
            <circle cx="80" cy="4" r="2.5" fill={colors.accent2} />
          </svg>
        }
        meterPct={(data.inputs.current.power / 250_000_000) * 100}
        meterColor="success"
        delay={0.1}
      />

      <KpiCard
        label="O&M Expense" code="L-14"
        curr={data.inputs.current.om} prior={data.inputs.prior.om}
        inverseGood
        description="Operating and maintenance costs excluding power purchase. Covers labor, materials, contracted services, and overhead. Monitor for cost creep exceeding revenue growth."
        sparkline={
          <svg width="80" height="40" viewBox="0 0 80 40">
            <rect x="10" y="24" width="14" height="14" rx="2" fill={alpha(colors.accent3, 0.25)} />
            <rect x="34" y="22" width="14" height="16" rx="2" fill={alpha(colors.accent3, 0.5)} />
            <rect x="58" y="14" width="14" height="24" rx="2" fill={alpha(colors.accent3, 0.85)} />
          </svg>
        }
        meterPct={(data.inputs.current.om / 50_000_000) * 100}
        meterColor="warning"
        delay={0.15}
      />

      <KpiCard
        label="Net Margin" code="L-99"
        curr={current.netMargin} prior={prior.netMargin}
        netMarginMode
        description="Bottom line after all deductions — operating costs, depreciation, interest, and non-operating adjustments. Core profitability indicator before RFSC contributions."
        sparkline={
          <svg width="84" height="40" viewBox="0 0 84 40">
            <defs>
              <linearGradient id="ar1" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor={colors.accent2} stopOpacity="0.55" />
                <stop offset="100%" stopColor={colors.accent2} stopOpacity="0" />
              </linearGradient>
            </defs>
            <path d="M0 32 L14 30 L28 26 L42 20 L56 14 L70 10 L84 4 L84 40 L0 40 Z" fill="url(#ar1)" />
            <path d="M0 32 L14 30 L28 26 L42 20 L56 14 L70 10 L84 4" fill="none" stroke={colors.accent2} strokeWidth="1.6" />
          </svg>
        }
        meterPct={(Math.abs(current.netMargin) / 30_000_000) * 100}
        delay={0.2}
      />
    </Box>
  );
}
