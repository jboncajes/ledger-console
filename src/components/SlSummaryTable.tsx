import { Box, IconButton, MenuItem, Select, Stack, Typography, alpha } from '@mui/material';
import ContentCopyRoundedIcon from '@mui/icons-material/ContentCopyRounded';
import CheckRoundedIcon from '@mui/icons-material/CheckRounded';
import type { SlMonthRecord } from '../types/pnl';
import { useColors } from '../theme/theme';
import { PESO } from '../utils/format';
import { computeSlValues, SL_CAP_PCT } from '../utils/sl';
import { useCopyCard } from '../hooks/useCopyCard';

interface Props {
  months: SlMonthRecord[];
  selectedYear: number;
  availableYears: number[];
  onYearChange: (y: number) => void;
}

function fmtKwh(n: number): string {
  const r = Math.round(n);
  if (r < 0) return `(${Math.abs(r).toLocaleString('en-PH')})`;
  return r.toLocaleString('en-PH');
}

function fmtPct(n: number): string {
  return `${n.toFixed(2)}%`;
}

function fmtPeso(n: number): string {
  if (n < 0) return `(${PESO}${Math.abs(n).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })})`;
  return `${PESO}${n.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function fmtRate(n: number): string {
  return n.toFixed(4);
}

interface CellProps {
  children: React.ReactNode;
  bold?: boolean;
  right?: boolean;
  highlight?: boolean;
  dim?: boolean;
  negative?: boolean;
  span?: number;
  center?: boolean;
}

function Th({ children, span, center }: { children: React.ReactNode; span?: number; center?: boolean }) {
  const colors = useColors();
  return (
    <Box
      component="th"
      colSpan={span}
      sx={{
        px: 1,
        py: 0.75,
        fontSize: 10,
        fontWeight: 700,
        textTransform: 'uppercase',
        letterSpacing: '0.8px',
        color: colors.inkSoft,
        background: alpha(colors.ink, 0.03),
        borderBottom: `1px solid ${colors.border}`,
        textAlign: center ? 'center' : 'left',
        whiteSpace: 'nowrap',
      }}
    >
      {children}
    </Box>
  );
}

function Td({ children, bold, right, highlight, dim, negative }: CellProps) {
  const colors = useColors();
  return (
    <Box
      component="td"
      sx={{
        px: 1,
        py: 0.9,
        fontSize: 12.5,
        fontFamily: '"JetBrains Mono", monospace',
        fontWeight: bold ? 700 : 400,
        textAlign: right ? 'right' : 'left',
        color: highlight
          ? colors.accent3 ?? '#F59E0B'
          : negative
          ? colors.danger
          : dim
          ? colors.inkSoft
          : 'inherit',
        borderBottom: `1px solid ${alpha(colors.border, 0.5)}`,
        whiteSpace: 'nowrap',
      }}
    >
      {children}
    </Box>
  );
}

export function SlSummaryTable({ months, selectedYear, availableYears, onYearChange }: Props) {
  const colors = useColors();
  const { cardRef, copyBtnRef, hovered, setHovered, copied, handleCopy } = useCopyCard();

  const sorted = [...months].sort((a, b) => a.month - b.month);
  const hasData = sorted.some((m) => m.inputs.kwhPurchased > 0);

  // To Date totals (only months with data)
  const dataMonths = sorted.filter((m) => m.inputs.kwhPurchased > 0);
  const totals = dataMonths.reduce(
    (acc, m) => {
      const c = computeSlValues(m.inputs);
      acc.kwhPurchased      += m.inputs.kwhPurchased;
      acc.slWithinCapKwh    += c.slWithinCapKwh;
      acc.slPerMfsrKwh      += c.slPerMfsrKwh;
      acc.slInExcessKwh     += c.slInExcessKwh;
      acc.foregoneRevenue   += c.foregoneRevenuePesos;
      acc.systemLoss        += c.systemLossPesos;
      acc.systemsRateSum    += m.inputs.systemsRate;
      acc.powerRateSum      += m.inputs.powerRate;
      acc.count             += 1;
      return acc;
    },
    { kwhPurchased: 0, slWithinCapKwh: 0, slPerMfsrKwh: 0, slInExcessKwh: 0, foregoneRevenue: 0, systemLoss: 0, systemsRateSum: 0, powerRateSum: 0, count: 0 },
  );

  const totalSlPerMfsrPct   = totals.kwhPurchased > 0 ? (totals.slPerMfsrKwh / totals.kwhPurchased) * 100 : 0;
  const totalSlInExcessPct  = totals.kwhPurchased > 0 ? (totals.slInExcessKwh / totals.kwhPurchased) * 100 : 0;
  const avgSystemsRate      = totals.count > 0 ? totals.systemsRateSum / totals.count : 0;
  const avgPowerRate        = totals.count > 0 ? totals.powerRateSum / totals.count : 0;

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
        overflow: 'hidden',
      }}
    >
      <IconButton ref={copyBtnRef} onClick={handleCopy} onMouseEnter={(e) => e.stopPropagation()} size="small"
        sx={{ position: 'absolute', top: 12, right: 12, width: 28, height: 28, opacity: hovered ? 1 : 0, pointerEvents: hovered ? 'auto' : 'none', transition: 'opacity 0.18s', background: alpha(colors.panel, 0.95), border: `1px solid ${colors.border}`, borderRadius: '8px', zIndex: 1, '&:hover': { background: alpha(colors.ink, 0.08), borderColor: colors.borderStrong } }}>
        {copied ? <CheckRoundedIcon sx={{ fontSize: 13, color: colors.accent2 }} /> : <ContentCopyRoundedIcon sx={{ fontSize: 13 }} />}
      </IconButton>

      {/* Header */}
      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }} gap={2} mb={2.5}>
        <Box>
          <Typography sx={{ fontFamily: '"Instrument Serif", serif', fontSize: { xs: 18, sm: 22 }, letterSpacing: '-0.3px' }}>
            Summary of Systems Losses
          </Typography>
          <Typography sx={{ fontSize: 12.5, color: 'text.secondary', mt: 0.5 }}>
            Cap: {SL_CAP_PCT}% · All KWh and peso values
          </Typography>
        </Box>
        <Box data-copy-hide="true">
          <Select value={selectedYear} onChange={(e) => onYearChange(Number(e.target.value))} size="small"
            sx={{ minWidth: 110, fontSize: 13, fontWeight: 500, '.MuiOutlinedInput-notchedOutline': { borderColor: colors.border }, '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: colors.borderStrong }, '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: colors.accent } }}>
            {availableYears.map((y) => (
              <MenuItem key={y} value={y} sx={{ fontSize: 13 }}>{y}</MenuItem>
            ))}
          </Select>
        </Box>
      </Stack>

      {/* Table */}
      <Box data-copy-scroll sx={{ overflowX: 'auto' }}>
        <Box component="table" sx={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead>
            <Box component="tr">
              <Th>Month</Th>
              <Th center>KWh Purchased</Th>
              <Th center>SL within cap {SL_CAP_PCT}%<br />(kwh)</Th>
              <Th center>SL per MFSR<br />(%)</Th>
              <Th center>SL per MFSR<br />(kwh)</Th>
              <Th center>SL in EXCESS<br />(%)</Th>
              <Th center>SL in EXCESS<br />(kwh)</Th>
              <Th center>Systems Rate</Th>
              <Th center>Foregone Revenue<br />in Pesos</Th>
              <Th center>Power Rate</Th>
              <Th center>System Loss<br />in Pesos</Th>
            </Box>
          </thead>
          <tbody>
            {/* Year header */}
            <Box component="tr" sx={{ background: alpha(colors.accent, 0.06) }}>
              <Box component="td" colSpan={11} sx={{ px: 1.5, py: 0.75, fontSize: 11, fontWeight: 700, color: colors.accent, textTransform: 'uppercase', letterSpacing: '0.8px', borderBottom: `1px solid ${colors.border}` }}>
                {selectedYear}
              </Box>
            </Box>

            {sorted.map((m) => {
              const c = computeSlValues(m.inputs);
              const hasEntry = m.inputs.kwhPurchased > 0;
              return (
                <Box component="tr" key={m.id} sx={{ '&:hover': { background: alpha(colors.ink, 0.02) } }}>
                  <Box component="td" sx={{ px: 1, py: 0.9, fontSize: 13, fontWeight: 500, borderBottom: `1px solid ${alpha(colors.border, 0.5)}`, whiteSpace: 'nowrap' }}>
                    {m.label.split(' ')[0]}
                  </Box>
                  <Td right>{hasEntry ? fmtKwh(m.inputs.kwhPurchased) : '—'}</Td>
                  <Td right>{hasEntry ? fmtKwh(c.slWithinCapKwh) : '—'}</Td>
                  <Td right>{hasEntry ? fmtPct(m.inputs.slPerMfsrPct) : '—'}</Td>
                  <Td right>{hasEntry ? fmtKwh(c.slPerMfsrKwh) : '—'}</Td>
                  <Td right negative={hasEntry && c.slInExcessPct < 0}>{hasEntry ? fmtPct(c.slInExcessPct) : '—'}</Td>
                  <Td right negative={hasEntry && c.slInExcessKwh < 0}>{hasEntry ? fmtKwh(c.slInExcessKwh) : '—'}</Td>
                  <Td right dim>{hasEntry ? fmtRate(m.inputs.systemsRate) : '—'}</Td>
                  <Td right highlight={hasEntry && c.foregoneRevenuePesos >= 0} negative={hasEntry && c.foregoneRevenuePesos < 0}>{hasEntry ? fmtPeso(c.foregoneRevenuePesos) : '—'}</Td>
                  <Td right dim>{hasEntry ? fmtRate(m.inputs.powerRate) : '—'}</Td>
                  <Td right highlight={hasEntry && c.systemLossPesos >= 0} negative={hasEntry && c.systemLossPesos < 0}>{hasEntry ? fmtPeso(c.systemLossPesos) : '—'}</Td>
                </Box>
              );
            })}

            {/* To Date row */}
            {hasData && (
              <Box component="tr" sx={{ background: alpha(colors.accent, 0.04), borderTop: `2px solid ${colors.border}` }}>
                <Box component="td" sx={{ px: 1, py: 1, fontSize: 13, fontWeight: 700, borderTop: `2px solid ${colors.border}`, whiteSpace: 'nowrap' }}>
                  To Date
                </Box>
                <Td right bold>{fmtKwh(totals.kwhPurchased)}</Td>
                <Td right bold>{fmtKwh(totals.slWithinCapKwh)}</Td>
                <Td right bold>{fmtPct(totalSlPerMfsrPct)}</Td>
                <Td right bold>{fmtKwh(totals.slPerMfsrKwh)}</Td>
                <Td right bold negative={totalSlInExcessPct < 0}>{fmtPct(totalSlInExcessPct)}</Td>
                <Td right bold negative={totals.slInExcessKwh < 0}>{fmtKwh(totals.slInExcessKwh)}</Td>
                <Td right dim>{fmtRate(avgSystemsRate)}</Td>
                <Td right bold highlight={totals.foregoneRevenue >= 0} negative={totals.foregoneRevenue < 0}>{fmtPeso(totals.foregoneRevenue)}</Td>
                <Td right dim>{fmtRate(avgPowerRate)}</Td>
                <Td right bold highlight={totals.systemLoss >= 0} negative={totals.systemLoss < 0}>{fmtPeso(totals.systemLoss)}</Td>
              </Box>
            )}
          </tbody>
        </Box>
      </Box>
    </Box>
  );
}
