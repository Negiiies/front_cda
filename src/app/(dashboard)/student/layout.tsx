// src/app/(dashboard)/student/layout.tsx
'use client';

import { useEffect } from 'react';
import { useAuth } from '../../../lib/auth';
import { useRouter } from 'next/navigation';
import RoleGuard from '../../../components/auth/RoleGuard';

interface StudentLayoutProps {
  children: React.ReactNode;
}

export default function StudentLayout({ children }: StudentLayoutProps) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Rediriger si ce n'est pas un élève
    if (!isLoading && user && user.role !== 'student') {
      router.push('/dashboard');
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#138784]"></div>
      </div>
    );
  }

  return (
    <RoleGuard allowedRoles={['student']}>
      <div className="min-h-screen bg-gray-50">
        {/* Breadcrumb navigation pour les élèves */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center space-x-2 py-3 text-sm text-gray-600">
              <span>Espace élève</span>
              <span>•</span>
              <span className="text-[#138784] font-medium">
                {user?.name || user?.email}
              </span>
            </div>
          </div>
        </div>
        
        {/* Contenu principal */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </main>
      </div>
    </RoleGuard>
  );
}