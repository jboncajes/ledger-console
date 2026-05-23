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

function PeriodRow({
  label, rev, power, maxScale, isCurrent,
}: {
  label: string; rev: number; power: number; maxScale: number; isCurrent: boolean;
}) {
  const colors = useColors();
  const revPct   = maxScale > 0 ? Math.min((rev   / maxScale) * 100, 100) : 0;
  const powerPct = rev      > 0 ? Math.min((power / rev)      * 100, 100) : 0;
  const ratio    = rev      > 0 ? (power / rev) * 100 : 0;
  const barH     = isCurrent ? 38 : 28;

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={0.75}>
        <Typography sx={{
          fontSize: isCurrent ? 13 : 12,
          fontWeight: isCurrent ? 600 : 400,
          color: isCurrent ? 'text.primary' : colors.inkSoft,
        }}>
          {label}
        </Typography>
        <Box sx={{
          px: 0.9, py: 0.15, borderRadius: '6px', fontSize: 11, fontWeight: 600,
          fontFamily: '"JetBrains Mono", monospace',
          background: alpha(colors.danger, 0.1),
          color: colors.danger,
        }}>
          {ratio.toFixed(1)}% power
        </Box>
      </Stack>

      {/* Two explicit segments: power (left) + non-power revenue (right) */}
      <Stack direction="row" alignItems="center" gap={1.5}>
        <Box sx={{ flex: 1, height: barH, background: alpha(colors.ink, 0.05), borderRadius: '10px', overflow: 'hidden', position: 'relative' }}>
          {/* Power segment */}
          <Box sx={{
            position: 'absolute', left: 0, top: 0,
            height: '100%',
            width: `${revPct * powerPct / 100}%`,
            background: isCurrent
              ? `linear-gradient(90deg, ${colors.danger}, ${alpha(colors.danger, 0.8)})`
              : `linear-gradient(90deg, ${alpha(colors.danger, 0.65)}, ${alpha(colors.danger, 0.45)})`,
            transition: 'width 0.6s ease',
          }} />
          {/* Non-power revenue segment */}
          <Box sx={{
            position: 'absolute', top: 0,
            left: `${revPct * powerPct / 100}%`,
            height: '100%',
            width: `${revPct * (100 - powerPct) / 100}%`,
            background: isCurrent
              ? `linear-gradient(90deg, ${alpha(colors.accent, 0.75)}, ${alpha(colors.accent, 0.5)})`
              : `linear-gradient(90deg, ${alpha(colors.accent, 0.45)}, ${alpha(colors.accent, 0.3)})`,
            transition: 'width 0.6s ease, left 0.6s ease',
          }} />
        </Box>

        {/* Values column */}
        <Stack alignItems="flex-end" sx={{ flexShrink: 0, width: 88 }}>
          <Typography sx={{
            fontSize: isCurrent ? 13 : 12,
            fontFamily: '"JetBrains Mono", monospace',
            fontWeight: isCurrent ? 700 : 400,
            color: isCurrent ? 'text.primary' : colors.inkSoft,
          }}>
            {PESO}{fmtMillions(rev)}M
          </Typography>
          <Typography sx={{
            fontSize: 11.5, fontFamily: '"JetBrains Mono", monospace',
            color: isCurrent ? colors.danger : alpha(colors.danger, 0.7),
          }}>
            −{PESO}{fmtMillions(power)}M
          </Typography>
        </Stack>
      </Stack>
    </Box>
  );
}

