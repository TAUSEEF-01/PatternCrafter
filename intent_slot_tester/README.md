# Intent Classification & Slot Filling — Web Tester

A Flask app that **parses your Label Studio YAML** and gives you a browser UI to:
- Select **intent** (single choice)
- Tag **slot entities** by selecting text in the dialogue and clicking a label
- Save annotations to a **SQLite** DB
- View recent annotations in **/history**

## Run locally

```bash
cd "/mnt/data/intent_slot_tester"
python -m venv .venv
# Windows PowerShell
.\.venv\Scripts\Activate.ps1
# macOS/Linux
# source .venv/bin/activate

pip install -r requirements.txt
flask --app app run --debug
```

Open: http://127.0.0.1:5000

## Files
- `config.yml` — Your provided YAML
- `app.py` — Flask server; parses the XML under `config:` and builds the UI
- `templates/annotate.html` — Annotation page
- `templates/history.html` — Saved annotations
- `static/styles.css` — Basic styles
- `annotations.db` — SQLite DB (auto-created)




Parses config: XML for:

Entity slot labels: Person, Organization, Location, Datetime, Quantity

Intent choices: Greeting, Customer request, Small talk

Input var name: $humanMachineDialogue

Renders UI accordingly and keeps it flexible if you update the YAML.

🖥️ UI Flow

Paste or edit the dialogue text

Choose an intent

Select words/phrases → click a slot label to tag

Click Save → check History to view stored annotations (JSON)