import { Box } from '@mui/material';
import { useColors } from '../theme/theme';

interface LogoProps {
  size?: number;
}

export function LedgerLogo({ size = 36 }: LogoProps) {
  const colors = useColors();
  const gradId = 'ledger-logo-gradient';
  const innerGradId = 'ledger-logo-inner';
  return (
    <Box
      component="svg"
      viewBox="0 0 64 64"
      sx={{
        width: size,
        height: size,
        filter: `drop-shadow(0 4px 12px ${colors.accent}33)`,
      }}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={gradId} x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stopColor={colors.accent} />
          <stop offset="100%" stopColor={colors.accent2} />
        </linearGradient>
        <linearGradient id={innerGradId} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0.7" />
        </linearGradient>
      </defs>
      <rect x="4" y="4" width="56" height="56" rx="14" fill={`url(#${gradId})`} />
      <path
        d="M18 16 v32 h12"
        fill="none"
        stroke={`url(#${innerGradId})`}
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="42" cy="20" r="3.2" fill="#ffffff" />
      <circle cx="42" cy="32" r="3.2" fill="#ffffff" />
      <circle cx="42" cy="44" r="3.2" fill="#ffffff" />
      <path
        d="M30 20 h8 M30 32 h8 M30 44 h8"
        stroke="#ffffff"
        strokeOpacity="0.55"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </Box>
  );
}
