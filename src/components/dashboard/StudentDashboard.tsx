// src/components/dashboard/StudentDashboard.tsx
'use client';

import { useState } from 'react';
import { DocumentTextIcon, ClockIcon, CheckCircleIcon, ChatBubbleLeftIcon } from '@heroicons/react/24/outline';

export default function StudentDashboard() {
  const [stats, setStats] = useState({
    pendingEvaluations: 2,
    completedEvaluations: 8,
    averageScore: 15.5,
    unreadMessages: 1
  });
  
  const statCards = [
    {
      title: 'Évaluations en cours',
      value: stats.pendingEvaluations,
      icon: <ClockIcon className="h-12 w-12 text-orange-500" />,
      color: 'orange'
    },
    {
      title: 'Évaluations terminées',
      value: stats.completedEvaluations,
      icon: <CheckCircleIcon className="h-12 w-12 text-green-500" />,
      color: 'green'
    },
    {
      title: 'Note moyenne',
      value: stats.averageScore + '/20',
      icon: <DocumentTextIcon className="h-12 w-12 text-blue-500" />,
      color: 'blue'
    },
    {
      title: 'Messages non lus',
      value: stats.unreadMessages,
      icon: <ChatBubbleLeftIcon className="h-12 w-12 text-purple-500" />,
      color: 'purple'
    }
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card, index) => (
          <div key={index} className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-gray-500 text-sm">{card.title}</h3>
                <p className="text-4xl font-bold mt-2">{card.value}</p>
              </div>
              <div>
                {card.icon}
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {/* Ajoutez ici la liste des prochaines évaluations */}
    </div>
  );
}