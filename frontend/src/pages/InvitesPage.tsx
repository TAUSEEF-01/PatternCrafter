import { useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { apiFetch } from '@/api/client';
import { Invite } from '@/types';

export default function InvitesPage() {
  const [invites, setInvites] = useState<Invite[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [searchParams] = useSearchParams();
  const highlightProjectId = searchParams.get('highlight');
  const cardRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  useEffect(() => {
    apiFetch<Invite[]>('/invites')
      .then(setInvites)
      .catch((e) => setError(String(e)));
  }, []);

  // Scroll to and highlight the card when highlight param is present
  useEffect(() => {
    if (highlightProjectId && invites.length > 0) {
      const targetInvite = invites.find((inv) => inv.project_id === highlightProjectId);
      if (targetInvite && cardRefs.current[targetInvite.id]) {
        const cardElement = cardRefs.current[targetInvite.id];
        if (cardElement) {
          // Scroll to card with smooth behavior
          setTimeout(() => {
            cardElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }, 100);
        }
      }
    }
  }, [highlightProjectId, invites]);

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
          {invites.map((inv) => {
            const isHighlighted = highlightProjectId === inv.project_id;
            return (
              <div
                key={inv.id}
                ref={(el) => (cardRefs.current[inv.id] = el)}
                className="card hover:shadow-lg transition-all duration-300"
                style={{
                  backgroundColor: isHighlighted ? '#AD49E1' : '#EBD3F8',
                  transform: isHighlighted ? 'scale(1.02)' : 'scale(1)',
                  boxShadow: isHighlighted
                    ? '0 10px 30px rgba(122, 28, 172, 0.4)'
                    : undefined,
                  animation: isHighlighted ? 'pulse 2s ease-in-out 3' : undefined,
                }}
              >
                <div className="card-body flex items-center justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span
                        className="font-medium"
                        style={{ color: isHighlighted ? '#FFFFFF' : '#2E073F' }}
                      >
                        Project:
                      </span>
                      <span
                        className="font-mono text-sm"
                        style={{
                          color: isHighlighted ? '#FFFFFF' : '#64748b',
                        }}
                      >
                        {inv.project_id.slice(0, 8)}
                      </span>
                    </div>
                    <div
                      className="text-sm"
                      style={{ color: isHighlighted ? '#F3E5FF' : '#64748b' }}
                    >
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
            );
          })}
        </div>
      )}
    </div>
  );
}