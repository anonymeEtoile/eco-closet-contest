import React from 'react';
import { Navigate } from 'react-router-dom';
import { useApp } from '@/contexts/AppContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireRole?: 'moderateur' | 'super_admin';
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requireRole }) => {
  const { user, role, loading } = useApp();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-muted-foreground text-sm">Chargement…</p>
        </div>
      </div>
    );
  }

  if (!user) return <Navigate to="/auth" replace />;

  if (requireRole) {
    const hasAccess =
      requireRole === 'moderateur'
        ? role === 'moderateur' || role === 'super_admin'
        : role === 'super_admin';
    if (!hasAccess) return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
