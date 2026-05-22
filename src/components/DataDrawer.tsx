import { useState } from 'react';
import {
  Box,
  Button,
  Drawer,
  IconButton,
  MenuItem,
  Select,
  Stack,
  Typography,
  alpha,
} from '@mui/material';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import ChevronLeftRoundedIcon from '@mui/icons-material/ChevronLeftRounded';
import ChevronRightRoundedIcon from '@mui/icons-material/ChevronRightRounded';
import RestartAltRoundedIcon from '@mui/icons-material/RestartAltRounded';
import type { MonthRecord, PnlInputs } from '../types/pnl';
import { useColors } from '../theme/theme';
import { fmtFull } from '../utils/format';
import { computePeriod } from '../utils/pnl';

interface DataDrawerProps {
  open: boolean;
  onClose: () => void;
  months: MonthRecord[];
  updateMonthField: (monthId: string, field: keyof PnlInputs, value: number) => void;
  resetMonth: (monthId: string) => void;
}

function NumericInput({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const colors = useColors();
  return (
    <Box
      component="input"
      type="text"
      value={fmtFull(value)}
      onChange={(e) => {
        const raw = (e.target as HTMLInputElement).value.replace(/,/g, '').replace(/[^0-9.\-]/g, '');
        const n = Number(raw);
        onChange(isNaN(n) ? 0 : n);
      }}
      sx={{
        width: '100%',
        py: 1,
        px: 1.25,
        background: alpha(colors.ink, 0.04),
        border: `1px solid ${colors.border}`,
        borderRadius: '8px',
        color: 'text.primary',
        fontFamily: '"JetBrains Mono", monospace',
        fontSize: 12.5,
        textAlign: 'right',
        outline: 'none',
        transition: 'all 0.2s',
        '&:focus': {
          borderColor: colors.accent,
          background: alpha(colors.accent, 0.07),
          boxShadow: `0 0 0 3px ${alpha(colors.accent, 0.12)}`,
        },
      }}
    />
  );
}

function FieldRow({
  label,
  field,
  inputs,
  onUpdate,
  subtle,
}: {
  label: string;
  field: keyof PnlInputs;
  inputs: PnlInputs;
  onUpdate: (field: keyof PnlInputs, value: number) => void;
  subtle?: boolean;
}) {
  const colors = useColors();
  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: '1fr 180px',
        gap: 1.5,
        alignItems: 'center',
        py: 0.85,
        borderRadius: '8px',
        transition: 'background 0.2s',
        '&:hover': { background: alpha(colors.ink, 0.03) },
      }}
    >
      <Box
        sx={{
          fontSize: 13,
          fontWeight: subtle ? 400 : 500,
          color: subtle ? colors.inkSoft : 'text.primary',
          fontStyle: subtle ? 'italic' : 'normal',
        }}
      >
        {label}
      </Box>
      <NumericInput value={inputs[field]} onChange={(v) => onUpdate(field, v)} />
    </Box>
  );
}

function ComputedRow({ label, value, variant = 'total' }: { label: string; value: number; variant?: 'total' | 'highlight' }) {
  const colors = useColors();
  const color = value > 0 ? colors.accent2 : value < 0 ? colors.danger : colors.inkDim;
  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: '1fr 180px',
        gap: 1.5,
        alignItems: 'center',
        py: 1.25,
        px: 1,
        my: 0.5,
        borderRadius: '8px',
        ...(variant === 'total' && { background: alpha(colors.accent, 0.06) }),
        ...(variant === 'highlight' && {
          background: `linear-gradient(90deg, ${alpha(colors.accent2, 0.1)}, ${alpha(colors.accent2, 0.02)})`,
          borderLeft: `2px solid ${colors.accent2}`,
        }),
      }}
    >
      <Typography
        sx={{
          fontSize: 13,
          fontWeight: 600,
          color: variant === 'highlight' ? colors.accent2 : 'text.primary',
        }}
      >
        {label}
      </Typography>
      <Box
        sx={{
          py: 1,
          px: 1.25,
          background: alpha(colors.ink, 0.04),
          border: `1px solid ${colors.border}`,
          borderRadius: '8px',
          fontFamily: '"JetBrains Mono", monospace',
          fontSize: 12.5,
          textAlign: 'right',
          color,
          fontWeight: 600,
        }}
      >
        {fmtFull(value)}
      </Box>
    </Box>
  );
}

