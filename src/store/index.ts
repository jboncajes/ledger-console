import { configureStore } from '@reduxjs/toolkit';
import uiReducer, { STORAGE_KEY } from './uiSlice';

export const store = configureStore({
  reducer: { ui: uiReducer },
});

// Persist UI state to localStorage on every change
store.subscribe(() => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store.getState().ui));
  } catch { /* ignore quota errors */ }
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
