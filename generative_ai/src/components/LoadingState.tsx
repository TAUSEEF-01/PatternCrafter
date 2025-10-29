import './LoadingState.css';

interface Props {
  label?: string;
  hint?: string;
}

const LoadingState = ({
  label = 'Setting up your workspace...',
  hint,
}: Props) => (
  <div className="loading-state" role="status" aria-live="polite">
    <div className="spinner">
      <span className="spinner-dot" />
      <span className="spinner-dot" />
      <span className="spinner-dot" />
    </div>
    <p className="loading-label">{label}</p>
    {hint && <p className="loading-hint">{hint}</p>}
  </div>
);

export default LoadingState;
