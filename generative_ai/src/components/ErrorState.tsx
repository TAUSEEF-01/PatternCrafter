import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import './ErrorState.css';

interface Props {
  title?: string;
  message: string;
  action?: ReactNode;
}

const ErrorState = ({
  title = 'Something went wrong',
  message,
  action,
}: Props) => (
  <div className="error-state" role="alert">
    <div className="error-icon">!</div>
    <h3>{title}</h3>
    <p>{message}</p>
    {action ?? (
      <Link to="/" className="error-action">
        Return to gallery
      </Link>
    )}
  </div>
);

export default ErrorState;
