import { useState } from 'react';
import { Box, IconButton, Stack, Typography, alpha } from '@mui/material';
import ContentCopyRoundedIcon from '@mui/icons-material/ContentCopyRounded';
import CheckRoundedIcon from '@mui/icons-material/CheckRounded';
import type { KpsMonthRecord } from '../types/pnl';
import { useColors } from '../theme/theme';
import { computeKpsScores } from '../utils/kps';
import { useCopyCard } from '../hooks/useCopyCard';

interface Props { months: KpsMonthRecord[]; }

const MAX_TOTAL = 40;

export function KpsTrend({ months }: Props) {
  const colors = useColors();
  const [hover, setHover] = useState<number | null>(null);
  const { cardRef, copyBtnRef, hovered, setHovered, copied, handleCopy } = useCopyCard();

  const sorted = [...months].sort((a, b) => a.id.localeCompare(b.id));
  const recent = sorted.slice(-12);

  const points = recent.map((m) => {
    const s = computeKpsScores(m.inputs);
    const short = m.label.slice(0, 3) + ' \'' + m.year.toString().slice(2);
    return { label: short, fullLabel: m.label, base: s.baseTotal, incentive: s.incentivePoints, total: s.totalPoints };
  });

  const seriesColors = [colors.accent2];
  const SERIES = [
    { key: 'total' as const, label: 'Total Points', max: MAX_TOTAL },
  ];

  const W = 800, H = 280, PX = 48, PT = 24, PB = 36;
  const cW = W - PX * 2;
  const cH = H - PT - PB;

  const yS = (v: number) => PT + cH - (v / MAX_TOTAL) * cH;
  const xS = (i: number) => PX + (i / Math.max(points.length - 1, 1)) * cW;

  const linePath = (key: 'base' | 'total') =>
    points.map((p, i) => `${i === 0 ? 'M' : 'L'}${xS(i).toFixed(1)},${yS(p[key]).toFixed(1)}`).join(' ');

  const yTicks = [0, 10, 20, 30, 40, MAX_TOTAL];
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

      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems="flex-start" gap={{ xs: 1.5, sm: 0 }}>
        <Box>
          <Typography sx={{ fontFamily: '"Instrument Serif", serif', fontSize: { xs: 18, sm: 22 }, letterSpacing: '-0.3px' }}>
            Score Trend{' '}
            <Box component="em" sx={{ fontStyle: 'italic', color: colors.accent }}>· 12-month rolling</Box>
          </Typography>
          <Typography sx={{ fontSize: 12.5, color: 'text.secondary', mt: 0.5 }}>
            KPS total points over time
          </Typography>
        </Box>
        <Stack direction="row" gap={2} sx={{ fontSize: 11.5, color: 'text.secondary', pt: { xs: 0, sm: 0.5 } }}>
          {SERIES.map((s, i) => (
            <Stack key={s.key} direction="row" alignItems="center" gap={0.75}>
              <Box sx={{ width: 18, height: 2.5, borderRadius: '2px', background: seriesColors[i] }} />
              <span>{s.label}</span>
            </Stack>
          ))}
        </Stack>
      </Stack>

      {/* Hover tooltip */}
      <Box sx={{ minHeight: 40, mt: 2, mb: 0.5, px: 1.75, py: hp ? 1.25 : 0, borderRadius: '10px', border: hp ? `1px solid ${alpha(colors.accent, 0.2)}` : '1px solid transparent', background: hp ? alpha(colors.accent, 0.06) : 'transparent', transition: 'all 0.18s ease' }}>
        {hp && (
          <Stack direction="row" gap={3} alignItems="center" flexWrap="wrap">
            <Typography sx={{ fontSize: 13, fontWeight: 600, fontFamily: '"Instrument Serif", serif', minWidth: 110 }}>{hp.fullLabel}</Typography>
            {SERIES.map((s, i) => (
              <Stack key={s.key} direction="row" alignItems="center" gap={0.75}>
                <Box sx={{ width: 7, height: 7, borderRadius: '50%', background: seriesColors[i] }} />
                <Typography sx={{ fontSize: 11.5, color: 'text.secondary' }}>{s.label}:</Typography>
                <Typography sx={{ fontSize: 12, fontFamily: '"JetBrains Mono", monospace', fontWeight: 600, color: seriesColors[i] }}>
                  {hp[s.key]}/{s.max}
                </Typography>
              </Stack>
            ))}
            {hp.incentive > 0 && (
              <Stack direction="row" alignItems="center" gap={0.75}>
                <Box sx={{ width: 7, height: 7, borderRadius: '50%', background: colors.accent3 }} />
                <Typography sx={{ fontSize: 11.5, color: 'text.secondary' }}>Incentive:</Typography>
                <Typography sx={{ fontSize: 12, fontFamily: '"JetBrains Mono", monospace', fontWeight: 600, color: colors.accent3 }}>+{hp.incentive}</Typography>
              </Stack>
            )}
          </Stack>
        )}
      </Box>

      <Box sx={{ overflowX: 'auto', overflowY: 'hidden' }}>
        <Box component="svg" viewBox={`0 0 ${W} ${H}`}
          sx={{ display: 'block', minWidth: W, width: '100%', height: H }}
          onMouseLeave={() => setHover(null)}>

          {yTicks.map((v) => {
            const y = yS(v);
            return (
              <g key={v}>
                <line x1={PX} x2={W - PX} y1={y} y2={y} stroke={alpha(colors.ink, v === MAX_TOTAL ? 0.12 : 0.06)} strokeWidth="1"
                  strokeDasharray={v === MAX_TOTAL ? '4 3' : undefined} />
                <text x={PX - 6} y={y + 4} textAnchor="end" fontSize="10" fill={colors.inkDim} fontFamily="JetBrains Mono, monospace">{v}</text>
              </g>
            );
          })}

          {/* Area fill under total */}
          <path
            d={`${linePath('total')} L${xS(points.length - 1).toFixed(1)},${H - PB} L${PX},${H - PB} Z`}
            fill={alpha(colors.accent2, 0.05)}
          />

          {SERIES.map((s, i) => (
            <path key={s.key} d={linePath(s.key)} fill="none"
              stroke={seriesColors[i]}
              strokeWidth={s.key === 'total' ? 3 : 2}
              strokeLinejoin="round" strokeLinecap="round"
              strokeDasharray={undefined}
            />
          ))}

          {hover !== null && (
            <>
              <line x1={xS(hover)} x2={xS(hover)} y1={PT} y2={H - PB}
                stroke={alpha(colors.ink, 0.14)} strokeWidth="1" strokeDasharray="4 3" />
              {SERIES.map((s, i) => (
                <circle key={s.key} cx={xS(hover)} cy={yS(points[hover][s.key])} r="5"
                  fill={seriesColors[i]} stroke={colors.panel} strokeWidth="2" />
              ))}
            </>
          )}

          {points.map((p, i) => {
            const slotW = points.length > 1 ? cW / (points.length - 1) : cW;
            return (
              <g key={i}>
                <rect x={xS(i) - slotW / 2} y={PT} width={slotW} height={cH + PB}
                  fill="transparent" style={{ cursor: 'crosshair' }} onMouseEnter={() => setHover(i)} />
                <text x={xS(i)} y={H - 6} textAnchor="middle" fontSize="10.5"
                  fill={hover === i ? colors.accent : colors.inkDim} fontFamily="Inter, sans-serif"
                  style={{ transition: 'fill 0.15s', fontWeight: hover === i ? 600 : 400 }}>
                  {p.label}
                </text>
              </g>
            );
          })}
        </Box>
      </Box>
    </Box>
  );
}
