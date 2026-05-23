import { Box, IconButton, Stack, Typography, alpha, keyframes } from '@mui/material';
import ContentCopyRoundedIcon from '@mui/icons-material/ContentCopyRounded';
import CheckRoundedIcon from '@mui/icons-material/CheckRounded';
import type { KpsMonthRecord, KpsScores } from '../types/pnl';
import { useColors } from '../theme/theme';
import { useCopyCard } from '../hooks/useCopyCard';

const rise = keyframes`
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
`;

const MAX_BASE  = 40;
const MAX_TOTAL = 40;

interface Props {
  scores: KpsScores;
  month: KpsMonthRecord;
}

function Arc({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.min(value / max, 1) : 0;
  const R = 42, SW = 7, C = 50;
  const circumference = Math.PI * R; // half-circle
  const dash = pct * circumference;
  return (
    <svg width="110" height="60" viewBox="0 0 100 56">
      <path
        d={`M ${C - R},${C} A ${R},${R} 0 0 1 ${C + R},${C}`}
        fill="none" stroke={color} strokeOpacity="0.12" strokeWidth={SW}
        strokeLinecap="round"
      />
      <path
        d={`M ${C - R},${C} A ${R},${R} 0 0 1 ${C + R},${C}`}
        fill="none" stroke={color} strokeWidth={SW}
        strokeLinecap="round"
        strokeDasharray={`${dash} ${circumference}`}
        style={{ transition: 'stroke-dasharray 0.7s ease' }}
      />
      <text x={C} y={C - 6} textAnchor="middle" fontSize="20" fontWeight="700"
        fill={color} fontFamily="JetBrains Mono, monospace">{value}</text>
      <text x={C} y={C + 8} textAnchor="middle" fontSize="11"
        fill={color} fontFamily="Inter, sans-serif" opacity="0.65">/ {max}</text>
    </svg>
  );
}

function KpiCard({ label, value, max, color, delay, sub }: {
  label: string; value: number; max: number; color: string; delay: number; sub: string;
}) {
  const colors = useColors();
  const { cardRef, copyBtnRef, hovered, setHovered, copied, handleCopy } = useCopyCard();
  const pct = max > 0 ? ((value / max) * 100).toFixed(1) : '0.0';
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
        p: 3.25,
        animation: `${rise} 0.6s ease both`,
        animationDelay: `${delay}s`,
        boxShadow: `0 20px 60px -20px ${alpha(colors.ink, 0.15)}`,
        transition: 'transform 0.25s, box-shadow 0.25s',
        '&:hover': { transform: 'translateY(-2px)', boxShadow: `0 30px 80px -30px ${alpha(colors.ink, 0.2)}` },
      }}>
      <IconButton ref={copyBtnRef} onClick={handleCopy} onMouseEnter={(e) => e.stopPropagation()} size="small"
        sx={{ position: 'absolute', top: 12, right: 12, width: 28, height: 28, opacity: hovered ? 1 : 0, pointerEvents: hovered ? 'auto' : 'none', transition: 'opacity 0.18s', background: alpha(colors.panel, 0.95), border: `1px solid ${colors.border}`, borderRadius: '8px', zIndex: 1, '&:hover': { background: alpha(colors.ink, 0.08), borderColor: colors.borderStrong } }}>
        {copied ? <CheckRoundedIcon sx={{ fontSize: 13, color: colors.accent2 }} /> : <ContentCopyRoundedIcon sx={{ fontSize: 13 }} />}
      </IconButton>
      <Typography sx={{ fontSize: 11.5, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '1.2px', fontWeight: 500, mb: 2 }}>
        {label}
      </Typography>
      <Stack direction="row" alignItems="flex-end" justifyContent="space-between" gap={1}>
        <Box>
          <Box sx={{ fontFamily: '"Instrument Serif", serif', fontSize: 56, lineHeight: 1, letterSpacing: '-1px' }}>
            <Box component="span" sx={{ fontSize: 28, color: color, mr: 0.25, fontFamily: 'inherit' }}>{value}</Box>
            <Box component="span" sx={{ fontSize: 20, color: 'text.secondary' }}>/{max}</Box>
          </Box>
          <Typography sx={{ fontSize: 12, color: colors.inkSoft, mt: 0.75 }}>{sub}</Typography>
        </Box>
        <Arc value={value} max={max} color={color} />
      </Stack>
      <Stack direction="row" alignItems="center" gap={1} sx={{ mt: 2.5 }}>
        <Box sx={{
          px: 1, py: 0.3, borderRadius: '6px', fontSize: 11.5, fontWeight: 600,
          fontFamily: '"JetBrains Mono", monospace',
          background: alpha(color, 0.12), color,
        }}>
          {pct}%
        </Box>
        <Typography sx={{ fontSize: 11.5, color: colors.inkSoft }}>achievement</Typography>
      </Stack>
      <Box sx={{ mt: 2, height: 6, borderRadius: 99, background: `linear-gradient(90deg, ${color}, ${alpha(color, 0.3)})` }} />
    </Box>
  );
}

export function KpsKpiGrid({ scores, month }: Props) {
  const colors = useColors();
  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2, '@media (max-width: 900px)': { gridTemplateColumns: '1fr' } }}>
      <KpiCard
        label="Total Points"
        value={scores.totalPoints}
        max={MAX_TOTAL}
        color={scores.totalPoints >= 35 ? colors.accent2 : scores.totalPoints >= 25 ? '#F59E0B' : colors.danger}
        delay={0.05}
        sub={month.label}
      />
      <KpiCard
        label="Base Score"
        value={scores.baseTotal}
        max={MAX_BASE}
        color={colors.accent}
        delay={0.1}
        sub="Excl. incentive points"
      />
      <KpiCard
        label="Incentive Points"
        value={scores.incentivePoints}
        max={2}
        color={scores.incentivePoints > 0 ? colors.accent2 : colors.inkDim}
        delay={0.15}
        sub="Advance 2 Qtrs Amortization"
      />
    </Box>
  );
}
