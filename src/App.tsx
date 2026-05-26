import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAppDispatch, useAppSelector } from './store/hooks';
import { setActiveEntity, setPeriod } from './store/uiSlice';
import type { EntityTab } from './components/Sidebar';
import {
  Box, Snackbar, Alert, Stack, Typography,
  ThemeProvider, CssBaseline,
  Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions,
  Button, alpha,
} from '@mui/material';
import { Topbar } from './components/Topbar';
import { LoginPage } from './components/LoginPage';
import { PageHead } from './components/PageHead';
import { KpiGrid } from './components/KpiGrid';
import { Waterfall } from './components/Waterfall';
import { MarginComposition } from './components/MarginComposition';
import { TripleGrid } from './components/TripleGrid';
import { RevenueVsPower } from './components/RevenueVsPower';
import { OmBreakdown } from './components/OmBreakdown';
import { RevPowerDonut } from './components/RevPowerDonut';
import { OmDonut } from './components/OmDonut';
import { DataDrawer } from './components/DataDrawer';
import { DsmDataDrawer } from './components/DsmDataDrawer';
import { DsmKpiGrid } from './components/DsmKpiGrid';
import { DsmRevVsExp } from './components/DsmRevVsExp';
import { DsmRevenueBreakdown, DsmExpenseBreakdown } from './components/DsmBreakdown';
import { DsmTrend } from './components/DsmTrend';
import { KpsKpiGrid } from './components/KpsKpiGrid';
import { KpsTrend } from './components/KpsTrend';
import { KpsScorecard } from './components/KpsScorecard';
import { KpsDataDrawer } from './components/KpsDataDrawer';
import { SlSummaryTable } from './components/SlSummaryTable';
import { SlMfsrTrend } from './components/SlMfsrTrend';
import { SlForgoneChart, SlSystemLossChart } from './components/SlPesoCharts';
import { SlDataDrawer } from './components/SlDataDrawer';
import { Sidebar } from './components/Sidebar';
import { usePnlState } from './hooks/usePnlState';
import { useDsmState } from './hooks/useDsmState';
import { useKpsState } from './hooks/useKpsState';
import { useSlState } from './hooks/useSlState';
import { createAppTheme, useColors } from './theme/theme';
import { PESO } from './utils/format';
import { getStoredUser, logout } from './auth';
import { supabase } from './lib/supabase';
import { exportToExcel, downloadTemplate } from './utils/exportExcel';
import { importFromExcel } from './utils/importExcel';
import { exportDsmToExcel, downloadDsmTemplate } from './utils/exportDsmExcel';
import { importDsmFromExcel } from './utils/importDsmExcel';
import { exportKpsToExcel, downloadKpsTemplate } from './utils/exportKpsExcel';
import { importKpsFromExcel } from './utils/importKpsExcel';
import { exportSlToExcel, downloadSlTemplate } from './utils/exportSlExcel';
import { importSlFromExcel } from './utils/importSlExcel';
import type { AuthUser } from './auth';

function getPrevMonthLabel(): string {
  const LONG = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const now = new Date();
  const m = now.getMonth();
  if (m === 0) return `December ${now.getFullYear() - 1}`;
  return `${LONG[m - 1]} ${now.getFullYear()}`;
}

export default function App() {
  const [darkMode, setDarkMode] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const appTheme = useMemo(() => createAppTheme(darkMode ? 'dark' : 'light'), [darkMode]);

  useEffect(() => {
    getStoredUser().then((u) => {
      setUser(u);
      setAuthReady(true);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) { setUser(null); return; }
      const u = session.user;
      const email = u.email ?? '';
      const meta = u.user_metadata ?? {};
      const displayName = meta['full_name'] ?? meta['display_name'] ?? meta['name'] ?? meta['username'];
      const username = typeof displayName === 'string' && displayName.trim()
        ? displayName.trim()
        : email.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
      setUser({ id: u.id, username, email });
    });

    return () => subscription.unsubscribe();
  }, []);

  if (!authReady) return null;

  return (
    <ThemeProvider theme={appTheme}>
      <CssBaseline />
      {user ? (
        <Dashboard
          user={user}
          darkMode={darkMode}
          onToggleDark={() => setDarkMode((d) => !d)}
          onLogout={async () => { await logout(); setUser(null); }}
        />
      ) : (
        <LoginPage onLogin={(u) => setUser(u)} />
      )}
    </ThemeProvider>
  );
}

interface DashboardProps {
  user: AuthUser;
  darkMode: boolean;
  onToggleDark: () => void;
  onLogout: () => void;
}

