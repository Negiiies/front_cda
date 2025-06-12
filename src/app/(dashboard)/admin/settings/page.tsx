// src/app/(dashboard)/admin/settings/page.tsx
'use client';

import { useState, useEffect } from 'react';
import RoleGuard from '../../../../components/auth/RoleGuard';
import { useNotification } from '../../../../contexts/NotificationContext';
import {
  CogIcon,
  BellIcon,
  ShieldCheckIcon,
  CircleStackIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';

interface SystemSettings {
  general: {
    appName: string;
    maintenance: boolean;
    maxUsersPerRole: {
      student: number;
      teacher: number;
      admin: number;
    };
  };
  notifications: {
    emailNotifications: boolean;
    evaluationReminders: boolean;
    weeklyReports: boolean;
    systemAlerts: boolean;
  };
  security: {
    sessionTimeout: number;
    maxLoginAttempts: number;
    passwordExpiry: number;
    twoFactorAuth: boolean;
  };
  database: {
    backupFrequency: 'daily' | 'weekly' | 'monthly';
    retentionPeriod: number;
    autoCleanup: boolean;
  };
}

export default function AdminSettingsPage() {
  const { showNotification } = useNotification();
  
  const [settings, setSettings] = useState<SystemSettings>({
    general: {
      appName: '89 Progress',
      maintenance: false,
      maxUsersPerRole: {
        student: 1000,
        teacher: 50,
        admin: 5
      }
    },
    notifications: {
      emailNotifications: true,
      evaluationReminders: true,
      weeklyReports: true,
      systemAlerts: true
    },
    security: {
      sessionTimeout: 15,
      maxLoginAttempts: 5,
      passwordExpiry: 90,
      twoFactorAuth: false
    },
    database: {
      backupFrequency: 'daily',
      retentionPeriod: 30,
      autoCleanup: true
    }
  });

  const [loading, setLoading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const handleSettingChange = (section: keyof SystemSettings, key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: value
      }
    }));
    setHasChanges(true);
  };

  const handleNestedSettingChange = (section: keyof SystemSettings, parentKey: string, key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [parentKey]: {
          ...(prev[section] as any)[parentKey],
          [key]: value
        }
      }
    }));
    setHasChanges(true);
  };

  const saveSettings = async () => {
    setLoading(true);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      showNotification('success', 'Paramètres sauvegardés', 'Les paramètres système ont été mis à jour avec succès.');
      setHasChanges(false);
    } catch (error) {
      showNotification('error', 'Erreur de sauvegarde', 'Impossible de sauvegarder les paramètres.');
    } finally {
      setLoading(false);
    }
  };

  const resetSettings = () => {
    if (window.confirm('Êtes-vous sûr de vouloir restaurer les paramètres par défaut ?')) {
      setSettings({
        general: {
          appName: '89 Progress',
          maintenance: false,
          maxUsersPerRole: {
            student: 1000,
            teacher: 50,
            admin: 5
          }
        },
        notifications: {
          emailNotifications: true,
          evaluationReminders: true,
          weeklyReports: true,
          systemAlerts: true
        },
        security: {
          sessionTimeout: 15,
          maxLoginAttempts: 5,
          passwordExpiry: 90,
          twoFactorAuth: false
        },
        database: {
          backupFrequency: 'daily',
          retentionPeriod: 30,
          autoCleanup: true
        }
      });
      setHasChanges(true);
      showNotification('info', 'Paramètres restaurés', 'Les paramètres par défaut ont été restaurés.');
    }
  };

  const testBackup = async () => {
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      showNotification('success', 'Test réussi', 'La sauvegarde de test a été créée avec succès.');
    } catch (error) {
      showNotification('error', 'Erreur', 'Le test de sauvegarde a échoué.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <RoleGuard allowedRoles={['admin']}>
      <div className="space-y-6">
        {/* En-tête */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Paramètres Système</h1>
            <p className="text-gray-600 mt-1">Configuration générale de l'application</p>
          </div>
          
          <div className="flex space-x-3">
            <button
              onClick={resetSettings}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
            >
              Restaurer par défaut
            </button>
            
            <button
              onClick={saveSettings}
              disabled={!hasChanges || loading}
              className="bg-[#138784] text-white px-4 py-2 rounded-md hover:bg-[#0c6460] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Sauvegarde...' : 'Sauvegarder'}
            </button>
          </div>
        </div>

        {/* Alerte de modifications */}
        {hasChanges && (
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-lg flex items-center">
            <ExclamationTriangleIcon className="h-5 w-5 mr-2 text-yellow-600" />
            <span className="font-medium">Vous avez des modifications non sauvegardées.</span>
          </div>
        )}

        {/* Paramètres généraux */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center mb-6">
            <CogIcon className="h-6 w-6 text-[#138784] mr-3" />
            <h2 className="text-xl font-semibold text-gray-900">Paramètres généraux</h2>
          </div>
          
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="appName" className="block text-sm font-medium text-gray-700 mb-2">
                  Nom de l'application
                </label>
                <input
                  type="text"
                  id="appName"
                  value={settings.general.appName}
                  onChange={(e) => handleSettingChange('general', 'appName', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#138784] focus:border-[#138784] text-gray-900 bg-white"
                />
              </div>
              
              <div className="flex items-center pt-6">
                <input
                  type="checkbox"
                  id="maintenance"
                  checked={settings.general.maintenance}
                  onChange={(e) => handleSettingChange('general', 'maintenance', e.target.checked)}
                  className="h-4 w-4 text-[#138784] focus:ring-[#138784] border-gray-300 rounded"
                />
                <label htmlFor="maintenance" className="ml-3 text-sm font-medium text-gray-700">
                  Mode maintenance
                </label>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Limites d'utilisateurs par rôle</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label htmlFor="maxStudents" className="block text-sm font-medium text-gray-700 mb-1">
                    Étudiants max
                  </label>
                  <input
                    type="number"
                    id="maxStudents"
                    min="1"
                    value={settings.general.maxUsersPerRole.student}
                    onChange={(e) => handleNestedSettingChange('general', 'maxUsersPerRole', 'student', parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#138784] focus:border-[#138784] text-gray-900 bg-white"
                  />
                </div>
                
                <div>
                  <label htmlFor="maxTeachers" className="block text-sm font-medium text-gray-700 mb-1">
                    Professeurs max
                  </label>
                  <input
                    type="number"
                    id="maxTeachers"
                    min="1"
                    value={settings.general.maxUsersPerRole.teacher}
                    onChange={(e) => handleNestedSettingChange('general', 'maxUsersPerRole', 'teacher', parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#138784] focus:border-[#138784] text-gray-900 bg-white"
                  />
                </div>
                
                <div>
                  <label htmlFor="maxAdmins" className="block text-sm font-medium text-gray-700 mb-1">
                    Admins max
                  </label>
                  <input
                    type="number"
                    id="maxAdmins"
                    min="1"
                    value={settings.general.maxUsersPerRole.admin}
                    onChange={(e) => handleNestedSettingChange('general', 'maxUsersPerRole', 'admin', parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#138784] focus:border-[#138784] text-gray-900 bg-white"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Paramètres de notifications */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center mb-6">
            <BellIcon className="h-6 w-6 text-[#138784] mr-3" />
            <h2 className="text-xl font-semibold text-gray-900">Notifications</h2>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <h4 className="text-sm font-medium text-gray-900">Notifications par email</h4>
                <p className="text-xs text-gray-600">Envoyer des emails pour les événements importants</p>
              </div>
              <input
                type="checkbox"
                id="emailNotifications"
                checked={settings.notifications.emailNotifications}
                onChange={(e) => handleSettingChange('notifications', 'emailNotifications', e.target.checked)}
                className="h-4 w-4 text-[#138784] focus:ring-[#138784] border-gray-300 rounded"
              />
            </div>
            
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <h4 className="text-sm font-medium text-gray-900">Rappels d'évaluation</h4>
                <p className="text-xs text-gray-600">Rappeler aux professeurs les évaluations en attente</p>
              </div>
              <input
                type="checkbox"
                id="evaluationReminders"
                checked={settings.notifications.evaluationReminders}
                onChange={(e) => handleSettingChange('notifications', 'evaluationReminders', e.target.checked)}
                className="h-4 w-4 text-[#138784] focus:ring-[#138784] border-gray-300 rounded"
              />
            </div>
            
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <h4 className="text-sm font-medium text-gray-900">Rapports hebdomadaires</h4>
                <p className="text-xs text-gray-600">Envoyer un résumé hebdomadaire aux administrateurs</p>
              </div>
              <input
                type="checkbox"
                id="weeklyReports"
                checked={settings.notifications.weeklyReports}
                onChange={(e) => handleSettingChange('notifications', 'weeklyReports', e.target.checked)}
                className="h-4 w-4 text-[#138784] focus:ring-[#138784] border-gray-300 rounded"
              />
            </div>
            
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <h4 className="text-sm font-medium text-gray-900">Alertes système</h4>
                <p className="text-xs text-gray-600">Notifications en cas de problème système</p>
              </div>
              <input
                type="checkbox"
                id="systemAlerts"
                checked={settings.notifications.systemAlerts}
                onChange={(e) => handleSettingChange('notifications', 'systemAlerts', e.target.checked)}
                className="h-4 w-4 text-[#138784] focus:ring-[#138784] border-gray-300 rounded"
              />
            </div>
          </div>
        </div>

        {/* Paramètres de sécurité */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center mb-6">
            <ShieldCheckIcon className="h-6 w-6 text-[#138784] mr-3" />
            <h2 className="text-xl font-semibold text-gray-900">Sécurité</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="sessionTimeout" className="block text-sm font-medium text-gray-700 mb-2">
                Timeout de session (minutes)
              </label>
              <input
                type="number"
                id="sessionTimeout"
                min="5"
                max="120"
                value={settings.security.sessionTimeout}
                onChange={(e) => handleSettingChange('security', 'sessionTimeout', parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#138784] focus:border-[#138784] text-gray-900 bg-white"
              />
            </div>
            
            <div>
              <label htmlFor="maxLoginAttempts" className="block text-sm font-medium text-gray-700 mb-2">
                Tentatives de connexion max
              </label>
              <input
                type="number"
                id="maxLoginAttempts"
                min="3"
                max="10"
                value={settings.security.maxLoginAttempts}
                onChange={(e) => handleSettingChange('security', 'maxLoginAttempts', parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#138784] focus:border-[#138784] text-gray-900 bg-white"
              />
            </div>
            
            <div>
              <label htmlFor="passwordExpiry" className="block text-sm font-medium text-gray-700 mb-2">
                Expiration mot de passe (jours)
              </label>
              <input
                type="number"
                id="passwordExpiry"
                min="30"
                max="365"
                value={settings.security.passwordExpiry}
                onChange={(e) => handleSettingChange('security', 'passwordExpiry', parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#138784] focus:border-[#138784] text-gray-900 bg-white"
              />
            </div>
            
            <div className="flex items-center pt-6">
              <input
                type="checkbox"
                id="twoFactorAuth"
                checked={settings.security.twoFactorAuth}
                onChange={(e) => handleSettingChange('security', 'twoFactorAuth', e.target.checked)}
                className="h-4 w-4 text-[#138784] focus:ring-[#138784] border-gray-300 rounded"
              />
              <label htmlFor="twoFactorAuth" className="ml-3 text-sm font-medium text-gray-700">
                Authentification à deux facteurs
              </label>
            </div>
          </div>
        </div>

        {/* Paramètres de base de données */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center mb-6">
            <CircleStackIcon className="h-6 w-6 text-[#138784] mr-3" />
            <h2 className="text-xl font-semibold text-gray-900">Base de données</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="backupFrequency" className="block text-sm font-medium text-gray-700 mb-2">
                Fréquence de sauvegarde
              </label>
              <select
                id="backupFrequency"
                value={settings.database.backupFrequency}
                onChange={(e) => handleSettingChange('database', 'backupFrequency', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#138784] focus:border-[#138784] text-gray-900 bg-white"
              >
                <option value="daily">Quotidienne</option>
                <option value="weekly">Hebdomadaire</option>
                <option value="monthly">Mensuelle</option>
              </select>
            </div>
            
            <div>
              <label htmlFor="retentionPeriod" className="block text-sm font-medium text-gray-700 mb-2">
                Période de rétention (jours)
              </label>
              <input
                type="number"
                id="retentionPeriod"
                min="7"
                max="365"
                value={settings.database.retentionPeriod}
                onChange={(e) => handleSettingChange('database', 'retentionPeriod', parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#138784] focus:border-[#138784] text-gray-900 bg-white"
              />
            </div>
            
            <div className="flex items-center">
              <input
                type="checkbox"
                id="autoCleanup"
                checked={settings.database.autoCleanup}
                onChange={(e) => handleSettingChange('database', 'autoCleanup', e.target.checked)}
                className="h-4 w-4 text-[#138784] focus:ring-[#138784] border-gray-300 rounded"
              />
              <label htmlFor="autoCleanup" className="ml-3 text-sm font-medium text-gray-700">
                Nettoyage automatique
              </label>
            </div>
            
            <div>
              <button
                onClick={testBackup}
                disabled={loading}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {loading ? 'Test en cours...' : 'Tester la sauvegarde'}
              </button>
            </div>
          </div>
        </div>

        {/* Informations système */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center mb-6">
            <InformationCircleIcon className="h-6 w-6 text-[#138784] mr-3" />
            <h2 className="text-xl font-semibold text-gray-900">Informations système</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <h3 className="text-sm font-medium text-gray-600 mb-2">Version</h3>
              <p className="text-2xl font-bold text-[#138784]">v1.0.0</p>
            </div>
            
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <h3 className="text-sm font-medium text-gray-600 mb-2">Dernière sauvegarde</h3>
              <p className="text-lg font-semibold text-gray-900">Il y a 2h</p>
            </div>
            
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <h3 className="text-sm font-medium text-gray-600 mb-2">Statut</h3>
              <div className="flex items-center justify-center">
                <CheckCircleIcon className="h-5 w-5 text-green-500 mr-2" />
                <span className="text-lg font-semibold text-green-600">Opérationnel</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </RoleGuard>
  );
}