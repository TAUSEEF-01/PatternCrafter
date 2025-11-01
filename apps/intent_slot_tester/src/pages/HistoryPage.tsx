import { listAnnotations } from "../store";
import { Link } from "react-router-dom";
import "../index.css";
import { NavTabs } from "../components/NavTabs";
import type { AnnotationRecord, Entity } from "../types";

export function HistoryPage() {
  const items: AnnotationRecord[] = listAnnotations();
  return (
    <div>
      <div className="container">
        <div className="side-layout">
          <NavTabs variant="side" />
          <div className="panel">
            <h2 className="label">History</h2>
            {items.length === 0 ? (
              <div className="muted">
                No saved annotations yet.{" "}
                <Link to="/" className="btn">
                  Start annotating
                </Link>
              </div>
            ) : (
              <ul className="list">
                {items.map((it: AnnotationRecord) => (
                  <li key={it.id} className="card">
                    <div className="row">
                      <strong>{it.intent || "(no intent)"}</strong>
                      <span className="muted">
                        {new Date(it.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <pre className="preview" style={{ whiteSpace: "pre-wrap" }}>
                      {it.dialogue}
                    </pre>
                    {it.entities.length > 0 && (
                      <div className="entities">
                        {it.entities.map((e: Entity, idx: number) => (
                          <div key={idx} className="entity">
                            <strong>{e.label}</strong>: "{e.text}" [{e.start},
                            {e.end})
                          </div>
                        ))}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
