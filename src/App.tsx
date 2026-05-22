import { useCallback, useMemo, useState } from 'react';
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
import { DataDrawer } from './components/DataDrawer';
import { usePnlState } from './hooks/usePnlState';
import { createAppTheme, useColors } from './theme/theme';
import { PESO } from './utils/format';
import { getStoredUser, logout } from './auth';
import { exportToExcel, downloadTemplate } from './utils/exportExcel';
import { importFromExcel } from './utils/importExcel';
import type { AuthUser } from './auth';

export default function App() {
  const [darkMode, setDarkMode] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(() => getStoredUser());
  const appTheme = useMemo(() => createAppTheme(darkMode ? 'dark' : 'light'), [darkMode]);

  const handleLogin = (u: AuthUser) => setUser(u);

  return (
    <ThemeProvider theme={appTheme}>
      <CssBaseline />
      {user ? (
        <Dashboard
          user={user}
          darkMode={darkMode}
          onToggleDark={() => setDarkMode((d) => !d)}
          onLogout={() => { logout(); setUser(null); }}
        />
      ) : (
        <LoginPage onLogin={handleLogin} />
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
  const {
    months,
    activePeriod,
    setActivePeriod,
    updateMonthField,
    resetMonth,
    importMonths,
    displayData,
    computed,
  } = usePnlState();

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [toast, setToast] = useState<{ open: boolean; msg: string; severity: 'success' | 'info' | 'warning' }>({
    open: false, msg: '', severity: 'success',
  });

  const showToast = useCallback((msg: string, severity: 'success' | 'info' | 'warning' = 'success') => {
    setToast({ open: true, msg, severity });
  }, []);

  const combined = useMemo(
    () => ({ prior: computed.prior, current: computed.current, inputs: displayData }),
    [computed, displayData],
  );

  const handleExport = useCallback(async () => {
    await exportToExcel(months, `ledger-console-${new Date().getFullYear()}.xlsx`);
    showToast('Exported P&L data to Excel');
  }, [months, showToast]);

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
    <Box sx={{ position: 'relative', zIndex: 1, minHeight: '100vh' }}>
      <Topbar
        darkMode={darkMode}
        onToggleDark={onToggleDark}
        user={user}
        onLogoutRequest={() => setLogoutOpen(true)}
      />

      <Stack gap={3} sx={{ p: 4 }}>
        <PageHead
          currentLabel={displayData.currentLabel}
          priorLabel={displayData.priorLabel}
          activePeriod={activePeriod}
          onPeriodChange={setActivePeriod}
          onOpenDrawer={() => setDrawerOpen(true)}
          onExport={handleExport}
          onImport={handleImport}
          onDownloadTemplate={handleDownloadTemplate}
        />

        <KpiGrid data={combined} />

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
          Values in {PESO} Philippine Peso · Ledger Console v0.0
        </Typography>
      </Stack>

      <DataDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        months={months}
        updateMonthField={updateMonthField}
        resetMonth={resetMonth}
      />

      {/* Logout confirmation modal */}
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
