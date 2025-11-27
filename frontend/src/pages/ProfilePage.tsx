import { useEffect, useState } from 'react';
import { useAuth } from '@/auth/AuthContext';
import { apiFetch } from '@/api/client';
import { useTheme } from '@/components/NavBar';
import Card from '@/components/ui/Card';

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

  const { darkMode } = useTheme();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
          Profile
        </h1>
        <p className={`mt-2 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
          Manage your account information and preferences
        </p>
      </div>

      <Card className="p-6">
        <h2 className={`text-xl font-bold mb-6 ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>
          Account Information
        </h2>
        <div className="space-y-4">
          <div className={`flex items-center gap-4 p-3 rounded-lg ${darkMode ? 'bg-slate-700/50' : 'bg-gray-50'}`}>
            <span className={`font-semibold w-24 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Name:</span>
            <span className={`font-medium ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>{me?.name}</span>
          </div>
          <div className={`flex items-center gap-4 p-3 rounded-lg ${darkMode ? 'bg-slate-700/50' : 'bg-gray-50'}`}>
            <span className={`font-semibold w-24 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Email:</span>
            <span className={`font-medium ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>{me?.email}</span>
          </div>
          <div className={`flex items-center gap-4 p-3 rounded-lg ${darkMode ? 'bg-slate-700/50' : 'bg-gray-50'}`}>
            <span className={`font-semibold w-24 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Role:</span>
            <span className="badge badge-primary capitalize">{me?.role}</span>
          </div>
        </div>
      </Card>

      {me?.role === 'annotator' && (
        <Card className="p-6">
          <div className="space-y-6">
            <h2 className={`text-xl font-bold ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>
              Skills & Expertise
            </h2>

            {/* Programming Languages */}
            <div>
              <label className={`block text-sm font-semibold mb-2 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                Programming Languages
              </label>
              <p className={`text-sm mb-4 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Select all programming languages you're proficient in
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {PROGRAMMING_LANGUAGES.map((lang) => (
                  <button
                    key={lang}
                    type="button"
                    onClick={() => toggleProgrammingLang(lang)}
                    className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                      selectedProgrammingLangs.includes(lang)
                        ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-lg hover:shadow-xl transform hover:scale-105'
                        : darkMode
                        ? 'bg-slate-700/50 text-gray-300 hover:bg-slate-600 border border-slate-600'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200'
                    }`}
                  >
                    {lang}
                  </button>
                ))}
              </div>
            </div>

            {/* Annotation Skills */}
            <div>
              <label className={`block text-sm font-semibold mb-2 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                Annotation Skills
              </label>
              <p className={`text-sm mb-4 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Select all annotation tasks you can perform
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {ANNOTATION_SKILLS.map((skill) => (
                  <button
                    key={skill}
                    type="button"
                    onClick={() => toggleAnnotationSkill(skill)}
                    className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 text-left ${
                      selectedAnnotationSkills.includes(skill)
                        ? 'bg-gradient-to-r from-green-600 to-green-700 text-white shadow-lg hover:shadow-xl transform hover:scale-105'
                        : darkMode
                        ? 'bg-slate-700/50 text-gray-300 hover:bg-slate-600 border border-slate-600'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200'
                    }`}
                  >
                    {skill}
                  </button>
                ))}
              </div>
            </div>

            {/* Selected Skills Summary */}
            <div className={`rounded-xl p-5 ${darkMode ? 'bg-slate-700/50' : 'bg-gray-50'}`}>
              <h3 className={`text-sm font-semibold mb-3 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                Selected Skills ({selectedProgrammingLangs.length + selectedAnnotationSkills.length})
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
                  <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    No skills selected yet
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-4">
              <button
                disabled={saving}
                onClick={saveSkills}
                className="px-6 py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:transform-none"
              >
                {saving ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Saving...
                  </span>
                ) : (
                  'Save Skills'
                )}
              </button>
              {msg && (
                <span
                  className={`text-sm font-medium ${
                    msg.includes('success')
                      ? 'text-green-600 dark:text-green-400'
                      : 'text-red-600 dark:text-red-400'
                  }`}
                >
                  {msg}
                </span>
              )}
            </div>
          </div>
        </Card>
      )}

      {me?.role === 'annotator' && (
        <Card className="p-6">
          <div className="space-y-4">
            <h2 className={`text-xl font-bold ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>
              My Invites
            </h2>
            {invitesError && (
              <div className="rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4 text-sm text-red-700 dark:text-red-400">
                {invitesError}
              </div>
            )}
            {invites.length === 0 ? (
              <p className={`text-center py-12 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                No invites yet
              </p>
            ) : (
              <div className="space-y-3">
                {invites.map((inv) => (
                  <div
                    key={inv.id}
                    className={`border rounded-xl p-5 flex items-center justify-between transition-all duration-200 hover:shadow-lg ${
                      darkMode
                        ? 'border-slate-700 bg-slate-800/50 hover:bg-slate-800'
                        : 'border-gray-200 bg-white hover:bg-gray-50'
                    }`}
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
                        className="px-4 py-2 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-md hover:shadow-lg"
                      >
                        {invBusy === inv.id ? (
                          <span className="flex items-center gap-2">
                            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                            Accepting...
                          </span>
                        ) : (
                          'Accept'
                        )}
                      </button>
                    ) : (
                      <span className={`text-sm font-medium ${darkMode ? 'text-green-400' : 'text-green-600'}`}>
                        ✓ Accepted
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}
