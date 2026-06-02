import { Box, IconButton, Stack, Typography, alpha } from '@mui/material';
import ContentCopyRoundedIcon from '@mui/icons-material/ContentCopyRounded';
import CheckRoundedIcon from '@mui/icons-material/CheckRounded';
import type { DsmPeriodComputed } from '../types/pnl';
import { useColors } from '../theme/theme';
import { fmtMillions, PESO } from '../utils/format';
import { useCopyCard } from '../hooks/useCopyCard';

interface Props { data: DsmPeriodComputed; }

function PeriodRow({ label, rev, exp, maxScale, isCurrent }: {
  label: string; rev: number; exp: number; maxScale: number; isCurrent: boolean;
}) {
  const colors = useColors();
  const revPct = maxScale > 0 ? Math.min((rev / maxScale) * 100, 100) : 0;
  const expPct = maxScale > 0 ? Math.min((exp / maxScale) * 100, 100) : 0;
  const netSavings = rev - exp;
  const barH = isCurrent ? 38 : 28;

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={0.75}>
        <Typography sx={{ fontSize: isCurrent ? 13 : 12, fontWeight: isCurrent ? 600 : 400, color: isCurrent ? 'text.primary' : colors.inkSoft }}>
          {label}
        </Typography>
        <Box sx={{
          px: 0.9, py: 0.15, borderRadius: '6px', fontSize: 11, fontWeight: 600,
          fontFamily: '"JetBrains Mono", monospace',
          background: alpha(netSavings >= 0 ? colors.accent2 : colors.danger, 0.1),
          color: netSavings >= 0 ? colors.accent2 : colors.danger,
        }}>
          Net {PESO}{fmtMillions(Math.abs(netSavings))}M {netSavings >= 0 ? 'saved' : 'deficit'}
        </Box>
      </Stack>

      <Stack direction="row" alignItems="center" gap={1.5} mb={0.75}>
        {/* Revenue bar */}
        <Box sx={{ flex: 1, height: barH, background: alpha(colors.ink, 0.05), borderRadius: '10px', overflow: 'hidden', position: 'relative' }}>
          <Box sx={{
            position: 'absolute', left: 0, top: 0,
            height: '100%', width: `${revPct}%`,
            background: isCurrent
              ? `linear-gradient(90deg, ${colors.accent2}, ${alpha(colors.accent2, 0.7)})`
              : `linear-gradient(90deg, ${alpha(colors.accent2, 0.55)}, ${alpha(colors.accent2, 0.35)})`,
            borderRadius: '10px',
            transition: 'width 0.6s ease',
          }} />
        </Box>
        <Stack alignItems="flex-end" sx={{ flexShrink: 0, width: 80 }}>
          <Typography sx={{ fontSize: isCurrent ? 12.5 : 11.5, fontFamily: '"JetBrains Mono", monospace', fontWeight: isCurrent ? 700 : 400, color: colors.accent2 }}>
            {PESO}{fmtMillions(rev)}M
          </Typography>
        </Stack>
      </Stack>

      <Stack direction="row" alignItems="center" gap={1.5}>
        {/* Expenses bar */}
        <Box sx={{ flex: 1, height: barH * 0.75, background: alpha(colors.ink, 0.05), borderRadius: '10px', overflow: 'hidden', position: 'relative' }}>
          <Box sx={{
            position: 'absolute', left: 0, top: 0,
            height: '100%', width: `${expPct}%`,
            background: isCurrent
              ? `linear-gradient(90deg, ${colors.danger}, ${alpha(colors.danger, 0.7)})`
              : `linear-gradient(90deg, ${alpha(colors.danger, 0.55)}, ${alpha(colors.danger, 0.35)})`,
            borderRadius: '10px',
            transition: 'width 0.6s ease',
          }} />
        </Box>
        <Stack alignItems="flex-end" sx={{ flexShrink: 0, width: 80 }}>
          <Typography sx={{ fontSize: isCurrent ? 12 : 11, fontFamily: '"JetBrains Mono", monospace', color: colors.danger }}>
            −{PESO}{fmtMillions(exp)}M
          </Typography>
        </Stack>
      </Stack>
    </Box>
  );
}