export function RevenueVsPower({ data }: Props) {
  const colors = useColors();
  const { cardRef, copyBtnRef, hovered, setHovered, copied, handleCopy } = useCopyCard();

  const priorLabel = data.inputs.priorLabel;
  const currLabel  = data.inputs.currentLabel;

  const revPrior = data.prior.totalRev;
  const revCurr  = data.current.totalRev;
  const powPrior = data.inputs.prior.power;
  const powCurr  = data.inputs.current.power;

  const powPctPrior = revPrior > 0 ? (powPrior / revPrior) * 100 : 0;
  const powPctCurr  = revCurr  > 0 ? (powCurr  / revCurr)  * 100 : 0;
  const pctDelta    = powPctCurr - powPctPrior;

  const maxScale = Math.max(revPrior, revCurr, 1);

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
            Revenue vs Power Purchased
          </Typography>
          <Typography sx={{ fontSize: 12.5, color: 'text.secondary', mt: 0.5 }}>
            Each bar shows revenue — the red portion is power cost
          </Typography>
        </Box>
        <Stack alignItems={{ xs: 'flex-start', sm: 'flex-end' }} gap={0.3} sx={{ flexShrink: 0, pt: { sm: 0.5 } }}>
          <Box sx={{
            display: 'inline-flex', alignItems: 'center', gap: 0.5,
            px: 1.25, py: 0.4, borderRadius: '8px', fontSize: 13, fontWeight: 700,
            fontFamily: '"JetBrains Mono", monospace',
            background: pctDelta <= 0 ? alpha(colors.accent2, 0.12) : alpha(colors.danger, 0.12),
            color: pctDelta <= 0 ? colors.accent2 : colors.danger,
          }}>
            {pctDelta <= 0 ? '▼' : '▲'} {Math.abs(pctDelta).toFixed(1)} pp
          </Box>
          <Typography sx={{ fontSize: 10.5, color: colors.inkSoft }}>power cost ratio</Typography>
        </Stack>
      </Stack>

      {/* Color key */}
      <Stack direction="row" gap={2} sx={{ mt: 1.5 }}>
        <Stack direction="row" alignItems="center" gap={0.6} sx={{ fontSize: 11.5, color: 'text.secondary' }}>
          <Box sx={{ width: 12, height: 12, borderRadius: '3px', background: alpha(colors.accent, 0.55) }} />
          <span>Revenue (non-power)</span>
        </Stack>
        <Stack direction="row" alignItems="center" gap={0.6} sx={{ fontSize: 11.5, color: 'text.secondary' }}>
          <Box sx={{ width: 12, height: 12, borderRadius: '3px', background: colors.danger }} />
          <span>Power purchased</span>
        </Stack>
      </Stack>

      {/* Period bars — current on top, prior below */}
      <Stack gap={2.5} sx={{ mt: 2.5 }}>
        <PeriodRow
          label={currLabel}
          rev={revCurr} power={powCurr}
          maxScale={maxScale} isCurrent
        />
        <PeriodRow
          label={priorLabel}
          rev={revPrior} power={powPrior}
          maxScale={maxScale} isCurrent={false}
        />
      </Stack>

      {/* Footer: ratio transition */}
      <Box sx={{ mt: 3, pt: 2.5, borderTop: `1px solid ${colors.border}` }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography sx={{ fontSize: 12.5, color: 'text.secondary' }}>
            Power cost ratio
          </Typography>
          <Stack direction="row" gap={1.5} alignItems="center">
            <Stack alignItems="flex-end">
              <Typography sx={{ fontSize: 10.5, color: colors.inkSoft }}>{priorLabel}</Typography>
              <Typography sx={{ fontSize: 13.5, fontFamily: '"JetBrains Mono", monospace', color: colors.inkDim }}>
                {powPctPrior.toFixed(1)}%
              </Typography>
            </Stack>
            <Typography sx={{ fontSize: 14, color: colors.borderStrong, mt: 1.5 }}>→</Typography>
            <Stack alignItems="flex-end">
              <Typography sx={{ fontSize: 10.5, fontWeight: 600, color: colors.ink }}>{currLabel}</Typography>
              <Typography sx={{
                fontSize: 13.5, fontFamily: '"JetBrains Mono", monospace', fontWeight: 700,
                color: pctDelta <= 0 ? colors.accent2 : colors.danger,
              }}>
                {powPctCurr.toFixed(1)}%
              </Typography>
            </Stack>
          </Stack>
        </Stack>
      </Box>
    </Box>
  );
}
