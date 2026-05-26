import { Box, IconButton, MenuItem, Select, Stack, Typography, alpha } from '@mui/material';
import ContentCopyRoundedIcon from '@mui/icons-material/ContentCopyRounded';
import CheckRoundedIcon from '@mui/icons-material/CheckRounded';
import type { KpsInputs, KpsMonthRecord, KpsScores } from '../types/pnl';
import { useColors } from '../theme/theme';
import { fmtMillions, PESO } from '../utils/format';
import { useCopyCard } from '../hooks/useCopyCard';

interface Props {
  months: KpsMonthRecord[];
  selectedId: string;
  onSelectMonth: (id: string) => void;
  scores: KpsScores;
  inputs: KpsInputs;
}

interface RowDef {
  type: 'section' | 'subsection' | 'param';
  label: string;
  standard?: string;
  maxScore?: number;
  scoreKey?: keyof KpsScores;
  format?: (i: KpsInputs) => string;
  indent?: number;
}

const ROWS: RowDef[] = [
  { type: 'section', label: '1. Leverage' },
  { type: 'param', label: 'Debt Ratio', standard: 'Up to 0.60', maxScore: 2, scoreKey: 'debtRatio',
    format: (i) => i.debtRatio > 0 ? i.debtRatio.toFixed(2) : '—' },

  { type: 'section', label: '2. Liquidity' },
  { type: 'param', label: 'Working Capital Ratio', standard: 'At least 1.00', maxScore: 2, scoreKey: 'workingCapitalRatio',
    format: (i) => i.workingCapitalRatio > 0 ? i.workingCapitalRatio.toFixed(2) : '—' },

  { type: 'section', label: '3. Efficiency' },
  { type: 'subsection', label: '3.1 Payment to Power Supplier', indent: 1 },
  { type: 'param', label: 'Payment to GENCO', standard: 'Current', maxScore: 10, scoreKey: 'paymentGenco',
    format: (i) => i.paymentGenco ? 'Current' : 'Not Current', indent: 2 },
  { type: 'param', label: 'Payment to Transmission', standard: 'Current', maxScore: 3, scoreKey: 'paymentTransmission',
    format: (i) => i.paymentTransmission ? 'Current' : 'Not Current', indent: 2 },
  { type: 'param', label: 'Payment to NEA', standard: 'Current', maxScore: 3, scoreKey: 'paymentNea',
    format: (i) => i.paymentNea ? 'Current' : 'Not Current', indent: 1 },
  { type: 'param', label: 'Payment to Banks', standard: 'Current', maxScore: 3, scoreKey: 'paymentBanks',
    format: (i) => i.paymentBanks ? 'Current' : 'Not Current', indent: 1 },
  { type: 'subsection', label: '3.4 Collection Efficiency', indent: 1 },
  { type: 'param', label: 'Average Method', standard: '97% and above', maxScore: 5, scoreKey: 'collectionAvg',
    format: (i) => i.collectionAvg > 0 ? `${i.collectionAvg.toFixed(2)}%` : '—', indent: 2 },
  { type: 'param', label: 'Current to Current Method', standard: '99% and above', maxScore: 4, scoreKey: 'collectionC2C',
    format: (i) => i.collectionC2C > 0 ? `${i.collectionC2C.toFixed(2)}%` : '—', indent: 2 },

  { type: 'section', label: '4. Financial Operation – Profitability' },
  { type: 'param', label: 'Profitability', standard: 'Positive', maxScore: 3, scoreKey: 'profitability',
    format: (i) => i.profitability !== 0 ? `${i.profitability < 0 ? '−' : ''}${PESO}${fmtMillions(Math.abs(i.profitability))}M` : '—' },

  { type: 'section', label: '5. NEA Audit Rating' },
  { type: 'param', label: 'Audit Rating', standard: 'Not less than 90%', maxScore: 5, scoreKey: 'neaAuditRating',
    format: (i) => i.neaAuditRating > 0 ? `${i.neaAuditRating.toFixed(0)}%` : '—' },
];

function ScoreBadge({ score, max }: { score: number; max: number }) {
  const colors = useColors();
  const full  = score === max;
  const zero  = score === 0;
  const color = full ? colors.accent2 : zero ? colors.danger : '#F59E0B';
  return (
    <Box sx={{ display: 'inline-flex', alignItems: 'center', px: 1, py: 0.25, borderRadius: '6px', background: alpha(color, 0.1), color, fontSize: 12, fontWeight: 700, fontFamily: '"JetBrains Mono", monospace', flexShrink: 0 }}>
      {score}
    </Box>
  );
}

