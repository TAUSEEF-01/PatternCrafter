import { FormEvent, useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { apiFetch } from "@/api/client";
import { Task, TaskRemark } from "@/types";
import RemarksThread from "@/components/RemarksThread";
import AnnotationViewer from "@/components/AnnotationViewer";
import { useAuth } from "@/auth/AuthContext";

function TaskDataViewer({ data }: { data: any }) {
  if (!data || typeof data !== "object") {
    return <div className="text-gray-500 text-sm">No data available</div>;
  }

  // Check if a string is an image URL or base64
  const isImageValue = (key: string, value: any): boolean => {
    if (typeof value !== "string") return false;
    const imageKeys = [
      "image_url",
      "image",
      "imageUrl",
      "img",
      "photo",
      "picture",
    ];
    if (imageKeys.some((k) => key.toLowerCase().includes(k.toLowerCase())))
      return true;
    if (value.startsWith("data:image/")) return true;
    if (/\.(jpg|jpeg|png|gif|webp|svg|bmp)(\?.*)?$/i.test(value)) return true;
    if (value.startsWith("http") && /image|img|photo/i.test(value)) return true;
    return false;
  };

  // Check if a key represents labels/tags
  const isLabelsArray = (key: string, value: any): boolean => {
    if (!Array.isArray(value)) return false;
    const labelKeys = ["labels", "tags", "classes", "categories", "options"];
    return (
      labelKeys.some((k) => key.toLowerCase().includes(k.toLowerCase())) &&
      value.every((item) => typeof item === "string")
    );
  };

  const renderValue = (key: string, value: any): React.ReactNode => {
    if (value === null || value === undefined)
      return <span className="text-gray-400">—</span>;
    if (typeof value === "boolean") return value ? "Yes" : "No";

    // Render image
    if (isImageValue(key, value)) {
      return (
        <div className="mt-2">
          <img
            src={value}
            alt={key}
            className="max-w-full max-h-80 rounded-lg border-2 border-gray-200 shadow-sm object-contain bg-gray-100"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
              (
                e.target as HTMLImageElement
              ).nextElementSibling?.classList.remove("hidden");
            }}
          />
          <div className="hidden text-sm text-red-500 mt-1">
            Failed to load image
          </div>
        </div>
      );
    }

    // Render labels/tags as badges
    if (isLabelsArray(key, value)) {
      return (
        <div className="flex flex-wrap gap-2 mt-1">
          {(value as string[]).map((item, idx) => (
            <span
              key={idx}
              className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-purple-100 text-purple-800 border border-purple-200"
            >
              {item}
            </span>
          ))}
        </div>
      );
    }

    if (Array.isArray(value)) {
      if (value.length === 0)
        return <span className="text-gray-400">Empty</span>;
      if (typeof value[0] === "string") {
        return (
          <div className="space-y-1">
            {value.map((item, idx) => (
              <div
                key={idx}
                className="text-sm text-gray-700 whitespace-pre-wrap break-words"
              >
                • {item}
              </div>
            ))}
          </div>
        );
      }
      if (typeof value[0] === "object") {
        return (
          <div className="space-y-2">
            {value.map((item, idx) => (
              <div key={idx} className="pl-3 border-l-2 border-gray-200">
                <div className="text-xs font-semibold text-gray-500 mb-1">
                  Item {idx + 1}
                </div>
                {Object.entries(item).map(([k, v]) => (
                  <div key={k} className="text-sm mb-1">
                    <span className="font-medium text-gray-600">{k}:</span>{" "}
                    <span className="text-gray-700">{String(v)}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        );
      }
      return value.join(", ");
    }
    if (typeof value === "object") {
      return (
        <div className="pl-3 space-y-1">
          {Object.entries(value).map(([k, v]) => (
            <div key={k} className="text-sm">
              <span className="font-medium text-gray-600">{k}:</span>{" "}
              <span className="text-gray-700">{renderValue(k, v)}</span>
            </div>
          ))}
        </div>
      );
    }
    return (
      <span className="text-gray-700 whitespace-pre-wrap break-words">
        {String(value)}
      </span>
    );
  };

  return (
    <div className="space-y-4">
      {Object.entries(data).map(([key, value]) => (
        <div
          key={key}
          className="border-b border-gray-100 pb-4 last:border-b-0 last:pb-0"
        >
          <div className="text-sm font-semibold text-gray-800 mb-2 capitalize flex items-center gap-2">
            {key === "image_url" && (
              <svg
                className="w-4 h-4 text-blue-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            )}
            {(key === "labels" || key === "tags") && (
              <svg
                className="w-4 h-4 text-purple-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                />
              </svg>
            )}
            {key.replace(/_/g, " ")}
          </div>
          <div className="text-sm">{renderValue(key, value)}</div>
        </div>
      ))}
    </div>
  );
}

export default function TaskQAPage() {
  const { taskId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [task, setTask] = useState<Task | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [returnReason, setReturnReason] = useState("");
  const [returnValidationError, setReturnValidationError] = useState<
    string | null
  >(null);
  const [returning, setReturning] = useState(false);

  const isManagerView = user?.role === "manager";

  // Timer state - tracks time in seconds
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isTimerActive, setIsTimerActive] = useState(false);
  
  // Refs to track current values for cleanup
  const currentTaskIdRef = useRef<string | null>(null);
  const currentElapsedTimeRef = useRef<number>(0);
  
  // Update refs when values change
  useEffect(() => {
    currentTaskIdRef.current = taskId || null;
  }, [taskId]);
  
  useEffect(() => {
    currentElapsedTimeRef.current = elapsedTime;
  }, [elapsedTime]);

  // QA Review Fields
  const [decision, setDecision] = useState<"approve" | "reject" | "revise">(
    "approve"
  );
  const [qualityScore, setQualityScore] = useState("5");
  const [accuracyRating, setAccuracyRating] = useState("5");
  const [completenessRating, setCompletenessRating] = useState("5");
  const [clarityRating, setClarityRating] = useState("5");
  const [feedback, setFeedback] = useState("");
  const [corrections, setCorrections] = useState("");
  const [notes, setNotes] = useState("");

  const handleRemarkAdded = (remark: TaskRemark) => {
    setTask((prev) =>
      prev
        ? {
            ...prev,
            remarks: [...(prev.remarks ?? []), remark],
          }
        : prev
    );
  };

  const canReplyToThread = Boolean(
    task &&
      user &&
      (user.role === "admin" ||
        user.role === "manager" ||
        task.assigned_qa_id === user.id)
  );

  useEffect(() => {
    if (!taskId) return;
    
    // Save previous task's time before switching
    const previousTaskId = currentTaskIdRef.current;
    const previousTime = currentElapsedTimeRef.current;
    
    if (previousTaskId && previousTaskId !== taskId && previousTime > 0) {
      console.log('🔄 Switching tasks - saving previous task time');
      console.log('Previous Task ID:', previousTaskId);
      console.log('Time to save:', previousTime, 'seconds');
      apiFetch(`/tasks/${previousTaskId}/qa-time`, {
        method: "PUT",
        body: { qa_accumulated_time: previousTime },
      })
        .then(() => console.log('✅ Previous task time saved successfully'))
        .catch((e) => console.error("❌ Failed to save previous task time:", e));
    }
    
    // Reset timer when switching tasks
    setIsTimerActive(false);
    setElapsedTime(0);
    
    apiFetch<Task>(`/tasks/${taskId}`)
      .then((taskData) => {
        console.log('=== TASK LOADED ===');
        console.log('Full task data:', JSON.stringify(taskData, null, 2));
        console.log('Task ID:', taskData.id);
        console.log('QA accumulated time:', taskData.qa_accumulated_time);
        console.log('Type of qa_accumulated_time:', typeof taskData.qa_accumulated_time);
        console.log('==================');
        
        setTask(taskData);

        // Load accumulated QA time if it exists for THIS specific task
        if (taskData.qa_accumulated_time !== undefined && taskData.qa_accumulated_time !== null) {
          const timeToSet = Math.floor(taskData.qa_accumulated_time);
          console.log('✅ Loading saved QA time:', timeToSet, 'seconds');
          setElapsedTime(timeToSet);
        } else {
          console.log('⚠️ No QA accumulated time found, starting from 0');
          setElapsedTime(0);
        }
      })
      .catch((e) => {
        console.error('❌ Error loading task:', e);
        setError(String(e));
      });
  }, [taskId]);

  // Timer effect - start timer when task is loaded and not completed
  useEffect(() => {
    if (task && !task.completed_status?.qa_part && !isManagerView) {
      setIsTimerActive(true);
    }
  }, [task, isManagerView]);

  // Timer interval effect
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isTimerActive) {
      interval = setInterval(() => {
        setElapsedTime((prevTime) => prevTime + 1);
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTimerActive]);

  // Auto-save accumulated time every 30 seconds
  useEffect(() => {
    if (!taskId || !isTimerActive) return;

    console.log('Setting up auto-save interval for QA time');
    const saveInterval = setInterval(async () => {
      // Use a function to get the latest elapsedTime value
      setElapsedTime((currentTime) => {
        if (currentTime > 0) {
          console.log('Auto-saving QA accumulated time:', currentTime);
          apiFetch(`/tasks/${taskId}/qa-time`, {
            method: "PUT",
            body: { qa_accumulated_time: currentTime },
          })
            .then(() => console.log('QA time saved successfully'))
            .catch((e) => console.error("Failed to save QA accumulated time:", e));
        }
        return currentTime; // Return unchanged
      });
    }, 30000); // Save every 30 seconds

    return () => {
      console.log('Clearing auto-save interval');
      clearInterval(saveInterval);
    };
  }, [taskId, isTimerActive]);

  // Save time when component unmounts (page close/refresh)
  useEffect(() => {
    return () => {
      const finalTaskId = currentTaskIdRef.current;
      const finalTime = currentElapsedTimeRef.current;
      
      if (finalTaskId && finalTime > 0) {
        console.log('Component unmounting - saving final QA time:', finalTaskId, finalTime);
        // Use sendBeacon for reliable save on page unload
        const data = JSON.stringify({ qa_accumulated_time: finalTime });
        const blob = new Blob([data], { type: 'application/json' });
        navigator.sendBeacon(`/api/tasks/${finalTaskId}/qa-time`, blob);
      }
    };
  }, []); // Empty deps - only run on mount/unmount

  // Save time when user leaves page, closes browser, or navigates away
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      const finalTaskId = currentTaskIdRef.current;
      const finalTime = currentElapsedTimeRef.current;
      
      if (finalTaskId && finalTime > 0) {
        console.log('Page unloading - saving QA time via beforeunload:', finalTaskId, finalTime);
        // Use sendBeacon for reliable save on page unload
        const data = JSON.stringify({ qa_accumulated_time: finalTime });
        const blob = new Blob([data], { type: 'application/json' });
        navigator.sendBeacon(`/api/tasks/${finalTaskId}/qa-time`, blob);
      }
    };

    // Add event listener for page unload
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []); // Empty deps - only run on mount/unmount

  // Save time when navigating away using React Router
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        const finalTaskId = currentTaskIdRef.current;
        const finalTime = currentElapsedTimeRef.current;
        
        if (finalTaskId && finalTime > 0) {
          console.log('Page hidden - saving QA time:', finalTaskId, finalTime);
          const data = JSON.stringify({ qa_accumulated_time: finalTime });
          const blob = new Blob([data], { type: 'application/json' });
          navigator.sendBeacon(`/api/tasks/${finalTaskId}/qa-time`, blob);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const handleReturnTask = async (reason?: string) => {
    if (!taskId) return false;

    try {
      await apiFetch(`/tasks/${taskId}/return`, {
        method: "PUT",
        body: reason !== undefined ? { return_reason: reason } : undefined,
      });
      setShowReturnModal(false);
      setSuccess("Task returned to the annotator for revision.");
      setError(null);
      setTimeout(() => {
        if (task) {
          navigate(`/projects/${task.project_id}`);
        }
      }, 1000);
      return true;
    } catch (e: any) {
      setError(e?.message || "Failed to return task");
      setSuccess(null);
      return false;
    }
  };

  const handleManagerReturn = async () => {
    const trimmed = returnReason.trim();
    if (!trimmed) {
      setReturnValidationError(
        "Please describe why this task needs to be returned."
      );
      return;
    }

    setReturnValidationError(null);
    setReturning(true);
    const returned = await handleReturnTask(trimmed);
    if (returned) {
      setReturnReason("");
    }
    setReturning(false);
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!taskId) return;

    if (decision === "reject") {
      setShowReturnModal(true);
      return;
    }

    const qaAnnotation: any = {
      decision: decision,
      quality_score: parseInt(qualityScore) || 5,
      accuracy_rating: parseInt(accuracyRating) || 5,
      completeness_rating: parseInt(completenessRating) || 5,
      clarity_rating: parseInt(clarityRating) || 5,
    };

    if (corrections.trim()) {
      try {
        qaAnnotation.corrections = JSON.parse(corrections);
      } catch {
        qaAnnotation.corrections = corrections;
      }
    }

    if (notes.trim()) {
      qaAnnotation.notes = notes;
    }

    try {
      // Stop the timer
      setIsTimerActive(false);

      const body = {
        qa_annotation: qaAnnotation,
        qa_feedback: feedback.trim() || undefined,
        qa_time_spent: elapsedTime, // Send time spent in seconds
      };
      await apiFetch(`/tasks/${taskId}/qa`, { method: "PUT", body });
      setSuccess(
        decision === "approve"
          ? "Task approved and marked as complete!"
          : "Task completed with revision notes!"
      );
      setError(null);
      setTimeout(() => {
        if (task) {
          navigate(`/projects/${task.project_id}`);
        }
      }, 1000);
    } catch (e: any) {
      setError(e?.message || "Failed to submit QA review");
      setSuccess(null);
      // Restart timer if submission failed
      setIsTimerActive(true);
    }
  };

  return (
    <div className="space-y-6">
      {showReturnModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="relative max-w-md w-full rounded-2xl shadow-2xl border-2 bg-white dark:bg-gray-900 border-amber-300 dark:border-amber-700 p-6 animate-scale-in">
            <div className="flex justify-center mb-4">
              <div className="rounded-full p-3 bg-amber-100 dark:bg-amber-900/30">
                <svg
                  width="48"
                  height="48"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#f59e0b"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                  <line x1="12" y1="9" x2="12" y2="13" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
              </div>
            </div>
            <h2 className="text-xl font-semibold text-center text-amber-700 mb-2">
              Return Task to Annotator?
            </h2>
            <p className="text-sm text-center text-amber-700 mb-6">
              Are you sure you want to send this task back for revision? The
              annotator will need to update their submission.
            </p>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setShowReturnModal(false)}
                className="flex-1 py-3 px-4 rounded-xl font-semibold transition-all bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 border-2 border-gray-300 dark:border-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  void handleReturnTask();
                }}
                className="flex-1 py-3 px-4 rounded-xl font-semibold text-white transition-all shadow-md hover:shadow-lg bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800"
              >
                Yes, Return Task
              </button>
            </div>
            <p className="text-xs text-center text-amber-600 mt-4">
              Tip: leave a remark in the thread to highlight what needs
              attention before returning.
            </p>
          </div>
        </div>
      )}

      <div>
        <h1>{isManagerView ? "Manager Review" : "QA Review"}</h1>
        <p className="muted mt-1">
          {isManagerView
            ? "Review the QA outcome and decide whether it should return to the annotator."
            : "Review the annotation and provide quality assurance feedback"}
        </p>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {success && (
        <div className="rounded-md bg-green-50 border border-green-200 p-3 text-sm text-green-700">
          {success}
        </div>
      )}

      {task && (
        <div className="card">
          <div className="card-body space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="card-title mb-2">Task Information</h2>
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-mono text-gray-600 dark:text-gray-400">
                    {task.id.slice(0, 8)}
                  </span>
                  <span className="badge badge-primary">{task.category}</span>
                </div>
              </div>
              {/* Timer Display - Only show for QA annotators, not managers */}
              {!isManagerView && (
                <div className="flex flex-col items-end">
                  <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Time Elapsed</div>
                  <div
                    className={`font-mono text-2xl font-bold ${
                      isTimerActive ? "text-blue-600 dark:text-blue-400" : "text-gray-400 dark:text-gray-500"
                    }`}
                  >
                    {Math.floor(elapsedTime / 3600)
                      .toString()
                      .padStart(2, "0")}
                    :
                    {Math.floor((elapsedTime % 3600) / 60)
                      .toString()
                      .padStart(2, "0")}
                    :
                    {(elapsedTime % 60).toString().padStart(2, "0")}
                  </div>
                  {isTimerActive && (
                    <>
                      <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                      <span className="text-xs text-gray-500 dark:text-gray-400">Recording</span>
                    </>
                  )}
                </div>
              )}
            </div>
            <div>
              <h3 className="font-medium mb-2">Task Data</h3>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 max-h-96 overflow-auto scrollbar-thin">
                <TaskDataViewer data={task.task_data} />
              </div>
            </div>
            {task.annotation && (
              <div>
                <h3 className="font-medium mb-3 text-lg">
                  Annotator Annotation
                </h3>
                <AnnotationViewer task={task} />
              </div>
            )}
          </div>
        </div>
      )}

      {task?.id && (
        <RemarksThread
          taskId={task.id}
          remarks={task.remarks}
          allowReply={canReplyToThread}
          replyLabel={
            canReplyToThread ? "Leave a note for the annotator" : "Conversation"
          }
          emptyStateLabel="No remarks yet. Add context for the annotator when needed."
          onRemarkAdded={handleRemarkAdded}
        />
      )}

      {isManagerView ? (
        <div className="card">
          <div className="card-body space-y-4">
            <h2 className="card-title mb-2">QA Summary</h2>
            {task?.qa_annotation ? (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <TaskDataViewer data={task.qa_annotation} />
              </div>
            ) : (
              <p className="text-sm text-gray-600">
                This task has not been reviewed by QA yet.
              </p>
            )}
            {task?.qa_feedback && (
              <div className="bg-white border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
                <span className="font-semibold">QA Feedback:</span>{" "}
                {task.qa_feedback}
              </div>
            )}
            {task?.return_reason && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-700">
                <span className="font-semibold">
                  Most recent return reason:
                </span>{" "}
                {task.return_reason}
              </div>
            )}
            <div className="border-t border-gray-200 pt-4 space-y-3">
              <h3 className="font-semibold text-amber-800">
                Return to Annotator
              </h3>
              <p className="text-sm text-amber-700">
                Share what needs to change. This note is sent with the task.
              </p>
              <textarea
                className="textarea textarea-bordered h-28"
                value={returnReason}
                onChange={(e) => setReturnReason(e.target.value)}
                placeholder="Explain the changes you expect before accepting this work."
                disabled={returning}
              />
              {returnValidationError && (
                <div className="text-sm text-red-600">
                  {returnValidationError}
                </div>
              )}
              <div className="flex justify-end">
                <button
                  type="button"
                  className="btn btn-warning"
                  onClick={handleManagerReturn}
                  disabled={returning}
                >
                  {returning ? "Returning..." : "Return to Annotator"}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="card">
          <div className="card-body">
            <h2 className="card-title mb-4">Submit QA Review</h2>
            <form onSubmit={submit} className="space-y-6">
              {/* Decision Section */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h3 className="font-medium mb-3 text-gray-800">
                  Review Decision
                </h3>
                <div>
                  <label className="label">Decision *</label>
                  <select
                    className="select"
                    value={decision}
                    onChange={(e) =>
                      setDecision(
                        e.target.value as "approve" | "reject" | "revise"
                      )
                    }
                    required
                  >
                    <option value="approve">
                      ✓ Approve & Complete - Mark task as fully completed
                    </option>
                    <option value="revise">
                      ↻ Complete with Notes - Mark complete but add feedback
                    </option>
                    <option value="reject">
                      ← Return to Annotator - Send back for revision
                    </option>
                  </select>
                  {decision === "reject" && (
                    <p className="text-xs text-amber-700 mt-2 bg-amber-50 p-2 rounded border border-amber-200">
                      ⚠️ This will return the task to the annotator. Their
                      annotation will be cleared and they will need to resubmit.
                    </p>
                  )}
                </div>
              </div>

              {/* Quality Ratings Section */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h3 className="font-medium mb-3 text-gray-800">
                  Quality Ratings
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="label">
                      Overall Quality Score (1-10)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      className="input"
                      value={qualityScore}
                      onChange={(e) => setQualityScore(e.target.value)}
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      1 = Poor, 10 = Excellent
                    </p>
                  </div>

                  <div>
                    <label className="label">Accuracy Rating (1-10)</label>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      className="input"
                      value={accuracyRating}
                      onChange={(e) => setAccuracyRating(e.target.value)}
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      How correct is the annotation?
                    </p>
                  </div>

                  <div>
                    <label className="label">Completeness Rating (1-10)</label>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      className="input"
                      value={completenessRating}
                      onChange={(e) => setCompletenessRating(e.target.value)}
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Is all required information included?
                    </p>
                  </div>

                  <div>
                    <label className="label">Clarity Rating (1-10)</label>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      className="input"
                      value={clarityRating}
                      onChange={(e) => setClarityRating(e.target.value)}
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      How clear and well-structured?
                    </p>
                  </div>
                </div>
              </div>

              {/* Feedback Section */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h3 className="font-medium mb-3 text-gray-800">
                  Detailed Feedback
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="label">Feedback for Annotator</label>
                    <textarea
                      className="textarea h-24"
                      value={feedback}
                      onChange={(e) => setFeedback(e.target.value)}
                      placeholder="Provide constructive feedback about the annotation quality, what was done well, and what could be improved..."
                    />
                  </div>

                  {decision !== "approve" && (
                    <div>
                      <label className="label">
                        Corrections Needed{" "}
                        <span className="text-xs text-gray-500">
                          (JSON or text)
                        </span>
                      </label>
                      <textarea
                        className="textarea font-mono text-sm h-32"
                        value={corrections}
                        onChange={(e) => setCorrections(e.target.value)}
                        placeholder='Specify corrections as JSON, e.g., {"corrected_label": "positive"} or as plain text'
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Optional: Provide specific corrections that need to be
                        made
                      </p>
                    </div>
                  )}

                  <div>
                    <label className="label">Internal Notes (optional)</label>
                    <textarea
                      className="textarea h-20"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Any internal notes for managers or future reference..."
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  type="submit"
                  className={`btn flex-1 ${
                    decision === "approve"
                      ? "btn-primary"
                      : decision === "revise"
                      ? "bg-blue-500 hover:bg-blue-600 text-white"
                      : "bg-amber-500 hover:bg-amber-600 text-white"
                  }`}
                >
                  {decision === "approve" && "✓ Approve & Mark Complete"}
                  {decision === "revise" && "✓ Complete with Feedback"}
                  {decision === "reject" && "← Return to Annotator"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
