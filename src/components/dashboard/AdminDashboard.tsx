// src/components/dashboard/AdminDashboard.tsx
'use client';

import { useState } from 'react';
import { UserGroupIcon, UserIcon, AcademicCapIcon, ChatBubbleLeftIcon } from '@heroicons/react/24/outline';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalUsers: 120,
    teachers: 20,
    students: 100,
    activeEvaluations: 45
  });
  
  const statCards = [
    {
      title: 'Utilisateurs totaux',
      value: stats.totalUsers,
      icon: <UserGroupIcon className="h-12 w-12 text-blue-500" />,
      color: 'blue'
    },
    {
      title: 'Professeurs',
      value: stats.teachers,
      icon: <AcademicCapIcon className="h-12 w-12 text-green-500" />,
      color: 'green'
    },
    {
      title: 'Étudiants',
      value: stats.students,
      icon: <UserIcon className="h-12 w-12 text-orange-500" />,
      color: 'orange'
    },
    {
      title: 'Évaluations actives',
      value: stats.activeEvaluations,
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
      
      {/* Ajoutez ici la section de gestion des utilisateurs */}
    </div>
  );
}