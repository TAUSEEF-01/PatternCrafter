import { useEffect, useMemo, useState } from 'react';
import { useParams, Link as RRLink } from 'react-router-dom';
import { apiFetch } from '@/api/client';
import { useAuth } from '@/auth/AuthContext';

const Link = RRLink as unknown as any;

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
        <div>
          <h1>Manage Invites</h1>
          <p className="muted mt-1">Invite annotators to collaborate on this project</p>
        </div>
        <Link className="btn btn-ghost" to={`/projects/${projectId}`}>
          ← Back to Project
        </Link>
      </div>
      {error && (
        <div className="rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-700">
          {error}
        </div>
      )}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Annotator</th>
                <th>Email</th>
                <th>Skills</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {annotators.map((a) => {
                const inv = inviteMap.get(a.id);
                const status = !inv ? 'Not invited' : inv.accepted_status ? 'Accepted' : 'Pending';
                return (
                  <tr key={a.id}>
                    <td className="font-medium">{a.name}</td>
                    <td className="text-gray-600">{a.email}</td>
                    <td>
                      <div className="flex flex-wrap gap-1">
                        {(a.skills || []).map((skill, i) => (
                          <span key={i} className="badge text-xs">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td>
                      {!inv ? (
                        <span className="badge">Not invited</span>
                      ) : inv.accepted_status ? (
                        <span className="badge badge-green">Accepted</span>
                      ) : (
                        <span className="badge badge-yellow">Pending</span>
                      )}
                    </td>
                    <td>
                      {!inv && (
                        <button
                          disabled={busy === a.id}
                          className="btn btn-primary btn-sm"
                          onClick={() => doInvite(a.id)}
                        >
                          {busy === a.id ? 'Inviting...' : 'Invite'}
                        </button>
                      )}
                      {inv && !inv.accepted_status && (
                        <button
                          disabled={busy === inv.id}
                          className="btn btn-outline btn-sm text-red-600 border-red-300 hover:bg-red-50"
                          onClick={() => cancelInvite(inv.id)}
                        >
                          {busy === inv.id ? 'Canceling...' : 'Cancel'}
                        </button>
                      )}
                      {inv && inv.accepted_status && <span className="text-gray-400">—</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
