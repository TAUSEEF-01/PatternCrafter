import { useNavigate } from 'react-router-dom';
import { useTheme } from '@/components/NavBar';

export default function WelcomePage() {
  const navigate = useNavigate();
  const { darkMode } = useTheme();

  return (
    <div
      style={{
        position: 'relative',
        minHeight: 'calc(100vh - 80px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '3rem 2rem',
      }}
    >
      <div style={{ maxWidth: '1200px', width: '100%' }}>
        {/* Hero Section */}
        <section
          style={{
            maxWidth: '900px',
            textAlign: 'center',
            margin: '0 auto 4rem',
            animation: 'fadeInUp 0.8s ease-out',
          }}
        >
          <div
            style={{
              fontSize: '1.1rem',
              fontWeight: '500',
              background: 'linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              marginBottom: '1rem',
              letterSpacing: '0.05em',
            }}
          >
            Welcome to
          </div>
          <h1
            style={{
              fontSize: 'clamp(3rem, 8vw, 5.5rem)',
              fontWeight: '800',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              marginBottom: '1.5rem',
              lineHeight: '1.1',
              letterSpacing: '-0.02em',
            }}
          >
            PatternCrafter
          </h1>
          <p
            style={{
              fontSize: 'clamp(1.1rem, 2.5vw, 1.35rem)',
              lineHeight: '1.6',
              maxWidth: '700px',
              margin: '0 auto 2.5rem',
              opacity: '0.9',
              color: darkMode ? '#e2e8f0' : '#475569',
            }}
          >
            Craft, annotate, and evaluate conversational AI datasets and templates—all in
            one powerful, unified workspace.
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={() => navigate('/register')}
              style={{
                fontSize: '1.05rem',
                padding: '0.85rem 2rem',
                fontWeight: '600',
                borderRadius: '0.5rem',
                backgroundColor: '#7A1CAC',
                color: '#EBD3F8',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                boxShadow: '0 10px 25px rgba(122, 28, 172, 0.3)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 15px 35px rgba(122, 28, 172, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 10px 25px rgba(122, 28, 172, 0.3)';
              }}
            >
              Get Started
            </button>

            <button
              onClick={() => navigate('/login')}
              style={{
                fontSize: '1.05rem',
                padding: '0.85rem 2rem',
                fontWeight: '600',
                borderRadius: '0.5rem',
                backgroundColor: darkMode ? '#1e293b' : '#ffffff',
                color: darkMode ? '#e2e8f0' : '#1e293b',
                border: darkMode ? '2px solid #334155' : '2px solid #e2e8f0',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                boxShadow: darkMode 
                  ? '0 10px 25px rgba(0, 0, 0, 0.3)' 
                  : '0 10px 25px rgba(0, 0, 0, 0.1)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = darkMode
                  ? '0 15px 35px rgba(0, 0, 0, 0.4)'
                  : '0 15px 35px rgba(0, 0, 0, 0.15)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = darkMode
                  ? '0 10px 25px rgba(0, 0, 0, 0.3)'
                  : '0 10px 25px rgba(0, 0, 0, 0.1)';
              }}
            >
              Sign In
            </button>
          </div>
        </section>

        {/* Features */}
        <section
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '2rem',
            animation: 'fadeInUp 0.8s ease-out 0.2s backwards',
          }}
        >
          {[
            {
              icon: '📋',
              title: 'Task Management',
              description:
                'Organize and track annotation tasks efficiently with our intuitive interface.',
            },
            {
              icon: '✓',
              title: 'Quality Assurance',
              description:
                'Built-in QA workflows to ensure high-quality annotations every time.',
            },
            {
              icon: '👥',
              title: 'Team Collaboration',
              description:
                'Invite team members and manage projects together seamlessly.',
            },
          ].map((feature, index) => (
            <div
              key={index}
              style={{
                padding: '2rem',
                borderRadius: '1rem',
                backgroundColor: darkMode ? '#1e293b' : '#ffffff',
                boxShadow: darkMode
                  ? '0 10px 30px rgba(0, 0, 0, 0.3)'
                  : '0 10px 30px rgba(0, 0, 0, 0.1)',
                transition: 'all 0.3s ease',
                cursor: 'pointer',
                border: darkMode ? '1px solid #334155' : 'none',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-8px)';
                e.currentTarget.style.boxShadow = darkMode
                  ? '0 20px 40px rgba(0, 0, 0, 0.4)'
                  : '0 20px 40px rgba(0, 0, 0, 0.15)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = darkMode
                  ? '0 10px 30px rgba(0, 0, 0, 0.3)'
                  : '0 10px 30px rgba(0, 0, 0, 0.1)';
              }}
            >
              <div
                style={{
                  fontSize: '3rem',
                  marginBottom: '1rem',
                }}
              >
                {feature.icon}
              </div>
              <h3
                style={{
                  fontSize: '1.5rem',
                  fontWeight: '700',
                  marginBottom: '0.8rem',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                {feature.title}
              </h3>
              <p
                style={{
                  fontSize: '1rem',
                  lineHeight: '1.6',
                  opacity: '0.85',
                  color: darkMode ? '#94a3b8' : '#64748b',
                }}
              >
                {feature.description}
              </p>
            </div>
          ))}
        </section>
      </div>

      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}