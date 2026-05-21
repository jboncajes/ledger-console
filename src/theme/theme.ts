import { createTheme, alpha, useTheme } from '@mui/material/styles';

const lightPalette = {
  bg0: '#f5f3ee',
  bg1: '#fbfaf6',
  bg2: '#ffffff',
  ink: '#1a1d24',
  inkDim: '#5b6172',
  inkSoft: '#9aa0b0',
  accent: '#5b6fd6',
  accent2: '#3aa982',
  accent3: '#d68a3a',
  danger: '#d65b78',
  border: 'rgba(20, 25, 40, 0.08)',
  borderStrong: 'rgba(20, 25, 40, 0.14)',
  panel: 'rgba(255, 255, 255, 0.55)',
  panelStrong: 'rgba(255, 255, 255, 0.78)',
};

const darkPalette = {
  bg0: '#0e1117',
  bg1: '#141720',
  bg2: '#1c2133',
  ink: '#e2e4ed',
  inkDim: '#8891a8',
  inkSoft: '#555e78',
  accent: '#7b8eed',
  accent2: '#3fb98d',
  accent3: '#e09a40',
  danger: '#e06680',
  border: 'rgba(255, 255, 255, 0.07)',
  borderStrong: 'rgba(255, 255, 255, 0.12)',
  panel: 'rgba(28, 33, 51, 0.78)',
  panelStrong: 'rgba(14, 17, 23, 0.94)',
};

declare module '@mui/material/styles' {
  interface Palette {
    custom: typeof lightPalette;
  }
  interface PaletteOptions {
    custom?: typeof lightPalette;
  }
}

export function createAppTheme(mode: 'light' | 'dark') {
  const p = mode === 'light' ? lightPalette : darkPalette;
  return createTheme({
    palette: {
      mode,
      primary: { main: p.accent },
      secondary: { main: p.accent2 },
      error: { main: p.danger },
      warning: { main: p.accent3 },
      success: { main: p.accent2 },
      background: { default: p.bg0, paper: p.panel },
      text: { primary: p.ink, secondary: p.inkDim },
      divider: p.border,
      custom: p,
    },
    typography: {
      fontFamily: '"Inter Variable", system-ui, -apple-system, sans-serif',
      fontSize: 14,
      h1: {
        fontFamily: '"Instrument Serif", serif',
        fontWeight: 400,
        fontSize: '2.4rem',
        letterSpacing: '-0.5px',
        lineHeight: 1.1,
      },
      h2: { fontFamily: '"Instrument Serif", serif', fontWeight: 400, letterSpacing: '-0.3px' },
      h3: { fontFamily: '"Instrument Serif", serif', fontWeight: 400 },
      button: { textTransform: 'none', fontWeight: 600 },
    },
    shape: { borderRadius: 14 },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          html: { overflowX: 'hidden' },
          body: {
            background: p.bg0,
            color: p.ink,
            minHeight: '100vh',
            position: 'relative',
            '&::before': {
              content: '""',
              position: 'fixed',
              inset: 0,
              background: `
                radial-gradient(ellipse 800px 500px at 12% -5%, ${alpha(p.accent, 0.18)}, transparent 60%),
                radial-gradient(ellipse 700px 500px at 95% 100%, ${alpha(p.accent2, 0.14)}, transparent 60%),
                radial-gradient(ellipse 500px 400px at 60% 40%, ${alpha(p.accent3, 0.08)}, transparent 60%)
              `,
              pointerEvents: 'none',
              zIndex: 0,
            },
            '&::after': {
              content: '""',
              position: 'fixed',
              inset: 0,
              backgroundImage: `linear-gradient(${alpha(p.ink, 0.03)} 1px, transparent 1px), linear-gradient(90deg, ${alpha(p.ink, 0.03)} 1px, transparent 1px)`,
              backgroundSize: '56px 56px',
              pointerEvents: 'none',
              zIndex: 0,
              maskImage: 'radial-gradient(ellipse at 50% 0%, black 30%, transparent 80%)',
            },
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
            backgroundColor: p.panel,
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: `1px solid ${p.border}`,
          },
        },
      },
      MuiButton: {
        styleOverrides: { root: { borderRadius: 10 } },
      },
    },
  });
}

/** Returns the current theme's custom color palette. Call inside React components only. */
export function useColors() {
  return useTheme().palette.custom;
}

export const customColors = lightPalette;
