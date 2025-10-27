import { Link } from "react-router-dom";
import { useAuth } from "../auth";

export default function ProfilePage() {
  const { user, logout } = useAuth();
  if (!user) {
    return (
      <div className="shell">
        <main className="main">
          <section className="hero">
            <div className="title">No profile</div>
            <p className="subtitle">Please sign in or create an account.</p>
            <div className="row">
              <Link className="btn primary" to="/login">
                Sign in
              </Link>
              <Link className="btn" to="/register">
                Create account
              </Link>
            </div>
          </section>
        </main>
      </div>
    );
  }
  const initials = user.name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
  return (
    <div className="shell">
      <main className="main">
        <section className="hero">
          <div className="kicker">Your account</div>
          <div className="title">Profile</div>
          <p className="subtitle">Manage your PatternCrafter identity.</p>
        </section>
        <section className="grid" style={{ maxWidth: 760 }}>
          <div className="card" style={{ width: "100%" }}>
            <div className="profile-card">
              <div className="avatar-lg" aria-hidden>
                {initials || "U"}
              </div>
              <div className="profile-info">
                <div className="profile-name">{user.name}</div>
                <div className="profile-email">{user.email}</div>
              </div>
              <div className="row" style={{ marginLeft: "auto" }}>
                <Link className="btn" to="/portal">
                  Go to Portal
                </Link>
                <button className="btn" onClick={logout}>
                  Logout
                </button>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
