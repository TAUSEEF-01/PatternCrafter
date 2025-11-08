import { useEffect, useState } from 'react';
import { apiFetch } from '@/api/client';
import { Invite } from '@/types';
import { useAuth } from '@/auth/AuthContext';

export default function InvitesPage() {
  const [invites, setInvites] = useState<Invite[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiFetch<Invite[]>('/invites')
      .then(setInvites)
      .catch((e) => setError(String(e)));
  }, []);

  // mark invites as seen when this page is open
  const { markInvitesSeen } = useAuth();
  useEffect(() => {
    try {
      markInvitesSeen();
    } catch {}
    // intentionally run on mount only
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const accept = async (id: string) => {
    try {
      await apiFetch(`/invites/${id}/accept`, { method: 'PUT' });
      setInvites((prev) =>
        prev.map((i) => (i.id === id ? { ...i, accepted_at: new Date().toISOString() } : i))
      );
    } catch (e: any) {
      setError(e?.message || 'Failed to accept invite');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1>Project Invites</h1>
        <p className="muted mt-1">Review and accept project invitations</p>
      </div>
      {error && (
        <div className="rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-700">
          {error}
        </div>
      )}
      {invites.length === 0 ? (
        <div className="card">
          <div className="card-body text-center py-12">
            <p className="muted">No invites yet</p>
          </div>
        </div>
      ) : (
        <div className="grid gap-3">
          {invites.map((inv) => (
  <div
    key={inv.id}
    className="card hover:shadow-lg transition-shadow"
    style={{ backgroundColor: '#EBD3F8' }}
  >
    <div className="card-body flex items-center justify-between">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
        <span className="font-medium" style={{ color: '#2E073F' }}>Project:</span>          <span className="font-mono text-sm text-gray-600">
            {inv.project_id.slice(0, 8)}
          </span>
        </div>
        <div className="text-sm text-gray-600">
          Invited: {new Date(inv.invited_at || '').toLocaleString()}
        </div>
        <div className="text-sm">
          {inv.accepted_at ? (
            <span className="badge badge-green">
              Accepted {new Date(inv.accepted_at).toLocaleString()}
            </span>
          ) : (
            <span className="badge badge-yellow">Pending</span>
          )}
        </div>
      </div>
      {!inv.accepted_at && (
        <button className="btn btn-primary" onClick={() => accept(inv.id)}>
          Accept Invite
        </button>
      )}
    </div>
  </div>
))}

        </div>
      )}
    </div>
  );
}