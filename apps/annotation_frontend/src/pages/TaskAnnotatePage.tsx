import { FormEvent, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { apiFetch } from '@/api/client';
import { Task } from '@/types';

function TaskDataViewer({ data }: { data: any }) {
  if (!data || typeof data !== 'object') {
    return <div className="text-gray-500 text-sm">No data available</div>;
  }

  const renderValue = (value: any): React.ReactNode => {
    if (value === null || value === undefined) return <span className="text-gray-400">—</span>;
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    if (Array.isArray(value)) {
      if (value.length === 0) return <span className="text-gray-400">Empty</span>;
      if (typeof value[0] === 'string') {
        return (
          <div className="space-y-1">
            {value.map((item, idx) => (
              <div key={idx} className="text-sm text-gray-700 whitespace-pre-wrap break-words">
                • {item}
              </div>
            ))}
          </div>
        );
      }
      if (typeof value[0] === 'object') {
        return (
          <div className="space-y-2">
            {value.map((item, idx) => (
              <div key={idx} className="pl-3 border-l-2 border-gray-200">
                <div className="text-xs font-semibold text-gray-500 mb-1">Item {idx + 1}</div>
                {Object.entries(item).map(([k, v]) => (
                  <div key={k} className="text-sm mb-1">
                    <span className="font-medium text-gray-600">{k}:</span>{' '}
                    <span className="text-gray-700">{String(v)}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        );
      }
      return value.join(', ');
    }
    if (typeof value === 'object') {
      return (
        <div className="pl-3 space-y-1">
          {Object.entries(value).map(([k, v]) => (
            <div key={k} className="text-sm">
              <span className="font-medium text-gray-600">{k}:</span>{' '}
              <span className="text-gray-700">{renderValue(v)}</span>
            </div>
          ))}
        </div>
      );
    }
    return <span className="text-gray-700 whitespace-pre-wrap break-words">{String(value)}</span>;
  };

  return (
    <div className="space-y-3">
      {Object.entries(data).map(([key, value]) => (
        <div key={key} className="border-b border-gray-100 pb-3 last:border-b-0 last:pb-0">
          <div className="text-sm font-semibold text-gray-800 mb-1 capitalize">
            {key.replace(/_/g, ' ')}
          </div>
          <div className="text-sm">{renderValue(value)}</div>
        </div>
      ))}
    </div>
  );
}

export default function TaskAnnotatePage() {
  const { taskId } = useParams();
  const [task, setTask] = useState<Task | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Common annotation fields
  const [label, setLabel] = useState('');
  const [confidence, setConfidence] = useState('0.95');
  const [notes, setNotes] = useState('');

  // Text Classification / Sentiment Analysis
  const [category, setCategory] = useState('');
  const [sentiment, setSentiment] = useState('');

  // Image Classification
  const [predictedClass, setPredictedClass] = useState('');

  // Object Detection
  const [objects, setObjects] = useState('');

  // Named Entity Recognition
  const [entities, setEntities] = useState('');

  // Text Summarization
  const [summary, setSummary] = useState('');

  // QA Evaluation
  const [accuracy, setAccuracy] = useState('');
  const [relevance, setRelevance] = useState('');
  const [completeness, setCompleteness] = useState('');

  // LLM Response Grading
  const [grade, setGrade] = useState('');
  const [reasoning, setReasoning] = useState('');

  // Chatbot Assessment
  const [coherence, setCoherence] = useState('');
  const [helpfulness, setHelpfulness] = useState('');

  // Response Selection
  const [selectedResponse, setSelectedResponse] = useState('');
  const [selectionReason, setSelectionReason] = useState('');

  useEffect(() => {
    if (!taskId) return;
    apiFetch<Task>(`/tasks/${taskId}`)
      .then(setTask)
      .catch((e) => setError(String(e)));
  }, [taskId]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!taskId || !task) return;

    let annotationData: any = {
      confidence: parseFloat(confidence) || 0.95,
      notes: notes || '',
    };

    // Build annotation based on task category
    switch (task.category) {
      case 'text_classification':
        annotationData.label = label;
        annotationData.category = category;
        break;
      case 'image_classification':
        annotationData.predicted_class = predictedClass;
        break;
      case 'object_detection':
        try {
          annotationData.objects = objects ? JSON.parse(objects) : [];
        } catch {
          setError('Objects must be valid JSON array');
          return;
        }
        break;
      case 'named_entity_recognition':
        try {
          annotationData.entities = entities ? JSON.parse(entities) : [];
        } catch {
          setError('Entities must be valid JSON array');
          return;
        }
        break;
      case 'sentiment_analysis':
        annotationData.sentiment = sentiment;
        annotationData.label = label;
        break;
      case 'text_summarization':
        annotationData.summary = summary;
        break;
      case 'qa_evaluation':
        annotationData.accuracy = accuracy;
        annotationData.relevance = relevance;
        annotationData.completeness = completeness;
        break;
      case 'generative_ai_llm_response_grading':
        annotationData.grade = grade;
        annotationData.reasoning = reasoning;
        break;
      case 'generative_ai_chatbot_assessment':
        annotationData.coherence = coherence;
        annotationData.helpfulness = helpfulness;
        break;
      case 'conversational_ai_response_selection':
        annotationData.selected_response = selectedResponse;
        annotationData.selection_reason = selectionReason;
        break;
      default:
        annotationData.label = label;
    }

    try {
      const body = { annotation: annotationData };
      await apiFetch(`/tasks/${taskId}/annotation`, { method: 'PUT', body });
      setSuccess('Annotation submitted successfully!');
      setError(null);
    } catch (e: any) {
      setError(e?.message || 'Failed to submit annotation');
      setSuccess(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1>Annotate Task</h1>
        <p className="muted mt-1">Review the task data and provide your annotation</p>
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
            <div>
              <h2 className="card-title mb-2">Task Information</h2>
              <div className="flex items-center gap-2 text-sm">
                <span className="font-mono text-gray-600">{task.id.slice(0, 8)}</span>
                <span className="badge badge-primary">{task.category}</span>
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

      <div className="card">
        <div className="card-body">
          <h2 className="card-title mb-4">Submit Annotation</h2>
          <form onSubmit={submit} className="space-y-4">
            {/* Text Classification */}
            {task?.category === 'text_classification' && (
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
            {task?.category === 'image_classification' && (
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
            {task?.category === 'object_detection' && (
              <div>
                <label className="label">
                  Detected Objects{' '}
                  <span className="text-xs text-gray-500">(JSON array format)</span>
                </label>
                <textarea
                  className="textarea font-mono text-sm h-32"
                  value={objects}
                  onChange={(e) => setObjects(e.target.value)}
                  placeholder='[{"class": "car", "bbox": [x, y, w, h], "confidence": 0.95}]'
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Example: [&#123;"class": "person", "bbox": [10, 20, 100, 200], "confidence":
                  0.92&#125;]
                </p>
              </div>
            )}

            {/* Named Entity Recognition */}
            {task?.category === 'named_entity_recognition' && (
              <div>
                <label className="label">
                  Entities <span className="text-xs text-gray-500">(JSON array format)</span>
                </label>
                <textarea
                  className="textarea font-mono text-sm h-32"
                  value={entities}
                  onChange={(e) => setEntities(e.target.value)}
                  placeholder='[{"entity": "John Doe", "type": "PERSON", "start": 0, "end": 8}]'
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Example: [&#123;"entity": "Microsoft", "type": "ORG", "start": 0, "end": 9&#125;]
                </p>
              </div>
            )}

            {/* Sentiment Analysis */}
            {task?.category === 'sentiment_analysis' && (
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
            {task?.category === 'text_summarization' && (
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
            {task?.category === 'qa_evaluation' && (
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
            {task?.category === 'generative_ai_llm_response_grading' && (
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
            {task?.category === 'generative_ai_chatbot_assessment' && (
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
            {task?.category === 'conversational_ai_response_selection' && (
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
              <h3 className="font-medium mb-3 text-sm text-gray-700">Additional Information</h3>
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
                  <p className="text-xs text-gray-500 mt-1">Value between 0 and 1</p>
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
              Submit Annotation
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
