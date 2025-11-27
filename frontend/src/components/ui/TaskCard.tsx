import { ReactNode } from 'react';
import { useTheme } from '@/components/NavBar';
import { motion } from 'framer-motion';
import Card from './Card';

interface TaskCardProps {
  children: ReactNode;
  className?: string;
  isHighlighted?: boolean;
  variant?: 'default' | 'success' | 'warning' | 'info';
  onClick?: () => void;
}

const variantStyles = {
  default: 'border-gray-200 dark:border-slate-700',
  success: 'border-l-4 border-l-green-500 bg-green-50/50 dark:bg-green-900/10',
  warning: 'border-l-4 border-l-amber-500 bg-amber-50/50 dark:bg-amber-900/10',
  info: 'border-l-4 border-l-blue-500 bg-blue-50/50 dark:bg-blue-900/10',
};

export default function TaskCard({
  children,
  className = '',
  isHighlighted = false,
  variant = 'default',
  onClick,
}: TaskCardProps) {
  const { darkMode } = useTheme();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{ y: -4 }}
      className="cursor-pointer"
      onClick={onClick}
    >
      <Card
        className={`
          ${variantStyles[variant]}
          ${isHighlighted ? 'ring-2 ring-indigo-500 ring-offset-2' : ''}
          ${onClick ? 'hover:shadow-xl transition-all duration-300' : ''}
          ${className}
        `}
        hover={!!onClick}
      >
        {children}
      </Card>
    </motion.div>
  );
}

