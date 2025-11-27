import { ReactNode } from 'react';
import { useTheme } from '@/components/NavBar';

interface CardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
}

export default function Card({ children, className = '', hover = false }: CardProps) {
  const { darkMode } = useTheme();
  
  return (
    <div
      className={`
        rounded-2xl shadow-lg border transition-all duration-300
        ${darkMode 
          ? 'bg-slate-800/90 border-slate-700 backdrop-blur-sm' 
          : 'bg-white/90 border-gray-200 backdrop-blur-sm'
        }
        ${hover ? 'hover:shadow-xl hover:-translate-y-1' : ''}
        ${className}
      `}
    >
      {children}
    </div>
  );
}

