import { FormEvent, useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { apiFetch } from "@/api/client";
import { Task } from "@/types";

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

  // Image Classification
  const [predictedClass, setPredictedClass] = useState("");

  // Object Detection
  const [objects, setObjects] = useState("");

  // Object Detection form fields
  interface DetectedObject {
    class: string;
    bbox: number[];
    confidence: number;
  }
  const [detectedObjects, setDetectedObjects] = useState<DetectedObject[]>([]);
  const [currentObjClass, setCurrentObjClass] = useState("");
  const [currentBboxX, setCurrentBboxX] = useState("");
  const [currentBboxY, setCurrentBboxY] = useState("");
  const [currentBboxW, setCurrentBboxW] = useState("");
  const [currentBboxH, setCurrentBboxH] = useState("");
  const [currentObjConfidence, setCurrentObjConfidence] = useState("0.95");

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

  // QA Evaluation
  const [accuracy, setAccuracy] = useState("");
  const [relevance, setRelevance] = useState("");
  const [completeness, setCompleteness] = useState("");

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

        // If task has existing annotation (returned task), populate the form fields
        if (taskData.annotation) {
          const ann = taskData.annotation;

          // Common fields
          if (ann.confidence !== undefined)
            setConfidence(String(ann.confidence));
          if (ann.notes) setNotes(ann.notes);

          // Category-specific fields
          switch (taskData.category) {
            case "text_classification":
              if (ann.label) setLabel(ann.label);
              if (ann.category) setCategory(ann.category);
              break;
            case "image_classification":
              if (ann.predicted_class) setPredictedClass(ann.predicted_class);
              break;
            case "object_detection":
              if (ann.objects) setObjects(JSON.stringify(ann.objects, null, 2));
              if (ann.objects && Array.isArray(ann.objects)) {
                setDetectedObjects(ann.objects);
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
            case "qa_evaluation":
              if (ann.accuracy) setAccuracy(ann.accuracy);
              if (ann.relevance) setRelevance(ann.relevance);
              if (ann.completeness) setCompleteness(ann.completeness);
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
      case "text_classification":
        annotationData.label = label;
        annotationData.category = category;
        break;
      case "image_classification":
        annotationData.predicted_class = predictedClass;
        break;
      case "object_detection":
        annotationData.objects = detectedObjects;
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
        annotationData.accuracy = accuracy;
        annotationData.relevance = relevance;
        annotationData.completeness = completeness;
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

      {/* Return Reason Alert */}
      {task?.is_returned && task?.return_reason && (
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
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-amber-800 mb-2">
                📥 Task Returned for Revision
              </h3>
              <p className="text-sm font-medium text-amber-700 mb-1">
                Reason from QA Reviewer:
              </p>
              <div className="bg-white border border-amber-200 rounded-lg p-3 mt-2">
                <p className="text-sm text-gray-800 whitespace-pre-wrap">
                  {task.return_reason}
                </p>
              </div>
              <p className="text-xs text-amber-600 mt-3">
                💡 Please address the feedback above and resubmit your
                annotation.
              </p>
            </div>
          </div>
        </div>
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
            {task?.category === "text_classification" && (
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
            )}

            {/* Image Classification */}
            {task?.category === "image_classification" && (
              <div>
                <label className="label">Predicted Class</label>
                <input
                  type="text"
                  className="input"
                  value={predictedClass}
                  onChange={(e) => setPredictedClass(e.target.value)}
                  placeholder="Enter predicted class"
                  required
                />
              </div>
            )}

            {/* Object Detection */}
            {task?.category === "object_detection" && (
              <div className="space-y-4">
                <div>
                  <label className="label">Detected Objects</label>

                  {/* List of added objects */}
                  {detectedObjects.length > 0 && (
                    <div className="mb-4 space-y-2">
                      <p className="text-sm font-medium text-gray-700">
                        Added Objects ({detectedObjects.length}):
                      </p>
                      {detectedObjects.map((obj, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-md"
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium text-gray-800">
                                {obj.class}
                              </span>
                              <span className="badge badge-primary text-xs">
                                Confidence: {(obj.confidence * 100).toFixed(0)}%
                              </span>
                            </div>
                            <div className="text-xs text-gray-600">
                              BBox: [{obj.bbox.join(", ")}]
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setDetectedObjects((prev) =>
                                prev.filter((_, i) => i !== idx)
                              );
                            }}
                            className="btn btn-ghost btn-sm text-red-600"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Add new object form */}
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-md space-y-3">
                    <p className="text-sm font-semibold text-blue-800 mb-2">
                      Add New Object:
                    </p>

                    <div>
                      <label className="label text-xs">Object Class</label>
                      <input
                        type="text"
                        className="input input-sm"
                        value={currentObjClass}
                        onChange={(e) => setCurrentObjClass(e.target.value)}
                        placeholder="e.g., car, person, dog"
                      />
                    </div>

                    <div className="grid grid-cols-4 gap-2">
                      <div>
                        <label className="label text-xs">X</label>
                        <input
                          type="number"
                          className="input input-sm"
                          value={currentBboxX}
                          onChange={(e) => setCurrentBboxX(e.target.value)}
                          placeholder="X"
                        />
                      </div>
                      <div>
                        <label className="label text-xs">Y</label>
                        <input
                          type="number"
                          className="input input-sm"
                          value={currentBboxY}
                          onChange={(e) => setCurrentBboxY(e.target.value)}
                          placeholder="Y"
                        />
                      </div>
                      <div>
                        <label className="label text-xs">Width</label>
                        <input
                          type="number"
                          className="input input-sm"
                          value={currentBboxW}
                          onChange={(e) => setCurrentBboxW(e.target.value)}
                          placeholder="W"
                        />
                      </div>
                      <div>
                        <label className="label text-xs">Height</label>
                        <input
                          type="number"
                          className="input input-sm"
                          value={currentBboxH}
                          onChange={(e) => setCurrentBboxH(e.target.value)}
                          placeholder="H"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="label text-xs">
                        Confidence (0.0 - 1.0)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        max="1"
                        className="input input-sm"
                        value={currentObjConfidence}
                        onChange={(e) =>
                          setCurrentObjConfidence(e.target.value)
                        }
                        placeholder="0.95"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        if (!currentObjClass.trim()) {
                          alert("Please enter an object class");
                          return;
                        }
                        if (
                          !currentBboxX ||
                          !currentBboxY ||
                          !currentBboxW ||
                          !currentBboxH
                        ) {
                          alert("Please enter all bounding box values");
                          return;
                        }

                        const newObject: DetectedObject = {
                          class: currentObjClass.trim(),
                          bbox: [
                            parseFloat(currentBboxX),
                            parseFloat(currentBboxY),
                            parseFloat(currentBboxW),
                            parseFloat(currentBboxH),
                          ],
                          confidence: parseFloat(currentObjConfidence) || 0.95,
                        };

                        setDetectedObjects((prev) => [...prev, newObject]);
                        setCurrentObjClass("");
                        setCurrentBboxX("");
                        setCurrentBboxY("");
                        setCurrentBboxW("");
                        setCurrentBboxH("");
                        setCurrentObjConfidence("0.95");
                      }}
                      className="btn btn-primary btn-sm w-full"
                    >
                      ➕ Add Object
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Named Entity Recognition */}
            {task?.category === "named_entity_recognition" && (
              <div className="space-y-4">
                <div>
                  <label className="label">Entities</label>

                  {/* Display the text to annotate */}
                  {task.task_data?.text && (
                    <div className="mb-4 p-4 bg-white border border-gray-300 rounded-lg">
                      <p className="text-xs font-semibold text-gray-600 mb-2">
                        Text to Annotate:
                      </p>
                      <div className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap select-text">
                        {task.task_data.text}
                      </div>
                      <p className="text-xs text-gray-500 mt-2 italic">
                        💡 Tip: Select text above to help identify start/end
                        positions
                      </p>
                    </div>
                  )}

                  {/* Display available entity types */}
                  {task.task_data?.entity_types && (
                    <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-md">
                      <p className="text-xs font-semibold text-blue-800 mb-1">
                        Available Entity Types:
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {task.task_data.entity_types.map((type: string) => (
                          <span
                            key={type}
                            className="badge badge-primary text-xs"
                          >
                            {type}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* List of added entities */}
                  {nerEntities.length > 0 && (
                    <div className="mb-4 space-y-2">
                      <p className="text-sm font-medium text-gray-700">
                        Added Entities ({nerEntities.length}):
                      </p>
                      {nerEntities.map((entity, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-md"
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium text-gray-800">
                                "{entity.entity}"
                              </span>
                              <span className="badge badge-primary text-xs">
                                {entity.type}
                              </span>
                            </div>
                            <p className="text-xs text-gray-500">
                              Position: {entity.start} - {entity.end}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setNerEntities(
                                nerEntities.filter((_, i) => i !== idx)
                              );
                            }}
                            className="text-red-600 hover:text-red-800 text-sm font-medium ml-3"
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Add new entity form */}
                  <div className="border border-gray-300 rounded-lg p-4 bg-gray-50 space-y-3">
                    <p className="text-sm font-medium text-gray-700">
                      Add New Entity
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="label text-xs">Entity Text</label>
                        <input
                          type="text"
                          className="input text-sm"
                          value={currentEntity}
                          onChange={(e) => {
                            const val = e.target.value;
                            setCurrentEntity(val);

                            // Auto-calculate positions if text is provided and we have the source text
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
                          placeholder="e.g., John Doe"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Type the entity text - positions will auto-calculate
                          if found
                        </p>
                      </div>

                      <div>
                        <label className="label text-xs">Entity Type</label>
                        {task.task_data?.entity_types ? (
                          <select
                            className="select text-sm"
                            value={currentEntityType}
                            onChange={(e) =>
                              setCurrentEntityType(e.target.value)
                            }
                          >
                            <option value="">Select type</option>
                            {task.task_data.entity_types.map((type: string) => (
                              <option key={type} value={type}>
                                {type}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <input
                            type="text"
                            className="input text-sm"
                            value={currentEntityType}
                            onChange={(e) =>
                              setCurrentEntityType(e.target.value)
                            }
                            placeholder="e.g., PERSON, ORG, LOC"
                          />
                        )}
                      </div>

                      <div>
                        <label className="label text-xs">Start Position</label>
                        <input
                          type="number"
                          className="input text-sm"
                          value={currentStart}
                          onChange={(e) => setCurrentStart(e.target.value)}
                          placeholder="0"
                          min="0"
                        />
                      </div>

                      <div>
                        <label className="label text-xs">End Position</label>
                        <input
                          type="number"
                          className="input text-sm"
                          value={currentEnd}
                          onChange={(e) => setCurrentEnd(e.target.value)}
                          placeholder="8"
                          min="0"
                        />
                      </div>
                    </div>

                    {/* Preview of the entity in context */}
                    {currentEntity &&
                      currentStart &&
                      currentEnd &&
                      task.task_data?.text && (
                        <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                          <p className="text-xs font-semibold text-green-800 mb-1">
                            Preview:
                          </p>
                          <p className="text-sm text-gray-700">
                            {(() => {
                              const start = parseInt(currentStart);
                              const end = parseInt(currentEnd);
                              const text = task.task_data.text;
                              const before = text.substring(
                                Math.max(0, start - 20),
                                start
                              );
                              const entity = text.substring(start, end);
                              const after = text.substring(
                                end,
                                Math.min(text.length, end + 20)
                              );
                              return (
                                <>
                                  {before && (
                                    <span className="text-gray-500">
                                      ...{before}
                                    </span>
                                  )}
                                  <span className="font-bold bg-yellow-200 px-1">
                                    {entity}
                                  </span>
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
                      )}

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

                        // Clear form
                        setCurrentEntity("");
                        setCurrentEntityType("");
                        setCurrentStart("");
                        setCurrentEnd("");
                      }}
                      className="btn btn-secondary w-full text-sm"
                    >
                      + Add Entity
                    </button>
                  </div>

                  {nerEntities.length === 0 && (
                    <p className="text-xs text-amber-600 mt-2">
                      ⚠️ You must add at least one entity before submitting
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Sentiment Analysis */}
            {task?.category === "sentiment_analysis" && (
              <>
                <div>
                  <label className="label">Sentiment</label>
                  <select
                    className="select"
                    value={sentiment}
                    onChange={(e) => setSentiment(e.target.value)}
                    required
                  >
                    <option value="">Select sentiment</option>
                    <option value="positive">Positive</option>
                    <option value="negative">Negative</option>
                    <option value="neutral">Neutral</option>
                  </select>
                </div>
                <div>
                  <label className="label">Label (optional)</label>
                  <input
                    type="text"
                    className="input"
                    value={label}
                    onChange={(e) => setLabel(e.target.value)}
                    placeholder="Additional label"
                  />
                </div>
              </>
            )}

            {/* Text Summarization */}
            {task?.category === "text_summarization" && (
              <div>
                <label className="label">Summary</label>
                <textarea
                  className="textarea h-32"
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  placeholder="Enter the summary"
                  required
                />
              </div>
            )}

            {/* QA Evaluation */}
            {task?.category === "qa_evaluation" && (
              <>
                <div>
                  <label className="label">Accuracy</label>
                  <input
                    type="text"
                    className="input"
                    value={accuracy}
                    onChange={(e) => setAccuracy(e.target.value)}
                    placeholder="e.g., High, Medium, Low or 1-10"
                    required
                  />
                </div>
                <div>
                  <label className="label">Relevance</label>
                  <input
                    type="text"
                    className="input"
                    value={relevance}
                    onChange={(e) => setRelevance(e.target.value)}
                    placeholder="e.g., High, Medium, Low or 1-10"
                    required
                  />
                </div>
                <div>
                  <label className="label">Completeness</label>
                  <input
                    type="text"
                    className="input"
                    value={completeness}
                    onChange={(e) => setCompleteness(e.target.value)}
                    placeholder="e.g., High, Medium, Low or 1-10"
                    required
                  />
                </div>
              </>
            )}

            {/* LLM Response Grading */}
            {task?.category === "generative_ai_llm_response_grading" && (
              <>
                <div>
                  <label className="label">Grade</label>
                  <input
                    type="text"
                    className="input"
                    value={grade}
                    onChange={(e) => setGrade(e.target.value)}
                    placeholder="e.g., A, B, C or 1-10"
                    required
                  />
                </div>
                <div>
                  <label className="label">Reasoning</label>
                  <textarea
                    className="textarea h-24"
                    value={reasoning}
                    onChange={(e) => setReasoning(e.target.value)}
                    placeholder="Explain the grade"
                    required
                  />
                </div>
              </>
            )}

            {/* Chatbot Assessment */}
            {task?.category === "generative_ai_chatbot_assessment" && (
              <>
                <div>
                  <label className="label">Coherence</label>
                  <input
                    type="text"
                    className="input"
                    value={coherence}
                    onChange={(e) => setCoherence(e.target.value)}
                    placeholder="e.g., High, Medium, Low or 1-10"
                    required
                  />
                </div>
                <div>
                  <label className="label">Helpfulness</label>
                  <input
                    type="text"
                    className="input"
                    value={helpfulness}
                    onChange={(e) => setHelpfulness(e.target.value)}
                    placeholder="e.g., High, Medium, Low or 1-10"
                    required
                  />
                </div>
              </>
            )}

            {/* Response Selection */}
            {task?.category === "conversational_ai_response_selection" && (
              <>
                <div>
                  <label className="label">Selected Response</label>
                  <input
                    type="text"
                    className="input"
                    value={selectedResponse}
                    onChange={(e) => setSelectedResponse(e.target.value)}
                    placeholder="Enter the selected response ID or text"
                    required
                  />
                </div>
                <div>
                  <label className="label">Selection Reason</label>
                  <textarea
                    className="textarea h-24"
                    value={selectionReason}
                    onChange={(e) => setSelectionReason(e.target.value)}
                    placeholder="Why did you select this response?"
                    required
                  />
                </div>
              </>
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

            <button type="submit" className="btn btn-primary w-full">
              Send to QA
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
