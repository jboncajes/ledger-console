import { useEffect, useRef, useState } from 'react';
import { Box, Button, Drawer, FormControlLabel, IconButton, MenuItem, Select, Stack, Switch, Typography, alpha } from '@mui/material';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import ChevronLeftRoundedIcon from '@mui/icons-material/ChevronLeftRounded';
import ChevronRightRoundedIcon from '@mui/icons-material/ChevronRightRounded';
import RestartAltRoundedIcon from '@mui/icons-material/RestartAltRounded';
import type { KpsInputs, KpsMonthRecord } from '../types/pnl';
import { useColors } from '../theme/theme';
import { computeKpsScores } from '../utils/kps';

interface Props {
  open: boolean;
  onClose: () => void;
  months: KpsMonthRecord[];
  selectedId: string;
  onSelectMonth: (id: string) => void;
  updateMonthField: (id: string, field: keyof KpsInputs, value: number | boolean) => void;
  resetMonth: (id: string) => void;
}

function displayNum(n: number): string {
  if (n === 0) return '0';
  if (Number.isInteger(n)) return n.toLocaleString('en-PH');
  return n.toLocaleString('en-PH', { minimumFractionDigits: 0, maximumFractionDigits: 4 });
}

function NumericInput({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const colors = useColors();
  const [raw, setRaw] = useState(() => displayNum(value));
  const focused = useRef(false);

  useEffect(() => {
    if (!focused.current) setRaw(displayNum(value));
  }, [value]);

  return (
    <Box component="input" type="text" value={raw}
      onFocus={() => {
        focused.current = true;
        setRaw(value === 0 ? '' : String(value));
      }}
      onChange={(e) => {
        const text = (e.target as HTMLInputElement).value;
        // Allow digits, one decimal, commas (paste), leading minus
        const sanitized = (text.startsWith('-') ? '-' : '') + text.replace(/[^0-9.,]/g, '');
        setRaw(sanitized);
        const cleaned = sanitized.replace(/,/g, '');
        if (cleaned === '' || cleaned === '-' || cleaned.endsWith('.')) return;
        const n = Number(cleaned);
        if (!isNaN(n)) onChange(n);
      }}
      onBlur={() => {
        focused.current = false;
        const cleaned = raw.replace(/,/g, '');
        const n = Number(cleaned);
        if (!isNaN(n) && cleaned !== '' && cleaned !== '-') {
          onChange(n);
          setRaw(displayNum(n));
        } else {
          onChange(0);
          setRaw(displayNum(value));
        }
      }}
      sx={{ width: '100%', py: 1, px: 1.25, background: alpha(colors.ink, 0.04), border: `1px solid ${colors.border}`, borderRadius: '8px', color: 'text.primary', fontFamily: '"JetBrains Mono", monospace', fontSize: 12.5, textAlign: 'right', outline: 'none', transition: 'all 0.2s', '&:focus': { borderColor: colors.accent, background: alpha(colors.accent, 0.07), boxShadow: `0 0 0 3px ${alpha(colors.accent, 0.12)}` } }}
    />
  );
}

function FieldRow({ label, children, score, maxScore }: { label: string; children: React.ReactNode; score?: number; maxScore?: number }) {
  const colors = useColors();
  const scoreColor = score === undefined ? undefined
    : score === maxScore ? colors.accent2
    : score === 0 ? colors.danger : '#F59E0B';
  return (
    <Box sx={{ py: 0.85, borderRadius: '8px', transition: 'background 0.2s', '&:hover': { background: alpha(colors.ink, 0.025) }, px: 0.5 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={0.75}>
        <Typography sx={{ fontSize: 13, fontWeight: 500 }}>{label}</Typography>
        {score !== undefined && (
          <Box sx={{ px: 0.9, py: 0.2, borderRadius: '6px', background: alpha(scoreColor!, 0.1), color: scoreColor, fontSize: 11.5, fontWeight: 700, fontFamily: '"JetBrains Mono", monospace' }}>
            {score}/{maxScore}
          </Box>
        )}
      </Stack>
      {children}
    </Box>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  const colors = useColors();
  return (
    <Typography sx={{ fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '1.6px', color: colors.inkSoft, mb: 1.5, mt: 0.5, display: 'flex', alignItems: 'center', gap: 1.25, '&::after': { content: '""', flex: 1, height: '1px', background: `linear-gradient(90deg, ${colors.border}, transparent)` } }}>
      {children}
    </Typography>
  );
}

function ComputedRow({ label, value, max }: { label: string; value: number; max: number }) {
  const colors = useColors();
  const full = value === max;
  const zero = value === 0;
  const color = full ? colors.accent2 : zero ? colors.danger : '#F59E0B';
  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 100px', gap: 1.5, alignItems: 'center', py: 1.25, px: 1, my: 0.5, borderRadius: '8px', background: alpha(colors.accent, 0.06) }}>
      <Typography sx={{ fontSize: 13, fontWeight: 600 }}>{label}</Typography>
      <Box sx={{ py: 0.75, px: 1.25, background: alpha(colors.ink, 0.04), border: `1px solid ${colors.border}`, borderRadius: '8px', fontFamily: '"JetBrains Mono", monospace', fontSize: 12.5, textAlign: 'right', color, fontWeight: 700 }}>
        {value}<Box component="span" sx={{ opacity: 0.5, fontSize: 11 }}>/{max}</Box>
      </Box>
    </Box>
  );
}

export function KpsDataDrawer({ open, onClose, months, selectedId, onSelectMonth, updateMonthField, resetMonth }: Props) {
  const colors = useColors();
  const sorted = [...months].sort((a, b) => a.id.localeCompare(b.id));
  const years  = [...new Set(sorted.map((m) => m.year))];

  const selectedMonth = sorted.find((m) => m.id === selectedId) ?? sorted[sorted.length - 1];
  const selectedIdx   = sorted.findIndex((m) => m.id === selectedId);
  const canPrev = selectedIdx > 0;
  const canNext = selectedIdx < sorted.length - 1;
  const go = (delta: number) => { const next = sorted[selectedIdx + delta]; if (next) onSelectMonth(next.id); };

  if (!selectedMonth) return null;

  const inp = selectedMonth.inputs;
  const s   = computeKpsScores(inp);
  const upd = (field: keyof KpsInputs, value: number | boolean) => updateMonthField(selectedMonth.id, field, value);

  const ghostBtnSx = { background: 'transparent', border: `1px solid ${colors.border}`, color: colors.inkDim, px: 1.75, py: 1, borderRadius: '8px', fontSize: 12, '&:hover': { color: 'text.primary', borderColor: colors.borderStrong } };
  const applyBtnSx = { background: `linear-gradient(135deg, ${colors.accent}, ${colors.accent2})`, color: '#fff', px: 2.25, py: 1.1, fontSize: 12.5, fontWeight: 600, borderRadius: '8px', '&:hover': { background: `linear-gradient(135deg, ${colors.accent}, ${colors.accent2})`, filter: 'brightness(1.05)' } };

  const boolField = (field: keyof KpsInputs, value: boolean, score: number, maxScore: number) => (
    <FormControlLabel
      control={
        <Switch
          checked={value}
          onChange={(e) => upd(field, e.target.checked)}
          size="small"
          sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: colors.accent2 }, '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: colors.accent2 } }}
        />
      }
      label={
        <Stack direction="row" alignItems="center" gap={1}>
          <Typography sx={{ fontSize: 12.5, fontWeight: value ? 600 : 400, color: value ? colors.accent2 : colors.inkSoft }}>
            {value ? 'Current' : 'Not Current'}
          </Typography>
          <Box sx={{ px: 0.8, py: 0.15, borderRadius: '5px', background: alpha(value ? colors.accent2 : colors.danger, 0.1), color: value ? colors.accent2 : colors.danger, fontSize: 11, fontWeight: 700, fontFamily: '"JetBrains Mono", monospace' }}>
            {score}/{maxScore}
          </Box>
        </Stack>
      }
      sx={{ m: 0 }}
    />
  );

  return (
    <Drawer anchor="right" open={open} onClose={onClose}
      PaperProps={{ sx: { width: 480, maxWidth: '95vw', background: `linear-gradient(180deg, ${colors.bg2}, ${colors.bg0})`, borderLeft: `1px solid ${colors.borderStrong}`, backdropFilter: 'blur(20px)' } }}>

      {/* Header */}
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start"
        sx={{ p: '24px 28px 20px', borderBottom: `1px solid ${colors.border}`, background: `linear-gradient(180deg, ${alpha(colors.accent, 0.05)}, transparent)` }}>
        <Box>
          <Typography sx={{ fontFamily: '"Instrument Serif", serif', fontSize: 26, letterSpacing: '-0.3px' }}>
            Edit <Box component="em" sx={{ fontStyle: 'italic', color: colors.accent }}>KPS data</Box>
          </Typography>
          <Typography sx={{ fontSize: 12.5, color: 'text.secondary', mt: 0.75 }}>
            Select a month and edit performance inputs.
          </Typography>
        </Box>
        <IconButton onClick={onClose} sx={{ borderRadius: '8px' }}><CloseRoundedIcon sx={{ fontSize: 18 }} /></IconButton>
      </Stack>

      {/* Month picker */}
      <Stack direction="row" alignItems="center" gap={1} sx={{ px: '28px', py: '16px', borderBottom: `1px solid ${colors.border}`, background: alpha(colors.ink, 0.02) }}>
        <IconButton size="small" onClick={() => go(-1)} disabled={!canPrev} sx={{ borderRadius: '8px', border: `1px solid ${colors.border}`, width: 32, height: 32 }}>
          <ChevronLeftRoundedIcon sx={{ fontSize: 16 }} />
        </IconButton>
        <Select value={selectedId} onChange={(e) => onSelectMonth(e.target.value)} size="small"
          sx={{ flex: 1, fontSize: 13, fontWeight: 500, '.MuiOutlinedInput-notchedOutline': { borderColor: colors.border }, '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: colors.borderStrong }, '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: colors.accent } }}>
          {years.map((year) => [
            <MenuItem key={`hdr-${year}`} disabled sx={{ fontSize: 10, letterSpacing: '1.4px', textTransform: 'uppercase', color: colors.inkSoft, py: 0.5 }}>{year}</MenuItem>,
            ...sorted.filter((m) => m.year === year).map((m) => (
              <MenuItem key={m.id} value={m.id} sx={{ fontSize: 13 }}>{m.label}</MenuItem>
            )),
          ])}
        </Select>
        <IconButton size="small" onClick={() => go(1)} disabled={!canNext} sx={{ borderRadius: '8px', border: `1px solid ${colors.border}`, width: 32, height: 32 }}>
          <ChevronRightRoundedIcon sx={{ fontSize: 16 }} />
        </IconButton>
      </Stack>

      {/* Inputs */}
      <Box sx={{ flex: 1, overflowY: 'auto', p: '20px 28px' }}>

        <Box sx={{ mb: 3 }}>
          <SectionTitle>1 · Leverage</SectionTitle>
          <FieldRow label="Debt Ratio — PL">
            <NumericInput value={inp.debtRatio} onChange={(v) => upd('debtRatio', v)} />
          </FieldRow>
          <FieldRow label="Debt Ratio — Score" score={s.debtRatio} maxScore={2}>
            <NumericInput value={inp.debtRatioScore} onChange={(v) => upd('debtRatioScore', v)} />
          </FieldRow>
        </Box>

        <Box sx={{ mb: 3 }}>
          <SectionTitle>2 · Liquidity</SectionTitle>
          <FieldRow label="Working Capital Ratio — PL">
            <NumericInput value={inp.workingCapitalRatio} onChange={(v) => upd('workingCapitalRatio', v)} />
          </FieldRow>
          <FieldRow label="Working Capital Ratio — Score" score={s.workingCapitalRatio} maxScore={2}>
            <NumericInput value={inp.workingCapitalRatioScore} onChange={(v) => upd('workingCapitalRatioScore', v)} />
          </FieldRow>
        </Box>

        <Box sx={{ mb: 3 }}>
          <SectionTitle>3 · Efficiency — Payments</SectionTitle>
          <FieldRow label="Payment to GENCO">{boolField('paymentGenco', inp.paymentGenco, s.paymentGenco, 10)}</FieldRow>
          <FieldRow label="Payment to Transmission">{boolField('paymentTransmission', inp.paymentTransmission, s.paymentTransmission, 3)}</FieldRow>
          <FieldRow label="Payment to NEA">{boolField('paymentNea', inp.paymentNea, s.paymentNea, 3)}</FieldRow>
          <FieldRow label="Payment to Banks">{boolField('paymentBanks', inp.paymentBanks, s.paymentBanks, 3)}</FieldRow>
        </Box>

        <Box sx={{ mb: 3 }}>
          <SectionTitle>3 · Efficiency — Collection</SectionTitle>
          <FieldRow label="Average Method — PL (%)" >
            <NumericInput value={inp.collectionAvg} onChange={(v) => upd('collectionAvg', v)} />
          </FieldRow>
          <FieldRow label="Average Method — Score" score={s.collectionAvg} maxScore={5}>
            <NumericInput value={inp.collectionAvgScore} onChange={(v) => upd('collectionAvgScore', v)} />
          </FieldRow>
          <FieldRow label="Current to Current — PL (%)">
            <NumericInput value={inp.collectionC2C} onChange={(v) => upd('collectionC2C', v)} />
          </FieldRow>
          <FieldRow label="Current to Current — Score" score={s.collectionC2C} maxScore={4}>
            <NumericInput value={inp.collectionC2CScore} onChange={(v) => upd('collectionC2CScore', v)} />
          </FieldRow>
        </Box>

        <Box sx={{ mb: 3 }}>
          <SectionTitle>4 · Profitability</SectionTitle>
          <FieldRow label="Net Income / Loss — PL (₱)">
            <NumericInput value={inp.profitability} onChange={(v) => upd('profitability', v)} />
          </FieldRow>
          <FieldRow label="Net Income / Loss — Score" score={s.profitability} maxScore={3}>
            <NumericInput value={inp.profitabilityScore} onChange={(v) => upd('profitabilityScore', v)} />
          </FieldRow>
        </Box>

        <Box sx={{ mb: 3 }}>
          <SectionTitle>5 · NEA Audit Rating</SectionTitle>
          <FieldRow label="Audit Rating — PL (%)">
            <NumericInput value={inp.neaAuditRating} onChange={(v) => upd('neaAuditRating', v)} />
          </FieldRow>
          <FieldRow label="Audit Rating — Score" score={s.neaAuditRating} maxScore={5}>
            <NumericInput value={inp.neaAuditRatingScore} onChange={(v) => upd('neaAuditRatingScore', v)} />
          </FieldRow>
        </Box>

        <Box sx={{ mb: 3 }}>
          <SectionTitle>Incentive</SectionTitle>
          <FieldRow label="Advance 2 Qtrs Amortization (0–2)">
            <Select value={inp.incentivePoints} onChange={(e) => upd('incentivePoints', Number(e.target.value))} size="small" fullWidth
              sx={{ fontSize: 13, '.MuiOutlinedInput-notchedOutline': { borderColor: colors.border } }}>
              {[0, 2].map((v) => <MenuItem key={v} value={v} sx={{ fontSize: 13 }}>{v} point{v !== 1 ? 's' : ''}</MenuItem>)}
            </Select>
          </FieldRow>
        </Box>

        <ComputedRow label="Base Score" value={s.baseTotal} max={40} />
        <ComputedRow label="Incentive Points" value={s.incentivePoints} max={2} />
        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 100px', gap: 1.5, alignItems: 'center', py: 1.5, px: 1, mt: 1, borderRadius: '10px', background: `linear-gradient(90deg, ${alpha(colors.accent2, 0.1)}, ${alpha(colors.accent2, 0.02)})`, border: `1px solid ${alpha(colors.accent2, 0.2)}` }}>
          <Typography sx={{ fontSize: 14, fontWeight: 700 }}>Total Points</Typography>
          <Box sx={{ py: 0.75, px: 1.25, background: alpha(colors.ink, 0.04), border: `1px solid ${colors.border}`, borderRadius: '8px', fontFamily: '"JetBrains Mono", monospace', fontSize: 14, textAlign: 'right', color: colors.accent2, fontWeight: 800 }}>
            {s.totalPoints}<Box component="span" sx={{ opacity: 0.5, fontSize: 11 }}>/40</Box>
          </Box>
        </Box>
      </Box>

      {/* Footer */}
      <Stack direction="row" gap={1} alignItems="center" sx={{ p: '16px 28px', borderTop: `1px solid ${colors.border}`, background: colors.panel }}>
        <Stack direction="row" alignItems="center" gap={1} sx={{ flex: 1, fontSize: 11.5, color: colors.inkSoft }}>
          <Box sx={{ width: 6, height: 6, borderRadius: '50%', background: colors.accent, boxShadow: `0 0 6px ${colors.accent}` }} />
          Live binding · scores update instantly
        </Stack>
        <Button startIcon={<RestartAltRoundedIcon sx={{ fontSize: 15 }} />} onClick={() => resetMonth(selectedMonth.id)} sx={ghostBtnSx}>Reset month</Button>
        <Button onClick={onClose} variant="contained" sx={applyBtnSx}>Done</Button>
      </Stack>
    </Drawer>
  );
}
