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
      <h1 className="text-2xl font-semibold">Profile</h1>

      <div className="bg-white p-4 rounded shadow space-y-2">
        <div>
          <span className="text-gray-500">Name:</span> {me?.name}
        </div>
        <div>
          <span className="text-gray-500">Email:</span> {me?.email}
        </div>
        <div>
          <span className="text-gray-500">Role:</span> {me?.role}
        </div>
      </div>

      {me?.role === 'annotator' && (
        <div className="bg-white p-4 rounded shadow space-y-3">
          <div>
            <label className="block mb-1 font-medium">Skills (comma separated)</label>
            <input
              className="w-full border rounded px-3 py-2"
              value={skillsText}
              onChange={(e) => setSkillsText(e.target.value)}
              placeholder="e.g., NLP, Text Classification, Bengali, QA"
            />
          </div>
          <button
            disabled={saving}
            onClick={saveSkills}
            className="bg-blue-600 text-white rounded px-4 py-2 disabled:opacity-60"
          >
            {saving ? 'Saving...' : 'Save Skills'}
          </button>
          {msg && <div className="text-sm text-gray-600">{msg}</div>}
        </div>
      )}

      {me?.role === 'annotator' && (
        <div className="bg-white p-4 rounded shadow space-y-3">
          <h2 className="font-semibold text-lg">My Invites</h2>
          {invitesError && <div className="text-red-600 text-sm">{invitesError}</div>}
          <ul className="space-y-2">
            {invites.map((inv) => (
              <li key={inv.id} className="border rounded p-3 flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-500">Project: {inv.project_id}</div>
                  <div className="text-sm text-gray-500">
                    Invited: {inv.invited_at ? new Date(inv.invited_at).toLocaleString() : '-'}
                  </div>
                  <div className="text-sm">
                    Status:{' '}
                    {inv.accepted_status
                      ? `Accepted at ${
                          inv.accepted_at ? new Date(inv.accepted_at).toLocaleString() : ''
                        }`
                      : 'Pending'}
                  </div>
                </div>
                {!inv.accepted_status ? (
                  <button
                    disabled={invBusy === inv.id}
                    onClick={() => acceptInvite(inv.id)}
                    className="px-3 py-1 rounded bg-blue-600 text-white disabled:opacity-60"
                  >
                    {invBusy === inv.id ? 'Accepting...' : 'Accept'}
                  </button>
                ) : (
                  <span className="text-gray-500 text-sm">Accepted</span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
