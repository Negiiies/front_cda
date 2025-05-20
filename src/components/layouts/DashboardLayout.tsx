// src/components/layouts/DashboardLayout.tsx
'use client';

import { useEffect, useState, Fragment } from 'react';
import { useAuth } from '../../lib/auth';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { BellIcon, UserIcon, ArrowRightOnRectangleIcon } from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Menu, Transition } from '@headlessui/react';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user, logout, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [currentDate] = useState(new Date());
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Formater la date en français
  const formattedDate = format(currentDate, "EEEE dd MMMM yyyy", { locale: fr });
  
  // Déterminer le nom d'affichage selon le rôle
  const userDisplayName = user?.name || user?.email || '';
  const roleLabel = user?.role === 'teacher' ? 'Professeur' : 
                   (user?.role === 'admin' ? 'Administrateur' : 'Élève');

  // Fonction pour gérer la déconnexion
  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Erreur lors de la déconnexion:", error);
    }
  };

  // Rediriger si non authentifié
  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  // Afficher un indicateur de chargement
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#138784] mb-3"></div>
          <p className="text-gray-600">Chargement de votre profil...</p>
        </div>
      </div>
    );
  }

  // Pas d'affichage si pas d'utilisateur
  if (!user) {
    return null;
  }

  // Navigation items based on user role
  const navItems = [
    { label: 'Dashboard', path: '/dashboard', icon: 'chart-bar' },
    // Pour tous les rôles
    { label: 'Évaluations', path: '/evaluations', icon: 'calendar' },
    
    // Uniquement pour les professeurs et admins
    ...(user.role === 'teacher' || user.role === 'admin' 
      ? [{ label: 'Barèmes', path: '/scales', icon: 'document-text' }] 
      : []),
    
    // Uniquement pour les admins
    ...(user.role === 'admin' 
      ? [{ label: 'Utilisateurs', path: '/users', icon: 'user-group' }] 
      : [])
  ];

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar - version desktop */}
      <aside className="hidden md:flex md:w-64 flex-col bg-white shadow-md">
        <div className="p-6">
          <Link href="/dashboard" className="text-2xl font-bold text-[#138784]">
            89 Progress
          </Link>
        </div>
        <nav className="mt-6 flex-grow">
          <ul>
            {navItems.map((item) => (
              <li key={item.path}>
                <Link
                  href={item.path}
                  className={`flex items-center px-6 py-3 text-gray-700 hover:bg-gray-100 ${
                    pathname === item.path ? 'bg-gray-100 border-l-4 border-[#138784] font-medium' : ''
                  }`}
                >
                  <span className="inline-flex items-center justify-center w-8">
                    <i className={`fas fa-${item.icon}`}></i>
                  </span>
                  <span>{item.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        
        {/* Bouton de déconnexion en bas de la sidebar */}
        <div className="p-4 border-t border-gray-200">
          <button 
            onClick={handleLogout}
            className="flex items-center w-full px-4 py-2 text-red-600 rounded hover:bg-red-50 transition-colors"
          >
            <span className="inline-flex items-center justify-center w-8">
              <ArrowRightOnRectangleIcon className="h-5 w-5" />
            </span>
            <span>Déconnexion</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white shadow-sm">
          <div className="flex items-center justify-between px-6 py-4">
            <div>
              {/* Mise à jour: rendre tout le texte visible et coloré */}
              <h2 className="text-2xl font-bold text-[#138784]">
                Bonjour, {roleLabel} {user.email}
              </h2>
              <p className="text-gray-500">{formattedDate}</p>
            </div>
            <div className="flex items-center space-x-4">
              <button className="p-2 rounded-full hover:bg-gray-100">
                <BellIcon className="h-6 w-6 text-gray-600" />
              </button>
              
              {/* Menu du profil utilisateur */}
              <Menu as="div" className="relative">
                <Menu.Button className="flex items-center space-x-1 p-2 rounded-full hover:bg-gray-100">
                  <div className="h-8 w-8 rounded-full bg-[#138784] flex items-center justify-center text-white">
                    {userDisplayName?.charAt(0).toUpperCase() || 'U'}
                  </div>
                </Menu.Button>
                <Transition
                  as={Fragment}
                  enter="transition ease-out duration-100"
                  enterFrom="transform opacity-0 scale-95"
                  enterTo="transform opacity-100 scale-100"
                  leave="transition ease-in duration-75"
                  leaveFrom="transform opacity-100 scale-100"
                  leaveTo="transform opacity-0 scale-95"
                >
                  <Menu.Items className="absolute right-0 mt-2 w-48 origin-top-right bg-white divide-y divide-gray-100 rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                    <div className="px-1 py-1">
                      <Menu.Item>
                        {({ active }) => (
                          <Link
                            href="/profile"
                            className={`${
                              active ? 'bg-gray-100' : ''
                            } group flex rounded-md items-center w-full px-2 py-2 text-sm text-gray-900`}
                          >
                            <UserIcon className="h-5 w-5 mr-2 text-gray-500" />
                            Mon profil
                          </Link>
                        )}
                      </Menu.Item>
                      <Menu.Item>
                        {({ active }) => (
                          <button
                            onClick={handleLogout}
                            className={`${
                              active ? 'bg-gray-100' : ''
                            } group flex rounded-md items-center w-full px-2 py-2 text-sm text-red-600`}
                          >
                            <ArrowRightOnRectangleIcon className="h-5 w-5 mr-2 text-red-500" />
                            Déconnexion
                          </button>
                        )}
                      </Menu.Item>
                    </div>
                  </Menu.Items>
                </Transition>
              </Menu>
            </div>
          </div>
        </header>

        {/* Mobile Menu Button - Visible only on small screens */}
        <div className="md:hidden p-4 flex items-center justify-between">
          <Link href="/dashboard" className="text-xl font-bold text-[#138784]">
            89 Progress
          </Link>
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 rounded-md text-gray-700 hover:bg-gray-100"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>

        {/* Mobile Menu - Sidebar for small screens */}
        {isMobileMenuOpen && (
          <div className="md:hidden fixed inset-0 z-40 bg-black bg-opacity-50">
            <div className="fixed inset-y-0 left-0 w-3/4 max-w-xs bg-white shadow-lg z-50">
              <div className="p-6 flex items-center justify-between">
                <Link href="/dashboard" className="text-xl font-bold text-[#138784]">
                  89 Progress
                </Link>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-2 rounded-md text-gray-700 hover:bg-gray-100"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <nav className="mt-6">
                <ul>
                  {navItems.map((item) => (
                    <li key={item.path}>
                      <Link
                        href={item.path}
                        className={`flex items-center px-6 py-3 text-gray-700 hover:bg-gray-100 ${
                          pathname === item.path ? 'bg-gray-100 border-l-4 border-[#138784] font-medium' : ''
                        }`}
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        <span className="inline-flex items-center justify-center w-8">
                          <i className={`fas fa-${item.icon}`}></i>
                        </span>
                        <span>{item.label}</span>
                      </Link>
                    </li>
                  ))}
                  <li>
                    <button 
                      onClick={handleLogout}
                      className="flex items-center w-full px-6 py-3 text-red-600 hover:bg-red-50"
                    >
                      <span className="inline-flex items-center justify-center w-8">
                        <ArrowRightOnRectangleIcon className="h-5 w-5" />
                      </span>
                      <span>Déconnexion</span>
                    </button>
                  </li>
                </ul>
              </nav>
            </div>
            <div 
              className="fixed inset-0 z-30" 
              onClick={() => setIsMobileMenuOpen(false)}
              aria-hidden="true"
            />
          </div>
        )}

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-6 bg-gray-100">
          {children}
        </main>
      </div>
    </div>
  );
}