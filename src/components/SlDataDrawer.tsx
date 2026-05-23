import { useEffect, useRef, useState } from 'react';
import {
  Box, Drawer, IconButton, MenuItem, Select, Stack, Typography, alpha,
} from '@mui/material';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import RestartAltRoundedIcon from '@mui/icons-material/RestartAltRounded';
import type { SlInputs, SlMonthRecord } from '../types/pnl';
import { useColors } from '../theme/theme';
import { PESO } from '../utils/format';
import { computeSlValues, SL_CAP_PCT } from '../utils/sl';

interface Props {
  open: boolean;
  onClose: () => void;
  months: SlMonthRecord[];
  updateMonthField: (id: string, field: keyof SlInputs, value: number) => void;
  resetMonth: (id: string) => void;
}

function displayNum(n: number): string {
  if (n === 0) return '';
  if (Number.isInteger(n)) return String(n);
  return String(n);
}

function NumericInput({
  value, onChange, label, unit, helperText,
}: { value: number; onChange: (v: number) => void; label: string; unit?: string; helperText?: string }) {
  const colors = useColors();
  const [raw, setRaw] = useState(() => displayNum(value));
  const focused = useRef(false);

  useEffect(() => {
    if (!focused.current) setRaw(displayNum(value));
  }, [value]);

  return (
    <Box>
      <Typography sx={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '1px', color: colors.inkSoft, mb: 0.5, fontWeight: 600 }}>
        {label}{unit && <Box component="span" sx={{ ml: 0.5, color: colors.inkDim, fontWeight: 400, textTransform: 'none' }}>({unit})</Box>}
      </Typography>
      <Box
        component="input"
        value={raw}
        placeholder="0"
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
          const v = e.target.value;
          if (v === '' || v === '-' || /^-?\d*\.?\d*$/.test(v)) setRaw(v);
        }}
        onFocus={() => {
          focused.current = true;
          setRaw(value === 0 ? '' : String(value));
        }}
        onBlur={() => {
          focused.current = false;
          const n = parseFloat(raw.replace(/,/g, ''));
          if (isNaN(n)) { onChange(0); setRaw(''); }
          else { onChange(n); setRaw(String(n)); }
        }}
        sx={{
          width: '100%',
          px: 1.5, py: 1,
          fontSize: 14,
          fontFamily: '"JetBrains Mono", monospace',
          fontWeight: 600,
          background: alpha(colors.ink, 0.04),
          border: `1px solid ${colors.border}`,
          borderRadius: '10px',
          color: 'text.primary',
          outline: 'none',
          transition: 'border-color 0.15s',
          '&:focus': { borderColor: colors.accent },
          '&::placeholder': { color: colors.inkDim, fontWeight: 400 },
        }}
      />
      {helperText && <Typography sx={{ fontSize: 10.5, color: colors.inkDim, mt: 0.5 }}>{helperText}</Typography>}
    </Box>
  );
}

function ComputedRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  const colors = useColors();
  return (
    <Stack direction="row" justifyContent="space-between" alignItems="center"
      sx={{ px: 1.5, py: 0.75, borderRadius: '8px', background: alpha(highlight ? colors.accent3 ?? '#F59E0B' : colors.ink, highlight ? 0.08 : 0.03) }}>
      <Typography sx={{ fontSize: 12, color: colors.inkSoft }}>{label}</Typography>
      <Typography sx={{ fontSize: 13, fontFamily: '"JetBrains Mono", monospace', fontWeight: 600, color: highlight ? (colors.accent3 ?? '#F59E0B') : 'text.primary' }}>
        {value}
      </Typography>
    </Stack>
  );
}

