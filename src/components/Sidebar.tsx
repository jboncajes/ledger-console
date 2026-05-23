import { Box, Drawer, IconButton, Stack, Tooltip, Typography, alpha } from '@mui/material';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import ElectricBoltRoundedIcon from '@mui/icons-material/ElectricBoltRounded';
import SpeedRoundedIcon from '@mui/icons-material/SpeedRounded';
import FactoryRoundedIcon from '@mui/icons-material/FactoryRounded';
import TrendingDownRoundedIcon from '@mui/icons-material/TrendingDownRounded';
import { LedgerLogo } from './LedgerLogo';
import { useColors } from '../theme/theme';

export type EntityTab = 'soo' | 'dsm' | 'kps' | 'sl';

const ENTITIES: { id: EntityTab; label: string; icon: React.ReactNode }[] = [
  { id: 'soo', label: 'SoO', icon: <ElectricBoltRoundedIcon sx={{ fontSize: 20 }} /> },
  { id: 'dsm', label: 'DSM', icon: <SpeedRoundedIcon sx={{ fontSize: 20 }} /> },
  { id: 'kps', label: 'KPS', icon: <FactoryRoundedIcon sx={{ fontSize: 20 }} /> },
  { id: 'sl', label: 'SL (in PhP)', icon: <TrendingDownRoundedIcon sx={{ fontSize: 20 }} /> },
];

interface SidebarProps {
  activeEntity: EntityTab;
  onEntityChange: (entity: EntityTab) => void;
  mobileOpen: boolean;
  onMobileClose: () => void;
}

function SidebarContent({
  activeEntity,
  onEntityChange,
  onClose,
}: {
  activeEntity: EntityTab;
  onEntityChange: (entity: EntityTab) => void;
  onClose?: () => void;
}) {
  const colors = useColors();

  const handleSelect = (id: EntityTab) => {
    onEntityChange(id);
    onClose?.();
  };

  return (
    <>
      <Stack
        direction="row"
        alignItems="center"
        sx={{ px: 2, borderBottom: `1px solid ${colors.border}`, gap: 1.5, minHeight: 64 }}
      >
        <LedgerLogo size={30} />
        <Box sx={{ flex: 1, overflow: 'hidden' }}>
          <Typography sx={{ fontFamily: '"Instrument Serif", serif', fontSize: 16, letterSpacing: '0.1px', whiteSpace: 'nowrap' }}>
            Ledger Console
          </Typography>
          <Typography sx={{ fontSize: 9.5, textTransform: 'uppercase', letterSpacing: '1.4px', color: colors.inkSoft, mt: '1px' }}>
            Finance · v1.0
          </Typography>
        </Box>
        {onClose && (
          <IconButton onClick={onClose} size="small" sx={{ color: colors.inkSoft, '&:hover': { color: 'text.primary' } }}>
            <CloseRoundedIcon sx={{ fontSize: 18 }} />
          </IconButton>
        )}
      </Stack>

      <Stack gap={0.5} sx={{ p: '20px 10px', flex: 1 }}>
        <Typography sx={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '1.4px', color: colors.inkSoft, px: 1, pb: 1 }}>
          Entities
        </Typography>

        {ENTITIES.map((e) => {
          const isActive = e.id === activeEntity;
          return (
            <Tooltip key={e.id} title="" placement="right">
              <Box
                role="button"
                tabIndex={0}
                onClick={() => handleSelect(e.id)}
                onKeyDown={(ev) => {
                  if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); handleSelect(e.id); }
                }}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.5,
                  px: 1.5,
                  py: 1.1,
                  borderRadius: '10px',
                  cursor: 'pointer',
                  color: isActive ? 'text.primary' : 'text.secondary',
                  fontWeight: 500,
                  position: 'relative',
                  transition: 'all 0.2s ease',
                  background: isActive
                    ? `linear-gradient(90deg, ${alpha(colors.accent, 0.16)}, ${alpha(colors.accent, 0.02)})`
                    : 'transparent',
                  '&:hover': {
                    background: isActive
                      ? `linear-gradient(90deg, ${alpha(colors.accent, 0.16)}, ${alpha(colors.accent, 0.02)})`
                      : alpha(colors.ink, 0.04),
                    color: 'text.primary',
                  },
                  '&::before': isActive
                    ? { content: '""', position: 'absolute', left: 0, top: 8, bottom: 8, width: 2, background: colors.accent, borderRadius: '0 2px 2px 0' }
                    : {},
                }}
              >
                <Box sx={{ color: isActive ? colors.accent : 'inherit', display: 'flex' }}>
                  {e.icon}
                </Box>
                <Typography component="span" sx={{ fontSize: 13.5, fontWeight: isActive ? 600 : 500 }}>
                  {e.label}
                </Typography>
              </Box>
            </Tooltip>
          );
        })}
      </Stack>
    </>
  );
}

export function Sidebar({ activeEntity, onEntityChange, mobileOpen, onMobileClose }: SidebarProps) {
  const colors = useColors();

  return (
    <>
      {/* Desktop: sticky aside */}
      <Box
        component="aside"
        sx={{
          width: 220,
          flexShrink: 0,
          borderRight: `1px solid ${colors.border}`,
          background: colors.panel,
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          display: { xs: 'none', md: 'flex' },
          flexDirection: 'column',
          position: 'sticky',
          top: 0,
          height: '100vh',
          zIndex: 10,
        }}
      >
        <SidebarContent activeEntity={activeEntity} onEntityChange={onEntityChange} />
      </Box>

      {/* Mobile: temporary drawer */}
      <Drawer
        open={mobileOpen}
        onClose={onMobileClose}
        variant="temporary"
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': {
            width: 240,
            background: colors.panel,
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            borderRight: `1px solid ${colors.border}`,
            boxSizing: 'border-box',
          },
        }}
      >
        <SidebarContent activeEntity={activeEntity} onEntityChange={onEntityChange} onClose={onMobileClose} />
      </Drawer>
    </>
  );
}
