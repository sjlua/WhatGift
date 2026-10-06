import React from 'react';
import { useAuth } from './context/AuthContext';
import AuthPage from './pages/AuthPage';
import DashboardPage from './pages/DashboardPage';

export default function App() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-[#18191A]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-[var(--theme-primary)] border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-semibold text-[#65676B] dark:text-[#B0B3B8]">Loading WhatGift...</span>
        </div>
      </div>
    );
  }

  return isAuthenticated ? <DashboardPage /> : <AuthPage />;
}
