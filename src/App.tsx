import React from 'react';
import { BrowserRouter, Navigate, Outlet, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProjectProvider } from './context/ProjectContext';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { LoginPage } from './components/auth/LoginPage';
import { ForgotPasswordPage, HelpPage, ResetPasswordPage } from './components/auth/AccountRecoveryPages';
import { GuestOnly, RequireAuth, RootRedirect } from './components/routing/RouteGuards';
import { AppShell } from './components/shell/AppShell';
import { HomeDashboard } from './components/shell/HomeDashboard';
import { DesignsPage, InspirationPage, SettingsPage, TeamPage, TemplatesPage, ToolsPage } from './components/shell/LibraryPages';
import { ProjectsListScreen } from './components/screens/ProjectsListScreen';
import { StudioApp } from './components/studio/StudioApp';

const AuthenticatedWorkspace: React.FC = () => (
  <ProjectProvider>
    <Outlet />
  </ProjectProvider>
);

export default function App() {
  return (
    <ErrorBoundary fallbackTitle="Compose AI Application Error">
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<RootRedirect />} />
            <Route element={<GuestOnly />}>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            </Route>
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="/help" element={<HelpPage />} />
            <Route element={<RequireAuth />}>
              <Route element={<AuthenticatedWorkspace />}>
                <Route element={<AppShell />}>
                  <Route path="/dashboard" element={<HomeDashboard />} />
                  <Route path="/projects" element={<ProjectsListScreen />} />
                  <Route path="/designs" element={<DesignsPage />} />
                  <Route path="/inspiration" element={<InspirationPage />} />
                  <Route path="/templates" element={<TemplatesPage />} />
                  <Route path="/tools" element={<ToolsPage />} />
                  <Route path="/team" element={<TeamPage />} />
                  <Route path="/settings" element={<SettingsPage />} />
                </Route>
                <Route path="/studio/:screenId" element={<StudioApp />} />
              </Route>
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
