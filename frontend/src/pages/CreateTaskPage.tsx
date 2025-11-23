import { useEffect, useState } from "react";
import { Link as RouterLink, useParams, useNavigate } from "react-router-dom";
import { apiFetch } from "@/api/client";
import { Task } from "@/types";

type Role = "user" | "assistant";
type DialogueMessage = { role: Role; content: string };

const LinkFix = RouterLink as unknown as any;

export default function CreateTaskPage() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [category, setCategory] = useState<string>("");

  // Get category from route state
  useEffect(() => {
    const state = (window.history.state as any)?.usr;
    if (state?.category) {
      setCategory(state.category);
    }
  }, []);

  // LLM Response Grading
  const [llm_document, setLLMDocument] = useState("");
  const [llm_split, setLLMSplit] = useState(false);
  const [llm_summary, setLLMSummary] = useState("");
  const [llm_prompt, setLLMPrompt] = useState("");
  const [llm_model, setLLMModel] = useState("");
  const [customModels, setCustomModels] = useState<string[]>([]);
  const [showAddModel, setShowAddModel] = useState(false);
  const [newModelName, setNewModelName] = useState("");

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

  // Sentiment Analysis
  const [sa_text, setSaText] = useState("");
  const [sa_sentiments, setSaSentiments] = useState(
    "positive, negative, neutral"
  );

  // Text Summarization
  const [ts_text, setTsText] = useState("");
  const [ts_split, setTsSplit] = useState(false);
  const [ts_guidelines, setTsGuidelines] = useState("");
  const [ts_max_length, setTsMaxLength] = useState("");

  // Get category from route state
  useEffect(() => {
    const state = (window.history.state as any)?.usr;
    if (state?.category) {
      setCategory(state.category);
    }
  }, []);

  // Common helpers
  const parseList = (s: string) =>
    s
      .split(",")
      .map((x) => x.trim())
      .filter(Boolean);

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
        case "sentiment_analysis": {
          task_data = {
            text: sa_text,
            sentiments: parseList(sa_sentiments),
          };
          break;
        }
        case "text_summarization": {
          const paragraphs = ts_text
            .split(/\n\n+/)
            .map((x) => x.trim())
            .filter(Boolean);
          task_data = {
            text: ts_split ? paragraphs : ts_text,
            ...(ts_guidelines ? { guidelines: ts_guidelines } : {}),
            ...(ts_max_length ? { max_length: parseInt(ts_max_length) } : {}),
          };
          break;
        }
        default: {
          task_data = {};
        }
      }

      const body = { category, task_data };
      await apiFetch<Task>(`/projects/${projectId}/tasks`, {
        method: "POST",
        body,
      });

      // Navigate back to project details
      navigate(`/projects/${projectId}`);
    } catch (e: any) {
      setError(e?.message || "Failed to create task");
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">
            Create New Task
          </h1>
          {category === "generative_ai_chatbot_assessment" && (
            <p className="mt-1 text-sm text-gray-500">
              Define the conversation and metadata used to evaluate your
              chatbot's responses.
            </p>
          )}
        </div>
        <div className="relative group">
          <LinkFix
            aria-label="Back to Project"
            to={`/projects/${projectId}`}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg border border-gray-300 bg-white text-gray-700 text-sm font-medium shadow-sm hover:border-gray-400 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-purple-500 transition-colors"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            <span className="hidden sm:inline">Back to Project</span>
          </LinkFix>
          <div className="absolute -top-10 right-0 bg-gray-900 text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity">
            Return without saving
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="card">
        <div className="card-body space-y-4">
          <div>
            <h2 className="card-title">Task Details</h2>
            <div className="badge badge-primary w-fit mt-2">
              {category || "Select category"}
            </div>
          </div>

          {/* Category-specific forms */}
          {category === "generative_ai_llm_response_grading" && (
            <div className="space-y-6">
              {/* Header Section */}
              <div className="bg-white border-b-2 border-gray-200 pb-5">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 bg-indigo-600 rounded-lg flex items-center justify-center">
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
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">
                      LLM Response Grading
                    </h3>
                    <p className="text-sm text-gray-500 mt-0.5">
                      Evaluate AI-generated summaries against source documents
                    </p>
                  </div>
                </div>
              </div>

              {/* Document Section */}
              <div className="bg-white border-2 border-gray-300 rounded-lg overflow-hidden">
                <div className="bg-gray-50 border-b-2 border-gray-300 px-5 py-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-gray-700 uppercase tracking-wide">
                      Source Document
                    </h4>
                    <span className="text-xs text-gray-500 bg-white px-3 py-1.5 rounded border border-gray-300 font-mono font-semibold">
                      {llm_document.length} chars
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    The original text that was summarized by the LLM
                  </p>
                </div>
                <div className="p-5">
                  <textarea
                    className="w-full px-4 py-3 text-base border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all resize-none"
                    rows={8}
                    value={llm_document}
                    onChange={(e) => setLLMDocument(e.target.value)}
                    placeholder="Paste the source document text here..."
                  />
                  <div className="mt-4 p-4 bg-blue-50 border-2 border-blue-200 rounded-lg">
                    <label className="flex items-start gap-3 cursor-pointer group">
                      <div className="flex items-center h-6">
                        <input
                          type="checkbox"
                          checked={llm_split}
                          onChange={(e) => setLLMSplit(e.target.checked)}
                          className="w-5 h-5 text-indigo-600 border-2 border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                        />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-gray-900">
                            Split into paragraphs
                          </span>
                          <svg
                            className="w-4 h-4 text-blue-600"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </div>
                        <p className="text-xs text-gray-600 mt-1">
                          Automatically split the document by blank lines to
                          create separate paragraphs for better organization
                        </p>
                      </div>
                    </label>
                  </div>
                </div>
              </div>

              {/* Summary Section */}
              <div className="bg-white border-2 border-gray-300 rounded-lg overflow-hidden">
                <div className="bg-gray-50 border-b-2 border-gray-300 px-5 py-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-gray-700 uppercase tracking-wide">
                      AI-Generated Summary
                    </h4>
                    <span className="text-xs text-gray-500 bg-white px-3 py-1.5 rounded border border-gray-300 font-mono font-semibold">
                      {llm_summary.length} chars
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    The summary produced by the language model
                  </p>
                </div>
                <div className="p-5">
                  <textarea
                    className="w-full px-4 py-3 text-base border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all resize-none"
                    rows={6}
                    value={llm_summary}
                    onChange={(e) => setLLMSummary(e.target.value)}
                    placeholder="Enter the AI-generated summary text..."
                  />
                  {llm_document && llm_summary && (
                    <div className="mt-3 flex items-center gap-4 text-xs">
                      <div className="flex items-center gap-2 text-gray-600">
                        <svg
                          className="w-4 h-4 text-indigo-600"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293a1 1 0 00-1.414 0l-2 2a1 1 0 101.414 1.414L8 10.414l1.293 1.293a1 1 0 001.414 0l4-4z"
                            clipRule="evenodd"
                          />
                        </svg>
                        <span className="font-semibold">
                          Compression ratio:
                        </span>
                        <span className="font-mono font-bold text-indigo-600">
                          {(
                            (llm_summary.length / llm_document.length) *
                            100
                          ).toFixed(1)}
                          %
                        </span>
                      </div>
                      <div className="h-4 w-px bg-gray-300"></div>
                      <span className="text-gray-500">
                        Summary is {llm_document.length - llm_summary.length}{" "}
                        chars shorter
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Optional Fields Section */}
              <div className="bg-white border-2 border-gray-300 rounded-lg overflow-hidden">
                <div className="bg-gray-50 border-b-2 border-gray-300 px-5 py-3">
                  <h4 className="text-sm font-bold text-gray-700 uppercase tracking-wide">
                    Additional Information
                  </h4>
                  <p className="text-xs text-gray-500 mt-1">
                    Optional fields to provide context for grading
                  </p>
                </div>
                <div className="p-5 space-y-5">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                    {/* Prompt Field */}
                    <div>
                      <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">
                        <svg
                          className="w-4 h-4 text-indigo-600"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z"
                            clipRule="evenodd"
                          />
                        </svg>
                        Prompt
                        <span className="text-xs text-gray-500 normal-case font-normal tracking-normal">
                          (Optional)
                        </span>
                      </label>
                      <input
                        type="text"
                        className="w-full px-4 py-3 text-base border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                        value={llm_prompt}
                        onChange={(e) => setLLMPrompt(e.target.value)}
                        placeholder="e.g., Summarize this document..."
                      />
                      <p className="text-xs text-gray-500 mt-2 flex items-center gap-1.5">
                        <svg
                          className="w-3.5 h-3.5 text-indigo-600"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                            clipRule="evenodd"
                          />
                        </svg>
                        The instruction given to the LLM
                      </p>
                    </div>

                    {/* Model Name Field */}
                    <div>
                      <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">
                        <svg
                          className="w-4 h-4 text-indigo-600"
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
                        Model Name
                        <span className="text-xs text-gray-500 normal-case font-normal tracking-normal">
                          (Optional)
                        </span>
                      </label>

                      {!showAddModel ? (
                        <div className="space-y-3">
                          <select
                            className="w-full px-4 py-3 text-base border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all bg-white cursor-pointer"
                            value={llm_model}
                            onChange={(e) => {
                              if (e.target.value === "__add_custom__") {
                                setShowAddModel(true);
                              } else {
                                setLLMModel(e.target.value);
                              }
                            }}
                          >
                            <option value="">Select a model...</option>
                            <optgroup label="OpenAI Models">
                              <option value="GPT-4">GPT-4</option>
                              <option value="GPT-4 Turbo">GPT-4 Turbo</option>
                              <option value="GPT-3.5 Turbo">
                                GPT-3.5 Turbo
                              </option>
                              <option value="GPT-4o">GPT-4o</option>
                              <option value="GPT-4o-mini">GPT-4o-mini</option>
                            </optgroup>
                            <optgroup label="Anthropic Models">
                              <option value="Claude-3 Opus">
                                Claude-3 Opus
                              </option>
                              <option value="Claude-3 Sonnet">
                                Claude-3 Sonnet
                              </option>
                              <option value="Claude-3 Haiku">
                                Claude-3 Haiku
                              </option>
                              <option value="Claude-3.5 Sonnet">
                                Claude-3.5 Sonnet
                              </option>
                            </optgroup>
                            <optgroup label="Google Models">
                              <option value="Gemini Pro">Gemini Pro</option>
                              <option value="Gemini Ultra">Gemini Ultra</option>
                              <option value="Gemini 1.5 Pro">
                                Gemini 1.5 Pro
                              </option>
                              <option value="PaLM 2">PaLM 2</option>
                            </optgroup>
                            <optgroup label="Meta Models">
                              <option value="Llama 2">Llama 2</option>
                              <option value="Llama 3">Llama 3</option>
                              <option value="Llama 3.1">Llama 3.1</option>
                            </optgroup>
                            <optgroup label="Other Models">
                              <option value="Mistral">Mistral</option>
                              <option value="Mixtral">Mixtral</option>
                              <option value="Command R+">Command R+</option>
                            </optgroup>
                            {customModels.length > 0 && (
                              <optgroup label="Custom Models">
                                {customModels.map((model) => (
                                  <option key={model} value={model}>
                                    {model}
                                  </option>
                                ))}
                              </optgroup>
                            )}
                            <option
                              value="__add_custom__"
                              className="font-bold text-indigo-600"
                            >
                              + Add Custom Model
                            </option>
                          </select>

                          {llm_model && (
                            <button
                              type="button"
                              onClick={() => {
                                setLLMModel("");
                              }}
                              className="text-xs text-red-600 hover:text-red-800 font-semibold flex items-center gap-1 transition-colors"
                            >
                              <svg
                                className="w-3.5 h-3.5"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                                  clipRule="evenodd"
                                />
                              </svg>
                              Clear selection
                            </button>
                          )}

                          {/* Custom Models Management */}
                          {customModels.length > 0 && (
                            <div className="bg-indigo-50 border-2 border-indigo-200 rounded-lg p-4">
                              <div className="flex items-center justify-between mb-3">
                                <h5 className="text-sm font-bold text-indigo-900 flex items-center gap-2">
                                  <svg
                                    className="w-4 h-4"
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
                                  Your Custom Models ({customModels.length})
                                </h5>
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (
                                      confirm(
                                        `Remove all ${customModels.length} custom models?`
                                      )
                                    ) {
                                      setCustomModels([]);
                                      if (customModels.includes(llm_model)) {
                                        setLLMModel("");
                                      }
                                    }
                                  }}
                                  className="text-xs text-red-600 hover:text-red-800 font-semibold px-2 py-1 bg-white border border-red-300 rounded hover:bg-red-50 transition-colors"
                                >
                                  Clear All
                                </button>
                              </div>
                              <div className="space-y-2 max-h-40 overflow-y-auto">
                                {customModels.map((model) => (
                                  <div
                                    key={model}
                                    className="flex items-center justify-between p-3 bg-white border-2 border-indigo-200 rounded-lg hover:border-indigo-400 transition-colors group"
                                  >
                                    <div className="flex items-center gap-2 flex-1 min-w-0">
                                      <svg
                                        className="w-4 h-4 text-indigo-600 flex-shrink-0"
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
                                      <span className="text-sm font-semibold text-gray-900 truncate">
                                        {model}
                                      </span>
                                      {llm_model === model && (
                                        <span className="px-2 py-0.5 bg-indigo-600 text-white text-xs font-bold rounded-full flex-shrink-0">
                                          Selected
                                        </span>
                                      )}
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        if (
                                          confirm(
                                            `Remove "${model}" from custom models?`
                                          )
                                        ) {
                                          setCustomModels(
                                            customModels.filter(
                                              (m) => m !== model
                                            )
                                          );
                                          if (llm_model === model) {
                                            setLLMModel("");
                                          }
                                        }
                                      }}
                                      className="flex-shrink-0 ml-3 px-2.5 py-1.5 bg-white text-red-600 border-2 border-red-300 rounded-lg text-xs font-semibold hover:bg-red-50 hover:border-red-400 transition-colors opacity-0 group-hover:opacity-100"
                                    >
                                      Remove
                                    </button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="bg-white border-2 border-indigo-400 rounded-lg p-5 space-y-4">
                          <div className="flex items-center gap-2">
                            <svg
                              className="w-5 h-5 text-indigo-600"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z"
                                clipRule="evenodd"
                              />
                            </svg>
                            <h5 className="text-sm font-bold text-indigo-900">
                              Add Custom Model
                            </h5>
                          </div>

                          <div className="space-y-2">
                            <label className="text-sm font-semibold text-gray-700">
                              Model Name
                            </label>
                            <input
                              type="text"
                              className="w-full px-4 py-3 text-base border-2 border-indigo-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                              value={newModelName}
                              onChange={(e) => setNewModelName(e.target.value)}
                              placeholder="Enter custom model name..."
                              autoFocus
                              onKeyDown={(e) => {
                                if (e.key === "Enter" && newModelName.trim()) {
                                  if (
                                    !customModels.includes(newModelName.trim())
                                  ) {
                                    setCustomModels([
                                      ...customModels,
                                      newModelName.trim(),
                                    ]);
                                  }
                                  setLLMModel(newModelName.trim());
                                  setNewModelName("");
                                  setShowAddModel(false);
                                } else if (e.key === "Escape") {
                                  setShowAddModel(false);
                                  setNewModelName("");
                                }
                              }}
                            />
                          </div>

                          <div className="flex items-start gap-2 bg-blue-50 border border-blue-200 rounded-lg p-3">
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
                              <p className="text-xs text-blue-900 font-semibold">
                                Quick Tips:
                              </p>
                              <ul className="text-xs text-blue-800 mt-1 space-y-0.5">
                                <li>
                                  • Press{" "}
                                  <kbd className="px-1 py-0.5 bg-white border border-blue-300 rounded text-xs font-mono">
                                    Enter
                                  </kbd>{" "}
                                  to add
                                </li>
                                <li>
                                  • Press{" "}
                                  <kbd className="px-1 py-0.5 bg-white border border-blue-300 rounded text-xs font-mono">
                                    Esc
                                  </kbd>{" "}
                                  to cancel
                                </li>
                              </ul>
                            </div>
                          </div>

                          {/* Action Buttons - Full Width and Clearly Visible */}
                          <div className="flex gap-3 pt-2">
                            <button
                              type="button"
                              onClick={() => {
                                if (newModelName.trim()) {
                                  if (
                                    !customModels.includes(newModelName.trim())
                                  ) {
                                    setCustomModels([
                                      ...customModels,
                                      newModelName.trim(),
                                    ]);
                                  }
                                  setLLMModel(newModelName.trim());
                                  setNewModelName("");
                                  setShowAddModel(false);
                                }
                              }}
                              disabled={!newModelName.trim()}
                              className="flex-1 px-6 py-4 bg-indigo-600 text-white rounded-lg font-bold text-base hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                            >
                              <svg
                                className="w-5 h-5"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                  clipRule="evenodd"
                                />
                              </svg>
                              Add Model
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setShowAddModel(false);
                                setNewModelName("");
                              }}
                              className="flex-1 px-6 py-4 bg-white text-gray-700 border-2 border-gray-300 rounded-lg font-bold text-base hover:bg-gray-50 hover:border-gray-400 transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                            >
                              <svg
                                className="w-5 h-5"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                                  clipRule="evenodd"
                                />
                              </svg>
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}

                      <p className="text-xs text-gray-500 mt-2 flex items-center gap-1.5">
                        <svg
                          className="w-3.5 h-3.5 text-indigo-600"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                            clipRule="evenodd"
                          />
                        </svg>
                        Which LLM generated the summary
                      </p>
                    </div>
                  </div>

                  <div className="bg-indigo-50 border-2 border-indigo-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <svg
                        className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5"
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
                        <p className="text-sm font-bold text-indigo-900">
                          About Optional Fields
                        </p>
                        <p className="text-xs text-indigo-700 mt-1">
                          These fields help provide context for annotators when
                          grading the LLM's response quality, accuracy, and
                          relevance.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Requirements Warning */}
              {(!llm_document.trim() || !llm_summary.trim()) && (
                <div className="bg-amber-50 border-2 border-amber-300 rounded-lg p-5 flex items-start gap-4">
                  <svg
                    className="w-7 h-7 text-amber-600 flex-shrink-0 mt-0.5"
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
                    <p className="text-sm font-bold text-amber-900 mb-1">
                      Required Fields Missing
                    </p>
                    <ul className="text-xs text-amber-800 space-y-1">
                      {!llm_document.trim() && (
                        <li className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 bg-amber-600 rounded-full"></span>
                          Source Document is required
                        </li>
                      )}
                      {!llm_summary.trim() && (
                        <li className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 bg-amber-600 rounded-full"></span>
                          AI-Generated Summary is required
                        </li>
                      )}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          )}

          {category === "generative_ai_chatbot_assessment" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Conversation Messages</h3>
                <span className="text-xs text-gray-500">
                  {chat_messages.filter((m) => m.content.trim()).length} of{" "}
                  {chat_messages.length} populated
                </span>
              </div>
              <p className="text-sm text-gray-500">
                Add user prompts and assistant replies. Start with any system /
                persona instruction inside the first user message.
              </p>
              <div className="space-y-3">
                {chat_messages.map((m, i) => (
                  <div
                    key={i}
                    className="relative rounded-lg border border-gray-200 bg-white p-3 shadow-sm"
                  >
                    <div className="flex flex-col sm:flex-row gap-3">
                      <div className="w-full sm:w-40 flex flex-col gap-2">
                        <label className="sr-only" htmlFor={`role-${i}`}>
                          Message role {i + 1}
                        </label>
                        <select
                          id={`role-${i}`}
                          className={`w-full px-3 py-2 rounded-md border text-sm font-medium focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors ${
                            m.role === "assistant"
                              ? "bg-purple-50 border-purple-300 text-purple-700"
                              : "bg-blue-50 border-blue-300 text-blue-700"
                          }`}
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
                          <option value="user">User</option>
                          <option value="assistant">Assistant</option>
                        </select>
                        <button
                          type="button"
                          className="text-xs px-2 py-1 rounded-md border border-gray-300 bg-white hover:bg-red-50 hover:border-red-400 hover:text-red-600 transition-colors"
                          onClick={() =>
                            setChatMessages((prev) =>
                              prev.filter((_, idx) => idx !== i)
                            )
                          }
                        >
                          Remove
                        </button>
                      </div>
                      <div className="flex-1">
                        <textarea
                          className="w-full px-3 py-2 rounded-md border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 min-h-[80px] resize-y"
                          placeholder={
                            m.role === "assistant"
                              ? "Assistant reply (clear, concise, helpful)..."
                              : "User prompt or instruction..."
                          }
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
                      </div>
                    </div>
                    <span className="absolute -top-2 -left-2 bg-purple-600 text-white text-[10px] font-semibold px-2 py-1 rounded-md shadow">
                      #{i + 1}
                    </span>
                  </div>
                ))}
                <div className="flex justify-end">
                  <button
                    type="button"
                    className="px-4 py-2 rounded-md text-sm font-medium border-2 border-dashed border-purple-300 text-purple-700 bg-purple-50 hover:border-purple-400 hover:bg-purple-100 transition-colors"
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
              </div>
              <div className="grid sm:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block mb-1 text-sm font-medium">
                    Model Name <span className="text-gray-400">(optional)</span>
                  </label>
                  <input
                    className="w-full px-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm"
                    value={chat_model}
                    onChange={(e) => setChatModel(e.target.value)}
                    placeholder="e.g. GPT-4"
                  />
                </div>
                <div>
                  <label className="block mb-1 text-sm font-medium">
                    Assessment Title
                  </label>
                  <input
                    className="w-full px-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm"
                    value={chat_title}
                    onChange={(e) => setChatTitle(e.target.value)}
                    placeholder="e.g. InstructGPT Assessment"
                  />
                </div>
              </div>
            </div>
          )}

          {category === "conversational_ai_response_selection" && (
            <div className="space-y-6">
              {/* Header Section */}
              <div className="bg-white border-b-2 border-gray-200 pb-5">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 bg-purple-600 rounded-lg flex items-center justify-center">
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
                        d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                      />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">
                      Conversational AI Response Selection
                    </h3>
                    <p className="text-sm text-gray-500 mt-0.5">
                      Create dialogue context and provide response options
                    </p>
                  </div>
                </div>
              </div>

              {/* Dialogue Section */}
              <div className="bg-white border-2 border-gray-300 rounded-lg overflow-hidden">
                <div className="bg-gray-50 border-b-2 border-gray-300 px-5 py-3 flex items-center justify-between">
                  <h4 className="text-sm font-bold text-gray-700 uppercase tracking-wide">
                    Conversation Dialogue
                  </h4>
                  <span className="text-xs text-gray-500 bg-white px-3 py-1.5 rounded border border-gray-300 font-semibold">
                    {rs_dialogue.length}{" "}
                    {rs_dialogue.length === 1 ? "Message" : "Messages"}
                  </span>
                </div>
                <div className="p-5 space-y-4">
                  {rs_dialogue.length === 0 ? (
                    <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                      <svg
                        className="w-12 h-12 text-gray-400 mx-auto mb-3"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                        />
                      </svg>
                      <p className="text-sm text-gray-600 font-medium">
                        No messages yet
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Click "Add Message" below to start building the dialogue
                      </p>
                    </div>
                  ) : (
                    rs_dialogue.map((m, i) => (
                      <div
                        key={i}
                        className="bg-white border-2 border-gray-300 rounded-lg overflow-hidden hover:border-blue-400 transition-colors"
                      >
                        <div className="bg-gray-50 border-b-2 border-gray-300 px-4 py-2.5 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span className="text-sm font-bold text-gray-700">
                              Message {i + 1}
                            </span>
                            <div className="h-5 w-px bg-gray-300"></div>
                            <div className="flex items-center gap-2">
                              <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                                Role:
                              </label>
                              <select
                                className={`text-sm font-bold px-3 py-1.5 border-2 rounded-lg focus:outline-none focus:ring-2 transition-all ${
                                  m.role === "assistant"
                                    ? "bg-purple-600 text-white border-purple-600 focus:ring-purple-300"
                                    : "bg-blue-600 text-white border-blue-600 focus:ring-blue-300"
                                }`}
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
                                <option value="user">👤 User</option>
                                <option value="assistant">🤖 Assistant</option>
                              </select>
                            </div>
                          </div>
                          <button
                            type="button"
                            className="px-3 py-1.5 bg-white text-red-600 border-2 border-red-300 rounded-lg text-sm font-semibold hover:bg-red-50 hover:border-red-400 transition-colors"
                            onClick={() =>
                              setRsDialogue((prev) =>
                                prev.filter((_, idx) => idx !== i)
                              )
                            }
                          >
                            Remove
                          </button>
                        </div>
                        <div className="p-4">
                          <textarea
                            className="w-full px-4 py-3 text-base border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all resize-none"
                            rows={3}
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
                            placeholder={`Enter ${
                              m.role === "assistant" ? "assistant" : "user"
                            } message...`}
                          />
                          <div className="flex items-center justify-between mt-2">
                            <p className="text-xs text-gray-500">
                              {m.role === "assistant"
                                ? "🤖 AI assistant response"
                                : "👤 User query or statement"}
                            </p>
                            <span className="text-xs text-gray-500 font-mono">
                              {m.content.length} chars
                            </span>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                  <button
                    type="button"
                    className="w-full py-3 bg-white text-blue-700 border-2 border-blue-400 rounded-lg text-sm font-bold hover:bg-blue-50 transition-colors flex items-center justify-center gap-2"
                    onClick={() =>
                      setRsDialogue((prev) => [
                        ...prev,
                        { role: "user", content: "" },
                      ])
                    }
                  >
                    <svg
                      className="w-5 h-5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Add Message to Dialogue
                  </button>
                </div>
              </div>

              {/* Response Options Section */}
              <div className="bg-white border-2 border-gray-300 rounded-lg overflow-hidden">
                <div className="bg-gray-50 border-b-2 border-gray-300 px-5 py-3 flex items-center justify-between">
                  <h4 className="text-sm font-bold text-gray-700 uppercase tracking-wide">
                    Response Options
                  </h4>
                  <span className="text-xs text-gray-500 bg-white px-3 py-1.5 rounded border border-gray-300 font-semibold">
                    {rs_options.length}{" "}
                    {rs_options.length === 1 ? "Option" : "Options"}
                  </span>
                </div>
                <div className="p-5 space-y-4">
                  {rs_options.length === 0 ? (
                    <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                      <svg
                        className="w-12 h-12 text-gray-400 mx-auto mb-3"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                        />
                      </svg>
                      <p className="text-sm text-gray-600 font-medium">
                        No response options yet
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Add multiple response options for annotators to choose
                        from
                      </p>
                    </div>
                  ) : (
                    rs_options.map((o, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-4 p-4 bg-white border-2 border-gray-300 rounded-lg hover:border-green-400 transition-colors"
                      >
                        <div className="flex-shrink-0 w-10 h-10 bg-green-600 text-white rounded-lg flex items-center justify-center font-bold text-base">
                          {String.fromCharCode(65 + i)}
                        </div>
                        <input
                          className="flex-1 px-4 py-3 text-base border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                          value={o}
                          onChange={(e) =>
                            setRsOptions((prev) =>
                              prev.map((oo, idx) =>
                                idx === i ? e.target.value : oo
                              )
                            )
                          }
                          placeholder={`Enter option ${String.fromCharCode(
                            65 + i
                          )}...`}
                        />
                        <button
                          type="button"
                          className="flex-shrink-0 px-4 py-2.5 bg-white text-red-600 border-2 border-red-300 rounded-lg text-sm font-semibold hover:bg-red-50 hover:border-red-400 transition-colors"
                          onClick={() =>
                            setRsOptions((prev) =>
                              prev.filter((_, idx) => idx !== i)
                            )
                          }
                        >
                          Remove
                        </button>
                      </div>
                    ))
                  )}
                  <button
                    type="button"
                    className="w-full py-3 bg-white text-green-700 border-2 border-green-400 rounded-lg text-sm font-bold hover:bg-green-50 transition-colors flex items-center justify-center gap-2"
                    onClick={() => setRsOptions((prev) => [...prev, ""])}
                  >
                    <svg
                      className="w-5 h-5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Add Response Option
                  </button>
                </div>
              </div>

              {/* Context Section */}
              <div className="bg-white border-2 border-gray-300 rounded-lg overflow-hidden">
                <div className="bg-gray-50 border-b-2 border-gray-300 px-5 py-3">
                  <h4 className="text-sm font-bold text-gray-700 uppercase tracking-wide">
                    Additional Context
                  </h4>
                  <p className="text-xs text-gray-500 mt-1">
                    Optional background information or instructions
                  </p>
                </div>
                <div className="p-5">
                  <textarea
                    className="w-full px-4 py-3 text-base border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all resize-none"
                    rows={4}
                    value={rs_context}
                    onChange={(e) => setRsContext(e.target.value)}
                    placeholder="Add any additional context, instructions, or background information..."
                  />
                  <div className="flex items-center justify-between mt-2">
                    <p className="text-xs text-gray-500 flex items-center gap-1.5">
                      <svg
                        className="w-3.5 h-3.5 text-blue-600"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                          clipRule="evenodd"
                        />
                      </svg>
                      This field is optional but can help annotators make better
                      decisions
                    </p>
                    <span className="text-xs text-gray-500 font-mono">
                      {rs_context.length} chars
                    </span>
                  </div>
                </div>
              </div>

              {/* Info Box */}
              {(rs_dialogue.length === 0 || rs_options.length < 2) && (
                <div className="bg-amber-50 border-2 border-amber-300 rounded-lg p-5 flex items-start gap-4">
                  <svg
                    className="w-7 h-7 text-amber-600 flex-shrink-0 mt-0.5"
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
                    <p className="text-sm font-bold text-amber-900 mb-1">
                      Task Requirements
                    </p>
                    <ul className="text-xs text-amber-800 space-y-1">
                      {rs_dialogue.length === 0 && (
                        <li className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 bg-amber-600 rounded-full"></span>
                          Add at least one message to the dialogue
                        </li>
                      )}
                      {rs_options.length < 2 && (
                        <li className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 bg-amber-600 rounded-full"></span>
                          Add at least two response options for selection
                        </li>
                      )}
                    </ul>
                  </div>
                </div>
              )}
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
                <label className="block mb-1">Labels (comma separated)</label>
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
                <label className="block mb-1">Labels (comma separated)</label>
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
                <label className="block mb-1">Classes (comma separated)</label>
                <input
                  className="w-full border rounded px-2 py-1"
                  value={od_classes}
                  onChange={(e) => setOdClasses(e.target.value)}
                />
              </div>
            </div>
          )}

          {category === "text_summarization" && (
            <div className="space-y-6">
              {/* Header Section */}
              <div className="bg-white border-2 border-gray-300 rounded-lg p-5">
                <div className="flex items-center gap-2 mb-2">
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
                    Text Summarization Task
                  </h3>
                </div>
                <p className="text-xs text-gray-600">
                  Configure the text that annotators will summarize
                </p>
              </div>

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
                  <span className="text-xs text-red-500 ml-1">*</span>
                </div>
                <textarea
                  className="w-full px-4 py-3 text-base border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white resize-none"
                  value={ts_text}
                  onChange={(e) => setTsText(e.target.value)}
                  rows={8}
                  placeholder="Enter the text to be summarized...&#10;&#10;You can paste an article, document, or any long-form text here. Annotators will create concise summaries of this content.&#10;&#10;Example: A research article, news story, blog post, etc."
                  required
                />
                <div className="flex items-center justify-between mt-3">
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
                    Full text to be summarized
                  </p>
                  <span className="text-xs text-gray-500 font-mono">
                    {ts_text.length} characters
                  </span>
                </div>

                {/* Split into Paragraphs Option */}
                <div className="mt-4 bg-blue-50 border-2 border-blue-200 rounded-lg p-3">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={ts_split}
                      onChange={(e) => setTsSplit(e.target.checked)}
                      className="w-4 h-4 text-blue-600 border-2 border-blue-300 rounded focus:ring-2 focus:ring-blue-500"
                    />
                    <div className="flex-1">
                      <span className="text-sm font-semibold text-blue-900">
                        Split into paragraphs
                      </span>
                      <p className="text-xs text-blue-700 mt-0.5">
                        Automatically split text by double line breaks
                        (paragraphs)
                      </p>
                    </div>
                  </label>
                  {ts_split && ts_text && (
                    <div className="mt-2 pt-2 border-t border-blue-200">
                      <p className="text-xs text-blue-800">
                        Will be split into{" "}
                        <span className="font-bold">
                          {ts_text.split(/\n\n+/).filter(Boolean).length}
                        </span>{" "}
                        paragraph
                        {ts_text.split(/\n\n+/).filter(Boolean).length !== 1
                          ? "s"
                          : ""}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Summarization Guidelines Section */}
              <div className="bg-white border-2 border-gray-300 rounded-lg p-5">
                <div className="flex items-center gap-2 mb-4">
                  <svg
                    className="w-5 h-5 text-blue-600"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide">
                    Summarization Guidelines
                  </h3>
                  <span className="text-xs text-gray-500">(Optional)</span>
                </div>
                <textarea
                  className="w-full px-4 py-3 text-base border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white resize-none"
                  value={ts_guidelines}
                  onChange={(e) => setTsGuidelines(e.target.value)}
                  rows={4}
                  placeholder="Provide specific instructions for annotators...&#10;&#10;Example: Focus on main points, use third-person perspective, maintain formal tone, etc."
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
                  Optional instructions to guide annotators
                </p>
              </div>

              {/* Maximum Length Section */}
              <div className="bg-white border-2 border-gray-300 rounded-lg p-5">
                <div className="flex items-center gap-2 mb-4">
                  <svg
                    className="w-5 h-5 text-blue-600"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide">
                    Maximum Summary Length
                  </h3>
                  <span className="text-xs text-gray-500">(Optional)</span>
                </div>
                <input
                  type="number"
                  className="w-full px-4 py-3 text-base border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white"
                  value={ts_max_length}
                  onChange={(e) => setTsMaxLength(e.target.value)}
                  placeholder="Enter maximum number of words (e.g., 150)"
                  min="10"
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
                  Leave empty for no word limit
                </p>
              </div>

              {/* Preview Section */}
              <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-5">
                <div className="flex items-center gap-2 mb-3">
                  <svg
                    className="w-5 h-5 text-blue-600"
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
                  <h3 className="text-sm font-bold text-blue-900 uppercase tracking-wide">
                    Task Preview
                  </h3>
                </div>
                <div className="space-y-3">
                  <div className="bg-white border-2 border-blue-200 rounded-lg p-3">
                    <p className="text-xs font-semibold text-blue-900 mb-2">
                      Task Configuration:
                    </p>
                    <ul className="text-xs text-blue-800 space-y-1">
                      <li className="flex items-center gap-2">
                        <svg
                          className="w-3 h-3"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                        Text: {ts_text.length} characters
                      </li>
                      {ts_split && (
                        <li className="flex items-center gap-2">
                          <svg
                            className="w-3 h-3"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                          Split into{" "}
                          {ts_text.split(/\n\n+/).filter(Boolean).length}{" "}
                          paragraphs
                        </li>
                      )}
                      {ts_guidelines && (
                        <li className="flex items-center gap-2">
                          <svg
                            className="w-3 h-3"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                          Guidelines provided
                        </li>
                      )}
                      {ts_max_length && (
                        <li className="flex items-center gap-2">
                          <svg
                            className="w-3 h-3"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                          Max length: {ts_max_length} words
                        </li>
                      )}
                    </ul>
                  </div>
                  <p className="text-xs text-blue-800 italic flex items-center gap-1">
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
                    Annotators will create concise summaries based on these
                    settings
                  </p>
                </div>
              </div>
            </div>
          )}

          {category === "sentiment_analysis" && (
            <div className="space-y-6">
              {/* Header Section */}
              <div className="bg-white border-2 border-gray-300 rounded-lg p-5">
                <div className="flex items-center gap-2 mb-2">
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
                    Sentiment Analysis Task
                  </h3>
                </div>
                <p className="text-xs text-gray-600">
                  Configure the text and sentiment options for annotation
                </p>
              </div>

              {/* Text Input Section */}
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
                  <span className="text-xs text-red-500 ml-1">*</span>
                </div>
                <textarea
                  className="w-full px-4 py-3 text-base border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all bg-white resize-none"
                  value={sa_text}
                  onChange={(e) => setSaText(e.target.value)}
                  rows={6}
                  placeholder="Enter the text that annotators will analyze for sentiment...&#10;&#10;Example: The product exceeded my expectations. The quality is outstanding and delivery was fast!"
                  required
                />
                <div className="flex items-center justify-between mt-3">
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
                    Text to be analyzed by annotators
                  </p>
                  <span className="text-xs text-gray-500 font-mono">
                    {sa_text.length} characters
                  </span>
                </div>
              </div>

              {/* Sentiment Options Section */}
              <div className="bg-white border-2 border-gray-300 rounded-lg p-5">
                <div className="flex items-center gap-2 mb-4">
                  <svg
                    className="w-5 h-5 text-emerald-600"
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
                    Sentiment Options
                  </h3>
                  <span className="text-xs text-red-500 ml-1">*</span>
                </div>
                <input
                  type="text"
                  className="w-full px-4 py-3 text-base border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all bg-white"
                  value={sa_sentiments}
                  onChange={(e) => setSaSentiments(e.target.value)}
                  placeholder="Enter sentiment options separated by commas"
                  required
                />
                <div className="flex items-start justify-between mt-3">
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
                    Separate options with commas
                  </p>
                  <span className="text-xs text-emerald-600 font-semibold">
                    {parseList(sa_sentiments).length} options
                  </span>
                </div>
              </div>

              {/* Preview Section */}
              <div className="bg-emerald-50 border-2 border-emerald-200 rounded-lg p-5">
                <div className="flex items-center gap-2 mb-3">
                  <svg
                    className="w-5 h-5 text-emerald-600"
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
                  <h3 className="text-sm font-bold text-emerald-900 uppercase tracking-wide">
                    Preview
                  </h3>
                </div>
                <div className="space-y-3">
                  <div className="bg-white border-2 border-emerald-200 rounded-lg p-3">
                    <p className="text-xs font-semibold text-emerald-900 mb-2">
                      Available Sentiment Options:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {parseList(sa_sentiments).map((sentiment, idx) => (
                        <span
                          key={idx}
                          className="px-3 py-1.5 bg-emerald-100 border-2 border-emerald-300 text-emerald-800 rounded-lg text-sm font-semibold"
                        >
                          {sentiment}
                        </span>
                      ))}
                    </div>
                  </div>
                  <p className="text-xs text-emerald-800 italic flex items-center gap-1">
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
                    Annotators will select one sentiment from these options
                  </p>
                </div>
              </div>

              {/* Quick Templates */}
              <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
                <p className="text-xs font-bold text-blue-900 mb-3 flex items-center gap-1">
                  <svg
                    className="w-4 h-4"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                  </svg>
                  Quick Templates
                </p>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setSaSentiments("positive, negative, neutral")
                    }
                    className="px-3 py-1.5 bg-white border-2 border-emerald-300 rounded-lg text-xs font-semibold text-emerald-700 hover:bg-emerald-50 transition-colors"
                  >
                    Basic (3)
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setSaSentiments(
                        "very positive, positive, neutral, negative, very negative"
                      )
                    }
                    className="px-3 py-1.5 bg-white border-2 border-emerald-300 rounded-lg text-xs font-semibold text-emerald-700 hover:bg-emerald-50 transition-colors"
                  >
                    Extended (5)
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setSaSentiments(
                        "happy, sad, angry, surprised, neutral, mixed"
                      )
                    }
                    className="px-3 py-1.5 bg-white border-2 border-emerald-300 rounded-lg text-xs font-semibold text-emerald-700 hover:bg-emerald-50 transition-colors"
                  >
                    Emotions (6)
                  </button>
                </div>
              </div>
            </div>
          )}

          {category === "named_entity_recognition" && (
            <div className="space-y-5">
              {/* Header Section */}
              <div className="flex items-center justify-between pb-3 border-b-2 border-purple-200">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center shadow-md">
                    <span className="text-xl">🏷️</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-800">
                      Named Entity Recognition Task
                    </h3>
                    <p className="text-xs text-gray-500">
                      Configure the text and entity types for annotation
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span
                    className={`px-3 py-1 rounded-full font-semibold ${
                      ner_text.trim() && ner_entity_types.trim()
                        ? "bg-green-100 text-green-700 border border-green-300"
                        : "bg-gray-100 text-gray-500 border border-gray-300"
                    }`}
                  >
                    {ner_text.trim() && ner_entity_types.trim()
                      ? "✓ Ready"
                      : "○ Incomplete"}
                  </span>
                </div>
              </div>

              {/* Source Text Section */}
              <div className="relative">
                <div className="absolute -top-2 left-3 bg-white px-2 z-10">
                  <span className="text-xs font-bold text-indigo-600 uppercase tracking-wide flex items-center gap-1">
                    <svg
                      className="w-3.5 h-3.5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" />
                    </svg>
                    Source Text
                  </span>
                </div>
                <div className="border-2 border-indigo-200 rounded-xl p-4 bg-gradient-to-br from-indigo-50 to-blue-50 shadow-sm">
                  <textarea
                    className="w-full border-2 border-indigo-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white transition-all resize-none"
                    value={ner_text}
                    onChange={(e) => setNerText(e.target.value)}
                    rows={6}
                    placeholder="Enter the text that annotators will analyze for named entities...&#10;&#10;Example: John Smith works at Microsoft in Seattle and graduated from Stanford University."
                  />
                  <div className="mt-2 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-4 text-indigo-600">
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
                        Annotators will identify entities in this text
                      </span>
                    </div>
                    <span
                      className={`font-mono font-semibold ${
                        ner_text.length > 0
                          ? "text-indigo-700"
                          : "text-gray-400"
                      }`}
                    >
                      {ner_text.length} characters
                    </span>
                  </div>
                </div>
              </div>

              {/* Entity Types Section */}
              <div className="relative">
                <div className="absolute -top-2 left-3 bg-white px-2 z-10">
                  <span className="text-xs font-bold text-green-600 uppercase tracking-wide flex items-center gap-1">
                    <svg
                      className="w-3.5 h-3.5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M17.707 9.293a1 1 0 010 1.414l-7 7a1 1 0 01-1.414 0l-7-7A.997.997 0 012 10V5a3 3 0 013-3h5c.256 0 .512.098.707.293l7 7zM5 6a1 1 0 100-2 1 1 0 000 2z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Entity Types
                  </span>
                </div>
                <div className="border-2 border-green-200 rounded-xl p-4 bg-gradient-to-br from-green-50 to-emerald-50 shadow-sm space-y-3">
                  <input
                    className="w-full border-2 border-green-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white transition-all font-medium"
                    value={ner_entity_types}
                    onChange={(e) => setNerEntityTypes(e.target.value)}
                    placeholder="PERSON, ORGANIZATION, LOCATION, DATE, PRODUCT"
                  />

                  {/* Entity Types Preview */}
                  {ner_entity_types.trim() && (
                    <div className="space-y-2">
                      <p className="text-xs font-semibold text-green-700 flex items-center gap-1">
                        <svg
                          className="w-3.5 h-3.5"
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
                        Preview ({parseList(ner_entity_types).length} types):
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {parseList(ner_entity_types).map((type, idx) => (
                          <span
                            key={idx}
                            className="px-3 py-1.5 bg-gradient-to-r from-green-600 to-emerald-600 text-white text-xs font-bold rounded-full shadow-sm border border-green-400 flex items-center gap-1"
                          >
                            <span className="w-1.5 h-1.5 bg-white rounded-full"></span>
                            {type}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="pt-2 border-t border-green-200">
                    <p className="text-xs text-green-700 flex items-start gap-2">
                      <svg
                        className="w-4 h-4 flex-shrink-0 mt-0.5"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span>
                        <strong>Tip:</strong> Separate entity types with commas.
                        Common types include PERSON, ORGANIZATION (ORG),
                        LOCATION (LOC), DATE, TIME, MONEY, PERCENT, PRODUCT,
                        EVENT, etc.
                      </span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Quick Templates (Optional Enhancement) */}
              <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
                <p className="text-xs font-semibold text-purple-700 mb-2 flex items-center gap-1">
                  <svg
                    className="w-3.5 h-3.5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  Quick Templates
                </p>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setNerEntityTypes("PERSON, ORGANIZATION, LOCATION")
                    }
                    className="px-2.5 py-1 bg-white border border-purple-300 rounded text-xs font-medium text-purple-700 hover:bg-purple-100 transition-colors"
                  >
                    Basic (3)
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setNerEntityTypes(
                        "PERSON, ORGANIZATION, LOCATION, DATE, TIME"
                      )
                    }
                    className="px-2.5 py-1 bg-white border border-purple-300 rounded text-xs font-medium text-purple-700 hover:bg-purple-100 transition-colors"
                  >
                    Standard (5)
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setNerEntityTypes(
                        "PERSON, ORGANIZATION, LOCATION, DATE, TIME, MONEY, PERCENT, PRODUCT"
                      )
                    }
                    className="px-2.5 py-1 bg-white border border-purple-300 rounded text-xs font-medium text-purple-700 hover:bg-purple-100 transition-colors"
                  >
                    Extended (8)
                  </button>
                </div>
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
              "sentiment_analysis",
              "text_summarization",
            ].indexOf(category) === -1) && (
            <div className="text-sm text-gray-600">
              No guided form for this category. A minimal empty task will be
              created.
            </div>
          )}

          <div className="flex gap-4 justify-center pt-2">
            <button
              onClick={createTask}
              style={{ backgroundColor: "#7a1cac" }}
              className="px-6 py-2.5 rounded-lg text-white font-semibold shadow-sm hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors"
            >
              Create Task
            </button>
            <LinkFix
              className="px-6 py-2.5 rounded-lg border border-gray-300 bg-white text-gray-700 font-semibold hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-300 transition-colors"
              to={`/projects/${projectId}`}
            >
              Cancel
            </LinkFix>
          </div>
        </div>
      </div>
    </div>
  );
}