function Dashboard({ user, darkMode, onToggleDark, onLogout }: DashboardProps) {
  const colors = useColors();
  const dispatch = useAppDispatch();
  const activeEntity = useAppSelector((s) => s.ui.activeEntity);
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [prevMonthMap, setPrevMonthMap] = useState<Record<string, boolean>>(() => {
    try { return JSON.parse(localStorage.getItem('prevMonthMap') ?? '{}'); } catch { return {}; }
  });
  const [toast, setToast] = useState<{ open: boolean; msg: string; severity: 'success' | 'info' | 'warning' }>({
    open: false, msg: '', severity: 'success',
  });

  const showToast = useCallback((msg: string, severity: 'success' | 'info' | 'warning' = 'success') => {
    setToast({ open: true, msg, severity });
  }, []);

  const togglePrevMonth = useCallback((tab: string) => {
    setPrevMonthMap((prev) => {
      const next = { ...prev, [tab]: !(prev[tab] ?? false) };
      localStorage.setItem('prevMonthMap', JSON.stringify(next));
      return next;
    });
  }, []);

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', position: 'relative', zIndex: 1 }}>
      <Sidebar
        activeEntity={activeEntity}
        onEntityChange={(e) => { dispatch(setActiveEntity(e)); setMobileSidebarOpen(false); }}
        mobileOpen={mobileSidebarOpen}
        onMobileClose={() => setMobileSidebarOpen(false)}
      />

      <Box sx={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        <Topbar
          darkMode={darkMode}
          onToggleDark={onToggleDark}
          user={user}
          onLogoutRequest={() => setLogoutOpen(true)}
          onMenuClick={() => setMobileSidebarOpen(true)}
          activeLabel={({ soo: 'SoO', dsm: 'DSM', kps: 'KPS', sl: 'SL (in PhP)' } as Record<string, string>)[activeEntity]}
        />

        {/* Re-mount view on tab switch so each entity gets fresh state */}
        {activeEntity === 'dsm'
          ? <DsmEntityView key={activeEntity} showToast={showToast} username={user.username} showPrevMonth={prevMonthMap['dsm'] ?? false} onTogglePrevMonth={() => togglePrevMonth('dsm')} />
          : activeEntity === 'kps'
          ? <KpsEntityView key={activeEntity} showToast={showToast} username={user.username} showPrevMonth={prevMonthMap['kps'] ?? false} onTogglePrevMonth={() => togglePrevMonth('kps')} />
          : activeEntity === 'sl'
          ? <SlEntityView key={activeEntity} showToast={showToast} username={user.username} showPrevMonth={prevMonthMap['sl'] ?? false} onTogglePrevMonth={() => togglePrevMonth('sl')} />
          : <EntityView key={activeEntity} namespace={activeEntity} showToast={showToast} username={user.username} showPrevMonth={prevMonthMap[activeEntity] ?? false} onTogglePrevMonth={() => togglePrevMonth(activeEntity)} />
        }
      </Box>

      {/* Logout dialog */}
      <Dialog
        open={logoutOpen}
        onClose={() => setLogoutOpen(false)}
        PaperProps={{
          sx: {
            background: colors.panel,
            backdropFilter: 'blur(24px)',
            border: `1px solid ${colors.border}`,
            borderRadius: '18px',
            px: 1,
            minWidth: 360,
            boxShadow: `0 24px 60px -12px ${alpha(colors.ink, 0.24)}`,
          },
        }}
      >
        <DialogTitle sx={{ fontFamily: '"Instrument Serif", serif', fontSize: 22, letterSpacing: '-0.2px', pb: 0.5 }}>
          Sign out
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ fontSize: 13.5, lineHeight: 1.6 }}>
            Your data has been saved. Are you sure you want to sign out,{' '}
            <Box component="strong" sx={{ color: 'text.primary' }}>{user.username}</Box>?
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ pb: 2.5, px: 3, gap: 1 }}>
          <Button
            onClick={() => setLogoutOpen(false)}
            sx={{
              borderRadius: '9px',
              border: `1px solid ${colors.border}`,
              color: 'text.secondary',
              fontSize: 13,
              px: 2.5,
              '&:hover': { background: alpha(colors.ink, 0.05) },
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={onLogout}
            variant="contained"
            sx={{
              borderRadius: '9px',
              background: colors.danger,
              fontSize: 13,
              fontWeight: 600,
              px: 2.5,
              '&:hover': { background: colors.danger, filter: 'brightness(1.1)' },
            }}
          >
            Sign out
          </Button>
        </DialogActions>
      </Dialog>

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
  );
}