export function KpsScorecard({ months, selectedId, onSelectMonth, scores, inputs }: Props) {
  const colors = useColors();
  const { cardRef, copyBtnRef, hovered, setHovered, copied, handleCopy } = useCopyCard();
  const sorted = [...months].sort((a, b) => a.id.localeCompare(b.id));
  const years  = [...new Set(sorted.map((m) => m.year))];

  return (
    <Box
      ref={cardRef}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      sx={{ position: 'relative', background: colors.panel, border: `1px solid ${colors.border}`, borderRadius: '18px', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', p: 3, boxShadow: `0 20px 60px -20px ${alpha(colors.ink, 0.15)}` }}
    >
      <IconButton ref={copyBtnRef} onClick={handleCopy} onMouseEnter={(e) => e.stopPropagation()} size="small"
        sx={{ position: 'absolute', top: 12, right: 12, width: 28, height: 28, opacity: hovered ? 1 : 0, pointerEvents: hovered ? 'auto' : 'none', transition: 'opacity 0.18s', background: alpha(colors.panel, 0.95), border: `1px solid ${colors.border}`, borderRadius: '8px', zIndex: 1, '&:hover': { background: alpha(colors.ink, 0.08), borderColor: colors.borderStrong } }}>
        {copied ? <CheckRoundedIcon sx={{ fontSize: 13, color: colors.accent2 }} /> : <ContentCopyRoundedIcon sx={{ fontSize: 13 }} />}
      </IconButton>

      {/* Header */}
      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }} gap={2} mb={3}>
        <Box>
          <Typography sx={{ fontFamily: '"Instrument Serif", serif', fontSize: { xs: 18, sm: 22 }, letterSpacing: '-0.3px' }}>
            KPS Scorecard
          </Typography>
          <Typography sx={{ fontSize: 12.5, color: 'text.secondary', mt: 0.5 }}>
            Financial parameters · scores auto-computed from inputs
          </Typography>
        </Box>
        <Box data-copy-hide="true">
          <Select value={selectedId} onChange={(e) => onSelectMonth(e.target.value)} size="small"
            sx={{ minWidth: 180, fontSize: 13, fontWeight: 500, '.MuiOutlinedInput-notchedOutline': { borderColor: colors.border }, '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: colors.borderStrong }, '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: colors.accent } }}>
            {years.map((year) => [
              <MenuItem key={`hdr-${year}`} disabled sx={{ fontSize: 10, letterSpacing: '1.4px', textTransform: 'uppercase', color: colors.inkSoft, py: 0.5 }}>{year}</MenuItem>,
              ...sorted.filter((m) => m.year === year).map((m) => (
                <MenuItem key={m.id} value={m.id} sx={{ fontSize: 13 }}>{m.label}</MenuItem>
              )),
            ])}
          </Select>
        </Box>
      </Stack>

      {/* Table header */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 80px 60px', sm: '1fr 110px 44px 80px 68px' }, gap: 1, px: 1.5, pb: 1, borderBottom: `2px solid ${colors.border}` }}>
        {['Financial Parameter', 'Standard', 'Max', 'PL', 'Score'].map((h) => (
          <Typography key={h} sx={{ fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '1.2px', color: colors.inkSoft, fontWeight: 600, textAlign: h === 'Max' || h === 'Score' ? 'center' : 'left', display: (h === 'Standard' || h === 'Max') ? { xs: 'none', sm: 'block' } : 'block' }}>{h}</Typography>
        ))}
      </Box>

      {/* Rows */}
      <Stack>
        {ROWS.map((row, idx) => {
          if (row.type === 'section') {
            return (
              <Box key={idx} sx={{ px: 1.5, py: 1, mt: idx > 0 ? 1 : 0, background: alpha(colors.accent, 0.04), borderLeft: `2px solid ${colors.accent}`, borderRadius: '0 8px 8px 0' }}>
                <Typography sx={{ fontSize: 11.5, fontWeight: 700, color: colors.accent, textTransform: 'uppercase', letterSpacing: '0.8px' }}>{row.label}</Typography>
              </Box>
            );
          }
          if (row.type === 'subsection') {
            return (
              <Box key={idx} sx={{ px: 1.5, py: 0.75, pl: `${(row.indent ?? 1) * 16 + 6}px` }}>
                <Typography sx={{ fontSize: 11.5, fontWeight: 600, color: 'text.secondary', fontStyle: 'italic' }}>{row.label}</Typography>
              </Box>
            );
          }

          const score = row.scoreKey ? (scores[row.scoreKey] as number) : 0;
          const plValue = row.format ? row.format(inputs) : '—';
          const isMet = row.maxScore ? score === row.maxScore : false;
          const isZero = score === 0;
          const valueColor = isMet ? colors.accent2 : isZero ? colors.danger : '#F59E0B';

          return (
            <Box key={idx} sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 80px 60px', sm: '1fr 110px 44px 80px 68px' }, gap: 1, px: 1.5, py: 1, pl: `${(row.indent ?? 0) * 16 + 6}px`, alignItems: 'center', borderRadius: '8px', transition: 'background 0.15s', '&:hover': { background: alpha(colors.ink, 0.025) } }}>
              <Typography sx={{ fontSize: 13, fontWeight: 500 }}>{row.label}</Typography>
              <Typography sx={{ fontSize: 12, color: colors.inkSoft, display: { xs: 'none', sm: 'block' } }}>{row.standard}</Typography>
              <Typography sx={{ fontSize: 12, fontFamily: '"JetBrains Mono", monospace', color: colors.inkDim, textAlign: 'center', display: { xs: 'none', sm: 'block' } }}>{row.maxScore}</Typography>
              <Typography sx={{ fontSize: 12.5, fontFamily: '"JetBrains Mono", monospace', fontWeight: 600, color: valueColor, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {plValue}
              </Typography>
              <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                {row.scoreKey && <ScoreBadge score={score} max={row.maxScore ?? 0} />}
              </Box>
            </Box>
          );
        })}
      </Stack>

      {/* Totals footer */}
      <Box sx={{ mt: 2, pt: 2, borderTop: `2px solid ${colors.border}` }}>
        <Stack gap={1}>
          {[
            { label: 'Base Score', value: scores.baseTotal, max: 40, color: colors.accent },
            { label: 'Incentive Points', value: scores.incentivePoints, max: 2, color: scores.incentivePoints > 0 ? colors.accent3 ?? colors.accent : colors.inkDim },
          ].map((r) => (
            <Box key={r.label} sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 80px 60px', sm: '1fr 110px 44px 80px 68px' }, gap: 1, px: 1.5, alignItems: 'center' }}>
              <Typography sx={{ fontSize: 13, fontWeight: 600, color: 'text.primary' }}>{r.label}</Typography>
              <Box sx={{ display: { xs: 'none', sm: 'block' } }} />
              <Typography sx={{ fontSize: 12, fontFamily: '"JetBrains Mono", monospace', color: colors.inkDim, textAlign: 'center' }}>{r.max}</Typography>
              <Box sx={{ display: { xs: 'none', sm: 'block' } }} />
              <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                <ScoreBadge score={r.value} max={r.max} />
              </Box>
            </Box>
          ))}

          {/* Grand total */}
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 80px 60px', sm: '1fr 110px 44px 80px 68px' }, gap: 1, px: 1.5, py: 1.25, mt: 0.5, borderRadius: '10px', background: alpha(scores.totalPoints >= 35 ? colors.accent2 : scores.totalPoints >= 25 ? '#F59E0B' : colors.danger, 0.08), border: `1px solid ${alpha(scores.totalPoints >= 35 ? colors.accent2 : '#F59E0B', 0.2)}`, alignItems: 'center' }}>
            <Typography sx={{ fontSize: 14, fontWeight: 700 }}>TOTAL POINTS</Typography>
            <Box sx={{ display: { xs: 'none', sm: 'block' } }} />
            <Typography sx={{ fontSize: 12, fontFamily: '"JetBrains Mono", monospace', color: colors.inkDim, textAlign: 'center' }}>40</Typography>
            <Box sx={{ display: { xs: 'none', sm: 'block' } }} />
            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
              <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, px: 1.25, py: 0.4, borderRadius: '8px', background: alpha(scores.totalPoints >= 35 ? colors.accent2 : scores.totalPoints >= 25 ? '#F59E0B' : colors.danger, 0.12), color: scores.totalPoints >= 35 ? colors.accent2 : scores.totalPoints >= 25 ? '#F59E0B' : colors.danger, fontSize: 14, fontWeight: 800, fontFamily: '"JetBrains Mono", monospace' }}>
                {scores.totalPoints}
                <Box component="span" sx={{ opacity: 0.55, fontSize: 12, fontWeight: 600 }}>/40</Box>
              </Box>
            </Box>
          </Box>
        </Stack>
      </Box>
    </Box>
  );
}
