import { useCallback, useMemo, useState } from 'react';
import { Box, Snackbar, Alert, Stack, Typography, ThemeProvider, CssBaseline } from '@mui/material';
import { Topbar } from './components/Topbar';
import { PageHead } from './components/PageHead';
import { KpiGrid } from './components/KpiGrid';
import { Waterfall } from './components/Waterfall';
import { MarginComposition } from './components/MarginComposition';
import { TripleGrid } from './components/TripleGrid';
import { DataDrawer } from './components/DataDrawer';
import { usePnlState } from './hooks/usePnlState';
import { createAppTheme } from './theme/theme';
import { PESO } from './utils/format';

export default function App() {
  const {
    months,
    activePeriod,
    setActivePeriod,
    updateMonthField,
    resetMonth,
    resetAll,
    displayData,
    computed,
  } = usePnlState();

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [toast, setToast] = useState<{ open: boolean; msg: string; severity: 'success' | 'info' | 'warning' }>({
    open: false,
    msg: '',
    severity: 'success',
  });

  const appTheme = useMemo(() => createAppTheme(darkMode ? 'dark' : 'light'), [darkMode]);

  const showToast = useCallback((msg: string, severity: 'success' | 'info' | 'warning' = 'success') => {
    setToast({ open: true, msg, severity });
  }, []);

  const combined = useMemo(
    () => ({ prior: computed.prior, current: computed.current, inputs: displayData }),
    [computed, displayData],
  );

  const handleExport = useCallback(() => {
    const rows = [
      ['Line item', displayData.priorLabel, displayData.currentLabel],
      ['Operating Revenue', displayData.prior.opRev, displayData.current.opRev],
      ['Other Revenue', displayData.prior.othRev, displayData.current.othRev],
      ['Total Revenue', computed.prior.totalRev, computed.current.totalRev],
      ['Power Purchased', displayData.prior.power, displayData.current.power],
      ['O&M Expense', displayData.prior.om, displayData.current.om],
      ['Operating Margin', computed.prior.opMargin, computed.current.opMargin],
      ['Depreciation', displayData.prior.deprec, displayData.current.deprec],
      ['Interest Expense', displayData.prior.interest, displayData.current.interest],
      ['Net Operating Margin', computed.prior.netOpMargin, computed.current.netOpMargin],
      ['Non-Operating Revenue', displayData.prior.nonOpRev, displayData.current.nonOpRev],
      ['Non-Operating Expense', displayData.prior.nonOpExp, displayData.current.nonOpExp],
      ['Net Margin', computed.prior.netMargin, computed.current.netMargin],
      ['RFSC', displayData.prior.rfsc, displayData.current.rfsc],
      ['Total Margin (Gross of RFSC)', computed.prior.totalMargin, computed.current.totalMargin],
    ];
    const csv = rows.map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ledger-console-${displayData.currentLabel.replace(/\s+/g, '-').toLowerCase()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast(`Exported ${displayData.currentLabel} P&L to CSV`);
  }, [displayData, computed, showToast]);

  return (
    <ThemeProvider theme={appTheme}>
      <CssBaseline />
      <Box sx={{ position: 'relative', zIndex: 1, minHeight: '100vh' }}>
        <Topbar darkMode={darkMode} onToggleDark={() => setDarkMode((d) => !d)} />

        <Stack gap={3} sx={{ p: 4 }}>
          <PageHead
            currentLabel={displayData.currentLabel}
            priorLabel={displayData.priorLabel}
            activePeriod={activePeriod}
            onPeriodChange={setActivePeriod}
            onOpenDrawer={() => setDrawerOpen(true)}
            onExport={handleExport}
          />

          <KpiGrid data={combined} />

          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: '2fr 1fr',
              gap: 2,
              '@media (max-width: 1200px)': { gridTemplateColumns: '1fr' },
            }}
          >
            <Waterfall data={combined} />
            <MarginComposition data={combined} />
          </Box>

          <TripleGrid data={combined} />

          <Typography
            sx={{
              textAlign: 'center',
              fontSize: 11,
              color: 'text.secondary',
              py: 1,
              fontStyle: 'italic',
              fontFamily: '"Instrument Serif", serif',
            }}
          >
            Values in {PESO} Philippine Pesos · Demo data · Ledger Console
          </Typography>
        </Stack>

        <DataDrawer
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          months={months}
          updateMonthField={updateMonthField}
          resetMonth={resetMonth}
          onResetAll={() => {
            resetAll();
            showToast('All months reset to defaults', 'info');
          }}
        />

        <Snackbar
          open={toast.open}
          autoHideDuration={3200}
          onClose={() => setToast((t) => ({ ...t, open: false }))}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert
            severity={toast.severity}
            variant="filled"
            onClose={() => setToast((t) => ({ ...t, open: false }))}
            sx={{ borderRadius: '12px', fontSize: 13 }}
          >
            {toast.msg}
          </Alert>
        </Snackbar>
      </Box>
    </ThemeProvider>
  );
}
