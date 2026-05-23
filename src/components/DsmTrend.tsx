import { useState } from 'react';
import { Box, IconButton, Stack, Typography, alpha } from '@mui/material';
import ContentCopyRoundedIcon from '@mui/icons-material/ContentCopyRounded';
import CheckRoundedIcon from '@mui/icons-material/CheckRounded';
import type { DsmMonthRecord } from '../types/pnl';
import { useColors } from '../theme/theme';
import { fmtMillions, PESO } from '../utils/format';
import { computeDsmPeriod } from '../utils/dsm';
import { useCopyCard } from '../hooks/useCopyCard';

interface Props {
  months: DsmMonthRecord[];
}

const SERIES = [
  { key: 'totalRev' as const,  label: 'Total Revenue'   },
  { key: 'totalExp' as const,  label: 'Total Expenses'  },
  { key: 'netSavings' as const, label: 'Net Savings'    },
];

export function DsmTrend({ months }: Props) {
  const colors = useColors();
  const [hover, setHover] = useState<number | null>(null);
  const { cardRef, copyBtnRef, hovered, setHovered, copied, handleCopy } = useCopyCard();

  const sorted = [...months].sort((a, b) => a.id.localeCompare(b.id));
  const recent = sorted.slice(-12);

  const points = recent.map((m) => {
    const c = computeDsmPeriod(m.inputs);
    const short = m.label.slice(0, 3) + ' \'' + m.year.toString().slice(2);
    return { label: short, fullLabel: m.label, totalRev: c.totalRev, totalExp: c.totalExp, netSavings: c.netSavings };
  });

  const seriesColors = [colors.accent2, colors.danger, colors.accent];

  const W = 800, H = 320, PX = 62, PT = 28, PB = 36;
  const cW = W - PX * 2;
  const cH = H - PT - PB;

  const allVals = points.flatMap((p) => [p.totalRev, p.totalExp, p.netSavings]);
  const minY = Math.min(...allVals, 0);
  const maxY = Math.max(...allVals, 1);
  const yRange = maxY - minY || 1;

  const yS = (v: number) => PT + cH - ((v - minY) / yRange) * cH;
  const xS = (i: number) => PX + (i / Math.max(points.length - 1, 1)) * cW;

  const linePath = (key: 'totalRev' | 'totalExp' | 'netSavings') =>
    points.map((p, i) => `${i === 0 ? 'M' : 'L'}${xS(i).toFixed(1)},${yS(p[key]).toFixed(1)}`).join(' ');

  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((t) => ({ t, val: maxY - t * yRange, y: PT + cH * t }));

  const zeroY = yS(0);
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

      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems="flex-start" gap={{ xs: 1.5, sm: 0 }}>
        <Box>
          <Typography sx={{ fontFamily: '"Instrument Serif", serif', fontSize: { xs: 18, sm: 22 }, letterSpacing: '-0.3px' }}>
            Net Savings Trend{' '}
            <Box component="em" sx={{ fontStyle: 'italic', color: colors.accent2 }}>· 12-month rolling</Box>
          </Typography>
          <Typography sx={{ fontSize: 12.5, color: 'text.secondary', mt: 0.5 }}>
            DSM revenue, expenses, and net savings over time
          </Typography>
        </Box>
        <Stack direction="row" gap={2} flexWrap="wrap" sx={{ fontSize: 11.5, color: 'text.secondary', pt: { xs: 0, sm: 0.5 } }}>
          {SERIES.map((s, i) => (
            <Stack key={s.key} direction="row" alignItems="center" gap={0.75}>
              <Box sx={{ width: 18, height: 2.5, borderRadius: '2px', background: seriesColors[i] }} />
              <span>{s.label}</span>
            </Stack>
          ))}
        </Stack>
      </Stack>

      {/* Hover tooltip row */}
      <Box
        sx={{
          minHeight: 44,
          mt: 2,
          mb: 0.5,
          px: 1.75,
          py: hp ? 1.25 : 0,
          borderRadius: '10px',
          border: hp ? `1px solid ${alpha(colors.accent2, 0.2)}` : '1px solid transparent',
          background: hp ? alpha(colors.accent2, 0.06) : 'transparent',
          transition: 'all 0.18s ease',
        }}
      >
        {hp && (
          <Stack direction="row" gap={3} alignItems="center" flexWrap="wrap">
            <Typography sx={{ fontSize: 13, fontWeight: 600, fontFamily: '"Instrument Serif", serif', minWidth: 110 }}>
              {hp.fullLabel}
            </Typography>
            {SERIES.map((s, i) => (
              <Stack key={s.key} direction="row" alignItems="center" gap={0.75}>
                <Box sx={{ width: 7, height: 7, borderRadius: '50%', background: seriesColors[i] }} />
                <Typography sx={{ fontSize: 11.5, color: 'text.secondary' }}>{s.label}:</Typography>
                <Typography sx={{
                  fontSize: 12, fontFamily: '"JetBrains Mono", monospace', fontWeight: 600,
                  color: s.key === 'netSavings'
                    ? (hp.netSavings >= 0 ? colors.accent2 : colors.danger)
                    : seriesColors[i],
                }}>
                  {hp[s.key] < 0 ? '−' : ''}{PESO}{fmtMillions(Math.abs(hp[s.key]))}M
                </Typography>
              </Stack>
            ))}
          </Stack>
        )}
      </Box>

      <Box sx={{ overflowX: 'auto', overflowY: 'hidden' }}>
        <Box
          component="svg"
          viewBox={`0 0 ${W} ${H}`}
          sx={{ display: 'block', minWidth: W, width: '100%', height: H }}
          onMouseLeave={() => setHover(null)}
        >
          {/* Zero baseline (visible when net savings can go negative) */}
          {minY < 0 && (
            <line
              x1={PX} x2={W - PX} y1={zeroY} y2={zeroY}
              stroke={alpha(colors.ink, 0.18)} strokeWidth="1" strokeDasharray="6 3"
            />
          )}

          {yTicks.map(({ t, val, y }) => (
            <g key={t}>
              <line x1={PX} x2={W - PX} y1={y} y2={y} stroke={alpha(colors.ink, 0.07)} strokeWidth="1" />
              <text x={PX - 8} y={y + 4} textAnchor="end" fontSize="10"
                fill={colors.inkDim} fontFamily="JetBrains Mono, monospace">
                {val < 0 ? '−' : ''}{PESO}{fmtMillions(Math.abs(val))}M
              </text>
            </g>
          ))}

          {/* Soft area fill under revenue */}
          <path
            d={`${linePath('totalRev')} L${xS(points.length - 1).toFixed(1)},${Math.min(zeroY, H - PB)} L${PX},${Math.min(zeroY, H - PB)} Z`}
            fill={alpha(colors.accent2, 0.05)}
          />

          {/* Net savings area fill (positive only) */}
          {points.length > 0 && (() => {
            const aPath = points.map((p, i) => {
              const y = yS(Math.max(p.netSavings, 0));
              return `${i === 0 ? 'M' : 'L'}${xS(i).toFixed(1)},${y.toFixed(1)}`;
            }).join(' ');
            return (
              <path
                d={`${aPath} L${xS(points.length - 1).toFixed(1)},${zeroY.toFixed(1)} L${PX},${zeroY.toFixed(1)} Z`}
                fill={alpha(colors.accent, 0.07)}
              />
            );
          })()}

          {SERIES.map((s, i) => (
            <path key={s.key} d={linePath(s.key)} fill="none"
              stroke={seriesColors[i]}
              strokeWidth={s.key === 'netSavings' ? 3 : 2}
              strokeLinejoin="round" strokeLinecap="round"
              strokeDasharray={s.key === 'totalExp' ? '6 3' : undefined}
            />
          ))}

          {hover !== null && (
            <>
              <line
                x1={xS(hover)} x2={xS(hover)} y1={PT} y2={H - PB}
                stroke={alpha(colors.ink, 0.14)} strokeWidth="1" strokeDasharray="4 3"
              />
              {SERIES.map((s, i) => (
                <circle key={s.key}
                  cx={xS(hover)} cy={yS(points[hover][s.key])} r="5"
                  fill={seriesColors[i]} stroke={colors.panel} strokeWidth="2"
                />
              ))}
            </>
          )}

          {points.map((p, i) => {
            const slotW = points.length > 1 ? cW / (points.length - 1) : cW;
            return (
              <g key={i}>
                <rect
                  x={xS(i) - slotW / 2} y={PT}
                  width={slotW} height={cH + PB}
                  fill="transparent" style={{ cursor: 'crosshair' }}
                  onMouseEnter={() => setHover(i)}
                />
                <text x={xS(i)} y={H - 6} textAnchor="middle" fontSize="10.5"
                  fill={hover === i ? colors.accent2 : colors.inkDim}
                  fontFamily="Inter, sans-serif"
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
