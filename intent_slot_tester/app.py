from flask import Flask, render_template, request, jsonify
import os, sqlite3, yaml, json
from contextlib import closing
from lxml import etree

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, "annotations.db")
CONFIG_PATH = os.path.join(BASE_DIR, "config.yml")

# Load YAML and parse XML
with open(CONFIG_PATH, "r", encoding="utf-8") as f:
    CFG = yaml.safe_load(f)

TITLE = CFG.get("title", "Intent & Slot Tester")
DETAILS_HTML = CFG.get("details", "")
VIEW_XML = CFG.get("config", "")

entity_labels, intent_choices, input_var = [], [], "humanMachineDialogue"
try:
    root = etree.fromstring(VIEW_XML.encode("utf-8"))
    for lab in root.xpath(".//ParagraphLabels//Label"):
        v = lab.get("value")
        if v: entity_labels.append(v)
    for opt in root.xpath(".//Choices//Choice"):
        v = opt.get("value")
        if v: intent_choices.append(v)
    para = root.xpath(".//Paragraphs")
    if para:
        v = para[0].get("value", "")
        if v.startswith("$"): input_var = v[1:]
except Exception:
    entity_labels = ["Person", "Organization", "Location", "Datetime", "Quantity"]
    intent_choices = ["Greeting", "Customer request", "Small talk"]
    input_var = "humanMachineDialogue"

app = Flask(__name__)
app.secret_key = "dev-secret"

SCHEMA = """
CREATE TABLE IF NOT EXISTS annotations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  intent TEXT,
  dialogue TEXT,
  entities_json TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
"""

def get_conn():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    with closing(get_conn()) as conn:
        conn.executescript(SCHEMA)
        conn.commit()

with app.app_context():
    init_db()

@app.context_processor
def inject_globals():
    return dict(app_title=TITLE, details_html=DETAILS_HTML, entity_labels=entity_labels, intent_choices=intent_choices)

@app.route("/", methods=["GET"])
def annotate():
    sample = [
        "User: Hi there!",
        "Agent: Hello! How can I help you today?",
        "User: I want to book a flight from Dhaka to Singapore next Monday.",
        "Agent: Sure—what time do you prefer?"
    ]
    return render_template("annotate.html", sample_dialogue="\\n".join(sample), input_var=input_var)

@app.route("/save", methods=["POST"])
def save():
    data = request.get_json(force=True, silent=True) or {}
    intent = data.get("intent") or ""
    dialogue = data.get("dialogue") or ""
    entities = data.get("entities") or []
    with closing(get_conn()) as conn:
        conn.execute(
            "INSERT INTO annotations (intent, dialogue, entities_json) VALUES (?,?,?)",
            (intent, dialogue, json.dumps(entities, ensure_ascii=False))
        )
        conn.commit()
    return jsonify({"ok": True})

@app.route("/history", methods=["GET"])
def history():
    with closing(get_conn()) as conn:
        rows = conn.execute("SELECT id, intent, dialogue, entities_json, created_at FROM annotations ORDER BY id DESC LIMIT 50").fetchall()
    return render_template("history.html", rows=rows)

if __name__ == "__main__":
    app.run(debug=True)