interface DsmEntityViewProps {
  showToast: (msg: string, severity?: 'success' | 'info' | 'warning') => void;
  username: string;
  showPrevMonth: boolean;
  onTogglePrevMonth: () => void;
}

function DsmEntityView({ showToast, username, showPrevMonth, onTogglePrevMonth }: DsmEntityViewProps) {
  const dispatch = useAppDispatch();
  const activePeriod = useAppSelector((s) => s.ui.periods['dsm'] ?? 'MoM');
  const setActivePeriod = useCallback(
    (p: import('./types/pnl').PeriodView) => dispatch(setPeriod({ tab: 'dsm', period: p })),
    [dispatch],
  );
  const prevMonthLabel = useMemo(() => getPrevMonthLabel(), []);
  const {
    months,
    updateMonthField,
    resetMonth,
    importMonths,
    displayData,
    computed,
  } = useDsmState('dsm', activePeriod, showPrevMonth);

  const [drawerOpen, setDrawerOpen] = useState(false);

  const combined = useMemo(
    () => ({ prior: computed.prior, current: computed.current, inputs: displayData }),
    [computed, displayData],
  );

  const handleExport = useCallback(async () => {
    await exportDsmToExcel(months, `ledger-console-dsm-${new Date().getFullYear()}.xlsx`);
    showToast('Exported DSM data to Excel');
  }, [months, showToast]);

  const handleDownloadTemplate = useCallback(async () => {
    await downloadDsmTemplate();
    showToast('DSM template downloaded', 'info');
  }, [showToast]);

  const handleImport = useCallback(async (file: File) => {
    try {
      const imported = await importDsmFromExcel(file);
      if (imported.length === 0) { showToast('No valid month data found in file', 'warning'); return; }
      importMonths(imported);
      showToast(`Imported ${imported.length} month${imported.length > 1 ? 's' : ''} from Excel`);
    } catch {
      showToast('Failed to read file — check the format', 'warning');
    }
  }, [importMonths, showToast]);

  return (
    <>
      <Stack gap={3} sx={{ p: { xs: 2, sm: 3, md: 4 }, flex: 1 }}>
        <PageHead
          currentLabel={displayData.currentLabel}
          priorLabel={displayData.priorLabel}
          activePeriod={activePeriod}
          onPeriodChange={setActivePeriod}
          onOpenDrawer={() => setDrawerOpen(true)}
          onExport={handleExport}
          onImport={handleImport}
          onDownloadTemplate={handleDownloadTemplate}
          showPrevMonth={showPrevMonth}
          onTogglePrevMonth={onTogglePrevMonth}
          prevMonthLabel={prevMonthLabel}
          username={username}
        />

        <DsmKpiGrid data={combined} />

        <DsmTrend months={months} />

        <DsmRevVsExp data={combined} />

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 2,
            '@media (max-width: 1200px)': { gridTemplateColumns: '1fr' },
            '& > *': { minWidth: 0 },
          }}
        >
          <DsmRevenueBreakdown data={combined} />
          <DsmExpenseBreakdown data={combined} />
        </Box>

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
          Values in {PESO} Philippine Peso · Ledger Console v1.1 (May 2026)
        </Typography>
      </Stack>

      <DsmDataDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        months={months}
        updateMonthField={updateMonthField}
        resetMonth={resetMonth}
      />
    </>
  );
}

interface KpsEntityViewProps {
  showToast: (msg: string, severity?: 'success' | 'info' | 'warning') => void;
  username: string;
  showPrevMonth: boolean;
  onTogglePrevMonth: () => void;
}

