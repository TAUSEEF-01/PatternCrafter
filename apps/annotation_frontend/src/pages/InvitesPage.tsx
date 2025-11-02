import { useEffect, useState } from 'react';
import { apiFetch } from '@/api/client';
import { Invite } from '@/types';

export default function InvitesPage() {
  const [invites, setInvites] = useState<Invite[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiFetch<Invite[]>('/invites')
      .then(setInvites)
      .catch((e) => setError(String(e)));
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
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Invites</h1>
      {error && <div className="text-red-600 text-sm">{error}</div>}
      <ul className="space-y-2">
        {invites.map((inv) => (
          <li
            key={inv.id}
            className="bg-white p-4 rounded shadow flex items-center justify-between"
          >
            <div>
              <div className="text-sm text-gray-500">Project: {inv.project_id}</div>
              <div className="text-sm text-gray-500">
                Invited: {new Date(inv.invited_at || '').toLocaleString()}
              </div>
              <div className="text-sm">
                Accepted: {inv.accepted_at ? new Date(inv.accepted_at).toLocaleString() : 'Pending'}
              </div>
            </div>
            {!inv.accepted_at && (
              <button
                className="bg-blue-600 text-white rounded px-3 py-1"
                onClick={() => accept(inv.id)}
              >
                Accept
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
