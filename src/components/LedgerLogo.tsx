import { Box } from '@mui/material';
import { useColors } from '../theme/theme';

interface LogoProps {
  size?: number;
}

export function LedgerLogo({ size = 36 }: LogoProps) {
  const colors = useColors();
  const gid = 'llg';
  return (
    <Box
      component="svg"
      viewBox="0 0 64 64"
      sx={{
        width: size,
        height: size,
        filter: `drop-shadow(0 4px 14px ${colors.accent}44)`,
        flexShrink: 0,
      }}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={colors.accent} />
          <stop offset="100%" stopColor={colors.accent2} />
        </linearGradient>
      </defs>

      {/* Background */}
      <rect x="2" y="2" width="60" height="60" rx="15" fill={`url(#${gid})`} />
      <rect x="2" y="2" width="60" height="60" rx="15" fill="none" stroke="#ffffff" strokeOpacity="0.1" strokeWidth="1" />

      {/* L-axis — the Ledger Console signature mark */}
      <path
        d="M13 11 V49 H51"
        fill="none"
        stroke="#ffffff"
        strokeOpacity="0.92"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Bars rising from baseline (y=49) */}
      <rect x="17" y="39" width="9" height="10" rx="2" fill="#ffffff" fillOpacity="0.45" />
      <rect x="30" y="30" width="9" height="19" rx="2" fill="#ffffff" fillOpacity="0.65" />
      <rect x="43" y="19" width="9" height="30" rx="2" fill="#ffffff" fillOpacity="0.88" />

      {/* Trend line through bar tops */}
      <polyline
        points="21.5,39 34.5,30 47.5,19"
        fill="none"
        stroke="#ffffff"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Dots at each peak */}
      <circle cx="21.5" cy="39" r="3.2" fill="#ffffff" />
      <circle cx="34.5" cy="30" r="3.2" fill="#ffffff" />
      <circle cx="47.5" cy="19" r="3.2" fill="#ffffff" />

      {/* Inner dot accent */}
      <circle cx="21.5" cy="39" r="1.3" fill={colors.accent} opacity="0.65" />
      <circle cx="34.5" cy="30" r="1.3" fill={colors.accent} opacity="0.65" />
      <circle cx="47.5" cy="19" r="1.3" fill={colors.accent} opacity="0.65" />
    </Box>
  );
}
