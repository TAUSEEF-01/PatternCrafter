import { NavLink } from 'react-router-dom';

type NavTabsProps = {
  variant?: 'top' | 'side';
};

export function NavTabs({ variant = 'top' }: NavTabsProps) {
  if (variant === 'side') {
    return (
      <aside className="side-tabs" aria-label="Section navigation">
        <div className="side-tabs-wrap">
          <div className="brand">Intent & Slot Tester</div>
          <nav className="side-tabs-nav">
            <NavLink to="/" end className={({ isActive }) => (isActive ? 'tab tab-active' : 'tab')}>
              Annotate
            </NavLink>
            <NavLink
              to="/history"
              className={({ isActive }) => (isActive ? 'tab tab-active' : 'tab')}
            >
              History
            </NavLink>
          </nav>
        </div>
      </aside>
    );
  }

  return (
    <div className="tabs">
      <div className="tabs-wrap">
        <div className="brand">Intent & Slot Tester</div>
        <nav className="tabs-nav">
          <NavLink to="/" end className={({ isActive }) => (isActive ? 'tab tab-active' : 'tab')}>
            Annotate
          </NavLink>
          <NavLink
            to="/history"
            className={({ isActive }) => (isActive ? 'tab tab-active' : 'tab')}
          >
            History
          </NavLink>
        </nav>
      </div>
    </div>
  );
}
