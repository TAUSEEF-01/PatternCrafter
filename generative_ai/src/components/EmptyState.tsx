import type { ReactNode } from 'react';
import './EmptyState.css';

interface Props {
  title: string;
  message: string;
  action?: ReactNode;
}

const EmptyState = ({ title, message, action }: Props) => (
  <div className="empty-state">
    <div className="empty-graphic" aria-hidden="true">
      <span />
      <span />
      <span />
    </div>
    <h3>{title}</h3>
    <p>{message}</p>
    {action}
  </div>
);

export default EmptyState;
