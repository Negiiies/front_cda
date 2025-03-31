// src/components/ui/LoadingSpinner.tsx
import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  color?: string;
  text?: string;
  fullScreen?: boolean;
  className?: string;
}

/**
 * Composant de chargement réutilisable avec plusieurs options de personnalisation
 */
export default function LoadingSpinner({
  size = 'md',
  color = '#138784', // Couleur principale de l'application
  text,
  fullScreen = false,
  className = '',
}: LoadingSpinnerProps) {
  // Déterminer les dimensions en fonction de la taille
  const dimensions = {
    sm: 'h-6 w-6',
    md: 'h-10 w-10',
    lg: 'h-16 w-16',
  };

  // Style du conteneur
  const containerClasses = fullScreen
    ? 'fixed inset-0 flex items-center justify-center bg-white/80 z-50'
    : 'flex flex-col items-center justify-center';

  return (
    <div className={`${containerClasses} ${className}`}>
      <div className={`relative ${dimensions[size]}`}>
        {/* Cercle extérieur */}
        <div className="absolute inset-0 rounded-full border-4 border-gray-200"></div>
        
        {/* Cercle animé */}
        <div 
          className="absolute inset-0 rounded-full border-4 border-transparent animate-spin"
          style={{ 
            borderTopColor: color,
            borderRightColor: 'transparent',
            borderBottomColor: 'transparent',
            borderLeftColor: 'transparent'
          }}
        ></div>
      </div>
      
      {/* Texte optionnel */}
      {text && <p className="mt-3 text-gray-600 text-sm font-medium">{text}</p>}
    </div>
  );
}