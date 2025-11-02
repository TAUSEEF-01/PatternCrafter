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
    </div>
  );
}
