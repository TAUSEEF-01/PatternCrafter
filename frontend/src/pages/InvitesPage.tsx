import { useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { apiFetch } from '@/api/client';
import { Invite } from '@/types';
import { useTheme } from '@/components/NavBar';
import Card from '@/components/ui/Card';
import { motion } from 'framer-motion';

export default function InvitesPage() {
  const { darkMode } = useTheme();
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
        <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
          Project Invites
        </h1>
        <p className={`mt-2 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
          Review and accept project invitations
        </p>
      </div>
      
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4 text-sm text-red-700 dark:text-red-400"
        >
          {error}
        </motion.div>
      )}
      
      {invites.length === 0 ? (
        <Card className="text-center py-12">
          <p className={darkMode ? 'text-gray-400' : 'text-gray-500'}>No invites yet</p>
        </Card>
      ) : (
        <div className="grid gap-4">
          {invites.map((inv, index) => {
            const isHighlighted = highlightProjectId === inv.project_id;
            return (
              <motion.div
                key={inv.id}
                ref={(el) => (cardRefs.current[inv.id] = el)}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`${
                  isHighlighted
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 shadow-2xl scale-[1.02]'
                    : darkMode
                    ? 'bg-slate-800/90 border-slate-700'
                    : 'bg-white border-gray-200'
                } rounded-2xl border shadow-lg hover:shadow-xl transition-all duration-300`}
                style={{
                  animation: isHighlighted ? 'pulse 2s ease-in-out 3' : undefined,
                }}
              >
                <div className="p-6 flex items-center justify-between">
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <span
                        className={`font-semibold ${
                          isHighlighted ? 'text-white' : darkMode ? 'text-gray-200' : 'text-gray-900'
                        }`}
                      >
                        Project:
                      </span>
                      <span
                        className={`font-mono text-sm ${
                          isHighlighted ? 'text-white/90' : darkMode ? 'text-gray-400' : 'text-gray-600'
                        }`}
                      >
                        {inv.project_id.slice(0, 8)}
                      </span>
                    </div>
                    <div
                      className={`text-sm ${
                        isHighlighted ? 'text-white/80' : darkMode ? 'text-gray-400' : 'text-gray-600'
                      }`}
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
                    <button
                      className={`px-6 py-3 rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 ${
                        isHighlighted
                          ? 'bg-white text-indigo-600 hover:bg-gray-50'
                          : 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700'
                      }`}
                      onClick={() => accept(inv.id)}
                    >
                      Accept Invite
                    </button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}