function SectionTitle({ children, variant }: { children: React.ReactNode; variant?: 'add' | 'less' }) {
  const colors = useColors();
  return (
    <Typography
      sx={{
        fontSize: 10.5,
        textTransform: 'uppercase',
        letterSpacing: '1.6px',
        color: colors.inkSoft,
        mb: 1.5,
        mt: 0.5,
        display: 'flex',
        alignItems: 'center',
        gap: 1.25,
        '&::before': variant
          ? {
              content: variant === 'less' ? '"−"' : '"+"',
              color: variant === 'less' ? colors.danger : colors.accent2,
              fontFamily: '"JetBrains Mono", monospace',
              fontWeight: 700,
            }
          : {},
        '&::after': {
          content: '""',
          flex: 1,
          height: '1px',
          background: `linear-gradient(90deg, ${colors.border}, transparent)`,
        },
      }}
    >
      {children}
    </Typography>
  );
}

export function DataDrawer({ open, onClose, months, updateMonthField, resetMonth }: DataDrawerProps) {
  const colors = useColors();
  const sorted = [...months].sort((a, b) => a.id.localeCompare(b.id));
  const lastId = sorted[sorted.length - 1]?.id ?? '';
  const [selectedId, setSelectedId] = useState(lastId);

  const selectedMonth = sorted.find((m) => m.id === selectedId) ?? sorted[sorted.length - 1];
  const selectedIdx = sorted.findIndex((m) => m.id === selectedId);
  const canPrev = selectedIdx > 0;
  const canNext = selectedIdx < sorted.length - 1;
  const go = (delta: number) => { const next = sorted[selectedIdx + delta]; if (next) setSelectedId(next.id); };

  if (!selectedMonth) return null;

  const c = computePeriod(selectedMonth.inputs);
  const update = (field: keyof PnlInputs, value: number) => updateMonthField(selectedMonth.id, field, value);
  const years = [...new Set(sorted.map((m) => m.year))];

  const ghostBtnSx = {
    background: 'transparent',
    border: `1px solid ${colors.border}`,
    color: colors.inkDim,
    px: 1.75,
    py: 1,
    borderRadius: '8px',
    fontSize: 12,
    '&:hover': { color: 'text.primary', borderColor: colors.borderStrong },
  };

  const applyBtnSx = {
    background: `linear-gradient(135deg, ${colors.accent}, ${colors.accent2})`,
    color: '#fff',
    px: 2.25,
    py: 1.1,
    fontSize: 12.5,
    fontWeight: 600,
    borderRadius: '8px',
    '&:hover': {
      background: `linear-gradient(135deg, ${colors.accent}, ${colors.accent2})`,
      filter: 'brightness(1.05)',
    },
  };

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          width: 500,
          maxWidth: '95vw',
          background: `linear-gradient(180deg, ${colors.bg2}, ${colors.bg0})`,
          borderLeft: `1px solid ${colors.borderStrong}`,
          backdropFilter: 'blur(20px)',
        },
      }}
    >
      {/* Header */}
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="flex-start"
        sx={{
          p: '24px 28px 20px',
          borderBottom: `1px solid ${colors.border}`,
          background: `linear-gradient(180deg, ${alpha(colors.accent, 0.05)}, transparent)`,
        }}
      >
        <Box>
          <Typography sx={{ fontFamily: '"Instrument Serif", serif', fontSize: 26, letterSpacing: '-0.3px' }}>
            Edit{' '}
            <Box component="em" sx={{ fontStyle: 'italic', color: colors.accent }}>
              monthly data
            </Box>
          </Typography>
          <Typography sx={{ fontSize: 12.5, color: 'text.secondary', mt: 0.75, lineHeight: 1.5 }}>
            Select a month and edit its P&L inputs. All dashboard views update instantly.
          </Typography>
        </Box>
        <IconButton onClick={onClose} sx={{ borderRadius: '8px' }}>
          <CloseRoundedIcon sx={{ fontSize: 18 }} />
        </IconButton>
      </Stack>

      {/* Month picker */}
      <Stack
        direction="row"
        alignItems="center"
        gap={1}
        sx={{
          px: '28px',
          py: '16px',
          borderBottom: `1px solid ${colors.border}`,
          background: alpha(colors.ink, 0.02),
        }}
      >
        <IconButton
          size="small"
          onClick={() => go(-1)}
          disabled={!canPrev}
          sx={{ borderRadius: '8px', border: `1px solid ${colors.border}`, width: 32, height: 32 }}
        >
          <ChevronLeftRoundedIcon sx={{ fontSize: 16 }} />
        </IconButton>

        <Select
          value={selectedId}
          onChange={(e) => setSelectedId(e.target.value)}
          size="small"
          sx={{
            flex: 1,
            fontSize: 13,
            fontWeight: 500,
            '.MuiOutlinedInput-notchedOutline': { borderColor: colors.border },
            '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: colors.borderStrong },
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: colors.accent },
          }}
        >
          {years.map((year) => [
            <MenuItem key={`hdr-${year}`} disabled sx={{ fontSize: 10, letterSpacing: '1.4px', textTransform: 'uppercase', color: colors.inkSoft, py: 0.5 }}>
              {year}
            </MenuItem>,
            ...sorted
              .filter((m) => m.year === year)
              .map((m) => (
                <MenuItem key={m.id} value={m.id} sx={{ fontSize: 13 }}>
                  {m.label}
                </MenuItem>
              )),
          ])}
        </Select>

        <IconButton
          size="small"
          onClick={() => go(1)}
          disabled={!canNext}
          sx={{ borderRadius: '8px', border: `1px solid ${colors.border}`, width: 32, height: 32 }}
        >
          <ChevronRightRoundedIcon sx={{ fontSize: 16 }} />
        </IconButton>
      </Stack>

      {/* Inputs */}
      <Box sx={{ flex: 1, overflowY: 'auto', p: '20px 28px' }}>
        <Box sx={{ mb: 3 }}>
          <SectionTitle>Revenue</SectionTitle>
          <FieldRow label="Total Operating Revenue" field="opRev" inputs={selectedMonth.inputs} onUpdate={update} />
          <FieldRow label="Other Revenue" field="othRev" inputs={selectedMonth.inputs} onUpdate={update} subtle />
          <ComputedRow label="Total Revenue" value={c.totalRev} />
        </Box>

        <Box sx={{ mb: 3 }}>
          <SectionTitle variant="less">Less: Operating Costs</SectionTitle>
          <FieldRow label="Total Power Purchased" field="power" inputs={selectedMonth.inputs} onUpdate={update} />
          <FieldRow label="Total Total Operating and Maintenance Expenses" field="om" inputs={selectedMonth.inputs} onUpdate={update} />
          <ComputedRow label="Operating Margin" value={c.opMargin} />
        </Box>

        <Box sx={{ mb: 3 }}>
          <SectionTitle variant="less">Less: Non-Operating Costs</SectionTitle>
          <FieldRow label="Depreciation Expense" field="deprec" inputs={selectedMonth.inputs} onUpdate={update} />
          <FieldRow label="Interest Expense" field="interest" inputs={selectedMonth.inputs} onUpdate={update} />
          <ComputedRow label="Net Operating Margin" value={c.netOpMargin} />
        </Box>

        <Box>
          <SectionTitle variant="add">Add: Adjustments</SectionTitle>
          <FieldRow label="Non-Total Operating Revenue" field="nonOpRev" inputs={selectedMonth.inputs} onUpdate={update} />
          <FieldRow label="Non-Operating Expense" field="nonOpExp" inputs={selectedMonth.inputs} onUpdate={update} subtle />
          <ComputedRow label="Net Margin" value={c.netMargin} variant="highlight" />
          <FieldRow label="RFSC" field="rfsc" inputs={selectedMonth.inputs} onUpdate={update} />
          <ComputedRow label="Total Margin (Gross of RFSC)" value={c.totalMargin} variant="highlight" />
        </Box>
      </Box>

      {/* Footer */}
      <Stack
        direction="row"
        gap={1}
        alignItems="center"
        sx={{
          p: '16px 28px',
          borderTop: `1px solid ${colors.border}`,
          background: colors.panel,
        }}
      >
        <Stack direction="row" alignItems="center" gap={1} sx={{ flex: 1, fontSize: 11.5, color: colors.inkSoft }}>
          <Box sx={{ width: 6, height: 6, borderRadius: '50%', background: colors.accent2, boxShadow: `0 0 6px ${colors.accent2}` }} />
          Live binding · changes reflect instantly
        </Stack>
        <Button
          startIcon={<RestartAltRoundedIcon sx={{ fontSize: 15 }} />}
          onClick={() => resetMonth(selectedMonth.id)}
          sx={ghostBtnSx}
        >
          Reset month
        </Button>
        <Button onClick={onClose} variant="contained" sx={applyBtnSx}>
          Done
        </Button>
      </Stack>
    </Drawer>
  );
}
