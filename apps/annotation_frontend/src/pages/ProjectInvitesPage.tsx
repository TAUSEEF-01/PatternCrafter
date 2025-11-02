import { useEffect, useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { apiFetch } from '@/api/client';
import { useAuth } from '@/auth/AuthContext';

// Minimal types
interface Annotator {
  id: string;
  name: string;
  email: string;
  skills?: string[];
}

interface InviteItem {
  id: string;
  project_id: string;
  user_id: string;
  accepted_status: boolean;
  invited_at?: string;
  accepted_at?: string | null;
}

export default function ProjectInvitesPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const { user } = useAuth();
  const [annotators, setAnnotators] = useState<Annotator[]>([]);
  const [invites, setInvites] = useState<InviteItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const inviteMap = useMemo(() => {
    const m = new Map<string, InviteItem>();
    invites.forEach((i) => m.set(i.user_id, i));
    return m;
  }, [invites]);

  useEffect(() => {
    if (!projectId) return;
    async function load() {
      setError(null);
      try {
        const [ann, inv] = await Promise.all([
          apiFetch<Annotator[]>('/annotators'),
          apiFetch<InviteItem[]>(`/projects/${projectId}/invites`),
        ]);
        setAnnotators(ann);
        setInvites(inv);
      } catch (e: any) {
        setError(e?.message || 'Failed to load invites data');
      }
    }
    load();
  }, [projectId]);

  const doInvite = async (annotatorId: string) => {
    if (!projectId) return;
    setBusy(annotatorId);
    setError(null);
    try {
      const created = await apiFetch<InviteItem>(`/projects/${projectId}/invites`, {
        method: 'POST',
        body: { user_id: annotatorId },
      });
      setInvites((prev) => [created, ...prev]);
    } catch (e: any) {
      setError(e?.message || 'Failed to create invite');
    } finally {
      setBusy(null);
    }
  };

  const cancelInvite = async (inviteId: string) => {
    setBusy(inviteId);
    setError(null);
    try {
      await apiFetch(`/invites/${inviteId}`, { method: 'DELETE' });
      setInvites((prev) => prev.filter((i) => i.id !== inviteId));
    } catch (e: any) {
      setError(e?.message || 'Failed to cancel invite');
    } finally {
      setBusy(null);
    }
  };

  if (!user) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Manage Invites</h1>
        <Link className="text-blue-600 hover:underline" to={`/projects/${projectId}`}>
          Back to Project
        </Link>
      </div>
      {error && <div className="text-red-600 text-sm">{error}</div>}
      <div className="bg-white rounded shadow overflow-hidden">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left p-3">Annotator</th>
              <th className="text-left p-3">Email</th>
              <th className="text-left p-3">Skills</th>
              <th className="text-left p-3">Status</th>
              <th className="text-left p-3">Action</th>
            </tr>
          </thead>
          <tbody>
            {annotators.map((a) => {
              const inv = inviteMap.get(a.id);
              const status = !inv ? 'Not invited' : inv.accepted_status ? 'Accepted' : 'Pending';
              return (
                <tr key={a.id} className="border-t">
                  <td className="p-3">{a.name}</td>
                  <td className="p-3">{a.email}</td>
                  <td className="p-3">{(a.skills || []).join(', ')}</td>
                  <td className="p-3">{status}</td>
                  <td className="p-3">
                    {!inv && (
                      <button
                        disabled={busy === a.id}
                        className="px-3 py-1 rounded bg-blue-600 text-white disabled:opacity-60"
                        onClick={() => doInvite(a.id)}
                      >
                        {busy === a.id ? 'Inviting...' : 'Invite'}
                      </button>
                    )}
                    {inv && !inv.accepted_status && (
                      <button
                        disabled={busy === inv.id}
                        className="px-3 py-1 rounded bg-red-600 text-white disabled:opacity-60"
                        onClick={() => cancelInvite(inv.id)}
                      >
                        {busy === inv.id ? 'Canceling...' : 'Cancel Invite'}
                      </button>
                    )}
                    {inv && inv.accepted_status && <span className="text-gray-500">—</span>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