export function DsmRevVsExp({ data }: Props) {
  const colors = useColors();
  const { cardRef, copyBtnRef, hovered, setHovered, copied, handleCopy } = useCopyCard();

  const { prior, current, inputs } = data;
  const singleMonth = !inputs.priorLabel;
  const maxScale = singleMonth
    ? Math.max(current.totalRev, current.totalExp, 1)
    : Math.max(prior.totalRev, current.totalRev, prior.totalExp, current.totalExp, 1);
  const netDelta = current.netSavings - prior.netSavings;

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

      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems="flex-start" gap={1}>
        <Box>
          <Typography sx={{ fontFamily: '"Instrument Serif", serif', fontSize: { xs: 18, sm: 22 }, letterSpacing: '-0.3px' }}>
            Revenue vs Expenses
          </Typography>
          <Typography sx={{ fontSize: 12.5, color: 'text.secondary', mt: 0.5 }}>
            Green = revenue · Red = expenses{!singleMonth ? ' · period comparison' : ''}
          </Typography>
        </Box>
        {!singleMonth && (
          <Stack alignItems={{ xs: 'flex-start', sm: 'flex-end' }} gap={0.3} sx={{ flexShrink: 0, pt: { sm: 0.5 } }}>
            <Box sx={{
              display: 'inline-flex', alignItems: 'center', gap: 0.5,
              px: 1.25, py: 0.4, borderRadius: '8px', fontSize: 13, fontWeight: 700,
              fontFamily: '"JetBrains Mono", monospace',
              background: netDelta >= 0 ? alpha(colors.accent2, 0.12) : alpha(colors.danger, 0.12),
              color: netDelta >= 0 ? colors.accent2 : colors.danger,
            }}>
              {netDelta >= 0 ? '▲' : '▼'} {PESO}{fmtMillions(Math.abs(netDelta))}M
            </Box>
            <Typography sx={{ fontSize: 10.5, color: colors.inkSoft }}>net savings change</Typography>
          </Stack>
        )}
      </Stack>

      <Stack gap={3} sx={{ mt: 3 }}>
        <PeriodRow label={inputs.currentLabel} rev={current.totalRev} exp={current.totalExp} maxScale={maxScale} isCurrent />
        {!singleMonth && (
          <PeriodRow label={inputs.priorLabel} rev={prior.totalRev} exp={prior.totalExp} maxScale={maxScale} isCurrent={false} />
        )}
      </Stack>

      <Box sx={{ mt: 3, pt: 2.5, borderTop: `1px solid ${colors.border}` }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography sx={{ fontSize: 12.5, color: 'text.secondary' }}>Net Savings</Typography>
          {singleMonth ? (
            <Typography sx={{ fontSize: 13.5, fontFamily: '"JetBrains Mono", monospace', fontWeight: 700, color: current.netSavings >= 0 ? colors.accent2 : colors.danger }}>
              {PESO}{fmtMillions(current.netSavings)}M
            </Typography>
          ) : (
            <Stack direction="row" gap={1.5} alignItems="center">
              <Stack alignItems="flex-end">
                <Typography sx={{ fontSize: 10.5, color: colors.inkSoft }}>{inputs.priorLabel}</Typography>
                <Typography sx={{ fontSize: 13.5, fontFamily: '"JetBrains Mono", monospace', color: colors.inkDim }}>
                  {PESO}{fmtMillions(prior.netSavings)}M
                </Typography>
              </Stack>
              <Typography sx={{ fontSize: 14, color: colors.borderStrong, mt: 1.5 }}>→</Typography>
              <Stack alignItems="flex-end">
                <Typography sx={{ fontSize: 10.5, fontWeight: 600, color: colors.ink }}>{inputs.currentLabel}</Typography>
                <Typography sx={{ fontSize: 13.5, fontFamily: '"JetBrains Mono", monospace', fontWeight: 700, color: current.netSavings >= 0 ? colors.accent2 : colors.danger }}>
                  {PESO}{fmtMillions(current.netSavings)}M
                </Typography>
              </Stack>
            </Stack>
          )}
        </Stack>
      </Box>
    </Box>
  );
}