export function SlDataDrawer({ open, onClose, months, updateMonthField, resetMonth }: Props) {
  const colors = useColors();
  const sorted = [...months].sort((a, b) => a.id.localeCompare(b.id));
  const [selectedId, setSelectedId] = useState<string>(() => sorted[sorted.length - 1]?.id ?? '');

  // Keep selectedId valid
  useEffect(() => {
    if (!sorted.some((m) => m.id === selectedId)) {
      setSelectedId(sorted[sorted.length - 1]?.id ?? '');
    }
  }, [sorted, selectedId]);

  const month = sorted.find((m) => m.id === selectedId);
  const computed = month ? computeSlValues(month.inputs) : null;

  function fmtKwhC(n: number): string {
    const r = Math.round(n);
    if (r < 0) return `(${Math.abs(r).toLocaleString('en-PH')})`;
    return r.toLocaleString('en-PH');
  }
  function fmtPesoC(n: number): string {
    if (n < 0) return `(${PESO}${Math.abs(n).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })})`;
    return `${PESO}${n.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  const yearGroups = [...new Set(sorted.map((m) => m.year))];

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          width: { xs: '100vw', sm: 420 },
          background: colors.bg1,
          backdropFilter: 'blur(24px)',
          borderLeft: `1px solid ${colors.border}`,
        },
      }}
    >
      <Stack sx={{ height: '100%', overflow: 'hidden' }}>
        {/* Header */}
        <Stack direction="row" alignItems="center" justifyContent="space-between"
          sx={{ px: 3, py: 2.5, borderBottom: `1px solid ${colors.border}`, flexShrink: 0 }}>
          <Box>
            <Typography sx={{ fontFamily: '"Instrument Serif", serif', fontSize: 20 }}>
              SL Data Entry
            </Typography>
            <Typography sx={{ fontSize: 12, color: 'text.secondary', mt: 0.25 }}>
              System Losses · {SL_CAP_PCT}% cap
            </Typography>
          </Box>
          <IconButton onClick={onClose} size="small"
            sx={{ border: `1px solid ${colors.border}`, borderRadius: '8px', p: 0.75 }}>
            <CloseRoundedIcon sx={{ fontSize: 18 }} />
          </IconButton>
        </Stack>

        {/* Month selector */}
        <Box sx={{ px: 3, py: 2, borderBottom: `1px solid ${colors.border}`, flexShrink: 0 }}>
          <Typography sx={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '1px', color: colors.inkSoft, mb: 1, fontWeight: 600 }}>
            Select Month
          </Typography>
          <Select value={selectedId} onChange={(e) => setSelectedId(e.target.value)} size="small" fullWidth
            sx={{ fontSize: 13, fontWeight: 500, '.MuiOutlinedInput-notchedOutline': { borderColor: colors.border }, '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: colors.accent } }}>
            {yearGroups.map((year) => [
              <MenuItem key={`hdr-${year}`} disabled sx={{ fontSize: 10, letterSpacing: '1.4px', textTransform: 'uppercase', color: colors.inkSoft, py: 0.5 }}>{year}</MenuItem>,
              ...sorted.filter((m) => m.year === year).map((m) => (
                <MenuItem key={m.id} value={m.id} sx={{ fontSize: 13 }}>{m.label}</MenuItem>
              )),
            ])}
          </Select>
        </Box>

        {/* Fields */}
        {month && (
          <Stack sx={{ flex: 1, overflowY: 'auto', px: 3, py: 2.5 }} gap={2.5}>
            <Typography sx={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '1px', color: colors.accent, fontWeight: 700 }}>
              Inputs
            </Typography>

            <NumericInput
              label="KWh Purchased"
              unit="kwh"
              value={month.inputs.kwhPurchased}
              onChange={(v) => updateMonthField(month.id, 'kwhPurchased', v)}
              helperText="Total electricity purchased for the month"
            />
            <NumericInput
              label="SL per MFSR"
              unit="%"
              value={month.inputs.slPerMfsrPct}
              onChange={(v) => updateMonthField(month.id, 'slPerMfsrPct', v)}
              helperText="System loss % per MFSR filing (e.g. 13.76)"
            />
            <NumericInput
              label="Systems Rate"
              unit="₱/kwh"
              value={month.inputs.systemsRate}
              onChange={(v) => updateMonthField(month.id, 'systemsRate', v)}
              helperText="Rate used to compute foregone revenue"
            />
            <NumericInput
              label="Power Rate"
              unit="₱/kwh"
              value={month.inputs.powerRate}
              onChange={(v) => updateMonthField(month.id, 'powerRate', v)}
              helperText="Rate used to compute system loss in pesos"
            />

            {/* Computed section */}
            {computed && month.inputs.kwhPurchased > 0 && (
              <>
                <Box sx={{ pt: 1, borderTop: `1px solid ${colors.border}` }}>
                  <Typography sx={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '1px', color: colors.inkSoft, mb: 1.5, fontWeight: 600 }}>
                    Computed Values
                  </Typography>
                  <Stack gap={0.75}>
                    <ComputedRow label={`SL within cap (${SL_CAP_PCT}%) kwh`} value={fmtKwhC(computed.slWithinCapKwh)} />
                    <ComputedRow label="SL per MFSR (kwh)" value={fmtKwhC(computed.slPerMfsrKwh)} />
                    <ComputedRow label="SL in EXCESS (%)" value={`${computed.slInExcessPct.toFixed(2)}%`} />
                    <ComputedRow label="SL in EXCESS (kwh)" value={fmtKwhC(computed.slInExcessKwh)} />
                    <ComputedRow label="Foregone Revenue" value={fmtPesoC(computed.foregoneRevenuePesos)} highlight />
                    <ComputedRow label="System Loss in Pesos" value={fmtPesoC(computed.systemLossPesos)} highlight />
                  </Stack>
                </Box>
              </>
            )}

            {/* Reset */}
            <Box sx={{ pt: 1 }}>
              <Stack direction="row" alignItems="center" justifyContent="flex-end">
                <Box
                  component="button"
                  onClick={() => resetMonth(month.id)}
                  sx={{
                    display: 'flex', alignItems: 'center', gap: 0.75,
                    fontSize: 12, color: colors.danger, cursor: 'pointer',
                    background: 'none', border: 'none', px: 1.5, py: 0.75,
                    borderRadius: '8px', fontFamily: 'inherit',
                    '&:hover': { background: alpha(colors.danger, 0.08) },
                  }}
                >
                  <RestartAltRoundedIcon sx={{ fontSize: 16 }} />
                  Reset month
                </Box>
              </Stack>
            </Box>
          </Stack>
        )}
      </Stack>
    </Drawer>
  );
}
