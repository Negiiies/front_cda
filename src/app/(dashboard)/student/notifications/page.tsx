// src/app/(dashboard)/student/notifications/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../../../lib/auth';
import { useNotification } from '../../../../contexts/NotificationContext';
import evaluationService, { Evaluation, Comment } from '../../../../services/evaluationService';
import Link from 'next/link';
import { 
  BellIcon, 
  ChatBubbleLeftIcon, 
  DocumentTextIcon, 
  CheckCircleIcon,
  ClockIcon,
  AcademicCapIcon,
  EyeIcon,
  ArchiveBoxIcon
} from '@heroicons/react/24/outline';
import LoadingSpinner from '../../../../components/ui/LoadingSpinner';

interface NotificationItem {
  id: string;
  type: 'new_evaluation' | 'new_grade' | 'new_comment' | 'evaluation_published';
  title: string;
  message: string;
  date: Date;
  isRead: boolean;
  evaluationId?: number;
  evaluation?: Evaluation;
  comment?: Comment;
}

export default function StudentNotificationsPage() {
  const { user } = useAuth();
  const { showNotification } = useNotification();
  
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Récupérer les évaluations de l'étudiant
        const evalData = await evaluationService.getEvaluations();
        const studentEvaluations = evalData.filter(evaluation => 
          evaluation.status === 'published' || evaluation.status === 'archived'
        );
        
        setEvaluations(studentEvaluations);
        
        // Générer des notifications basées sur les évaluations
        const generatedNotifications = generateNotifications(studentEvaluations);
        setNotifications(generatedNotifications);
        
      } catch (err) {
        console.error('Erreur lors du chargement des données', err);
        setError('Impossible de charger vos notifications. Veuillez réessayer plus tard.');
        showNotification('error', 'Erreur de chargement', 'Impossible de charger vos notifications.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [showNotification]);

  // Générer des notifications basées sur les évaluations
  const generateNotifications = (evaluations: Evaluation[]): NotificationItem[] => {
    const notifications: NotificationItem[] = [];
    
    evaluations.forEach((evaluation, index) => {
      // Notification pour nouvelle évaluation publiée
      if (evaluation.status === 'published') {
        notifications.push({
          id: `eval-${evaluation.id}`,
          type: 'evaluation_published',
          title: 'Nouvelle évaluation disponible',
          message: `L'évaluation "${evaluation.title}" a été publiée par ${evaluation.teacher?.name}`,
          date: new Date(evaluation.updatedAt || evaluation.createdAt),
          isRead: Math.random() > 0.5, // Simulation
          evaluationId: evaluation.id,
          evaluation
        });
      }
      
      // Notification pour notes disponibles
      if (evaluation.grades && evaluation.grades.length > 0) {
        notifications.push({
          id: `grade-${evaluation.id}`,
          type: 'new_grade',
          title: 'Nouvelles notes disponibles',
          message: `Vos notes pour "${evaluation.title}" sont maintenant disponibles`,
          date: new Date(evaluation.updatedAt || evaluation.createdAt),
          isRead: Math.random() > 0.3, // Simulation
          evaluationId: evaluation.id,
          evaluation
        });
      }
      
      // Notifications pour commentaires
      if (evaluation.comments && evaluation.comments.length > 0) {
        evaluation.comments.forEach((comment, commentIndex) => {
          notifications.push({
            id: `comment-${evaluation.id}-${comment.id}`,
            type: 'new_comment',
            title: 'Nouveau commentaire reçu',
            message: `${comment.teacher?.name} a ajouté un commentaire sur "${evaluation.title}"`,
            date: new Date(comment.createdAt),
            isRead: Math.random() > 0.7, // Simulation
            evaluationId: evaluation.id,
            evaluation,
            comment
          });
        });
      }
    });
    
    // Trier par date (plus récent en premier)
    return notifications.sort((a, b) => b.date.getTime() - a.date.getTime());
  };

  const handleMarkAsRead = (notificationId: string) => {
    setNotifications(notifications.map(notif => 
      notif.id === notificationId ? { ...notif, isRead: true } : notif
    ));
  };

  const handleMarkAllAsRead = () => {
    setNotifications(notifications.map(notif => ({ ...notif, isRead: true })));
    showNotification('success', 'Notifications marquées', 'Toutes les notifications ont été marquées comme lues.');
  };

  const getNotificationIcon = (type: NotificationItem['type']) => {
    switch (type) {
      case 'new_evaluation':
      case 'evaluation_published':
        return <DocumentTextIcon className="h-5 w-5 text-blue-600" />;
      case 'new_grade':
        return <AcademicCapIcon className="h-5 w-5 text-green-600" />;
      case 'new_comment':
        return <ChatBubbleLeftIcon className="h-5 w-5 text-purple-600" />;
      default:
        return <BellIcon className="h-5 w-5 text-gray-600" />;
    }
  };

  const getNotificationBgColor = (type: NotificationItem['type']) => {
    switch (type) {
      case 'new_evaluation':
      case 'evaluation_published':
        return 'bg-blue-50';
      case 'new_grade':
        return 'bg-green-50';
      case 'new_comment':
        return 'bg-purple-50';
      default:
        return 'bg-gray-50';
    }
  };

  // Filtrer les notifications
  const filteredNotifications = notifications.filter(notif => {
    if (filter === 'unread') return !notif.isRead;
    if (filter === 'read') return notif.isRead;
    return true;
  });

  const unreadCount = notifications.filter(n => !n.isRead).length;

  if (loading) {
    return <LoadingSpinner size="lg" text="Chargement de vos notifications..." />;
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <BellIcon className="h-8 w-8 text-[#138784] mr-3" />
            Notifications
            {unreadCount > 0 && (
              <span className="ml-3 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                {unreadCount} non lu{unreadCount > 1 ? 's' : ''}
              </span>
            )}
          </h1>
          <p className="text-gray-600 mt-1">
            Restez informé des nouvelles évaluations, notes et commentaires
          </p>
        </div>
        
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllAsRead}
            className="flex items-center space-x-2 px-4 py-2 bg-[#138784] text-white rounded-lg hover:bg-[#0c6460] transition-colors"
          >
            <CheckCircleIcon className="h-5 w-5" />
            <span>Tout marquer comme lu</span>
          </button>
        )}
      </div>

      {/* Filtres */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="flex space-x-1">
          {[
            { key: 'all', label: 'Toutes', count: notifications.length },
            { key: 'unread', label: 'Non lues', count: unreadCount },
            { key: 'read', label: 'Lues', count: notifications.length - unreadCount }
          ].map(({ key, label, count }) => (
            <button
              key={key}
              onClick={() => setFilter(key as typeof filter)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === key
                  ? 'bg-[#138784] text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {label} ({count})
            </button>
          ))}
        </div>
      </div>

      {/* Liste des notifications */}
      {filteredNotifications.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
          <BellIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {filter === 'all' 
              ? 'Aucune notification' 
              : filter === 'unread' 
                ? 'Aucune notification non lue' 
                : 'Aucune notification lue'}
          </h3>
          <p className="text-gray-600">
            {filter === 'all'
              ? 'Vous recevrez des notifications ici lorsque de nouvelles évaluations seront disponibles.'
              : filter === 'unread'
                ? 'Toutes vos notifications ont été lues.'
                : 'Aucune notification n\'a encore été marquée comme lue.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredNotifications.map((notification) => (
            <div
              key={notification.id}
              className={`bg-white rounded-xl shadow-sm border border-gray-200 p-4 transition-all hover:shadow-md ${
                !notification.isRead ? 'border-l-4 border-l-[#138784]' : ''
              }`}
            >
              <div className="flex items-start space-x-4">
                {/* Icône */}
                <div className={`flex-shrink-0 p-2 rounded-full ${getNotificationBgColor(notification.type)}`}>
                  {getNotificationIcon(notification.type)}
                </div>
                
                {/* Contenu */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className={`text-sm font-medium ${
                        !notification.isRead ? 'text-gray-900' : 'text-gray-700'
                      }`}>
                        {notification.title}
                        {!notification.isRead && (
                          <span className="ml-2 w-2 h-2 bg-[#138784] rounded-full inline-block"></span>
                        )}
                      </h3>
                      <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                        {notification.message}
                      </p>
                      <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                        <div className="flex items-center">
                          <ClockIcon className="h-4 w-4 mr-1" />
                          {notification.date.toLocaleDateString('fr-FR', {
                            day: 'numeric',
                            month: 'long',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                        {notification.evaluation && (
                          <span>• {notification.evaluation.teacher?.name}</span>
                        )}
                      </div>
                    </div>
                    
                    {/* Actions */}
                    <div className="flex items-center space-x-2 ml-4">
                      {!notification.isRead && (
                        <button
                          onClick={() => handleMarkAsRead(notification.id)}
                          className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                          title="Marquer comme lu"
                        >
                          <CheckCircleIcon className="h-5 w-5" />
                        </button>
                      )}
                      
                      {notification.evaluationId && (
                        <Link
                          href={`/student/evaluations/${notification.evaluationId}`}
                          className="p-1 text-[#138784] hover:text-[#0c6460] transition-colors"
                          title="Voir l'évaluation"
                          onClick={() => !notification.isRead && handleMarkAsRead(notification.id)}
                        >
                          <EyeIcon className="h-5 w-5" />
                        </Link>
                      )}
                    </div>
                  </div>
                  
                  {/* Extrait du commentaire si disponible */}
                  {notification.comment && (
                    <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-700 italic line-clamp-2">
                        "{notification.comment.text}"
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Actions rapides */}
      {notifications.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Actions rapides</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link
              href="/student/evaluations"
              className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <DocumentTextIcon className="h-8 w-8 text-blue-600 mr-3" />
              <div>
                <h4 className="font-medium text-gray-900">Mes évaluations</h4>
                <p className="text-sm text-gray-600">Consulter toutes mes évaluations</p>
              </div>
            </Link>
            
            <Link
              href="/student/performance"
              className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <AcademicCapIcon className="h-8 w-8 text-green-600 mr-3" />
              <div>
                <h4 className="font-medium text-gray-900">Mes performances</h4>
                <p className="text-sm text-gray-600">Voir mes statistiques détaillées</p>
              </div>
            </Link>
            
            <button
              onClick={handleMarkAllAsRead}
              className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              disabled={unreadCount === 0}
            >
              <ArchiveBoxIcon className="h-8 w-8 text-purple-600 mr-3" />
              <div>
                <h4 className="font-medium text-gray-900">Tout archiver</h4>
                <p className="text-sm text-gray-600">Marquer tout comme lu</p>
              </div>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}