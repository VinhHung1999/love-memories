import AsyncStorage from '@react-native-async-storage/async-storage';

import { useAuthStore } from '../authStore';

// T403 (Sprint 63 hotfix) — BE rotates refreshToken on every /auth/refresh
// call. The apiClient now reads both tokens from the refresh response and
// calls setTokens() with both. If the store DROPS the rotated refreshToken
// (the old bug), the next refresh fires with a revoked token → 401 →
// forced logout after ~30 min.

const STORAGE_KEY = '@memoura/auth/v1';

const baseUser = {
  id: 'u1',
  email: 'a@b.c',
  name: 'A',
  avatarUrl: null,
  color: null,
  coupleId: 'c1',
};

describe('authStore.setTokens', () => {
  beforeEach(async () => {
    await useAuthStore.getState().clear();
    await AsyncStorage.clear();
  });

  it('persists rotated refreshToken from /auth/refresh response', async () => {
    await useAuthStore.getState().setSession({
      user: baseUser,
      accessToken: 'access_1',
      refreshToken: 'refresh_A',
      onboardingComplete: true,
    });

    await useAuthStore.getState().setTokens({
      accessToken: 'access_2',
      refreshToken: 'refresh_B',
    });

    const state = useAuthStore.getState();
    expect(state.accessToken).toBe('access_2');
    expect(state.refreshToken).toBe('refresh_B');

    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    expect(raw).not.toBeNull();
    const parsed = JSON.parse(raw!);
    expect(parsed.accessToken).toBe('access_2');
    expect(parsed.refreshToken).toBe('refresh_B');
  });

  it('keeps existing refreshToken when response omits it (null)', async () => {
    await useAuthStore.getState().setSession({
      user: baseUser,
      accessToken: 'access_1',
      refreshToken: 'refresh_A',
      onboardingComplete: true,
    });

    await useAuthStore.getState().setTokens({
      accessToken: 'access_2',
      refreshToken: null,
    });

    const state = useAuthStore.getState();
    expect(state.accessToken).toBe('access_2');
    expect(state.refreshToken).toBe('refresh_A');

    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    const parsed = JSON.parse(raw!);
    expect(parsed.refreshToken).toBe('refresh_A');
  });

  it('keeps existing refreshToken when response omits it (undefined)', async () => {
    await useAuthStore.getState().setSession({
      user: baseUser,
      accessToken: 'access_1',
      refreshToken: 'refresh_A',
      onboardingComplete: true,
    });

    await useAuthStore.getState().setTokens({ accessToken: 'access_2' });

    expect(useAuthStore.getState().refreshToken).toBe('refresh_A');
  });
});
