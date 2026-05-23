import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { EntityTab } from '../components/Sidebar';
import type { PeriodView } from '../types/pnl';

interface UiState {
  activeEntity: EntityTab;
  periods: Partial<Record<EntityTab, PeriodView>>;
}

const STORAGE_KEY = 'ledger-console:ui:v1';

function loadState(): UiState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<UiState>;
      return {
        activeEntity: parsed.activeEntity ?? 'soo',
        periods: parsed.periods ?? {},
      };
    }
  } catch { /* ignore */ }
  return { activeEntity: 'soo', periods: {} };
}

const uiSlice = createSlice({
  name: 'ui',
  initialState: loadState(),
  reducers: {
    setActiveEntity(state, action: PayloadAction<EntityTab>) {
      state.activeEntity = action.payload;
    },
    setPeriod(state, action: PayloadAction<{ tab: EntityTab; period: PeriodView }>) {
      state.periods[action.payload.tab] = action.payload.period;
    },
  },
});

export const { setActiveEntity, setPeriod } = uiSlice.actions;
export { STORAGE_KEY };
export default uiSlice.reducer;