function KpsEntityView({ showToast, username, showPrevMonth, onTogglePrevMonth }: KpsEntityViewProps) {
  const prevMonthLabel = useMemo(() => getPrevMonthLabel(), []);
  const { months, selectedId, setSelectedId, selectedMonth, scores, updateMonthField, resetMonth, importMonths } = useKpsState('kps', showPrevMonth);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const handleExport = useCallback(async () => {
    await exportKpsToExcel(months, `ledger-console-kps-${new Date().getFullYear()}.xlsx`);
    showToast('Exported KPS data to Excel');
  }, [months, showToast]);

  const handleDownloadTemplate = useCallback(async () => {
    await downloadKpsTemplate();
    showToast('KPS template downloaded', 'info');
  }, [showToast]);


  const handleImport = useCallback(async (file: File) => {
    try {
      const imported = await importKpsFromExcel(file);
      if (imported.length === 0) { showToast('No valid month data found in file', 'warning'); return; }
      importMonths(imported);
      showToast(`Imported ${imported.length} month${imported.length > 1 ? 's' : ''} from Excel`);
    } catch {
      showToast('Failed to read file — check the format', 'warning');
    }
  }, [importMonths, showToast]);

  if (!selectedMonth || !scores) return null;

  return (
    <>
      <Stack gap={3} sx={{ p: { xs: 2, sm: 3, md: 4 }, flex: 1 }}>
        <PageHead
          currentLabel={selectedMonth.label}
          activePeriod="MoM"
          onPeriodChange={() => {}}
          hidePeriodSelector
          onOpenDrawer={() => setDrawerOpen(true)}
          onExport={handleExport}
          onImport={handleImport}
          onDownloadTemplate={handleDownloadTemplate}
          showPrevMonth={showPrevMonth}
          onTogglePrevMonth={onTogglePrevMonth}
          prevMonthLabel={prevMonthLabel}
          username={username}
        />

        <KpsKpiGrid scores={scores} month={selectedMonth} />
        <KpsTrend months={months} />
        <KpsScorecard
          months={months}
          selectedId={selectedId}
          onSelectMonth={setSelectedId}
          scores={scores}
          inputs={selectedMonth.inputs}
        />

        <Typography sx={{ textAlign: 'center', fontSize: 11, color: 'text.secondary', py: 1, fontStyle: 'italic', fontFamily: '"Instrument Serif", serif' }}>
          Values in {PESO} Philippine Peso · Ledger Console v1.1 (May 2026)
        </Typography>
      </Stack>

      <KpsDataDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        months={months}
        selectedId={selectedId}
        onSelectMonth={setSelectedId}
        updateMonthField={updateMonthField}
        resetMonth={resetMonth}
      />
    </>
  );
}

interface SlEntityViewProps {
  showToast: (msg: string, severity?: 'success' | 'info' | 'warning') => void;
  username: string;
  showPrevMonth: boolean;
  onTogglePrevMonth: () => void;
}

function SlEntityView({ showToast, username, showPrevMonth, onTogglePrevMonth }: SlEntityViewProps) {
  const prevMonthLabel = useMemo(() => getPrevMonthLabel(), []);
  const { months, updateMonthField, resetMonth, importMonths } = useSlState('sl', showPrevMonth);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const availableYears = useMemo(
    () => [...new Set(months.map((m) => m.year))].sort(),
    [months],
  );
  const [selectedYear, setSelectedYear] = useState<number>(() => {
    const loaded = months;
    const cur = new Date().getFullYear();
    const years = [...new Set(loaded.map((m) => m.year))].sort();
    return years.includes(cur) ? cur : (years[years.length - 1] ?? cur);
  });

  const yearMonths = useMemo(
    () => months.filter((m) => m.year === selectedYear).sort((a, b) => a.month - b.month),
    [months, selectedYear],
  );

  const handleExport = useCallback(async () => {
    await exportSlToExcel(months, `ledger-console-sl-${new Date().getFullYear()}.xlsx`);
    showToast('Exported SL data to Excel');
  }, [months, showToast]);

  const handleDownloadTemplate = useCallback(async () => {
    await downloadSlTemplate();
    showToast('SL template downloaded', 'info');
  }, [showToast]);

  const handleImport = useCallback(async (file: File) => {
    try {
      const imported = await importSlFromExcel(file);
      if (imported.length === 0) { showToast('No valid month data found in file', 'warning'); return; }
      importMonths(imported);
      showToast(`Imported ${imported.length} month${imported.length > 1 ? 's' : ''} from Excel`);
    } catch {
      showToast('Failed to read file — check the format', 'warning');
    }
  }, [importMonths, showToast]);

  return (
    <>
      <Stack gap={3} sx={{ p: { xs: 2, sm: 3, md: 4 }, flex: 1 }}>
        <PageHead
          currentLabel={String(selectedYear)}
          activePeriod="MoM"
          onPeriodChange={() => {}}
          hidePeriodSelector
          onOpenDrawer={() => setDrawerOpen(true)}
          onExport={handleExport}
          onImport={handleImport}
          onDownloadTemplate={handleDownloadTemplate}
          showPrevMonth={showPrevMonth}
          onTogglePrevMonth={onTogglePrevMonth}
          prevMonthLabel={prevMonthLabel}
          username={username}
        />

        <SlSummaryTable
          months={yearMonths}
          selectedYear={selectedYear}
          availableYears={availableYears}
          onYearChange={setSelectedYear}
        />

        <SlMfsrTrend months={months} />

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 2,
            '@media (max-width: 1100px)': { gridTemplateColumns: '1fr' },
            '& > *': { minWidth: 0 },
          }}
        >
          <SlForgoneChart months={yearMonths} year={selectedYear} />
          <SlSystemLossChart months={yearMonths} year={selectedYear} />
        </Box>

        <Typography sx={{ textAlign: 'center', fontSize: 11, color: 'text.secondary', py: 1, fontStyle: 'italic', fontFamily: '"Instrument Serif", serif' }}>
          Values in {PESO} Philippine Peso · Ledger Console v1.1 (May 2026)
        </Typography>
      </Stack>

      <SlDataDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        months={months}
        updateMonthField={updateMonthField}
        resetMonth={resetMonth}
      />
    </>
  );
}

