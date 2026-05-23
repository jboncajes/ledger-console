import { useMemo, useState } from 'react';
import { Box, IconButton, Stack, Typography, alpha } from '@mui/material';
import ContentCopyRoundedIcon from '@mui/icons-material/ContentCopyRounded';
import CheckRoundedIcon from '@mui/icons-material/CheckRounded';
import type { SlMonthRecord } from '../types/pnl';
import { useColors } from '../theme/theme';
import { SL_CAP_PCT } from '../utils/sl';
import { useCopyCard } from '../hooks/useCopyCard';

interface Props { months: SlMonthRecord[] }

const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function SlMfsrTrend({ months }: Props) {
  const colors = useColors();
  const [hover, setHover] = useState<{ year: number; month: number } | null>(null);
  const { cardRef, copyBtnRef, hovered, setHovered, copied, handleCopy } = useCopyCard();

  // Group by year, only months with data
  const byYear = useMemo(() => {
    const map = new Map<number, Map<number, number>>();
    for (const m of months) {
      if (m.inputs.kwhPurchased <= 0) continue;
      if (!map.has(m.year)) map.set(m.year, new Map());
      map.get(m.year)!.set(m.month, m.inputs.slPerMfsrPct);
    }
    return map;
  }, [months]);

  const allYears = [...byYear.keys()].sort();
  const latestYear = allYears[allYears.length - 1];

  // Only latest year visible by default; previous years toggled individually
  const [visibleYears, setVisibleYears] = useState<Set<number>>(() => new Set(latestYear ? [latestYear] : []));

  // Keep visibleYears in sync when months change (ensure latest year always exists)
  const activeYears = allYears.filter((y) => visibleYears.has(y));

  const toggleYear = (year: number) => {
    setVisibleYears((prev) => {
      const next = new Set(prev);
      if (next.has(year)) next.delete(year);
      else next.add(year);
      return next;
    });
  };

  const YEAR_COLORS = [colors.accent, colors.accent2, '#F59E0B', colors.accent3 ?? '#A78BFA'];
  const yearColor = (year: number) => YEAR_COLORS[allYears.indexOf(year) % YEAR_COLORS.length];

  const W = 800, H = 280, PX = 52, PT = 24, PB = 36;
  const cW = W - PX * 2;
  const cH = H - PT - PB;

  const allVals = [...byYear.values()].flatMap((m) => [...m.values()]);
  const minY = Math.min(0, ...allVals);
  const maxY = Math.max(SL_CAP_PCT * 1.3, ...allVals, 1);
  const yRange = maxY - minY || 1;

  const xS = (monthIdx: number) => PX + (monthIdx / 11) * cW;
  const yS = (v: number) => PT + cH - ((v - minY) / yRange) * cH;

  const rawTicks = [0, 5, 10, SL_CAP_PCT, 15, 20].filter((v) => v >= minY - 0.5 && v <= maxY * 1.05);
  const yTicks = rawTicks.filter((v, i, arr) => i === 0 || Math.abs(yS(v) - yS(arr[i - 1])) > 14);

  const linePath = (monthMap: Map<number, number>) => {
    const pts = [...Array(12).keys()]
      .map((i) => ({ i, v: monthMap.get(i + 1) }))
      .filter((p): p is { i: number; v: number } => p.v !== undefined);
    if (pts.length === 0) return '';
    return pts.map((p, idx) => `${idx === 0 ? 'M' : 'L'}${xS(p.i).toFixed(1)},${yS(p.v).toFixed(1)}`).join(' ');
  };

  const hp = hover && byYear.get(hover.year)?.has(hover.month)
    ? { year: hover.year, month: hover.month, value: byYear.get(hover.year)!.get(hover.month)! }
    : null;

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

      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }} gap={{ xs: 1.5, sm: 0 }}>
        <Box>
          <Typography sx={{ fontFamily: '"Instrument Serif", serif', fontSize: { xs: 18, sm: 22 }, letterSpacing: '-0.3px' }}>
            SL per MFSR Trend{' '}
            <Box component="em" sx={{ fontStyle: 'italic', color: colors.accent }}>· rolling per year</Box>
          </Typography>
          <Typography sx={{ fontSize: 12.5, color: 'text.secondary', mt: 0.5 }}>
            System loss % by calendar month · dashed = {SL_CAP_PCT}% cap
          </Typography>
        </Box>

        {/* Year toggle chips */}
        <Stack direction="row" gap={0.75} flexWrap="wrap" alignItems="center">
          {allYears.map((year) => {
            const isOn = visibleYears.has(year);
            const col  = yearColor(year);
            return (
              <Box
                key={year}
                component="button"
                onClick={() => toggleYear(year)}
                sx={{
                  display: 'flex', alignItems: 'center', gap: 0.75,
                  px: 1.25, py: 0.5, borderRadius: '20px', cursor: 'pointer',
                  fontSize: 12, fontWeight: 600, fontFamily: 'inherit',
                  border: `1.5px solid ${isOn ? col : colors.border}`,
                  background: isOn ? alpha(col, 0.12) : 'transparent',
                  color: isOn ? col : colors.inkSoft,
                  transition: 'all 0.18s',
                  '&:hover': { background: alpha(col, 0.18), borderColor: col, color: col },
                }}
              >
                <Box sx={{ width: 8, height: 8, borderRadius: '50%', background: isOn ? col : colors.border, transition: 'background 0.18s' }} />
                {year}
              </Box>
            );
          })}
        </Stack>
      </Stack>

      {/* Hover tooltip */}
      <Box sx={{ minHeight: 40, mt: 2, mb: 0.5, px: 1.75, py: hp ? 1.25 : 0, borderRadius: '10px', border: hp ? `1px solid ${alpha(colors.accent, 0.2)}` : '1px solid transparent', background: hp ? alpha(colors.accent, 0.06) : 'transparent', transition: 'all 0.18s ease' }}>
        {hp && (
          <Stack direction="row" gap={3} alignItems="center">
            <Typography sx={{ fontSize: 13, fontWeight: 600, fontFamily: '"Instrument Serif", serif' }}>
              {MONTH_SHORT[hp.month - 1]} {hp.year}
            </Typography>
            <Stack direction="row" alignItems="center" gap={0.75}>
              <Box sx={{ width: 7, height: 7, borderRadius: '50%', background: yearColor(hp.year) }} />
              <Typography sx={{ fontSize: 11.5, color: 'text.secondary' }}>SL per MFSR:</Typography>
              <Typography sx={{ fontSize: 12, fontFamily: '"JetBrains Mono", monospace', fontWeight: 600, color: hp.value > SL_CAP_PCT ? colors.danger : colors.accent2 }}>
                {hp.value.toFixed(2)}%
              </Typography>
            </Stack>
            <Typography sx={{ fontSize: 11.5, color: hp.value > SL_CAP_PCT ? colors.danger : colors.accent2 }}>
              {hp.value > SL_CAP_PCT
                ? `▲ ${(hp.value - SL_CAP_PCT).toFixed(2)}% above cap`
                : `▼ ${(SL_CAP_PCT - hp.value).toFixed(2)}% below cap`}
            </Typography>
          </Stack>
        )}
      </Box>

      <Box sx={{ overflowX: 'auto', overflowY: 'hidden' }}>
        <Box component="svg" viewBox={`0 0 ${W} ${H}`}
          sx={{ display: 'block', minWidth: W, width: '100%', height: H }}
          onMouseLeave={() => setHover(null)}>

          {/* Y gridlines */}
          {yTicks.map((v) => {
            const y      = yS(v);
            const isCap  = v === SL_CAP_PCT;
            return (
              <g key={v}>
                <line x1={PX} x2={W - PX} y1={y} y2={y}
                  stroke={isCap ? alpha(colors.danger, 0.35) : alpha(colors.ink, 0.06)}
                  strokeWidth={isCap ? 1.5 : 1}
                  strokeDasharray={isCap ? '6 3' : undefined} />
                <text x={PX - 6} y={y + 4} textAnchor="end" fontSize="10"
                  fill={isCap ? colors.danger : colors.inkDim}
                  fontFamily="JetBrains Mono, monospace" fontWeight={isCap ? 700 : 400}>
                  {v}%
                </text>
              </g>
            );
          })}
          <text x={W - PX + 4} y={yS(SL_CAP_PCT) + 4} fontSize="9" fill={colors.danger}
            fontFamily="Inter, sans-serif" fontWeight={600}>cap</text>

          {/* Lines for visible years */}
          {activeYears.map((year) => {
            const monthMap = byYear.get(year)!;
            const path     = linePath(monthMap);
            if (!path) return null;
            const col  = yearColor(year);
            const pts  = [...Array(12).keys()]
              .map((i) => ({ i, v: monthMap.get(i + 1) }))
              .filter((p): p is { i: number; v: number } => p.v !== undefined);
            return (
              <g key={year}>
                <path
                  d={`${path} L${xS(pts[pts.length-1].i).toFixed(1)},${yS(0).toFixed(1)} L${xS(pts[0].i).toFixed(1)},${yS(0).toFixed(1)} Z`}
                  fill={alpha(col, 0.05)}
                />
                <path d={path} fill="none" stroke={col} strokeWidth={2.5}
                  strokeLinejoin="round" strokeLinecap="round" />
                {hover?.year === year && hover.month && monthMap.has(hover.month) && (
                  <circle cx={xS(hover.month - 1)} cy={yS(monthMap.get(hover.month)!)} r="5"
                    fill={col} stroke={colors.panel} strokeWidth="2" />
                )}
              </g>
            );
          })}

          {/* Hit areas */}
          {[...Array(12).keys()].map((i) => {
            const slotW = cW / 12;
            return (
              <rect key={i}
                x={xS(i) - slotW / 2} y={PT} width={slotW} height={cH + PB}
                fill="transparent" style={{ cursor: 'crosshair' }}
                onMouseEnter={() => {
                  const yr = activeYears.find((y) => byYear.get(y)?.has(i + 1)) ?? activeYears[0];
                  if (yr !== undefined) setHover({ year: yr, month: i + 1 });
                }}
              />
            );
          })}

          {/* X labels */}
          {MONTH_SHORT.map((lbl, i) => (
            <text key={i} x={xS(i)} y={H - 6} textAnchor="middle" fontSize="10.5"
              fill={hover?.month === i + 1 ? colors.accent : colors.inkDim}
              fontFamily="Inter, sans-serif"
              style={{ transition: 'fill 0.15s', fontWeight: hover?.month === i + 1 ? 600 : 400 }}>
              {lbl}
            </text>
          ))}
        </Box>
      </Box>
    </Box>
  );
}
