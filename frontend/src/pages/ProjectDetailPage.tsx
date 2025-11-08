import { Fragment, useEffect, useMemo, useState } from "react";
import { Link as RouterLink, useParams } from "react-router-dom";
import { apiFetch } from "@/api/client";
import { Project, Task } from "@/types";
import { useAuth } from "@/auth/AuthContext";

type Role = "user" | "assistant";
type DialogueMessage = { role: Role; content: string };

// Temporary workaround for react-router-dom Link typing mismatch across the file
const LinkFix = RouterLink as unknown as any;

export default function ProjectDetailPage() {
  const { projectId } = useParams();
  const { user } = useAuth();
  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [error, setError] = useState<string | null>(null);

  // QA Management
  const [projectAnnotators, setProjectAnnotators] = useState<
    { id: string; name: string; email: string }[]
  >([]);
  const [qaAnnotators, setQaAnnotators] = useState<
    { id: string; name: string; email: string }[]
  >([]);
  const [selectedQaIds, setSelectedQaIds] = useState<string[]>([]);
  const [qaManagementOpen, setQaManagementOpen] = useState(false);

  // Build task data per category
  const category = useMemo(() => project?.category, [project]);

  // Common helpers
  const parseList = (s: string) =>
    s
      .split(",")
      .map((x) => x.trim())
      .filter(Boolean);

  // LLM Response Grading
  const [llm_document, setLLMDocument] = useState("");
  const [llm_split, setLLMSplit] = useState(false);
  const [llm_summary, setLLMSummary] = useState("");
  const [llm_prompt, setLLMPrompt] = useState("");
  const [llm_model, setLLMModel] = useState("");

  // Chatbot Model Assessment
  const [chat_messages, setChatMessages] = useState<DialogueMessage[]>([
    { role: "user", content: "" },
    { role: "assistant", content: "" },
  ]);
  const [chat_model, setChatModel] = useState("");
  const [chat_title, setChatTitle] = useState("InstructGPT Assessment");

  // Response Selection
  const [rs_dialogue, setRsDialogue] = useState<DialogueMessage[]>([
    { role: "user", content: "" },
  ]);
  const [rs_options, setRsOptions] = useState<string[]>(["", "", ""]);
  const [rs_context, setRsContext] = useState("");

  // Text Classification
  const [tc_text, setTcText] = useState("");
  const [tc_labels, setTcLabels] = useState("positive, negative");

  // Image Classification
  const [ic_image, setIcImage] = useState("");
  const [ic_labels, setIcLabels] = useState("cat, dog");

  // Object Detection
  const [od_image, setOdImage] = useState("");
  const [od_classes, setOdClasses] = useState("person, car");

  // NER
  const [ner_text, setNerText] = useState("");
  const [ner_entity_types, setNerEntityTypes] = useState(
    "PERSON, ORG, LOCATION"
  );

  useEffect(() => {
    if (!projectId) return;
    apiFetch<Project>(`/projects/${projectId}`)
      .then(setProject)
      .catch((e) => setError(String(e)));
    const tasksPath =
      user?.role === "annotator"
        ? `/projects/${projectId}/my-tasks`
        : `/projects/${projectId}/tasks`;
    apiFetch<Task[]>(tasksPath)
      .then(setTasks)
      .catch((e) => setError(String(e)));

    // Load annotators and QA annotators for managers
    if (user?.role !== "annotator") {
      apiFetch<{ id: string; name: string; email: string }[]>(
        `/projects/${projectId}/annotators`
      )
        .then(setProjectAnnotators)
        .catch((e) => console.error("Failed to load annotators:", e));

      apiFetch<{ id: string; name: string; email: string }[]>(
        `/projects/${projectId}/qa-annotators`
      )
        .then((qaList) => {
          setQaAnnotators(qaList);
          setSelectedQaIds(qaList.map((q) => q.id));
        })
        .catch((e) => console.error("Failed to load QA annotators:", e));
    }
  }, [projectId, user?.role]);

  const updateQaAnnotators = async () => {
    if (!projectId) return;
    try {
      await apiFetch(`/projects/${projectId}/qa-annotators`, {
        method: "PUT",
        body: selectedQaIds,
      });

      // Reload QA annotators
      const qaList = await apiFetch<
        { id: string; name: string; email: string }[]
      >(`/projects/${projectId}/qa-annotators`);
      setQaAnnotators(qaList);
      setQaManagementOpen(false);
      setError(null);
    } catch (e: any) {
      setError(e?.message || "Failed to update QA annotators");
    }
  };

  const createTask = async () => {
    if (!projectId) return;
    try {
      let task_data: any = {};
      switch (category) {
        case "generative_ai_llm_response_grading": {
          const paragraphs = llm_document
            .split(/\n\n+/)
            .map((x) => x.trim())
            .filter(Boolean);
          task_data = {
            document: llm_split ? paragraphs : llm_document,
            summary: llm_summary,
            ...(llm_prompt ? { prompt: llm_prompt } : {}),
            ...(llm_model ? { model_name: llm_model } : {}),
          };
          break;
        }
        case "generative_ai_chatbot_assessment": {
          task_data = {
            messages: chat_messages.filter((m) => m.content.trim().length),
            ...(chat_model ? { model_name: chat_model } : {}),
            ...(chat_title ? { assessment_title: chat_title } : {}),
          };
          break;
        }
        case "conversational_ai_response_selection": {
          task_data = {
            dialogue: rs_dialogue.filter((m) => m.content.trim().length),
            response_options: rs_options.map((o) => o.trim()).filter(Boolean),
            ...(rs_context ? { context: rs_context } : {}),
          };
          break;
        }
        case "text_classification": {
          task_data = { text: tc_text, labels: parseList(tc_labels) };
          break;
        }
        case "image_classification": {
          task_data = { image_url: ic_image, labels: parseList(ic_labels) };
          break;
        }
        case "object_detection": {
          task_data = { image_url: od_image, classes: parseList(od_classes) };
          break;
        }
        case "named_entity_recognition": {
          task_data = {
            text: ner_text,
            entity_types: parseList(ner_entity_types),
          };
          break;
        }
        default: {
          // Fallback for categories without a dedicated form
          task_data = {};
        }
      }

      const body = { category, task_data };
      const t = await apiFetch<Task>(`/projects/${projectId}/tasks`, {
        method: "POST",
        body,
      });
      setTasks((prev) => [t, ...prev]);
      // reset simple fields
      setLLMDocument("");
      setLLMSummary("");
      setLLMPrompt("");
      setLLMModel("");
      setChatMessages([
        { role: "user", content: "" },
        { role: "assistant", content: "" },
      ]);
      setChatModel("");
      setChatTitle("InstructGPT Assessment");
      setRsDialogue([{ role: "user", content: "" }]);
      setRsOptions(["", "", ""]);
      setRsContext("");
      setTcText("");
      setTcLabels("positive, negative");
      setIcImage("");
      setIcLabels("cat, dog");
      setOdImage("");
      setOdClasses("person, car");
      setNerText("");
      setNerEntityTypes("PERSON, ORG, LOCATION");
    } catch (e: any) {
      setError(e?.message || "Failed to create task");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1>Project Details</h1>
          {project && (
            <div className="muted mt-1 space-y-0.5">
              <div>{project.details}</div>
              <span className="badge badge-primary">{project.category}</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-4">
          {user?.role !== "annotator" && projectId && (
            <LinkFix
              className="btn btn-outline"
              to={`/projects/${projectId}/completed`}
            >
              Completed Tasks
            </LinkFix>
          )}
          <LinkFix className="btn btn-ghost" to="/projects">
            ← Back
          </LinkFix>
        </div>
      </div>

      {user?.role !== "annotator" && (
        <>
          {/* QA Annotators Management */}
          <div className="card">
            <div className="card-body">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="card-title">QA Reviewers</h2>
                  <p className="text-sm text-gray-600 mt-1">
                    Designate which annotators can perform QA reviews for this
                    project
                  </p>
                </div>
                <button
                  className="btn btn-outline btn-sm"
                  onClick={() => setQaManagementOpen(!qaManagementOpen)}
                >
                  {qaManagementOpen ? "Cancel" : "Manage QA"}
                </button>
              </div>

              {qaManagementOpen ? (
                <div className="mt-4 space-y-3">
                  <div className="text-sm font-medium">
                    Select QA Reviewers:
                  </div>
                  {projectAnnotators.length === 0 ? (
                    <p className="text-sm text-gray-500">
                      No annotators in this project yet. Invite annotators
                      first.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {projectAnnotators.map((annotator) => (
                        <label
                          key={annotator.id}
                          className="flex items-center gap-2 p-2 border rounded hover:bg-gray-50 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            className="checkbox"
                            checked={selectedQaIds.includes(annotator.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedQaIds([
                                  ...selectedQaIds,
                                  annotator.id,
                                ]);
                              } else {
                                setSelectedQaIds(
                                  selectedQaIds.filter(
                                    (id) => id !== annotator.id
                                  )
                                );
                              }
                            }}
                          />
                          <div>
                            <div className="font-medium">{annotator.name}</div>
                            <div className="text-sm text-gray-500">
                              {annotator.email}
                            </div>
                          </div>
                        </label>
                      ))}
                    </div>
                  )}
                  <button
                    className="btn btn-primary"
                    onClick={updateQaAnnotators}
                    disabled={projectAnnotators.length === 0}
                  >
                    Save QA Reviewers
                  </button>
                </div>
              ) : (
                <div className="mt-3">
                  {qaAnnotators.length === 0 ? (
                    <p className="text-sm text-gray-500">
                      No QA reviewers assigned yet
                    </p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {qaAnnotators.map((qa) => (
                        <div
                          key={qa.id}
                          className="badge badge-lg badge-primary"
                        >
                          {qa.name}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Task Creation Form */}
          <div className="card">
            <div className="card-body space-y-4">
              <h2 className="card-title">Create Task</h2>
              <div className="badge badge-primary w-fit">{category}</div>

              {/* Category-specific forms */}
              {category === "generative_ai_llm_response_grading" && (
                <div className="space-y-3">
                  <div>
                    <label className="block mb-1 font-medium">Document</label>
                    <textarea
                      className="w-full border rounded p-2 h-28"
                      value={llm_document}
                      onChange={(e) => setLLMDocument(e.target.value)}
                      placeholder="Paste text; enable split to make paragraphs"
                    />
                    <label className="inline-flex items-center gap-2 mt-2 text-sm">
                      <input
                        type="checkbox"
                        checked={llm_split}
                        onChange={(e) => setLLMSplit(e.target.checked)}
                      />
                      Split by blank lines into paragraphs
                    </label>
                  </div>
                  <div>
                    <label className="block mb-1 font-medium">Summary</label>
                    <textarea
                      className="w-full border rounded p-2 h-20"
                      value={llm_summary}
                      onChange={(e) => setLLMSummary(e.target.value)}
                    />
                  </div>
                  <div className="grid sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block mb-1">Prompt (optional)</label>
                      <input
                        className="w-full border rounded px-2 py-1"
                        value={llm_prompt}
                        onChange={(e) => setLLMPrompt(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block mb-1">
                        Model Name (optional)
                      </label>
                      <input
                        className="w-full border rounded px-2 py-1"
                        value={llm_model}
                        onChange={(e) => setLLMModel(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              )}

              {category === "generative_ai_chatbot_assessment" && (
                <div className="space-y-3">
                  <div className="space-y-2">
                    <div className="font-medium">Messages</div>
                    {chat_messages.map((m, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <select
                          className="border rounded px-2 py-1"
                          value={m.role}
                          onChange={(e) => {
                            const v = e.target.value as Role;
                            setChatMessages((prev) =>
                              prev.map((mm, idx) =>
                                idx === i ? { ...mm, role: v } : mm
                              )
                            );
                          }}
                        >
                          <option value="user">user</option>
                          <option value="assistant">assistant</option>
                        </select>
                        <textarea
                          className="flex-1 border rounded p-2 h-20"
                          value={m.content}
                          onChange={(e) =>
                            setChatMessages((prev) =>
                              prev.map((mm, idx) =>
                                idx === i
                                  ? { ...mm, content: e.target.value }
                                  : mm
                              )
                            )
                          }
                        />
                        <button
                          type="button"
                          className="px-2 py-1 text-sm border rounded"
                          onClick={() =>
                            setChatMessages((prev) =>
                              prev.filter((_, idx) => idx !== i)
                            )
                          }
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      className="px-3 py-1 text-sm border rounded"
                      onClick={() =>
                        setChatMessages((prev) => [
                          ...prev,
                          { role: "user", content: "" },
                        ])
                      }
                    >
                      + Add Message
                    </button>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block mb-1">
                        Model Name (optional)
                      </label>
                      <input
                        className="w-full border rounded px-2 py-1"
                        value={chat_model}
                        onChange={(e) => setChatModel(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block mb-1">Assessment Title</label>
                      <input
                        className="w-full border rounded px-2 py-1"
                        value={chat_title}
                        onChange={(e) => setChatTitle(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              )}

              {category === "conversational_ai_response_selection" && (
                <div className="space-y-3">
                  <div className="space-y-2">
                    <div className="font-medium">Dialogue</div>
                    {rs_dialogue.map((m, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <select
                          className="border rounded px-2 py-1"
                          value={m.role}
                          onChange={(e) => {
                            const v = e.target.value as Role;
                            setRsDialogue((prev) =>
                              prev.map((mm, idx) =>
                                idx === i ? { ...mm, role: v } : mm
                              )
                            );
                          }}
                        >
                          <option value="user">user</option>
                          <option value="assistant">assistant</option>
                        </select>
                        <textarea
                          className="flex-1 border rounded p-2 h-20"
                          value={m.content}
                          onChange={(e) =>
                            setRsDialogue((prev) =>
                              prev.map((mm, idx) =>
                                idx === i
                                  ? { ...mm, content: e.target.value }
                                  : mm
                              )
                            )
                          }
                        />
                        <button
                          type="button"
                          className="px-2 py-1 text-sm border rounded"
                          onClick={() =>
                            setRsDialogue((prev) =>
                              prev.filter((_, idx) => idx !== i)
                            )
                          }
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      className="px-3 py-1 text-sm border rounded"
                      onClick={() =>
                        setRsDialogue((prev) => [
                          ...prev,
                          { role: "user", content: "" },
                        ])
                      }
                    >
                      + Add Message
                    </button>
                  </div>
                  <div className="space-y-2">
                    <div className="font-medium">Response Options</div>
                    {rs_options.map((o, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <input
                          className="flex-1 border rounded px-2 py-1"
                          value={o}
                          onChange={(e) =>
                            setRsOptions((prev) =>
                              prev.map((oo, idx) =>
                                idx === i ? e.target.value : oo
                              )
                            )
                          }
                          placeholder={`Option ${i + 1}`}
                        />
                        <button
                          type="button"
                          className="px-2 py-1 text-sm border rounded"
                          onClick={() =>
                            setRsOptions((prev) =>
                              prev.filter((_, idx) => idx !== i)
                            )
                          }
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      className="px-3 py-1 text-sm border rounded"
                      onClick={() => setRsOptions((prev) => [...prev, ""])}
                    >
                      + Add Option
                    </button>
                  </div>
                  <div>
                    <label className="block mb-1">Context (optional)</label>
                    <textarea
                      className="w-full border rounded p-2 h-20"
                      value={rs_context}
                      onChange={(e) => setRsContext(e.target.value)}
                    />
                  </div>
                </div>
              )}

              {category === "text_classification" && (
                <div className="space-y-3">
                  <div>
                    <label className="block mb-1 font-medium">Text</label>
                    <textarea
                      className="w-full border rounded p-2 h-28"
                      value={tc_text}
                      onChange={(e) => setTcText(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block mb-1">
                      Labels (comma separated)
                    </label>
                    <input
                      className="w-full border rounded px-2 py-1"
                      value={tc_labels}
                      onChange={(e) => setTcLabels(e.target.value)}
                    />
                  </div>
                </div>
              )}

              {category === "image_classification" && (
                <div className="space-y-3">
                  <div>
                    <label className="block mb-1">Image URL</label>
                    <input
                      className="w-full border rounded px-2 py-1"
                      value={ic_image}
                      onChange={(e) => setIcImage(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block mb-1">
                      Labels (comma separated)
                    </label>
                    <input
                      className="w-full border rounded px-2 py-1"
                      value={ic_labels}
                      onChange={(e) => setIcLabels(e.target.value)}
                    />
                  </div>
                </div>
              )}

              {category === "object_detection" && (
                <div className="space-y-3">
                  <div>
                    <label className="block mb-1">Image URL</label>
                    <input
                      className="w-full border rounded px-2 py-1"
                      value={od_image}
                      onChange={(e) => setOdImage(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block mb-1">
                      Classes (comma separated)
                    </label>
                    <input
                      className="w-full border rounded px-2 py-1"
                      value={od_classes}
                      onChange={(e) => setOdClasses(e.target.value)}
                    />
                  </div>
                </div>
              )}

              {category === "named_entity_recognition" && (
                <div className="space-y-3">
                  <div>
                    <label className="block mb-1 font-medium">Text</label>
                    <textarea
                      className="w-full border rounded p-2 h-28"
                      value={ner_text}
                      onChange={(e) => setNerText(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block mb-1">
                      Entity Types (comma separated)
                    </label>
                    <input
                      className="w-full border rounded px-2 py-1"
                      value={ner_entity_types}
                      onChange={(e) => setNerEntityTypes(e.target.value)}
                    />
                  </div>
                </div>
              )}

              {(!category ||
                [
                  "generative_ai_llm_response_grading",
                  "generative_ai_chatbot_assessment",
                  "conversational_ai_response_selection",
                  "text_classification",
                  "image_classification",
                  "object_detection",
                  "named_entity_recognition",
                ].indexOf(category) === -1) && (
                <div className="text-sm text-gray-600">
                  No guided form for this category. A minimal empty task will be
                  created.
                </div>
              )}

              <div>
                <button onClick={createTask} className="btn btn-primary">
                  Add Task
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {error && (
        <div className="rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="space-y-4">
        {user?.role === "annotator" ? (
          <>
            {/* Returned tasks section for annotators */}
            {tasks.filter((t) => t.is_returned).length > 0 && (
              <div>
                <h2 className="text-amber-600">⚠️ Tasks Needing Revision</h2>
                <p className="text-sm text-gray-600 mb-3">
                  These tasks were returned and need to be reworked
                </p>
                <div className="grid gap-3">
                  {tasks
                    .filter((t) => t.is_returned)
                    .map((t) => (
                      <TaskCard key={t.id} t={t} isManager={false} />
                    ))}
                </div>
              </div>
            )}

            <div>
              <h2>Your assigned tasks</h2>
              {tasks.filter(
                (t) => !t.is_returned && !t.completed_status?.annotator_part
              ).length === 0 ? (
                <div className="card">
                  <div className="card-body text-center py-12">
                    <p className="muted">No tasks assigned yet</p>
                  </div>
                </div>
              ) : (
                <div className="grid gap-3 mt-3">
                  {tasks
                    .filter(
                      (t) =>
                        !t.is_returned && !t.completed_status?.annotator_part
                    )
                    .map((t) => (
                      <TaskCard key={t.id} t={t} isManager={false} />
                    ))}
                </div>
              )}
            </div>

            {/* Completed tasks for annotators */}
            {tasks.filter(
              (t) => t.completed_status?.annotator_part && !t.is_returned
            ).length > 0 && (
              <div>
                <h2>Completed tasks</h2>
                <div className="grid gap-3 mt-3">
                  {tasks
                    .filter(
                      (t) =>
                        t.completed_status?.annotator_part && !t.is_returned
                    )
                    .map((t) => (
                      <TaskCard key={t.id} t={t} isManager={false} />
                    ))}
                </div>
              </div>
            )}
          </>
        ) : (
          <>
            <div>
              <h2>In progress</h2>
              {tasks.filter((t) => !t.completed_status?.annotator_part)
                .length === 0 ? (
                <div className="card mt-3">
                  <div className="card-body text-center py-8 muted">
                    No tasks in progress
                  </div>
                </div>
              ) : (
                <div className="grid gap-3 mt-3">
                  {tasks
                    .filter((t) => !t.completed_status?.annotator_part)
                    .map((t) => (
                      <TaskCard key={t.id} t={t} isManager={true} />
                    ))}
                </div>
              )}
            </div>
            <div>
              <h2>Completed by annotator</h2>
              {tasks.filter((t) => t.completed_status?.annotator_part)
                .length === 0 ? (
                <div className="card mt-3">
                  <div className="card-body text-center py-8 muted">
                    No completed tasks yet
                  </div>
                </div>
              ) : (
                <div className="grid gap-3 mt-3">
                  {tasks
                    .filter((t) => t.completed_status?.annotator_part)
                    .map((t) => (
                      <TaskCard key={t.id} t={t} isManager={true} />
                    ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

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

function TaskCard({ t, isManager }: { t: Task; isManager: boolean }) {
  const [returning, setReturning] = useState(false);
  const [returnError, setReturnError] = useState<string | null>(null);

  const handleReturn = async () => {
    if (
      !confirm(
        "Are you sure you want to return this task to the annotator? The annotation will be cleared and they will need to resubmit."
      )
    ) {
      return;
    }

    setReturning(true);
    setReturnError(null);

    try {
      await apiFetch(`/tasks/${t.id}/return`, { method: "PUT" });
      // Refresh the page to show updated task status
      window.location.reload();
    } catch (e: any) {
      setReturnError(e?.message || "Failed to return task");
      setReturning(false);
    }
  };

  return (
    <div className="card hover:shadow-lg transition-shadow">
      <div className="card-body">
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="font-semibold text-base">
              Task {t.id.slice(0, 8)}
            </div>
            <span className="badge mt-1">{t.category}</span>
            {t.completed_status?.annotator_part && (
              <span className="badge badge-green ml-2">Completed</span>
            )}
            {t.is_returned && (
              <span className="badge badge-warning ml-2">Returned</span>
            )}
          </div>
          <div className="flex items-center gap-3">
            {isManager && (
              <>
                <LinkFix
                  className="btn btn-outline btn-sm"
                  to={`/tasks/${t.id}/assign`}
                >
                  Assign
                </LinkFix>
                <LinkFix
                  className="btn btn-outline btn-sm"
                  to={`/tasks/${t.id}/assign-qa`}
                >
                  Assign QA
                </LinkFix>
                {t.completed_status?.annotator_part && (
                  <button
                    className="btn btn-warning btn-sm"
                    onClick={handleReturn}
                    disabled={returning}
                  >
                    {returning ? "Returning..." : "Return"}
                  </button>
                )}
              </>
            )}
            <LinkFix
              className="btn btn-primary btn-sm"
              to={`/tasks/${t.id}/annotate`}
            >
              Annotate
            </LinkFix>
          </div>
        </div>
        {returnError && (
          <div className="text-sm text-red-600 mb-2">{returnError}</div>
        )}
        <div className="space-y-2">
          <details className="mt-2">
            <summary className="cursor-pointer text-sm font-medium text-gray-700 hover:text-gray-900">
              View task data
            </summary>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mt-2 max-h-96 overflow-auto scrollbar-thin">
              <TaskDataViewer data={t.task_data} />
            </div>
          </details>

          {/* Show annotator's work if task is completed */}
          {t.annotation && t.completed_status?.annotator_part && (
            <details className="mt-2">
              <summary className="cursor-pointer text-sm font-medium text-green-700 hover:text-green-900">
                📝 View annotator's work
              </summary>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mt-2 max-h-96 overflow-auto scrollbar-thin">
                <TaskDataViewer data={t.annotation} />
              </div>
            </details>
          )}
        </div>
      </div>
    </div>
  );
}
