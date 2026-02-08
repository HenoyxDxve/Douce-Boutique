import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

export default function ProtectedAdminRoute({ children }: { children: React.ReactNode }) {
  const { estAdmin, chargement } = useAuth();

  if (chargement) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto mb-4" />
          <p>Vérification...</p>
        </div>
      </div>
    );
  }

  if (!estAdmin) {
    return <Navigate to="/compte" replace />;
  }

  return <>{children}</>;
}
