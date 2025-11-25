import { FormEvent, useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { apiFetch } from "@/api/client";
import { Task, TaskRemark } from "@/types";
import RemarksThread from "@/components/RemarksThread";
import {
  ImageClassificationAnnotator,
  ImageClassificationData,
  ImageClassificationAnnotation,
} from "@/components/ImageClassification";
import {
  ObjectDetectionAnnotator,
  MultiToolAnnotator,
  ObjectDetectionAnnotation,
} from "@/components/ObjectDetection";

function TaskDataViewer({ data }: { data: any }) {
  if (!data || typeof data !== "object") {
    return <div className="text-gray-500 text-sm">No data available</div>;
  }

  const renderValue = (value: any): React.ReactNode => {
    if (value === null || value === undefined)
      return <span className="text-gray-400">—</span>;
    if (typeof value === "boolean") return value ? "Yes" : "No";
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
              <span className="text-gray-700">{renderValue(v)}</span>
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
    <div className="space-y-3">
      {Object.entries(data).map(([key, value]) => (
        <div
          key={key}
          className="border-b border-gray-100 pb-3 last:border-b-0 last:pb-0"
        >
          <div className="text-sm font-semibold text-gray-800 mb-1 capitalize">
            {key.replace(/_/g, " ")}
          </div>
          <div className="text-sm">{renderValue(value)}</div>
        </div>
      ))}
    </div>
  );
}

export default function TaskAnnotatePage() {
  const { taskId } = useParams();
  const navigate = useNavigate();
  const [task, setTask] = useState<Task | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const hasReturnRemark = task?.remarks?.some(
    (r) => r.remark_type === "qa_return"
  );

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

  // Timer state - tracks time in seconds
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isTimerActive, setIsTimerActive] = useState(false);

  // Common annotation fields
  const [label, setLabel] = useState("");
  const [confidence, setConfidence] = useState("0.95");
  const [notes, setNotes] = useState("");

  // Text Classification / Sentiment Analysis
  const [category, setCategory] = useState("");
  const [sentiment, setSentiment] = useState("");

  // Image Classification - NEW COMPONENT
  const [imageClassificationAnnotation, setImageClassificationAnnotation] =
    useState<ImageClassificationAnnotation | null>(null);

  // Image Classification - OLD (kept for backward compatibility)
  const [predictedClass, setPredictedClass] = useState("");

  // Object Detection - NEW COMPONENT
  const [objectDetectionAnnotation, setObjectDetectionAnnotation] =
    useState<ObjectDetectionAnnotation | null>(null);

  // Object Detection - OLD (kept for backward compatibility)
  const [objects, setObjects] = useState("");

  // Named Entity Recognition
  const [entities, setEntities] = useState("");

  // NER entity form fields
  interface NEREntity {
    entity: string;
    type: string;
    start: number;
    end: number;
  }
  const [nerEntities, setNerEntities] = useState<NEREntity[]>([]);
  const [currentEntity, setCurrentEntity] = useState("");
  const [currentEntityType, setCurrentEntityType] = useState("");
  const [currentStart, setCurrentStart] = useState("");
  const [currentEnd, setCurrentEnd] = useState("");

  // Text Summarization
  const [summary, setSummary] = useState("");

  // QA Evaluation - Multiple pairs support
  interface QAEvaluation {
    accuracy: string;
    relevance: string;
    completeness: string;
  }
  const [qaEvaluations, setQaEvaluations] = useState<QAEvaluation[]>([]);

  // LLM Response Grading
  const [grade, setGrade] = useState("");
  const [reasoning, setReasoning] = useState("");

  // Chatbot Assessment
  const [coherence, setCoherence] = useState("");
  const [helpfulness, setHelpfulness] = useState("");

  // Response Selection
  const [selectedResponse, setSelectedResponse] = useState("");
  const [selectionReason, setSelectionReason] = useState("");

  useEffect(() => {
    if (!taskId) return;
    apiFetch<Task>(`/tasks/${taskId}`)
      .then((taskData) => {
        setTask(taskData);

        // If task was returned, start timer from accumulated time
        if (taskData.is_returned && taskData.accumulated_time) {
          setElapsedTime(Math.floor(taskData.accumulated_time));
        }

        // Initialize QA evaluations array based on qa_pairs length
        if (
          taskData.category === "qa_evaluation" &&
          taskData.task_data?.qa_pairs
        ) {
          const pairsCount = taskData.task_data.qa_pairs.length;
          setQaEvaluations(
            Array(pairsCount)
              .fill(null)
              .map(() => ({
                accuracy: "",
                relevance: "",
                completeness: "",
              }))
          );
        }

        // If task has existing annotation (returned task), populate the form fields
        if (taskData.annotation) {
          const ann = taskData.annotation;

          // Common fields
          if (ann.confidence !== undefined)
            setConfidence(String(ann.confidence));
          if (ann.notes) setNotes(ann.notes);

          // QA Evaluation - restore multiple evaluations
          if (taskData.category === "qa_evaluation" && ann.evaluations) {
            setQaEvaluations(ann.evaluations);
          }

          // Category-specific fields
          switch (taskData.category) {
            // case "text_classification":
            //   if (ann.label) setLabel(ann.label);
            //   if (ann.category) setCategory(ann.category);
            //   break;
            case "image_classification":
              // Restore new annotation format
              if (ann.selected_label) {
                setImageClassificationAnnotation({
                  selected_label: ann.selected_label,
                  confidence: ann.confidence,
                  notes: ann.notes,
                });
              }
              // Fallback to old format
              if (ann.predicted_class) setPredictedClass(ann.predicted_class);
              break;
            case "object_detection":
              // New multi-tool format: ObjectDetectionAnnotation with annotations array
              if (ann.annotations && Array.isArray(ann.annotations)) {
                setObjectDetectionAnnotation({
                  annotations: ann.annotations,
                  image_url: taskData.task_data.image_url,
                  notes: ann.notes || "",
                  bounding_boxes: ann.bounding_boxes || [],
                });
              }
              // Legacy format: bounding_boxes only
              else if (ann.bounding_boxes && Array.isArray(ann.bounding_boxes)) {
                setObjectDetectionAnnotation({
                  annotations: ann.bounding_boxes,
                  image_url: taskData.task_data.image_url,
                  notes: ann.notes || "",
                  bounding_boxes: ann.bounding_boxes,
                });
              }
              // Fallback to old format
              else if (ann.objects) {
                setObjects(JSON.stringify(ann.objects, null, 2));
              }
              break;
            case "named_entity_recognition":
              if (ann.entities && Array.isArray(ann.entities)) {
                setNerEntities(ann.entities);
              }
              break;
            case "sentiment_analysis":
              if (ann.sentiment) setSentiment(ann.sentiment);
              if (ann.label) setLabel(ann.label);
              break;
            case "text_summarization":
              if (ann.summary) setSummary(ann.summary);
              break;
            case "generative_ai_llm_response_grading":
              if (ann.grade) setGrade(ann.grade);
              if (ann.reasoning) setReasoning(ann.reasoning);
              break;
            case "generative_ai_chatbot_assessment":
              if (ann.coherence) setCoherence(ann.coherence);
              if (ann.helpfulness) setHelpfulness(ann.helpfulness);
              break;
            case "conversational_ai_response_selection":
              if (ann.selected_response)
                setSelectedResponse(ann.selected_response);
              if (ann.selection_reason)
                setSelectionReason(ann.selection_reason);
              break;
          }
        }

        // Start timer when task loads
        setIsTimerActive(true);
      })
      .catch((e) => setError(String(e)));
  }, [taskId]);

  // Timer effect
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

  // Format time as HH:MM:SS
  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!taskId || !task) return;

    // Stop the timer
    setIsTimerActive(false);

    let annotationData: any = {
      confidence: parseFloat(confidence) || 0.95,
      notes: notes || "",
    };

    // Build annotation based on task category
    switch (task.category) {
      // case "text_classification":
      //   annotationData.label = label;
      //   annotationData.category = category;
      //   break;
      case "image_classification":
        // Use new annotation format if available
        if (imageClassificationAnnotation) {
          annotationData = {
            ...annotationData,
            ...imageClassificationAnnotation,
          };
        } else {
          // Fallback to old format
          annotationData.predicted_class = predictedClass;
        }
        break;
      case "object_detection":
        // Use new multi-tool annotation format if available
        if (objectDetectionAnnotation && objectDetectionAnnotation.annotations && objectDetectionAnnotation.annotations.length > 0) {
          annotationData = {
            ...annotationData,
            ...objectDetectionAnnotation,
          };
        } else if (objectDetectionAnnotation && objectDetectionAnnotation.bounding_boxes && objectDetectionAnnotation.bounding_boxes.length > 0) {
          // Legacy format with bounding_boxes only
          annotationData = {
            ...annotationData,
            ...objectDetectionAnnotation,
          };
        } else if (objects) {
          // Fallback to old format (if objects string exists)
          try {
            annotationData.objects = JSON.parse(objects);
          } catch {
            annotationData.objects = [];
          }
        } else {
          // No annotations drawn
          setError("Please create at least one annotation before submitting");
          setIsTimerActive(true); // Resume timer on error
          return;
        }
        break;
      case "named_entity_recognition":
        // Validate that at least one entity has been added
        if (nerEntities.length === 0) {
          setError("Please add at least one entity before submitting");
          setIsTimerActive(true); // Resume timer on error
          return;
        }
        // Use the nerEntities array directly instead of parsing JSON
        annotationData.entities = nerEntities;
        break;
      case "sentiment_analysis":
        annotationData.sentiment = sentiment;
        annotationData.label = label;
        break;
      case "text_summarization":
        annotationData.summary = summary;
        break;
      case "qa_evaluation":
        annotationData.evaluations = qaEvaluations;
        break;
      case "generative_ai_llm_response_grading":
        annotationData.grade = grade;
        annotationData.reasoning = reasoning;
        break;
      case "generative_ai_chatbot_assessment":
        annotationData.coherence = coherence;
        annotationData.helpfulness = helpfulness;
        break;
      case "conversational_ai_response_selection":
        annotationData.selected_response = selectedResponse;
        annotationData.selection_reason = selectionReason;
        break;
      default:
        annotationData.label = label;
    }

    try {
      const body = {
        annotation: annotationData,
        completion_time: elapsedTime, // Send elapsed time in seconds
      };
      await apiFetch(`/tasks/${taskId}/annotation`, { method: "PUT", body });
      setSuccess(
        `Annotation sent to QA successfully! Time taken: ${formatTime(
          elapsedTime
        )}`
      );
      setError(null);

      // Redirect to project details page after 1.5 seconds
      setTimeout(() => {
        if (task?.project_id) {
          navigate(`/projects/${task.project_id}`);
        }
      }, 1500);
    } catch (e: any) {
      setError(e?.message || "Failed to submit annotation");
      setSuccess(null);
      setIsTimerActive(true); // Resume timer on error
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1>Annotate Task</h1>
        <p className="muted mt-1">
          Review the task data and provide your annotation
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
            <div className="flex items-center justify-between">
              <div>
                <h2 className="card-title mb-2">Task Information</h2>
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-mono text-gray-600">
                    {task.id.slice(0, 8)}
                  </span>
                  <span className="badge badge-primary">{task.category}</span>
                  {task.is_returned && (
                    <span className="badge badge-warning">
                      ⚠️ Returned - Needs Revision
                    </span>
                  )}
                </div>
                {task.is_returned && task.accumulated_time && (
                  <div className="text-xs text-amber-600 mt-2">
                    Previous time spent:{" "}
                    {formatTime(Math.floor(task.accumulated_time))}
                  </div>
                )}
              </div>
              {/* Timer Display */}
              <div className="flex flex-col items-end">
                <div className="text-xs text-gray-500 mb-1">Time Elapsed</div>
                <div
                  className={`font-mono text-2xl font-bold ${
                    isTimerActive ? "text-blue-600" : "text-gray-600"
                  }`}
                >
                  {formatTime(elapsedTime)}
                </div>
                <div className="flex items-center gap-1 mt-1">
                  {isTimerActive && (
                    <>
                      <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                      <span className="text-xs text-gray-500">Recording</span>
                    </>
                  )}
                  {!isTimerActive && elapsedTime > 0 && (
                    <span className="text-xs text-gray-500">Completed</span>
                  )}
                </div>
              </div>
            </div>
            <div>
              <h3 className="font-medium mb-2">Task Data</h3>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 max-h-96 overflow-auto scrollbar-thin">
                <TaskDataViewer data={task.task_data} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* QA Remarks Panel */}
      {task?.is_returned &&
        !hasReturnRemark &&
        (task.return_reason || task.qa_feedback || task.qa_annotation) && (
          <div className="bg-amber-50 border-2 border-amber-300 rounded-xl p-5 shadow-md">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-0.5">
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#d97706"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                  <line x1="12" y1="9" x2="12" y2="13" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
              </div>
              <div className="flex-1 space-y-3">
                <div>
                  <h3 className="text-lg font-semibold text-amber-800">
                    📥 Task Returned for Revision
                  </h3>
                  <p className="text-xs text-amber-600 mt-1">
                    Review these notes from the QA reviewer before updating your
                    submission.
                  </p>
                </div>
                {task.return_reason && (
                  <div>
                    <p className="text-xs uppercase tracking-wide text-amber-700 font-semibold">
                      Return Reason
                    </p>
                    <div className="bg-white border border-amber-200 rounded-lg p-3 mt-1">
                      <p className="text-sm text-gray-800 whitespace-pre-wrap">
                        {task.return_reason}
                      </p>
                    </div>
                  </div>
                )}
                {task.qa_feedback && (
                  <div>
                    <p className="text-xs uppercase tracking-wide text-amber-700 font-semibold">
                      Additional Comments
                    </p>
                    <div className="bg-white border border-amber-200 rounded-lg p-3 mt-1">
                      <p className="text-sm text-gray-800 whitespace-pre-wrap">
                        {task.qa_feedback}
                      </p>
                    </div>
                  </div>
                )}
                {task.qa_annotation &&
                  typeof task.qa_annotation === "object" && (
                    <div>
                      <p className="text-xs uppercase tracking-wide text-amber-700 font-semibold">
                        QA Notes
                      </p>
                      <pre className="text-xs text-gray-800 bg-white border border-amber-200 rounded-lg p-3 mt-1 whitespace-pre-wrap overflow-x-auto">
                        {JSON.stringify(task.qa_annotation, null, 2)}
                      </pre>
                    </div>
                  )}
              </div>
            </div>
          </div>
        )}

      {task?.id && (task.is_returned || (task.remarks?.length ?? 0) > 0) && (
        <RemarksThread
          taskId={task.id}
          remarks={task.remarks}
          allowReply={Boolean(task.is_returned)}
          replyLabel="Let QA know what you fixed"
          emptyStateLabel="No remarks yet. Add a note once you review the feedback."
          onRemarkAdded={handleRemarkAdded}
        />
      )}

      <div className="card">
        <div className="card-body">
          <h2 className="card-title mb-4">Review & Send to QA</h2>
          {task?.is_returned && task?.annotation && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
              <p className="text-sm text-blue-800">
                <strong>📝 Note:</strong> This task was returned for revision.
                The form below is pre-filled with your previous submission.
                Please review and update as needed.
              </p>
            </div>
          )}
          {!task?.is_returned &&
            task?.annotation &&
            task?.completed_status?.annotator_part && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md">
                <p className="text-sm text-green-800">
                  <strong>✅ Viewing Completed Task:</strong> This task has been
                  completed by the annotator. The form below shows their
                  submitted work. You can review and modify if needed.
                </p>
              </div>
            )}
          <form onSubmit={submit} className="space-y-4">
            {/* Text Classification */}
            {/* {task?.category === "text_classification" && (
              <>
                <div>
                  <label className="label">Label</label>
                  <input
                    type="text"
                    className="input"
                    value={label}
                    onChange={(e) => setLabel(e.target.value)}
                    placeholder="Enter label"
                    required
                  />
                </div>
                <div>
                  <label className="label">Category</label>
                  <input
                    type="text"
                    className="input"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    placeholder="Enter category"
                  />
                </div>
              </>
            )} */}

            {/* Image Classification */}
            {task?.category === "image_classification" && (
              <ImageClassificationAnnotator
                taskData={task.task_data as ImageClassificationData}
                initialAnnotation={imageClassificationAnnotation || undefined}
                onAnnotationChange={(annotation) =>
                  setImageClassificationAnnotation(annotation)
                }
              />
            )}

            {/* Object Detection */}
            {task?.category === "object_detection" && (
              <MultiToolAnnotator
                imageUrl={task.task_data.image_url}
                classes={task.task_data.classes}
                existingAnnotation={objectDetectionAnnotation || undefined}
                onAnnotationChange={(annotation) =>
                  setObjectDetectionAnnotation(annotation)
                }
                allowedTypes={task.task_data.annotation_types || ['bbox', 'polygon', 'polyline', 'point', 'mask']}
                defaultTool={task.task_data.default_annotation_type || 'bbox'}
              />
            )}

            {/* Named Entity Recognition */}
            {task?.category === "named_entity_recognition" && (
              <div className="space-y-6">
                {/* Header Section */}
                <div className="bg-white border-b-2 border-gray-200 pb-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                        <svg
                          className="w-6 h-6 text-white"
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
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">
                          Named Entity Recognition
                        </h3>
                        <p className="text-sm text-gray-500 mt-0.5">
                          Identify and label entities in the text below
                        </p>
                      </div>
                    </div>
                    <div className="bg-blue-50 border border-blue-200 px-5 py-2.5 rounded-lg">
                      <div className="text-sm text-gray-600 font-medium">
                        Labeled Entities
                      </div>
                      <div className="text-2xl font-bold text-blue-600 text-center">
                        {nerEntities.length}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Source Text Display */}
                {task.task_data?.text && (
                  <div className="bg-white border-2 border-gray-300 rounded-lg overflow-hidden">
                    <div className="bg-gray-50 border-b-2 border-gray-300 px-5 py-3 flex items-center justify-between">
                      <h4 className="text-sm font-bold text-gray-700 uppercase tracking-wide">
                        Source Text
                      </h4>
                      <span className="text-xs text-gray-500 font-mono bg-white px-3 py-1 rounded border border-gray-300">
                        {task.task_data.text.length} characters
                      </span>
                    </div>
                    <div className="p-6 bg-white">
                      <div className="text-base text-gray-900 leading-loose whitespace-pre-wrap select-text">
                        {task.task_data.text}
                      </div>
                    </div>
                    <div className="bg-blue-50 border-t border-blue-200 px-5 py-3">
                      <p className="text-xs text-blue-800 flex items-center gap-2">
                        <svg
                          className="w-4 h-4"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                            clipRule="evenodd"
                          />
                        </svg>
                        <strong>Tip:</strong> Select text to identify entity
                        positions for labeling
                      </p>
                    </div>
                  </div>
                )}

                {/* Available Entity Types */}
                {task.task_data?.entity_types && (
                  <div className="bg-white border-2 border-gray-300 rounded-lg overflow-hidden">
                    <div className="bg-gray-50 border-b-2 border-gray-300 px-5 py-3">
                      <h4 className="text-sm font-bold text-gray-700 uppercase tracking-wide">
                        Available Entity Types
                      </h4>
                    </div>
                    <div className="p-5">
                      <div className="flex flex-wrap gap-3">
                        {task.task_data.entity_types.map((type: string) => (
                          <button
                            key={type}
                            type="button"
                            onClick={() => setCurrentEntityType(type)}
                            className={`px-5 py-2.5 text-sm font-semibold rounded-lg border-2 transition-all ${
                              currentEntityType === type
                                ? "bg-blue-600 text-white border-blue-600 shadow-md"
                                : "bg-white text-gray-700 border-gray-300 hover:border-blue-400 hover:bg-blue-50"
                            }`}
                          >
                            {type}
                          </button>
                        ))}
                      </div>
                      <p className="text-xs text-gray-600 mt-4 flex items-center gap-1.5">
                        <svg
                          className="w-3.5 h-3.5"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
                          <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
                        </svg>
                        Click to quick-select a type for your next entity
                      </p>
                    </div>
                  </div>
                )}

                {/* Labeled Entities List */}
                {nerEntities.length > 0 && (
                  <div className="bg-white border-2 border-gray-300 rounded-lg overflow-hidden">
                    <div className="bg-gray-50 border-b-2 border-gray-300 px-5 py-3 flex items-center justify-between">
                      <h4 className="text-sm font-bold text-gray-700 uppercase tracking-wide">
                        Labeled Entities ({nerEntities.length})
                      </h4>
                      <button
                        type="button"
                        onClick={() => {
                          if (
                            confirm(
                              `Clear all ${nerEntities.length} labeled entities?`
                            )
                          ) {
                            setNerEntities([]);
                          }
                        }}
                        className="text-xs text-red-600 hover:text-red-800 font-semibold px-3 py-1.5 bg-white border border-red-300 rounded hover:bg-red-50 transition-colors"
                      >
                        Clear All
                      </button>
                    </div>
                    <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
                      {nerEntities.map((entity, idx) => (
                        <div
                          key={idx}
                          className="flex items-center gap-5 p-5 hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex-shrink-0 w-12 h-12 bg-blue-600 text-white rounded-lg flex items-center justify-center font-bold text-lg">
                            {idx + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3 mb-2">
                              <span className="text-base font-bold text-gray-900">
                                "{entity.entity}"
                              </span>
                              <span className="px-3 py-1 bg-blue-600 text-white text-xs font-bold rounded uppercase tracking-wide">
                                {entity.type}
                              </span>
                            </div>
                            <div className="flex items-center gap-4 text-xs text-gray-600">
                              <span className="font-mono bg-gray-100 px-2.5 py-1 rounded border border-gray-300">
                                Start:{" "}
                                <strong className="text-gray-900">
                                  {entity.start}
                                </strong>
                              </span>
                              <span className="text-gray-400">→</span>
                              <span className="font-mono bg-gray-100 px-2.5 py-1 rounded border border-gray-300">
                                End:{" "}
                                <strong className="text-gray-900">
                                  {entity.end}
                                </strong>
                              </span>
                              <span className="text-gray-500">
                                ({entity.end - entity.start} chars)
                              </span>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() =>
                              setNerEntities(
                                nerEntities.filter((_, i) => i !== idx)
                              )
                            }
                            className="flex-shrink-0 px-4 py-2.5 bg-white text-red-600 border-2 border-red-300 rounded-lg text-sm font-semibold hover:bg-red-50 hover:border-red-400 transition-colors"
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Add Entity Form */}
                <div className="bg-white border-2 border-gray-300 rounded-lg overflow-hidden">
                  <div className="bg-gray-50 border-b-2 border-gray-300 px-5 py-3">
                    <h4 className="text-sm font-bold text-gray-700 uppercase tracking-wide">
                      Add New Entity
                    </h4>
                  </div>
                  <div className="p-6 space-y-5">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                      {/* Entity Text */}
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">
                          Entity Text
                        </label>
                        <input
                          type="text"
                          className="w-full px-4 py-3 text-base border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                          value={currentEntity}
                          onChange={(e) => {
                            const val = e.target.value;
                            setCurrentEntity(val);
                            if (val && task.task_data?.text && !currentStart) {
                              const sourceText = task.task_data.text;
                              const startPos = sourceText.indexOf(val);
                              if (startPos !== -1) {
                                setCurrentStart(startPos.toString());
                                setCurrentEnd(
                                  (startPos + val.length).toString()
                                );
                              }
                            }
                          }}
                          placeholder="Type or paste entity text..."
                        />
                        <p className="text-xs text-gray-500 mt-2 flex items-center gap-1.5">
                          <svg
                            className="w-3.5 h-3.5 text-blue-600"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z"
                              clipRule="evenodd"
                            />
                          </svg>
                          Positions auto-calculate when typing
                        </p>
                      </div>

                      {/* Entity Type */}
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">
                          Entity Type
                        </label>
                        {task.task_data?.entity_types ? (
                          <select
                            className="w-full px-4 py-3 text-base border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white transition-all cursor-pointer"
                            value={currentEntityType}
                            onChange={(e) =>
                              setCurrentEntityType(e.target.value)
                            }
                          >
                            <option value="">Select entity type...</option>
                            {task.task_data.entity_types.map((type: string) => (
                              <option key={type} value={type}>
                                {type}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <input
                            type="text"
                            className="w-full px-4 py-3 text-base border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                            value={currentEntityType}
                            onChange={(e) =>
                              setCurrentEntityType(e.target.value)
                            }
                            placeholder="e.g., PERSON, ORG, LOC"
                          />
                        )}
                      </div>

                      {/* Start Position */}
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">
                          Start Position
                        </label>
                        <input
                          type="number"
                          className="w-full px-4 py-3 text-base font-mono border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                          value={currentStart}
                          onChange={(e) => setCurrentStart(e.target.value)}
                          placeholder="0"
                          min="0"
                        />
                      </div>

                      {/* End Position */}
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">
                          End Position
                        </label>
                        <input
                          type="number"
                          className="w-full px-4 py-3 text-base font-mono border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                          value={currentEnd}
                          onChange={(e) => setCurrentEnd(e.target.value)}
                          placeholder="8"
                          min="0"
                        />
                      </div>
                    </div>

                    {/* Live Preview */}
                    {currentEntity &&
                      currentStart &&
                      currentEnd &&
                      task.task_data?.text && (
                        <div className="bg-green-50 border-2 border-green-300 rounded-lg overflow-hidden">
                          <div className="bg-green-100 border-b-2 border-green-300 px-4 py-2.5 flex items-center gap-2">
                            <svg
                              className="w-5 h-5 text-green-700"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                              <path
                                fillRule="evenodd"
                                d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
                                clipRule="evenodd"
                              />
                            </svg>
                            <span className="text-sm font-bold text-green-900 uppercase tracking-wide">
                              Preview
                            </span>
                          </div>
                          <div className="p-4 bg-white">
                            <p className="text-base text-gray-900 leading-relaxed">
                              {(() => {
                                const start = parseInt(currentStart);
                                const end = parseInt(currentEnd);
                                const text = task.task_data.text;
                                const before = text.substring(
                                  Math.max(0, start - 40),
                                  start
                                );
                                const entity = text.substring(start, end);
                                const after = text.substring(
                                  end,
                                  Math.min(text.length, end + 40)
                                );
                                return (
                                  <>
                                    {before && (
                                      <span className="text-gray-500">
                                        ...{before}
                                      </span>
                                    )}
                                    <mark className="font-bold bg-yellow-200 px-2 py-1 border-2 border-yellow-400 rounded">
                                      {entity}
                                    </mark>
                                    {after && (
                                      <span className="text-gray-500">
                                        {after}...
                                      </span>
                                    )}
                                  </>
                                );
                              })()}
                            </p>
                          </div>
                        </div>
                      )}

                    {/* Add Button */}
                    <button
                      type="button"
                      onClick={() => {
                        if (!currentEntity.trim()) {
                          alert("Please enter entity text");
                          return;
                        }
                        if (!currentEntityType.trim()) {
                          alert("Please select or enter entity type");
                          return;
                        }
                        if (currentStart === "" || currentEnd === "") {
                          alert("Please enter start and end positions");
                          return;
                        }
                        const start = parseInt(currentStart);
                        const end = parseInt(currentEnd);
                        if (start < 0 || end < 0) {
                          alert("Positions must be non-negative");
                          return;
                        }
                        if (end <= start) {
                          alert(
                            "End position must be greater than start position"
                          );
                          return;
                        }
                        const newEntity: NEREntity = {
                          entity: currentEntity.trim(),
                          type: currentEntityType.trim(),
                          start: start,
                          end: end,
                        };
                        setNerEntities([...nerEntities, newEntity]);
                        setCurrentEntity("");
                        setCurrentEntityType("");
                        setCurrentStart("");
                        setCurrentEnd("");
                      }}
                      className="w-full py-4 text-base font-bold text-white rounded-lg transition-all shadow-md hover:shadow-lg transform hover:scale-[1.01] active:scale-[0.99] focus:outline-none focus:ring-4 focus:ring-blue-300"
                      style={{ backgroundColor: "#7a1cac" }}
                    >
                      + Add Entity to List
                    </button>
                  </div>
                </div>

                {/* Warning Message */}
                {nerEntities.length === 0 && (
                  <div className="bg-amber-50 border-2 border-amber-300 rounded-lg p-5 flex items-center gap-4">
                    <svg
                      className="w-8 h-8 text-amber-600 flex-shrink-0"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <div className="flex-1">
                      <p className="text-sm font-bold text-amber-900">
                        At least one entity must be labeled before submission
                      </p>
                      <p className="text-xs text-amber-700 mt-1">
                        Use the form above to add entities to your annotation
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Sentiment Analysis */}
            {task?.category === "sentiment_analysis" && (
              <div className="space-y-6">
                {/* Text to Analyze Section */}
                <div className="bg-white border-2 border-gray-300 rounded-lg p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <svg
                      className="w-5 h-5 text-emerald-600"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide">
                      Text to Analyze
                    </h3>
                  </div>
                  <div className="bg-gray-50 border-2 border-gray-200 rounded-lg p-4 max-h-60 overflow-y-auto">
                    <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">
                      {task.task_data?.text || "No text provided"}
                    </p>
                  </div>
                  <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <svg
                        className="w-3.5 h-3.5"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                          clipRule="evenodd"
                        />
                      </svg>
                      Analyze the sentiment of this text
                    </span>
                    <span>{task.task_data?.text?.length || 0} characters</span>
                  </div>
                </div>

                {/* Sentiment Selection Section */}
                <div className="bg-white border-2 border-emerald-400 rounded-lg p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <svg
                      className="w-5 h-5 text-emerald-600"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 100-2 1 1 0 000 2zm7-1a1 1 0 11-2 0 1 1 0 012 0zm-.464 5.535a1 1 0 10-1.415-1.414 3 3 0 01-4.242 0 1 1 0 00-1.415 1.414 5 5 0 007.072 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide">
                      Select Sentiment
                    </h3>
                    <span className="text-xs text-red-500 ml-1">*</span>
                  </div>

                  {/* Available Sentiments */}
                  {Array.isArray(task.task_data?.sentiments) &&
                  task.task_data.sentiments.length > 0 ? (
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {task.task_data.sentiments.map(
                          (sentimentOption: string) => {
                            const isSelected = sentiment === sentimentOption;
                            const sentimentColors: Record<string, string> = {
                              positive: "emerald",
                              "very positive": "green",
                              negative: "red",
                              "very negative": "rose",
                              neutral: "gray",
                              mixed: "amber",
                              happy: "yellow",
                              sad: "blue",
                              angry: "red",
                              surprised: "purple",
                            };
                            const colorKey = sentimentOption.toLowerCase();
                            const colorScheme =
                              sentimentColors[colorKey] || "emerald";

                            return (
                              <button
                                key={sentimentOption}
                                type="button"
                                onClick={() => setSentiment(sentimentOption)}
                                className={`px-4 py-3 border-2 rounded-lg font-semibold text-sm transition-all ${
                                  isSelected
                                    ? `bg-${colorScheme}-100 border-${colorScheme}-500 text-${colorScheme}-900 shadow-md`
                                    : `bg-white border-gray-300 text-gray-700 hover:border-${colorScheme}-300 hover:bg-${colorScheme}-50`
                                }`}
                                style={{
                                  backgroundColor: isSelected
                                    ? colorScheme === "emerald"
                                      ? "#d1fae5"
                                      : colorScheme === "green"
                                      ? "#d9f99d"
                                      : colorScheme === "red"
                                      ? "#fee2e2"
                                      : colorScheme === "rose"
                                      ? "#ffe4e6"
                                      : colorScheme === "gray"
                                      ? "#f3f4f6"
                                      : colorScheme === "amber"
                                      ? "#fef3c7"
                                      : colorScheme === "yellow"
                                      ? "#fef9c3"
                                      : colorScheme === "blue"
                                      ? "#dbeafe"
                                      : colorScheme === "purple"
                                      ? "#e9d5ff"
                                      : "#d1fae5"
                                    : "white",
                                  borderColor: isSelected
                                    ? colorScheme === "emerald"
                                      ? "#10b981"
                                      : colorScheme === "green"
                                      ? "#84cc16"
                                      : colorScheme === "red"
                                      ? "#ef4444"
                                      : colorScheme === "rose"
                                      ? "#f43f5e"
                                      : colorScheme === "gray"
                                      ? "#6b7280"
                                      : colorScheme === "amber"
                                      ? "#f59e0b"
                                      : colorScheme === "yellow"
                                      ? "#eab308"
                                      : colorScheme === "blue"
                                      ? "#3b82f6"
                                      : colorScheme === "purple"
                                      ? "#a855f7"
                                      : "#10b981"
                                    : "#d1d5db",
                                  color: isSelected
                                    ? colorScheme === "emerald"
                                      ? "#047857"
                                      : colorScheme === "green"
                                      ? "#365314"
                                      : colorScheme === "red"
                                      ? "#991b1b"
                                      : colorScheme === "rose"
                                      ? "#9f1239"
                                      : colorScheme === "gray"
                                      ? "#374151"
                                      : colorScheme === "amber"
                                      ? "#92400e"
                                      : colorScheme === "yellow"
                                      ? "#854d0e"
                                      : colorScheme === "blue"
                                      ? "#1e40af"
                                      : colorScheme === "purple"
                                      ? "#6b21a8"
                                      : "#047857"
                                    : "#374151",
                                }}
                              >
                                {isSelected && (
                                  <svg
                                    className="w-4 h-4 inline mr-1"
                                    fill="currentColor"
                                    viewBox="0 0 20 20"
                                  >
                                    <path
                                      fillRule="evenodd"
                                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                      clipRule="evenodd"
                                    />
                                  </svg>
                                )}
                                {sentimentOption}
                              </button>
                            );
                          }
                        )}
                      </div>
                      {sentiment && (
                        <div className="bg-emerald-50 border-2 border-emerald-200 rounded-lg p-3">
                          <p className="text-xs text-emerald-900 font-semibold">
                            ✓ Selected:{" "}
                            <span className="font-bold">{sentiment}</span>
                          </p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <select
                      className="w-full px-4 py-3 text-base border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all bg-white"
                      value={sentiment}
                      onChange={(e) => setSentiment(e.target.value)}
                      required
                    >
                      <option value="">Select sentiment...</option>
                      <option value="positive">Positive</option>
                      <option value="negative">Negative</option>
                      <option value="neutral">Neutral</option>
                    </select>
                  )}

                  <p className="text-xs text-gray-500 mt-3 flex items-center gap-1">
                    <svg
                      className="w-3.5 h-3.5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Choose the sentiment that best represents the text
                  </p>
                </div>

                {/* Additional Notes (Optional) */}
                <div className="bg-white border-2 border-gray-300 rounded-lg p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <svg
                      className="w-5 h-5 text-gray-600"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M18 13V5a2 2 0 00-2-2H4a2 2 0 00-2 2v8a2 2 0 002 2h3l3 3 3-3h3a2 2 0 002-2zM5 7a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1zm1 3a1 1 0 100 2h3a1 1 0 100-2H6z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide">
                      Additional Notes
                    </h3>
                    <span className="text-xs text-gray-500">(Optional)</span>
                  </div>
                  <input
                    type="text"
                    className="w-full px-4 py-3 text-base border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all bg-white"
                    value={label}
                    onChange={(e) => setLabel(e.target.value)}
                    placeholder="Add any additional notes or observations (optional)"
                  />
                  <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                    <svg
                      className="w-3.5 h-3.5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Optional field for context or reasoning
                  </p>
                </div>
              </div>
            )}

            {/* Text Summarization */}
            {task?.category === "text_summarization" && (
              <div className="space-y-6">
                {/* Source Text Section */}
                <div className="bg-white border-2 border-gray-300 rounded-lg p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <svg
                      className="w-5 h-5 text-blue-600"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide">
                      Source Text
                    </h3>
                  </div>
                  <div className="bg-gray-50 border-2 border-gray-200 rounded-lg p-4 max-h-96 overflow-y-auto">
                    {Array.isArray(task.task_data?.text) ? (
                      <div className="space-y-4">
                        {task.task_data.text.map(
                          (para: string, idx: number) => (
                            <div
                              key={idx}
                              className="pb-3 border-b border-gray-300 last:border-0 last:pb-0"
                            >
                              <div className="flex items-center gap-2 mb-2">
                                <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-xs font-bold rounded">
                                  ¶{idx + 1}
                                </span>
                                <span className="text-xs text-gray-500">
                                  {para.split(/\s+/).length} words
                                </span>
                              </div>
                              <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">
                                {para}
                              </p>
                            </div>
                          )
                        )}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">
                        {task.task_data?.text || "No text provided"}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <svg
                        className="w-3.5 h-3.5"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                          clipRule="evenodd"
                        />
                      </svg>
                      Original text to summarize
                    </span>
                    <span>
                      {Array.isArray(task.task_data?.text)
                        ? `${task.task_data.text.length} paragraphs`
                        : typeof task.task_data?.text === "string"
                        ? `${task.task_data.text.split(/\s+/).length} words`
                        : "0 words"}
                    </span>
                  </div>
                </div>

                {/* Guidelines Section */}
                {task.task_data?.guidelines && (
                  <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
                    <div className="flex items-start gap-2">
                      <svg
                        className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <div className="flex-1">
                        <p className="text-xs font-bold text-blue-900 mb-1">
                          Summarization Guidelines
                        </p>
                        <p className="text-xs text-blue-800 whitespace-pre-wrap">
                          {task.task_data.guidelines}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Summary Input Section */}
                <div className="bg-white border-2 border-blue-400 rounded-lg p-5">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <svg
                        className="w-5 h-5 text-blue-600"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                        <path
                          fillRule="evenodd"
                          d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide">
                        Your Summary
                      </h3>
                      <span className="text-xs text-red-500 ml-1">*</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs">
                      <span className="text-gray-500">
                        {summary.split(/\s+/).filter(Boolean).length} words
                      </span>
                      {task.task_data?.max_length && (
                        <span
                          className={`px-2 py-1 rounded font-semibold ${
                            summary.split(/\s+/).filter(Boolean).length <=
                            task.task_data.max_length
                              ? "bg-green-100 text-green-700 border border-green-300"
                              : "bg-red-100 text-red-700 border border-red-300"
                          }`}
                        >
                          Max: {task.task_data.max_length}
                        </span>
                      )}
                    </div>
                  </div>
                  <textarea
                    className="w-full px-4 py-3 text-base border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white resize-none"
                    rows={8}
                    value={summary}
                    onChange={(e) => setSummary(e.target.value)}
                    placeholder="Write your summary here...&#10;&#10;Create a concise summary that captures the main points and key information from the source text."
                    required
                  />
                  <div className="mt-3 space-y-2">
                    <p className="text-xs text-gray-500 flex items-center gap-1">
                      <svg
                        className="w-3.5 h-3.5"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                          clipRule="evenodd"
                        />
                      </svg>
                      Focus on main ideas, key points, and essential information
                    </p>
                    {task.task_data?.max_length &&
                      summary.split(/\s+/).filter(Boolean).length >
                        task.task_data.max_length && (
                        <p className="text-xs text-red-600 font-semibold flex items-center gap-1">
                          <svg
                            className="w-3.5 h-3.5"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                              clipRule="evenodd"
                            />
                          </svg>
                          Summary exceeds maximum word limit
                        </p>
                      )}
                  </div>
                </div>

                {/* Summary Quality Tips */}
                <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
                  <div className="flex items-start gap-2">
                    <svg
                      className="w-5 h-5 text-blue-600 flex-shrink-0"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    <div className="flex-1">
                      <p className="text-sm font-bold text-blue-900 mb-2">
                        Quality Summary Tips
                      </p>
                      <ul className="text-xs text-blue-800 space-y-1">
                        <li>• Include only the most important information</li>
                        <li>• Use your own words (don't copy verbatim)</li>
                        <li>• Maintain objectivity and neutrality</li>
                        <li>• Ensure coherence and logical flow</li>
                        <li>• Remove redundant details and examples</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* QA Evaluation */}
            {task?.category === "qa_evaluation" && (
              <div className="space-y-6">
                {/* Progress Summary */}
                <div className="bg-teal-50 border-2 border-teal-300 rounded-lg p-4 flex flex-col gap-3">
                  {(() => {
                    const total = task.task_data?.qa_pairs?.length || 0;
                    const completed = qaEvaluations.filter(
                      (e) => e && e.accuracy && e.relevance && e.completeness
                    ).length;
                    const pct =
                      total === 0 ? 0 : Math.round((completed / total) * 100);
                    return (
                      <>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <svg
                              className="w-5 h-5 text-teal-600"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 001 1h2a1 1 0 100-2h-1V6z"
                                clipRule="evenodd"
                              />
                            </svg>
                            <h3 className="text-sm font-bold text-teal-900 uppercase tracking-wide">
                              Evaluation Progress
                            </h3>
                          </div>
                          <span className="text-xs font-semibold text-teal-800 bg-teal-100 px-2 py-0.5 rounded-full">
                            {completed}/{total} Completed
                          </span>
                        </div>
                        <div className="w-full h-3 bg-white border-2 border-teal-200 rounded-md overflow-hidden">
                          <div
                            className="h-full bg-teal-500 transition-all"
                            style={{ width: pct + "%" }}
                          />
                        </div>
                        <p className="text-xs text-teal-700 flex items-center gap-1">
                          <svg
                            className="w-3.5 h-3.5"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                              clipRule="evenodd"
                            />
                          </svg>
                          Rate Accuracy, Relevance, and Completeness for each
                          answer.
                        </p>
                      </>
                    );
                  })()}
                </div>

                {/* Context */}
                {task.task_data?.context && (
                  <div className="bg-white border-2 border-teal-300 rounded-lg p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <svg
                        className="w-5 h-5 text-teal-600"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <h3 className="text-sm font-bold text-teal-900 uppercase tracking-wide">
                        Context / Background
                      </h3>
                    </div>
                    <div className="bg-teal-50 border-2 border-teal-200 rounded-lg p-4 max-h-56 overflow-auto">
                      <p className="text-sm text-teal-900 leading-relaxed whitespace-pre-wrap">
                        {task.task_data.context}
                      </p>
                    </div>
                  </div>
                )}

                {/* Guidelines */}
                <div className="bg-teal-50 border-2 border-teal-200 rounded-lg p-4">
                  <div className="flex items-start gap-2">
                    <svg
                      className="w-5 h-5 text-teal-600 flex-shrink-0"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    <div className="flex-1">
                      <p className="text-sm font-bold text-teal-900 mb-2">
                        Evaluation Guidelines
                      </p>
                      <ul className="text-xs text-teal-800 space-y-1">
                        <li>• Accuracy: factual correctness & precision</li>
                        <li>• Relevance: directly answers the question</li>
                        <li>• Completeness: covers all key aspects</li>
                        <li>• Use Low / Medium / High or numeric (1–10)</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Q&A Pairs */}
                {task.task_data?.qa_pairs?.map((pair: any, index: number) => {
                  const current = qaEvaluations[index] || {
                    accuracy: "",
                    relevance: "",
                    completeness: "",
                  };
                  const setValue = (
                    field: "accuracy" | "relevance" | "completeness",
                    value: string
                  ) => {
                    const newEvals = [...qaEvaluations];
                    newEvals[index] = { ...current, [field]: value };
                    setQaEvaluations(newEvals);
                  };
                  const levelButtons = ["Low", "Medium", "High"];
                  const sliderValue = (val: string) => {
                    if (/^\d+$/.test(val)) return parseInt(val, 10);
                    if (val === "Low") return 3;
                    if (val === "Medium") return 6;
                    if (val === "High") return 9;
                    return 0;
                  };
                  return (
                    <div
                      key={index}
                      className="bg-white border-2 border-gray-300 rounded-lg p-5 space-y-5"
                    >
                      <div className="flex items-center justify-between pb-3 border-b-2 border-gray-200">
                        <div className="flex items-center gap-2">
                          <div className="bg-teal-600 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
                            {index + 1}
                          </div>
                          <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide">
                            Q&A Pair #{index + 1}
                          </h3>
                        </div>
                        <span
                          className={
                            "text-xs px-2 py-0.5 rounded-full font-semibold " +
                            (current.accuracy &&
                            current.relevance &&
                            current.completeness
                              ? "bg-green-100 text-green-700 border border-green-300"
                              : "bg-yellow-100 text-yellow-700 border border-yellow-300")
                          }
                        >
                          {current.accuracy &&
                          current.relevance &&
                          current.completeness
                            ? "Done"
                            : "Pending"}
                        </span>
                      </div>

                      {/* Question */}
                      <div className="bg-gray-50 border-2 border-gray-200 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <svg
                            className="w-4 h-4 text-teal-600"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z"
                              clipRule="evenodd"
                            />
                          </svg>
                          <p className="text-xs font-bold text-gray-700 uppercase tracking-wide">
                            Question
                          </p>
                        </div>
                        <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">
                          {pair.question}
                        </p>
                      </div>

                      {/* Answer */}
                      <div className="bg-teal-50 border-2 border-teal-200 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <svg
                            className="w-4 h-4 text-teal-600"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M18 13V5a2 2 0 00-2-2H4a2 2 0 00-2 2v8a2 2 0 002 2h3l3 3 3-3h3a2 2 0 002-2zM5 7a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1zm1 3a1 1 0 100 2h3a1 1 0 100-2H6z"
                              clipRule="evenodd"
                            />
                          </svg>
                          <p className="text-xs font-bold text-teal-900 uppercase tracking-wide">
                            Answer to Evaluate
                          </p>
                        </div>
                        <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">
                          {pair.answer}
                        </p>
                      </div>

                      {pair.reference_answer && (
                        <div className="bg-green-50 border-2 border-green-200 rounded-lg p-3">
                          <div className="flex items-start gap-2">
                            <svg
                              className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                clipRule="evenodd"
                              />
                            </svg>
                            <div className="flex-1">
                              <p className="text-xs font-bold text-green-900 mb-1">
                                Reference Answer
                              </p>
                              <p className="text-xs text-green-800 whitespace-pre-wrap">
                                {pair.reference_answer}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Evaluation Controls */}
                      <div className="grid gap-6 md:grid-cols-3 pt-2">
                        {(
                          ["accuracy", "relevance", "completeness"] as const
                        ).map((field) => (
                          <div key={field} className="space-y-2">
                            <label className="text-xs font-bold text-gray-700 uppercase tracking-wide flex items-center gap-1">
                              <svg
                                className="w-4 h-4 text-teal-600"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                  clipRule="evenodd"
                                />
                              </svg>
                              {field.charAt(0).toUpperCase() + field.slice(1)}
                              <span className="text-red-500">*</span>
                            </label>
                            <div className="flex gap-2">
                              {levelButtons.map((lvl) => {
                                const selected = current[field] === lvl;
                                return (
                                  <button
                                    type="button"
                                    key={lvl}
                                    onClick={() => setValue(field, lvl)}
                                    className={
                                      "flex-1 text-xs font-semibold px-2 py-1 rounded-md border-2 transition-all " +
                                      (selected
                                        ? "border-teal-600 bg-teal-600 text-white"
                                        : "border-gray-300 bg-white hover:border-teal-400")
                                    }
                                  >
                                    {lvl}
                                  </button>
                                );
                              })}
                            </div>
                            <div className="flex items-center gap-2">
                              <input
                                type="range"
                                min={1}
                                max={10}
                                value={sliderValue(current[field])}
                                onChange={(e) =>
                                  setValue(field, e.target.value)
                                }
                                className="w-full accent-teal-600"
                              />
                              <span className="text-xs font-mono w-7 text-center border-2 border-teal-300 rounded-md bg-teal-50 text-teal-700">
                                {sliderValue(current[field]) || "-"}
                              </span>
                            </div>
                            <p className="text-[10px] text-gray-500">
                              Choose a level or adjust numeric score (1–10).
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* LLM Response Grading */}
            {task?.category === "generative_ai_llm_response_grading" && (
              <div className="space-y-6">
                {/* Source Document Section */}
                <div className="bg-white border-2 border-gray-300 rounded-lg p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <svg
                      className="w-5 h-5 text-indigo-600"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide">
                      Source Document
                    </h3>
                  </div>
                  <div className="bg-gray-50 border-2 border-gray-200 rounded-lg p-4 max-h-80 overflow-y-auto">
                    {Array.isArray(task.task_data?.document) ? (
                      <div className="space-y-3">
                        {task.task_data.document.map(
                          (para: string, idx: number) => (
                            <p
                              key={idx}
                              className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap"
                            >
                              {para}
                            </p>
                          )
                        )}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">
                        {task.task_data?.document || "No document provided"}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <svg
                        className="w-3.5 h-3.5"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                          clipRule="evenodd"
                        />
                      </svg>
                      Original source text
                    </span>
                    <span>
                      {Array.isArray(task.task_data?.document)
                        ? `${task.task_data.document.length} paragraphs`
                        : `${task.task_data?.document?.length || 0} characters`}
                    </span>
                  </div>
                </div>

                {/* AI-Generated Summary Section */}
                <div className="bg-white border-2 border-gray-300 rounded-lg p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <svg
                      className="w-5 h-5 text-indigo-600"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                      <path
                        fillRule="evenodd"
                        d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide">
                      AI-Generated Summary
                    </h3>
                  </div>
                  <div className="bg-indigo-50 border-2 border-indigo-200 rounded-lg p-4 max-h-60 overflow-y-auto">
                    <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">
                      {task.task_data?.summary || "No summary provided"}
                    </p>
                  </div>
                  <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <svg
                        className="w-3.5 h-3.5"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M13 7H7v6h6V7z" />
                        <path
                          fillRule="evenodd"
                          d="M7 2a1 1 0 012 0v1h2V2a1 1 0 112 0v1h2a2 2 0 012 2v2h1a1 1 0 110 2h-1v2h1a1 1 0 110 2h-1v2a2 2 0 01-2 2h-2v1a1 1 0 11-2 0v-1H9v1a1 1 0 11-2 0v-1H5a2 2 0 01-2-2v-2H2a1 1 0 110-2h1V9H2a1 1 0 010-2h1V5a2 2 0 012-2h2V2zM5 5h10v10H5V5z"
                          clipRule="evenodd"
                        />
                      </svg>
                      {task.task_data?.model_name || "Model not specified"}
                    </span>
                    <span>
                      {task.task_data?.summary?.length || 0} characters
                    </span>
                  </div>
                </div>

                {/* Optional Context */}
                {task.task_data?.prompt && (
                  <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
                    <div className="flex items-start gap-2">
                      <svg
                        className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <div className="flex-1">
                        <p className="text-xs font-bold text-blue-900 mb-1">
                          Prompt Used
                        </p>
                        <p className="text-xs text-blue-800 italic">
                          {task.task_data.prompt}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Grading Instructions */}
                <div className="bg-indigo-50 border-2 border-indigo-200 rounded-lg p-4">
                  <div className="flex items-start gap-2">
                    <svg
                      className="w-5 h-5 text-indigo-600 flex-shrink-0"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    <div className="flex-1">
                      <p className="text-sm font-bold text-indigo-900 mb-2">
                        Grading Guidelines
                      </p>
                      <ul className="text-xs text-indigo-800 space-y-1">
                        <li>
                          • Compare the summary against the source document
                        </li>
                        <li>
                          • Check for accuracy, completeness, and coherence
                        </li>
                        <li>
                          • Grade using A-F scale or 1-10 rating based on
                          quality
                        </li>
                        <li>• Provide detailed reasoning for your grade</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Grade Input */}
                <div className="bg-white border-2 border-indigo-400 rounded-lg p-5">
                  <label className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-3 flex items-center gap-2">
                    <svg
                      className="w-5 h-5 text-indigo-600"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    Grade
                    <span className="text-xs text-red-500 ml-1">*</span>
                  </label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 text-base border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all bg-white"
                    value={grade}
                    onChange={(e) => setGrade(e.target.value)}
                    placeholder="Enter grade (e.g., A, B+, C, or 8/10, 7.5/10)"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                    <svg
                      className="w-3.5 h-3.5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Use letter grades (A-F) or numeric scores (1-10)
                  </p>
                </div>

                {/* Reasoning Input */}
                <div className="bg-white border-2 border-indigo-400 rounded-lg p-5">
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-sm font-bold text-gray-900 uppercase tracking-wide flex items-center gap-2">
                      <svg
                        className="w-5 h-5 text-indigo-600"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M18 13V5a2 2 0 00-2-2H4a2 2 0 00-2 2v8a2 2 0 002 2h3l3 3 3-3h3a2 2 0 002-2zM5 7a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1zm1 3a1 1 0 100 2h3a1 1 0 100-2H6z"
                          clipRule="evenodd"
                        />
                      </svg>
                      Reasoning
                      <span className="text-xs text-red-500 ml-1">*</span>
                    </label>
                    <span className="text-xs text-gray-500">
                      {reasoning.length} characters
                    </span>
                  </div>
                  <textarea
                    className="w-full px-4 py-3 text-base border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all bg-white resize-none"
                    rows={6}
                    value={reasoning}
                    onChange={(e) => setReasoning(e.target.value)}
                    placeholder="Explain your grade in detail. Consider:&#10;• Accuracy: Does the summary correctly represent the source?&#10;• Completeness: Are key points covered?&#10;• Coherence: Is the summary well-structured and clear?&#10;• Conciseness: Is it appropriately condensed?"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                    <svg
                      className="w-3.5 h-3.5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Provide detailed justification for your grade
                  </p>
                </div>
              </div>
            )}

            {/* Chatbot Assessment */}
            {task?.category === "generative_ai_chatbot_assessment" && (
              <div className="space-y-6">
                {/* Conversation Preview */}
                {Array.isArray(task.task_data?.chat_messages) &&
                  task.task_data.chat_messages.length > 0 && (
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <label className="label m-0">
                          💬 Conversation Preview
                        </label>
                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                          {task.task_data.chat_messages.length} messages
                        </span>
                      </div>
                      <div className="rounded-lg border border-gray-200 bg-gradient-to-br from-gray-50 to-white shadow-sm max-h-96 overflow-auto divide-y divide-gray-100">
                        {task.task_data.chat_messages.map(
                          (msg: any, idx: number) => (
                            <div
                              key={idx}
                              className="p-4 flex gap-3 hover:bg-blue-50/30 transition-all duration-150"
                            >
                              <div className="flex-shrink-0">
                                <span
                                  className={`inline-flex items-center justify-center px-2.5 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wide shadow-sm ${
                                    msg.role === "assistant"
                                      ? "bg-gradient-to-br from-purple-500 to-purple-600 text-white"
                                      : msg.role === "user"
                                      ? "bg-gradient-to-br from-blue-500 to-blue-600 text-white"
                                      : "bg-gray-300 text-gray-700"
                                  }`}
                                >
                                  {msg.role}
                                </span>
                                <div className="text-[10px] text-center text-gray-400 mt-1.5 font-mono font-semibold">
                                  #{idx + 1}
                                </div>
                              </div>
                              <div className="flex-1">
                                <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">
                                  {msg.content || (
                                    <span className="text-gray-400 italic">
                                      (empty message)
                                    </span>
                                  )}
                                </p>
                              </div>
                            </div>
                          )
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-2 italic flex items-center gap-1">
                        <svg
                          className="w-3.5 h-3.5"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                            clipRule="evenodd"
                          />
                        </svg>
                        Review the conversation flow and tone before scoring.
                        First user message may include system instructions.
                      </p>
                    </div>
                  )}

                {/* Coherence Rating */}
                <div className="space-y-3">
                  <label className="label mb-0 flex items-center gap-2">
                    <span>🧩 Coherence</span>
                    <span className="text-xs text-gray-500 font-normal">
                      (logical flow & consistency)
                    </span>
                  </label>
                  <div
                    className="flex flex-wrap gap-2"
                    role="group"
                    aria-label="Select coherence level"
                  >
                    {[
                      { label: "Very Low", color: "red" },
                      { label: "Low", color: "orange" },
                      { label: "Medium", color: "yellow" },
                      { label: "High", color: "green" },
                      { label: "Excellent", color: "emerald" },
                    ].map((opt) => (
                      <button
                        type="button"
                        key={opt.label}
                        onClick={() => setCoherence(opt.label)}
                        className={`px-4 py-2 rounded-lg text-sm font-semibold border-2 transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 ${
                          coherence === opt.label
                            ? `bg-${opt.color}-100 text-${opt.color}-800 border-${opt.color}-500 shadow-md scale-105`
                            : "bg-white text-gray-700 border-gray-300 hover:border-gray-400 hover:bg-gray-50"
                        }`}
                        style={
                          coherence === opt.label
                            ? {
                                backgroundColor:
                                  opt.color === "red"
                                    ? "#fee"
                                    : opt.color === "orange"
                                    ? "#fed"
                                    : opt.color === "yellow"
                                    ? "#ffc"
                                    : opt.color === "green"
                                    ? "#dfd"
                                    : "#dff",
                                borderColor:
                                  opt.color === "red"
                                    ? "#f66"
                                    : opt.color === "orange"
                                    ? "#fa0"
                                    : opt.color === "yellow"
                                    ? "#fc0"
                                    : opt.color === "green"
                                    ? "#6c6"
                                    : "#6cc",
                                color:
                                  opt.color === "red"
                                    ? "#600"
                                    : opt.color === "orange"
                                    ? "#860"
                                    : opt.color === "yellow"
                                    ? "#860"
                                    : opt.color === "green"
                                    ? "#060"
                                    : "#066",
                              }
                            : {}
                        }
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                  <input
                    aria-label="Custom coherence value"
                    type="text"
                    className="input w-full"
                    value={coherence}
                    onChange={(e) => setCoherence(e.target.value)}
                    placeholder="Or enter a custom score (e.g., 7/10, 85%)"
                    required
                  />
                </div>

                {/* Helpfulness Rating */}
                <div className="space-y-3">
                  <label className="label mb-0 flex items-center gap-2">
                    <span>💡 Helpfulness</span>
                    <span className="text-xs text-gray-500 font-normal">
                      (value & usefulness to user)
                    </span>
                  </label>
                  <div
                    className="flex flex-wrap gap-2"
                    role="group"
                    aria-label="Select helpfulness level"
                  >
                    {[
                      { label: "Very Low", color: "red" },
                      { label: "Low", color: "orange" },
                      { label: "Medium", color: "yellow" },
                      { label: "High", color: "green" },
                      { label: "Excellent", color: "emerald" },
                    ].map((opt) => (
                      <button
                        type="button"
                        key={opt.label}
                        onClick={() => setHelpfulness(opt.label)}
                        className={`px-4 py-2 rounded-lg text-sm font-semibold border-2 transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 ${
                          helpfulness === opt.label
                            ? `bg-${opt.color}-100 text-${opt.color}-800 border-${opt.color}-500 shadow-md scale-105`
                            : "bg-white text-gray-700 border-gray-300 hover:border-gray-400 hover:bg-gray-50"
                        }`}
                        style={
                          helpfulness === opt.label
                            ? {
                                backgroundColor:
                                  opt.color === "red"
                                    ? "#fee"
                                    : opt.color === "orange"
                                    ? "#fed"
                                    : opt.color === "yellow"
                                    ? "#ffc"
                                    : opt.color === "green"
                                    ? "#dfd"
                                    : "#dff",
                                borderColor:
                                  opt.color === "red"
                                    ? "#f66"
                                    : opt.color === "orange"
                                    ? "#fa0"
                                    : opt.color === "yellow"
                                    ? "#fc0"
                                    : opt.color === "green"
                                    ? "#6c6"
                                    : "#6cc",
                                color:
                                  opt.color === "red"
                                    ? "#600"
                                    : opt.color === "orange"
                                    ? "#860"
                                    : opt.color === "yellow"
                                    ? "#860"
                                    : opt.color === "green"
                                    ? "#060"
                                    : "#066",
                              }
                            : {}
                        }
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                  <input
                    aria-label="Custom helpfulness value"
                    type="text"
                    className="input w-full"
                    value={helpfulness}
                    onChange={(e) => setHelpfulness(e.target.value)}
                    placeholder="Or enter a custom score (e.g., 8/10, 90%)"
                    required
                  />
                </div>
              </div>
            )}

            {/* Response Selection */}
            {task?.category === "conversational_ai_response_selection" && (
              <div className="space-y-6">
                {/* Dialogue Context */}
                {Array.isArray(task.task_data?.dialogue) &&
                  task.task_data.dialogue.length > 0 && (
                    <div className="bg-white border-2 border-gray-300 rounded-lg p-5">
                      <div className="flex items-center gap-2 mb-3">
                        <svg
                          className="w-5 h-5 text-purple-600"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M18 13V5a2 2 0 00-2-2H4a2 2 0 00-2 2v8a2 2 0 002 2h3l3 3 3-3h3a2 2 0 002-2zM5 7a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1zm1 3a1 1 0 100 2h3a1 1 0 100-2H6z"
                            clipRule="evenodd"
                          />
                        </svg>
                        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide">
                          Dialogue Context
                        </h3>
                        <span className="text-xs bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full font-semibold">
                          {task.task_data.dialogue.length} turns
                        </span>
                      </div>
                      <div className="max-h-64 overflow-auto space-y-3 pr-1">
                        {task.task_data.dialogue.map(
                          (msg: any, idx: number) => (
                            <div key={idx} className="flex gap-3 items-start">
                              <div
                                className={
                                  "text-xs font-semibold px-2 py-1 rounded-md border-2 " +
                                  (msg.role === "user"
                                    ? "border-gray-300 bg-gray-100 text-gray-800"
                                    : "border-purple-300 bg-purple-50 text-purple-700")
                                }
                              >
                                {msg.role === "assistant"
                                  ? "Assistant"
                                  : "User"}
                              </div>
                              <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap flex-1">
                                {msg.content}
                              </p>
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  )}

                {/* Response Options */}
                {Array.isArray(task.task_data?.response_options) &&
                  task.task_data.response_options.length > 0 && (
                    <div className="bg-white border-2 border-gray-300 rounded-lg p-5">
                      <div className="flex items-center gap-2 mb-3">
                        <svg
                          className="w-5 h-5 text-purple-600"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M3 5a2 2 0 012-2h10a2 2 0 012 2v6a2 2 0 01-2 2H9l-4 4v-4H5a2 2 0 01-2-2V5zm3 2a1 1 0 000 2h6a1 1 0 100-2H6z"
                            clipRule="evenodd"
                          />
                        </svg>
                        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide">
                          Response Options
                        </h3>
                        <span className="text-xs bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full font-semibold">
                          Select One
                        </span>
                      </div>
                      <div className="grid gap-4 sm:grid-cols-2">
                        {task.task_data.response_options.map(
                          (opt: string, idx: number) => {
                            const selected = selectedResponse === opt;
                            return (
                              <button
                                type="button"
                                key={idx}
                                onClick={() => setSelectedResponse(opt)}
                                className={
                                  "text-left group relative rounded-lg border-2 p-4 transition-all focus:outline-none " +
                                  (selected
                                    ? "border-purple-600 bg-purple-50 shadow-md"
                                    : "border-gray-300 bg-white hover:border-purple-400 hover:shadow-sm")
                                }
                              >
                                <div className="flex items-start gap-2">
                                  <div
                                    className={
                                      "w-5 h-5 flex items-center justify-center rounded-md text-xs font-bold border-2 " +
                                      (selected
                                        ? "border-purple-600 bg-purple-600 text-white"
                                        : "border-gray-300 bg-gray-100 text-gray-600")
                                    }
                                  >
                                    {idx + 1}
                                  </div>
                                  <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed flex-1">
                                    {opt}
                                  </p>
                                </div>
                                {selected && (
                                  <div className="absolute top-2 right-2">
                                    <svg
                                      className="w-5 h-5 text-purple-600"
                                      fill="currentColor"
                                      viewBox="0 0 20 20"
                                    >
                                      <path
                                        fillRule="evenodd"
                                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                        clipRule="evenodd"
                                      />
                                    </svg>
                                  </div>
                                )}
                              </button>
                            );
                          }
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-3 flex items-center gap-1">
                        <svg
                          className="w-3.5 h-3.5"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                            clipRule="evenodd"
                          />
                        </svg>
                        Click a card to select the best response.
                      </p>
                    </div>
                  )}

                {/* Selection Summary */}
                <div className="bg-purple-50 border-2 border-purple-200 rounded-lg p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <svg
                      className="w-5 h-5 text-purple-600"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M10 3a1 1 0 01.894.553L11.618 5H15a1 1 0 010 2h-.382l-.724 1.447A1 1 0 0112 9h-.277a2 2 0 010 4H13a1 1 0 010 2h-1a2 2 0 01-2 2 2 2 0 01-2-2H7a1 1 0 010-2h1.277a2 2 0 010-4H8a1 1 0 01-.894-1.447L6.382 7H5a1 1 0 110-2h3.382l.724-1.447A1 1 0 0110 3z" />
                    </svg>
                    <h3 className="text-sm font-bold text-purple-900 uppercase tracking-wide">
                      Selection Details
                    </h3>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="text-xs font-bold text-gray-700 uppercase tracking-wide mb-2 flex items-center gap-1">
                        Selected Response<span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        className="w-full px-3 py-2 text-sm border-2 border-purple-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white"
                        value={selectedResponse}
                        onChange={(e) => setSelectedResponse(e.target.value)}
                        placeholder="If you manually edit, ensure it matches an option"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-gray-700 uppercase tracking-wide mb-2 flex items-center gap-1">
                        Selection Reason<span className="text-red-500">*</span>
                      </label>
                      <textarea
                        className="w-full px-3 py-2 text-sm border-2 border-purple-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white resize-none h-28"
                        value={selectionReason}
                        onChange={(e) => setSelectionReason(e.target.value)}
                        placeholder="Explain why this response is superior (clarity, relevance, completeness, tone, etc.)"
                        required
                      />
                      <p className="text-xs text-purple-700 mt-2 flex items-center gap-1">
                        <svg
                          className="w-3.5 h-3.5"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                            clipRule="evenodd"
                          />
                        </svg>
                        Provide objective reasoning; avoid subjective preference
                        only.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Common fields for all categories */}
            <div className="border-t pt-4">
              <h3 className="font-medium mb-3 text-sm text-gray-700">
                Additional Information
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="label">Confidence Score</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="1"
                    className="input"
                    value={confidence}
                    onChange={(e) => setConfidence(e.target.value)}
                    placeholder="0.95"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Value between 0 and 1
                  </p>
                </div>
                <div>
                  <label className="label">Notes (optional)</label>
                  <textarea
                    className="textarea h-20"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Any additional notes or observations"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-lg font-bold text-white shadow-md hover:shadow-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transform hover:scale-[1.02] active:scale-[0.98]"
              style={{ backgroundColor: "#7a1cac" }}
            >
              📤 Send to QA
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
