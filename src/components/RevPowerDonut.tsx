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

export function RevPowerDonut({ data }: Props) {
  const colors = useColors();
  const { cardRef, copyBtnRef, hovered, setHovered, copied, handleCopy } = useCopyCard();

  const revCurr  = data.current.totalRev;
  const powCurr  = data.inputs.current.power;
  const revPrior = data.prior.totalRev;
  const powPrior = data.inputs.prior.power;
  const priorLabel = data.inputs.priorLabel;
  const currLabel  = data.inputs.currentLabel;

  const ratioCurr  = revCurr  > 0 ? powCurr  / revCurr  : 0;
  const ratioPrior = revPrior > 0 ? powPrior / revPrior : 0;
  const pctCurr  = ratioCurr  * 100;
  const pctPrior = ratioPrior * 100;
  const pctDelta = pctCurr - pctPrior;

  // Outer ring = current period, inner ring = prior period
  const RO = 98, RI = 70, SW = 22, cx = 125, cy = 125;
  const circumO = 2 * Math.PI * RO;
  const circumI = 2 * Math.PI * RI;
  const GAP_DEG = 3;

  function buildRing(ratio: number, circum: number) {
    const gap = circum * (GAP_DEG / 360);
    const powArc   = ratio * circum;
    const otherArc = (1 - ratio) * circum;
    return [
      { id: 'power', arcLength: powArc,   dashLength: Math.max(0, powArc   - gap), offset: circum / 4 },
      { id: 'other', arcLength: otherArc, dashLength: Math.max(0, otherArc - gap), offset: circum / 4 - powArc },
    ];
  }

  const outerSegs = buildRing(ratioCurr,  circumO);
  const innerSegs = buildRing(ratioPrior, circumI);

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
        Power Cost Ratio
      </Typography>
      <Typography sx={{ fontSize: 12.5, color: 'text.secondary', mt: 0.5 }}>
        Power purchased as share of revenue · {priorLabel} vs {currLabel}
      </Typography>

      <Stack direction={{ xs: 'column', sm: 'row' }} alignItems="center" gap={3} sx={{ mt: 2.5 }}>
        {/* Dual-ring SVG donut */}
        <Box sx={{ flexShrink: 0, width: { xs: '100%', sm: 250 }, maxWidth: 250 }}>
          <Box component="svg" viewBox="0 0 250 250" sx={{ width: '100%', height: 'auto', display: 'block' }}>
            {/* Background tracks */}
            <circle cx={cx} cy={cy} r={RO} fill="none" stroke={alpha(colors.ink, 0.07)} strokeWidth={SW} />
            <circle cx={cx} cy={cy} r={RI} fill="none" stroke={alpha(colors.ink, 0.07)} strokeWidth={SW} />

            {/* Outer ring — current period */}
            {outerSegs.map((seg) => (
              <circle key={`o-${seg.id}`}
                cx={cx} cy={cy} r={RO}
                fill="none"
                stroke={seg.id === 'power' ? colors.danger : colors.accent}
                strokeWidth={SW}
                strokeDasharray={`${seg.dashLength} ${circumO - seg.dashLength}`}
                strokeDashoffset={seg.offset}
                strokeLinecap="butt"
                opacity={seg.id === 'power' ? 1 : 0.18}
              />
            ))}

            {/* Inner ring — prior period */}
            {innerSegs.map((seg) => (
              <circle key={`i-${seg.id}`}
                cx={cx} cy={cy} r={RI}
                fill="none"
                stroke={seg.id === 'power' ? colors.danger : colors.accent}
                strokeWidth={SW}
                strokeDasharray={`${seg.dashLength} ${circumI - seg.dashLength}`}
                strokeDashoffset={seg.offset}
                strokeLinecap="butt"
                opacity={seg.id === 'power' ? 0.42 : 0.1}
              />
            ))}

            {/* Center: current ratio + delta */}
            <text x={cx} y={cy - 14} textAnchor="middle" fontSize="9.5"
              fill={colors.inkSoft} fontFamily="Inter, sans-serif">power ratio</text>
            <text x={cx} y={cy + 4} textAnchor="middle" fontSize="18" fontWeight="700"
              fill={colors.ink} fontFamily="JetBrains Mono, monospace">
              {pctCurr.toFixed(1)}%
            </text>
            <text x={cx} y={cy + 19} textAnchor="middle" fontSize="10" fontWeight="600"
              fill={pctDelta <= 0 ? colors.accent2 : colors.danger}
              fontFamily="JetBrains Mono, monospace">
              {pctDelta <= 0 ? '▼' : '▲'}{Math.abs(pctDelta).toFixed(1)}pp
            </text>
          </Box>
        </Box>

        {/* Stats panel */}
        <Stack gap={2} sx={{ flex: 1 }}>
          {/* Ring key */}
          <Stack gap={0.75}>
            <Stack direction="row" alignItems="center" gap={1}>
              <Box sx={{ width: 18, height: 6, borderRadius: 99, background: colors.danger }} />
              <Typography sx={{ fontSize: 12, fontWeight: 600, color: colors.ink }}>{currLabel} (outer)</Typography>
            </Stack>
            <Stack direction="row" alignItems="center" gap={1}>
              <Box sx={{ width: 18, height: 6, borderRadius: 99, background: alpha(colors.danger, 0.42) }} />
              <Typography sx={{ fontSize: 12, color: colors.inkSoft }}>{priorLabel} (inner)</Typography>
            </Stack>
          </Stack>

          <Box sx={{ pt: 1.5, borderTop: `1px solid ${colors.border}` }}>
            <Typography sx={{ fontSize: 11.5, color: 'text.secondary', mb: 1.5 }}>Power cost ratio</Typography>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Stack alignItems="center" gap={0.25}>
                <Typography sx={{ fontSize: 10.5, color: colors.inkSoft }}>{priorLabel}</Typography>
                <Typography sx={{ fontSize: 22, fontFamily: '"JetBrains Mono", monospace', fontWeight: 700, color: colors.inkDim }}>
                  {pctPrior.toFixed(1)}%
                </Typography>
                <Typography sx={{ fontSize: 11, color: colors.inkSoft, fontFamily: '"JetBrains Mono", monospace' }}>
                  {PESO}{fmtMillions(powPrior)}M
                </Typography>
              </Stack>
              <Stack alignItems="center" gap={0.5}>
                <Typography sx={{ fontSize: 14, color: colors.borderStrong }}>→</Typography>
                <Box sx={{
                  px: 1, py: 0.3, borderRadius: '7px', fontSize: 11.5, fontWeight: 700,
                  fontFamily: '"JetBrains Mono", monospace',
                  background: pctDelta <= 0 ? alpha(colors.accent2, 0.12) : alpha(colors.danger, 0.12),
                  color: pctDelta <= 0 ? colors.accent2 : colors.danger,
                }}>
                  {pctDelta <= 0 ? '▼' : '▲'} {Math.abs(pctDelta).toFixed(1)}pp
                </Box>
              </Stack>
              <Stack alignItems="center" gap={0.25}>
                <Typography sx={{ fontSize: 10.5, fontWeight: 600, color: colors.ink }}>{currLabel}</Typography>
                <Typography sx={{
                  fontSize: 22, fontFamily: '"JetBrains Mono", monospace', fontWeight: 700,
                  color: pctDelta <= 0 ? colors.accent2 : colors.danger,
                }}>
                  {pctCurr.toFixed(1)}%
                </Typography>
                <Typography sx={{ fontSize: 11, color: colors.inkSoft, fontFamily: '"JetBrains Mono", monospace' }}>
                  {PESO}{fmtMillions(powCurr)}M
                </Typography>
              </Stack>
            </Stack>
          </Box>
        </Stack>
      </Stack>
    </Box>
  );
}
