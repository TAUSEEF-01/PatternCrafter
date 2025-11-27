import { useEffect, useState } from "react";
import { Link as RouterLink, useParams, useNavigate } from "react-router-dom";
import { apiFetch } from "@/api/client";
import { Task } from "@/types";
import { useAuth } from "@/auth/AuthContext";
import { useTheme } from '@/components/NavBar';
import TaskCard from '@/components/ui/TaskCard';
import Card from '@/components/ui/Card';
import { motion } from 'framer-motion';

const LinkFix = RouterLink as unknown as any;

const categoryIcons: { [key: string]: string } = {
  'image_classification': '🖼️',
  'object_detection': '📦',
  'named_entity_recognition': '🏷️',
  'sentiment_analysis': '😊',
  'text_summarization': '📝',
  'qa_evaluation': '❓',
  'generative_ai_llm_response_grading': '🤖',
  'generative_ai_chatbot_assessment': '💬',
  'conversational_ai_response_selection': '💭',
};

export default function AnnotationTasksPage() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { darkMode } = useTheme();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!projectId) return;

    apiFetch<Task[]>(`/projects/${projectId}/my-tasks`)
      .then((allTasks) => {
        // Filter for annotation tasks in progress (not completed, not returned)
        const annotationTasks = allTasks.filter(
          (t) =>
            t.assigned_annotator_id === user?.id &&
            !t.is_returned &&
            !t.completed_status?.annotator_part
        );
        setTasks(annotationTasks);
      })
      .catch((e) => setError(String(e)));
  }, [projectId, user?.id]);

  return (
    <div className="max-w-6xl mx-auto space-y-6 p-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-8"
      >
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              My Assigned Tasks
            </h1>
          </div>
          <p className={`text-lg mt-2 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            Complete these tasks and submit them for review
          </p>
        </div>
        <LinkFix
          to={`/projects/${projectId}`}
          className="px-4 py-2 rounded-xl font-semibold text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 transition-all duration-200 flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Project
        </LinkFix>
      </motion.div>

      {error && (
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4 text-sm text-red-700 dark:text-red-400 flex items-center gap-3"
        >
          <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          <span>{error}</span>
        </motion.div>
      )}

      {tasks.length === 0 ? (
        <Card className="text-center py-16">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 10 }}
            className="text-6xl mb-4"
          >
            📭
          </motion.div>
          <h3 className={`text-2xl font-bold mb-2 ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>
            No tasks assigned
          </h3>
          <p className={`text-lg ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            You don't have any tasks assigned at the moment.
          </p>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {tasks.map((task, index) => (
            <TaskCard
              key={task.id}
              variant="info"
              onClick={() => navigate(`/tasks/${task.id}/annotate`)}
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="text-3xl">
                      {categoryIcons[task.category] || '📋'}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <code className={`text-xs px-2 py-1 rounded font-mono ${
                          darkMode ? 'bg-slate-700 text-gray-300' : 'bg-gray-100 text-gray-700'
                        }`}>
                          {task.id.slice(0, 8)}
                        </code>
                        <span className="badge badge-primary text-xs">
                          {task.category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </span>
                      </div>
                      <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        Created: {task.created_at ? new Date(task.created_at).toLocaleDateString() : "N/A"}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-slate-700">
                  <span className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Ready to start
                  </span>
                  <button className="px-4 py-2 rounded-lg font-semibold text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105 flex items-center gap-2">
                    Start Annotation
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </button>
                </div>
              </div>
            </TaskCard>
          ))}
        </div>
      )}
    </div>
  );
}
