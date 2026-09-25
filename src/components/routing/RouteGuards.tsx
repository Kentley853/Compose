import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export const SessionScreen: React.FC = () => (
  <div className="min-h-[100dvh] bg-[#F7F8FC] p-6">
    <div className="mx-auto max-w-5xl space-y-4">
      <div className="h-12 w-40 animate-pulse rounded-xl bg-white" />
      <div className="h-56 animate-pulse rounded-3xl bg-white" />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="h-28 animate-pulse rounded-2xl bg-white" />
        <div className="h-28 animate-pulse rounded-2xl bg-white" />
        <div className="h-28 animate-pulse rounded-2xl bg-white" />
      </div>
    </div>
  </div>
);

export const RequireAuth: React.FC = () => {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <SessionScreen />;
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  return <Outlet />;
};

export const GuestOnly: React.FC = () => {
  const { user, loading } = useAuth();
  if (loading) return <SessionScreen />;
  if (user) return <Navigate to="/dashboard" replace />;
  return <Outlet />;
};

export const RootRedirect: React.FC = () => {
  const { user, loading } = useAuth();
  if (loading) return <SessionScreen />;
  return <Navigate to={user ? '/dashboard' : '/login'} replace />;
};