interface EntityViewProps {
  namespace: EntityTab;
  showToast: (msg: string, severity?: 'success' | 'info' | 'warning') => void;
  username: string;
  showPrevMonth: boolean;
  onTogglePrevMonth: () => void;
}

function EntityView({ namespace, showToast, username, showPrevMonth, onTogglePrevMonth }: EntityViewProps) {
  const dispatch = useAppDispatch();
  const activePeriod = useAppSelector((s) => s.ui.periods[namespace] ?? 'MoM');
  const setActivePeriod = useCallback(
    (p: import('./types/pnl').PeriodView) => dispatch(setPeriod({ tab: namespace, period: p })),
    [dispatch, namespace],
  );
  const prevMonthLabel = useMemo(() => getPrevMonthLabel(), []);
  const {
    months,
    updateMonthField,
    resetMonth,
    importMonths,
    displayData,
    computed,
  } = usePnlState(namespace, activePeriod, showPrevMonth);

  const [drawerOpen, setDrawerOpen] = useState(false);

  const combined = useMemo(
    () => ({ prior: computed.prior, current: computed.current, inputs: displayData }),
    [computed, displayData],
  );

  const handleExport = useCallback(async () => {
    await exportToExcel(months, `ledger-console-${namespace}-${new Date().getFullYear()}.xlsx`);
    showToast('Exported P&L data to Excel');
  }, [months, namespace, showToast]);

  const handleDownloadTemplate = useCallback(async () => {
    await downloadTemplate();
    showToast('Template downloaded', 'info');
  }, [showToast]);

  const handleImport = useCallback(async (file: File) => {
    try {
      const imported = await importFromExcel(file);
      if (imported.length === 0) { showToast('No valid month data found in file', 'warning'); return; }
      importMonths(imported);
      showToast(`Imported ${imported.length} month${imported.length > 1 ? 's' : ''} from Excel`);
    } catch {
      showToast('Failed to read file — check the format', 'warning');
    }
  }, [importMonths, showToast]);

  return (
    <>
      <Stack gap={3} sx={{ p: { xs: 2, sm: 3, md: 4 }, flex: 1 }}>
        <PageHead
          currentLabel={displayData.currentLabel}
          priorLabel={displayData.priorLabel}
          activePeriod={activePeriod}
          onPeriodChange={setActivePeriod}
          onOpenDrawer={() => setDrawerOpen(true)}
          onExport={handleExport}
          onImport={handleImport}
          onDownloadTemplate={handleDownloadTemplate}
          showPrevMonth={showPrevMonth}
          onTogglePrevMonth={onTogglePrevMonth}
          prevMonthLabel={prevMonthLabel}
          username={username}
        />

        <KpiGrid data={combined} />

        {/* O&M group */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 2,
            '@media (max-width: 1200px)': { gridTemplateColumns: '1fr' },
            '& > *': { minWidth: 0 },
          }}
        >
          <OmBreakdown data={combined} />
          <OmDonut data={combined} />
        </Box>

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: '2fr 1fr',
            gap: 2,
            '@media (max-width: 1200px)': { gridTemplateColumns: '1fr' },
            '& > *': { minWidth: 0 },
          }}
        >
          <Waterfall months={months} />
          <MarginComposition data={combined} />
        </Box>

        <TripleGrid data={combined} />

        {/* Revenue vs Power group */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 2,
            '@media (max-width: 1200px)': { gridTemplateColumns: '1fr' },
            '& > *': { minWidth: 0 },
          }}
        >
          <RevenueVsPower data={combined} />
          <RevPowerDonut data={combined} />
        </Box>

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
          Values in {PESO} Philippine Peso · Ledger Console v1.1 (May 2026)
        </Typography>
      </Stack>

      <DataDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        months={months}
        updateMonthField={updateMonthField}
        resetMonth={resetMonth}
      />
    </>
  );
}
