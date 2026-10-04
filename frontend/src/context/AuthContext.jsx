import React, { createContext, useContext, useState, useEffect } from 'react';
import { api, getStoredAuth, saveStoredAuth, clearStoredAuth } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState(() => getStoredAuth());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function verifyAuth() {
      if (auth.token) {
        try {
          const user = await api.getMe();
          const family = await api.getCurrentFamily();
          saveStoredAuth(auth.token, user, family);
          setAuth({ token: auth.token, user, family });
        } catch (e) {
          console.warn('Session verification failed:', e.message);
          clearStoredAuth();
          setAuth({ token: null, user: null, family: null });
        }
      }
      setLoading(false);
    }
    verifyAuth();
  }, []);

  const login = async (familyCode, alias, pin = null) => {
    const data = await api.login({ family_code: familyCode, alias, pin });
    saveStoredAuth(data.access_token, data.user, data.family);
    setAuth({
      token: data.access_token,
      user: data.user,
      family: data.family,
    });
    // Immediately fetch full directory to guarantee all family members appear on first login
    try {
      const fullFamily = await api.getCurrentFamily();
      saveStoredAuth(data.access_token, data.user, fullFamily);
      setAuth((prev) => ({ ...prev, family: fullFamily }));
    } catch {}
    return data;
  };

  const registerFamily = async (payload) => {
    const data = await api.createFamily(payload);
    saveStoredAuth(data.access_token, data.user, data.family);
    setAuth({
      token: data.access_token,
      user: data.user,
      family: data.family,
    });
    try {
      const fullFamily = await api.getCurrentFamily();
      saveStoredAuth(data.access_token, data.user, fullFamily);
      setAuth((prev) => ({ ...prev, family: fullFamily }));
    } catch {}
    return data;
  };

  const logout = () => {
    clearStoredAuth();
    setAuth({ token: null, user: null, family: null });
  };

  const refreshFamily = async () => {
    if (auth.token) {
      try {
        const family = await api.getCurrentFamily();
        saveStoredAuth(auth.token, auth.user, family);
        setAuth((prev) => ({ ...prev, family }));
      } catch (e) {
        console.error('Failed to refresh family:', e);
      }
    }
  };

  const updateUserProfile = async (payload) => {
    const updatedUser = await api.updateProfile(payload);
    saveStoredAuth(auth.token, updatedUser, auth.family);
    setAuth((prev) => ({ ...prev, user: updatedUser }));
    // Also refresh family so other members see the new avatar/alias
    await refreshFamily();
    return updatedUser;
  };

  const updateFamilyDetails = async (payload) => {
    const updatedFamily = await api.updateFamily(payload);
    if (!updatedFamily.code_changed) {
      saveStoredAuth(auth.token, auth.user, updatedFamily);
      setAuth((prev) => ({ ...prev, family: updatedFamily }));
    }
    return updatedFamily;
  };

  return (
    <AuthContext.Provider
      value={{
        token: auth.token,
        user: auth.user,
        family: auth.family,
        isAuthenticated: !!auth.token && !!auth.user,
        isAdmin: !!auth.user?.is_admin,
        loading,
        login,
        registerFamily,
        updateUserProfile,
        updateFamilyDetails,
        logout,
        refreshFamily,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
