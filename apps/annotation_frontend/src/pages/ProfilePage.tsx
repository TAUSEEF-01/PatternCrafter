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

// Predefined skill options
const PROGRAMMING_LANGUAGES = [
  'Python',
  'Java',
  'C++',
  'C',
  'JavaScript',
  'TypeScript',
  'Go',
  'Rust',
  'Ruby',
  'PHP',
  'Swift',
  'Kotlin',
  'C#',
  'Scala',
  'R',
  'MATLAB',
  'SQL',
];

const ANNOTATION_SKILLS = [
  'Text Classification',
  'Named Entity Recognition (NER)',
  'Sentiment Analysis',
  'Image Classification',
  'Object Detection',
  'Image Segmentation',
  'Bounding Box Annotation',
  'Semantic Segmentation',
  'Keypoint Annotation',
  'Video Annotation',
  'Audio Transcription',
  'Audio Classification',
  'Text Summarization',
  'Question Answering (QA)',
  'Translation',
  'Data Labeling',
  'Quality Assurance',
  'Bengali Language',
  'English Language',
  'Multi-lingual Annotation',
];

export default function ProfilePage() {
  const { user } = useAuth();
  const [me, setMe] = useState<Me | null>(null);
  const [selectedProgrammingLangs, setSelectedProgrammingLangs] = useState<string[]>([]);
  const [selectedAnnotationSkills, setSelectedAnnotationSkills] = useState<string[]>([]);
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
        // Parse existing skills into programming languages and annotation skills
        const skills = m.skills || [];
        setSelectedProgrammingLangs(skills.filter((s) => PROGRAMMING_LANGUAGES.includes(s)));
        setSelectedAnnotationSkills(skills.filter((s) => ANNOTATION_SKILLS.includes(s)));
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

  const toggleProgrammingLang = (lang: string) => {
    setSelectedProgrammingLangs((prev) =>
      prev.includes(lang) ? prev.filter((l) => l !== lang) : [...prev, lang]
    );
  };

  const toggleAnnotationSkill = (skill: string) => {
    setSelectedAnnotationSkills((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]
    );
  };

  const saveSkills = async () => {
    if (!me) return;
    setSaving(true);
    setMsg(null);
    try {
      // Combine both skill categories
      const skills = [...selectedProgrammingLangs, ...selectedAnnotationSkills];
      const updated = await apiFetch<Me>('/users/me/skills', {
        method: 'PUT',
        body: { skills },
      });
      setMe(updated);
      setMsg('Skills updated successfully!');
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
          <div className="card-body space-y-6">
            <h2 className="card-title">Skills & Expertise</h2>

            {/* Programming Languages */}
            <div>
              <label className="label">Programming Languages</label>
              <p className="text-sm text-gray-600 mb-3">
                Select all programming languages you're proficient in
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                {PROGRAMMING_LANGUAGES.map((lang) => (
                  <button
                    key={lang}
                    type="button"
                    onClick={() => toggleProgrammingLang(lang)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      selectedProgrammingLangs.includes(lang)
                        ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {lang}
                  </button>
                ))}
              </div>
            </div>

            {/* Annotation Skills */}
            <div>
              <label className="label">Annotation Skills</label>
              <p className="text-sm text-gray-600 mb-3">
                Select all annotation tasks you can perform
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                {ANNOTATION_SKILLS.map((skill) => (
                  <button
                    key={skill}
                    type="button"
                    onClick={() => toggleAnnotationSkill(skill)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors text-left ${
                      selectedAnnotationSkills.includes(skill)
                        ? 'bg-green-600 text-white hover:bg-green-700'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {skill}
                  </button>
                ))}
              </div>
            </div>

            {/* Selected Skills Summary */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">
                Selected Skills ({selectedProgrammingLangs.length + selectedAnnotationSkills.length}
                )
              </h3>
              <div className="flex flex-wrap gap-2">
                {selectedProgrammingLangs.map((lang) => (
                  <span key={lang} className="badge badge-primary">
                    {lang}
                  </span>
                ))}
                {selectedAnnotationSkills.map((skill) => (
                  <span key={skill} className="badge badge-green">
                    {skill}
                  </span>
                ))}
                {selectedProgrammingLangs.length === 0 && selectedAnnotationSkills.length === 0 && (
                  <span className="text-sm text-gray-500">No skills selected yet</span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button disabled={saving} onClick={saveSkills} className="btn btn-primary">
                {saving ? 'Saving...' : 'Save Skills'}
              </button>
              {msg && (
                <span
                  className={`text-sm ${
                    msg.includes('success') ? 'text-green-600' : 'text-gray-600'
                  }`}
                >
                  {msg}
                </span>
              )}
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
