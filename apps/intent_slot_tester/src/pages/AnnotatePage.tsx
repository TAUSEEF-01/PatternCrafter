import { useMemo, useRef, useState, ChangeEvent } from "react";
import { saveAnnotation } from "../store";
import type { Entity, AnnotationRecord } from "../types";
import "../index.css";
import { NavTabs } from "../components/NavTabs";

const DEFAULT_LABELS = [
  "Person",
  "Organization",
  "Location",
  "Datetime",
  "Quantity",
];
const DEFAULT_INTENTS = ["Greeting", "Customer request", "Small talk"];

export function AnnotatePage() {
  const [dialogue, setDialogue] = useState(
    [
      "User: Hi there!",
      "Agent: Hello! How can I help you today?",
      "User: I want to book a flight from Dhaka to Singapore next Monday.",
      "Agent: Sure—what time do you prefer?",
    ].join("\n")
  );
  const [intent, setIntent] = useState("");
  const [entities, setEntities] = useState<Entity[]>([]);
  const taRef = useRef<HTMLTextAreaElement | null>(null);
  const [label, setLabel] = useState(DEFAULT_LABELS[0]);

  const preview = useMemo(() => dialogue, [dialogue]);

  function addEntityFromSelection() {
    const ta = taRef.current;
    if (!ta) return;
    const start = ta.selectionStart ?? 0;
    const end = ta.selectionEnd ?? 0;
    if (end <= start) return;
    const text = dialogue.slice(start, end);
    setEntities((prev: Entity[]) => [...prev, { start, end, label, text }]);
  }

  function removeEntity(idx: number) {
    setEntities((prev: Entity[]) => prev.filter((_, i) => i !== idx));
  }

  function onSave() {
    const rec: Omit<AnnotationRecord, "id" | "createdAt"> = {
      intent: intent || "",
      dialogue,
      entities,
    };
    saveAnnotation(rec);
    setEntities([]);
    setIntent("");
    alert("Saved. See History page for recent items.");
  }

  function resetSample() {
    setDialogue(
      [
        "User: Hi there!",
        "Agent: Hello! How can I help you today?",
        "User: I want to book a flight from Dhaka to Singapore next Monday.",
        "Agent: Sure—what time do you prefer?",
      ].join("\n")
    );
    setEntities([]);
    setIntent("");
  }

  return (
    <div>
      <NavTabs />
      <div className="container">
        <div className="panel">
          <section className="section">
            <label className="label">Dialogue</label>
            <div
              className="row"
              style={{ justifyContent: "flex-end", marginTop: -8 }}
            >
              <button
                className="btn link"
                type="button"
                onClick={resetSample}
                aria-label="Reset sample text"
              >
                Reset sample
              </button>
            </div>
            <textarea
              ref={taRef}
              className="textarea"
              rows={8}
              value={dialogue}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                setDialogue(e.target.value)
              }
            />
          </section>

          <section className="section">
            <label className="label">Intent</label>
            <select
              className="select"
              value={intent}
              onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                setIntent(e.target.value)
              }
            >
              <option value="">Select intent…</option>
              {DEFAULT_INTENTS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </section>

          <section className="section">
            <div className="row">
              <div>
                <label className="label">Entity label</label>
                <select
                  className="select"
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                >
                  {DEFAULT_LABELS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>
              <button
                className="btn"
                type="button"
                onClick={addEntityFromSelection}
                aria-label="Add entity from selected text"
              >
                Add entity from selection
              </button>
            </div>
            <div className="entities">
              {entities.map((ent, i) => (
                <div key={i} className="entity">
                  <div>
                    <strong>{ent.label}</strong>: "{ent.text}" [{ent.start},
                    {ent.end})
                  </div>
                  <button
                    className="btn link"
                    type="button"
                    onClick={() => removeEntity(i)}
                    aria-label={`Remove entity ${i + 1}`}
                  >
                    remove
                  </button>
                </div>
              ))}
              {entities.length === 0 && (
                <div className="muted">
                  No entities yet. Select text in the dialogue and click the
                  button above.
                </div>
              )}
            </div>
            {entities.length > 0 && (
              <div className="row" style={{ justifyContent: "flex-end" }}>
                <button
                  className="btn link"
                  type="button"
                  onClick={() => setEntities([])}
                  aria-label="Clear all entities"
                >
                  Clear all
                </button>
              </div>
            )}
          </section>

          <section className="section">
            <button
              className="btn primary"
              type="button"
              onClick={onSave}
              aria-label="Save annotation"
            >
              Save
            </button>
          </section>

          <section className="section">
            <label className="label">Preview</label>
            <pre className="preview">{preview}</pre>
          </section>
        </div>
      </div>
    </div>
  );
}
