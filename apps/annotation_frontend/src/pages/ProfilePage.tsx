import { useEffect, useState } from 'react';
import { useAuth } from '@/auth/AuthContext';
import { apiFetch } from '@/api/client';

// Extend minimal user shape locally to include optional skills
type Me = {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'manager' | 'annotator' | string;
  skills?: string[];
  paid?: boolean;
};

export default function ProfilePage() {
  const { user } = useAuth();
  const [me, setMe] = useState<Me | null>(null);
  const [skillsText, setSkillsText] = useState('');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [invites, setInvites] = useState<
    {
      id: string;
      project_id: string;
      accepted_status: boolean;
      invited_at?: string;
      accepted_at?: string | null;
    }[]
  >([]);
  const [invitesError, setInvitesError] = useState<string | null>(null);
  const [invBusy, setInvBusy] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const m = await apiFetch<Me>('/auth/me');
        setMe(m);
        setSkillsText((m.skills || []).join(', '));
      } catch (e: any) {
        setMsg(e?.message || 'Failed to load profile');
      }
    }
    load();
  }, []);

  useEffect(() => {
    async function loadInvites() {
      try {
        const list = await apiFetch<any[]>('/invites');
        setInvites(list);
      } catch (e: any) {
        setInvitesError(e?.message || 'Failed to load invites');
      }
    }
    if (user) loadInvites();
  }, [user]);

  const saveSkills = async () => {
    if (!me) return;
    setSaving(true);
    setMsg(null);
    try {
      const skills = skillsText
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      const updated = await apiFetch<Me>('/users/me/skills', {
        method: 'PUT',
        body: { skills },
      });
      setMe(updated);
      setMsg('Skills updated');
    } catch (e: any) {
      setMsg(e?.message || 'Failed to update skills');
    } finally {
      setSaving(false);
    }
  };

  const acceptInvite = async (id: string) => {
    setInvBusy(id);
    setInvitesError(null);
    try {
      await apiFetch(`/invites/${id}/accept`, { method: 'PUT' });
      setInvites((prev) =>
        prev.map((i) =>
          i.id === id ? { ...i, accepted_status: true, accepted_at: new Date().toISOString() } : i
        )
      );
    } catch (e: any) {
      setInvitesError(e?.message || 'Failed to accept invite');
    } finally {
      setInvBusy(null);
    }
  };

  if (!user) return null;

  return (
    <div className="space-y-6">
      <div>
        <h1>Profile</h1>
        <p className="muted mt-1">Manage your account information and preferences</p>
      </div>

      <div className="card">
        <div className="card-body">
          <h2 className="card-title mb-4">Account Information</h2>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <span className="text-gray-600 w-20">Name:</span>
              <span className="font-medium">{me?.name}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-gray-600 w-20">Email:</span>
              <span className="font-medium">{me?.email}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-gray-600 w-20">Role:</span>
              <span className="badge badge-primary">{me?.role}</span>
            </div>
          </div>
        </div>
      </div>

      {me?.role === 'annotator' && (
        <div className="card">
          <div className="card-body space-y-4">
            <h2 className="card-title">Skills & Expertise</h2>
            <div>
              <label className="label">Skills (comma separated)</label>
              <input
                className="input"
                value={skillsText}
                onChange={(e) => setSkillsText(e.target.value)}
                placeholder="e.g., NLP, Text Classification, Bengali, QA"
              />
            </div>
            <div className="flex items-center gap-3">
              <button disabled={saving} onClick={saveSkills} className="btn btn-primary">
                {saving ? 'Saving...' : 'Save Skills'}
              </button>
              {msg && <span className="text-sm text-gray-600">{msg}</span>}
            </div>
          </div>
        </div>
      )}

      {me?.role === 'annotator' && (
        <div className="card">
          <div className="card-body space-y-4">
            <h2 className="card-title">My Invites</h2>
            {invitesError && (
              <div className="rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-700">
                {invitesError}
              </div>
            )}
            {invites.length === 0 ? (
              <p className="muted text-center py-8">No invites yet</p>
            ) : (
              <div className="space-y-3">
                {invites.map((inv) => (
                  <div
                    key={inv.id}
                    className="border border-gray-200 rounded-lg p-4 flex items-center justify-between"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">Project:</span>
                        <span className="text-sm font-mono text-gray-600">
                          {inv.project_id.slice(0, 8)}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600">
                        Invited: {inv.invited_at ? new Date(inv.invited_at).toLocaleString() : '-'}
                      </div>
                      <div className="text-sm">
                        {inv.accepted_status ? (
                          <span className="badge badge-green">
                            Accepted{' '}
                            {inv.accepted_at ? new Date(inv.accepted_at).toLocaleString() : ''}
                          </span>
                        ) : (
                          <span className="badge badge-yellow">Pending</span>
                        )}
                      </div>
                    </div>
                    {!inv.accepted_status ? (
                      <button
                        disabled={invBusy === inv.id}
                        onClick={() => acceptInvite(inv.id)}
                        className="btn btn-primary btn-sm"
                      >
                        {invBusy === inv.id ? 'Accepting...' : 'Accept'}
                      </button>
                    ) : (
                      <span className="text-gray-400 text-sm">✓ Accepted</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
