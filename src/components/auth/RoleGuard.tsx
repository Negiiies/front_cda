// src/components/auth/RoleGuard.tsx
'use client';

import { ReactNode, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, UserRole, hasRequiredRole } from '../../lib/auth';

interface RoleGuardProps {
  children: ReactNode;
  allowedRoles: UserRole[];
  redirectTo?: string;
}

/**
 * Composant pour protéger les routes basées sur le rôle de l'utilisateur.
 * Si l'utilisateur n'a pas le rôle requis, il est redirigé vers la page spécifiée.
 */
export default function RoleGuard({ 
  children, 
  allowedRoles, 
  redirectTo = '/dashboard' 
}: RoleGuardProps) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Attendre que l'auth soit chargée
    if (!isLoading) {
      // Rediriger si l'utilisateur n'a pas le rôle requis
      if (!hasRequiredRole(user, allowedRoles)) {
        console.warn(`Access denied: user role ${user?.role} not in allowed roles [${allowedRoles.join(', ')}]`);
        router.push(redirectTo);
      }
    }
  }, [user, isLoading, allowedRoles, redirectTo, router]);

  // Afficher un indicateur de chargement pendant la vérification
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#138784]"></div>
      </div>
    );
  }

  // Ne rien afficher si l'utilisateur n'a pas le rôle requis
  if (!hasRequiredRole(user, allowedRoles)) {
    return null;
  }

  // Rendre les enfants si l'utilisateur a le rôle requis
  return <>{children}</>;
}

// Exemple d'utilisation:
// <RoleGuard allowedRoles={['admin']}>
//   <AdminDashboard />
// </RoleGuard>