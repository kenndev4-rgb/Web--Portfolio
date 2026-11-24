/* ════════════════════════════════════════════════════════════════════
   PROJECTS DATA — the single source of truth for the Projects section.
   ────────────────────────────────────────────────────────────────────
   Each record drives: the card, the filter counts, the case-file modal
   (Overview / Architecture / Stack / Concept Demo / Timeline) and the
   terminal `projects` command.

   UPDATING ZIP-ARCHIVED PROJECTS
   Finance App, Incubator Monitoring App and the Facial Recognition
   Visitor System are currently stored as .zip archives in
   C:\Personal_Projects, and their live source lives in another
   directory. Their records carry `source.updatePending: true`, which
   shows a "Source archived · update pending" tag on the card.
   When the source is updated:
     1. edit the fields below (features, stack, metrics, timeline…)
     2. set `updatePending: false` and point `source.path` at the
        new folder.

   Field reference
     id         unique slug (also used by the terminal: `open <id>`)
     category   'academic' | 'casual' | 'longterm'
     status     'Completed' | 'In Progress' | 'Prototype' | 'In Design'
     glyph      1–2 characters shown in the card's moon emblem
     flow       architecture diagram — nodes are placed in columns by `col`
     langs      approximate language mix in percent (sums to ~100)
     widget     key of the bespoke concept demo in viz.js
   ════════════════════════════════════════════════════════════════════ */
window.PROJECTS = [

/* ───────────────────────────── ACADEMIC ───────────────────────────── */
{
  id: 'announcements',
  title: 'University Announcement System',
  short: 'Announcement System',
  category: 'academic',
  status: 'Completed',
  glyph: 'An',
  pitch: 'Real-time announcement kiosk and esports tournament manager for Batangas State University, with a Taglish-speaking Gemini chatbot.',
  overview: 'A Flask platform built for three audiences. Admins manage announcements, events, venues, QR links and esports tournaments from an admin panel. A touch-optimised tablet kiosk shows everything publicly in a swipeable carousel, with a screensaver and a lockdown that blocks shortcuts. "Red", a Gemini 2.0 Flash chatbot, answers student questions using the live database as context and falls back to offline keyword matching when the quota runs out. Tournaments get auto-generated single-elimination, double-elimination or round-robin brackets that advance winners automatically. Every admin change is pushed to all kiosks instantly over Socket.IO.',
  features: [
    'Announcement CRUD with drafts, scheduling, expiry, priority ordering and image optimisation',
    'Bracket engine: single-elim padded with BYEs, double-elim with Grand Final, round-robin by circle method',
    'Six AI automations (categorise, seed, schedule, rebracket, format advice), each with a non-AI fallback',
    'Chatbot "Red": 6-turn memory, 10 msgs/min limit, 3 suggested replies, 65 s offline mode on quota errors',
    'Kiosk mode: 8 s carousel, 2-minute screensaver, thumb-sized bottom nav, shortcut lockdown',
    'Security: login rate limiting, CSRF, HTML sanitising, audit log and password-reset tokens',
    'Deployed with Docker Compose — PostgreSQL 16 behind a Cloudflare Tunnel'
  ],
  stack: {
    'Backend':  ['Python', 'Flask 3', 'SQLAlchemy 2', 'Flask-SocketIO', 'Flask-Login', 'eventlet', 'gunicorn'],
    'AI':       ['Google Gemini 2.0 Flash', 'Keyword fallback engine'],
    'Data':     ['PostgreSQL 16', 'SQLite (dev)', 'Flask-Migrate'],
    'Frontend': ['Jinja2', 'Tailwind CSS', 'Vanilla JS', 'Socket.IO client'],
    'DevOps':   ['Docker Compose', 'Cloudflare Tunnel', 'pytest']
  },
  langs: [['Python', 45], ['HTML / Jinja', 30], ['JavaScript', 15], ['CSS', 10]],
  metrics: [
    { label: 'Lines of code', value: '~15k' },
    { label: 'Bracket formats', value: '3' },
    { label: 'AI automations', value: '6' },
    { label: 'Data models', value: '12' }
  ],
  flow: {
    nodes: [
      { id: 'admin', label: 'Admin Panel', col: 0, detail: '21 Jinja templates — announcements, tournaments, events, users, logs.' },
      { id: 'kiosk', label: 'Kiosk Tablet', col: 0, detail: 'Touch carousel, brackets, chatbot, screensaver and lockdown.' },
      { id: 'flask', label: 'Flask Routes', col: 1, detail: 'admin.py, kiosk.py and a JSON API — rate limited and CSRF protected.' },
      { id: 'ai', label: 'AI Service', col: 2, detail: 'Gemini 2.0 Flash for categorising, seeding and chat — keyword fallback when offline.' },
      { id: 'bracket', label: 'Bracket Engine', col: 2, detail: 'Single / double elimination and round-robin with auto-advance.' },
      { id: 'db', label: 'PostgreSQL', col: 3, detail: '12 models, including Tournament, Match, ChatLog and ActivityLog.' },
      { id: 'ws', label: 'Socket.IO Push', col: 3, detail: 'Broadcasts announcement_update / tournament_update to every kiosk.' }
    ],
    edges: [['admin','flask'],['kiosk','flask'],['flask','ai'],['flask','bracket'],['ai','db'],['bracket','db'],['db','ws'],['ws','kiosk']]
  },
  timeline: [
    { date: 'Mar 2026', label: 'Project start — data models and admin panel' },
    { date: 'Apr 2026', label: 'Bracket engine and kiosk UI' },
    { date: 'May 2026', label: 'Gemini chatbot "Red" and AI automations' },
    { date: 'Jul 2026', label: 'Dockerised and deployed through a Cloudflare Tunnel' }
  ],
  source: { type: 'folder', path: 'C:\\Personal_Projects\\Announcements_System', updatePending: false },
  widget: 'bracket'
},
{
  id: 'facial-recognition',
  title: 'AI-Based Facial Recognition Visitor Management System',
  short: 'Facial Recognition VMS',
  category: 'academic',
  status: 'Completed',
  glyph: 'Fr',
  pitch: 'A campus gate terminal that recognises returning visitors by face, rejects photo or screen spoofs, and pushes each visit to the host\'s phone for approval.',
  overview: 'Built for Batangas State University as a thesis project. A guard terminal streams camera frames for live alignment checks and auto-captures once the face holds steady. RetinaFace finds the face (with seven fallback preprocessing passes for bad lighting), MiniFASNet checks it is a live person, Facenet512 turns it into a 512-number embedding, and a FAISS index finds the closest match. Returning visitors get their form pre-filled. The host is notified through Firebase Cloud Messaging and accepts or declines in a Flutter mobile app while the terminal waits for the answer.',
  features: [
    'Auto-capture once alignment stays ≥ 70% for ~800 ms, with on-screen guidance',
    'Anti-spoofing liveness check (MiniFASNet) that rejects printed photos and screens',
    'Returning-visitor recognition through a FAISS cosine-similarity index (match ≥ 0.85)',
    'Host approval in a Flutter app through FCM push, with a polling fallback',
    'Visitor queue of up to 5 simultaneous check-ins',
    'Admin dashboard: logs, user management, embedding purge, index rebuild',
    'JWT for mobile, hardened session cookies for admin, bcrypt and rate limiting'
  ],
  stack: {
    'AI / Vision': ['RetinaFace', 'MiniFASNet', 'Facenet512 (DeepFace)', 'FAISS', 'OpenCV', 'TensorFlow 2.13', 'dlib'],
    'Backend':     ['Python 3.10', 'Flask', 'Flask-Limiter', 'PyJWT', 'gunicorn'],
    'Data':        ['PostgreSQL 16', 'psycopg2'],
    'Mobile':      ['Flutter', 'Firebase Cloud Messaging', 'provider'],
    'Frontend':    ['HTML', 'CSS', 'Vanilla JS (camera module)'],
    'DevOps':      ['Docker Compose']
  },
  langs: [['Python', 34], ['JavaScript', 28], ['Dart', 12], ['Docs', 26]],
  metrics: [
    { label: 'Embedding size', value: '512-d' },
    { label: 'Match threshold', value: '0.85' },
    { label: 'Flask routes', value: '40' },
    { label: 'Lines incl. docs', value: '~21.6k' }
  ],
  flow: {
    nodes: [
      { id: 'cam', label: 'Gate Camera', col: 0, detail: 'Browser canvas streams frames for live alignment feedback.' },
      { id: 'detect', label: 'RetinaFace', col: 1, detail: 'Face detection at 0.65 confidence, plus 7 fallback preprocessing passes.' },
      { id: 'live', label: 'MiniFASNet', col: 1, detail: 'Liveness score — anything below 0.5 is rejected as a spoof.' },
      { id: 'embed', label: 'Facenet512', col: 2, detail: 'Produces a normalised 512-dimension face embedding.' },
      { id: 'faiss', label: 'FAISS Index', col: 2, detail: 'Top-5 cosine search; ≥ 0.85 counts as a returning visitor.' },
      { id: 'db', label: 'PostgreSQL', col: 3, detail: 'visitors, users, office_notifications, fcm_tokens.' },
      { id: 'fcm', label: 'FCM Push', col: 3, detail: 'Firebase Admin SDK notifies the host\'s devices.' },
      { id: 'app', label: 'Flutter App', col: 4, detail: 'The host accepts or declines; the terminal polls every 5 s.' }
    ],
    edges: [['cam','detect'],['detect','live'],['live','embed'],['embed','faiss'],['faiss','db'],['db','fcm'],['fcm','app'],['app','db']]
  },
  timeline: [
    { date: 'Feb 2026', label: 'Initial face pipeline and terminal UI' },
    { date: 'Mar 2026', label: 'Liveness check and FAISS index' },
    { date: 'Apr 2026', label: 'Flutter approval app with FCM' },
    { date: 'May 2026', label: 'PostgreSQL migration, Docker, defense documentation' }
  ],
  source: { type: 'zip', path: 'C:\\Personal_Projects\\Retina_based (2).zip', updatePending: true },
  widget: 'facepipe'
},
{
  id: 'datalens',
  title: 'DataLens Analytics Platform',
  short: 'DataLens',
  category: 'academic',
  status: 'Completed',
  glyph: 'DL',
  pitch: 'Upload a spreadsheet and get a finished audit-grade report — a dual-mode offline analytics platform for businesses and Philippine government offices.',
  overview: 'A technopreneurship capstone (codename "Sentrix") that automates the path from a raw CSV, Excel or JSON upload to a PDF or HTML report. A schema detector maps columns by fuzzy-matching more than 200 known name variants, a cleaner scores data quality from 0 to 100, and a mode router sends the data to the right engines. Business mode covers sales, forecasting, segmentation, inventory, HR and anomalies. Government mode covers procurement red flags aligned with Commission on Audit practice — Benford\'s Law, split-transaction detection and vendor concentration — plus budget utilisation and ledger audits. Every upload is SHA-256 hashed for the audit trail.',
  features: [
    'Schema intelligence: fuzzy matching of 200+ column-name variants',
    'Data-quality score with imputation, deduplication and outlier tagging',
    'Procurement engine: Benford chi-square, split transactions near ₱1M, HHI vendor concentration',
    'Forecasting with Prophet (Philippine holidays) and auto-ARIMA fallback',
    'RFM + K-Means customer segmentation and Isolation Forest anomaly detection',
    'Confidence score on every finding; PDF, HTML, CSV and Excel exports',
    'SHA-256 audit trail and run history'
  ],
  stack: {
    'Backend':    ['Python', 'Flask 3.1', 'SQLAlchemy 2', 'pydantic 2', 'gunicorn'],
    'Analytics':  ['pandas', 'scikit-learn', 'statsmodels', 'SciPy', 'Prophet', 'pmdarima', 'XGBoost', 'SHAP', 'PyOD'],
    'Reporting':  ['Plotly', 'Jinja2', 'WeasyPrint', 'xhtml2pdf'],
    'Data':       ['SQLite']
  },
  langs: [['Python', 62], ['HTML / Jinja', 24], ['JavaScript', 8], ['CSS', 6]],
  metrics: [
    { label: 'Analysis engines', value: '12' },
    { label: 'Column variants', value: '200+' },
    { label: 'HHI alert', value: '> 2500' },
    { label: 'Lines of code', value: '~15k' }
  ],
  flow: {
    nodes: [
      { id: 'up', label: 'Upload', col: 0, detail: 'CSV, XLSX or JSON — hashed with SHA-256 for the audit trail.' },
      { id: 'schema', label: 'Schema Detector', col: 1, detail: 'Fuzzy-maps columns onto canonical dimensions.' },
      { id: 'clean', label: 'Data Cleaner', col: 1, detail: 'Imputation, dedupe, date normalisation, quality score 0–100.' },
      { id: 'router', label: 'Mode Router', col: 2, detail: 'Business or Government mode, chosen once at onboarding.' },
      { id: 'biz', label: 'Business Engines', col: 3, detail: 'Sales, forecasting, financials, RFM, inventory, HR, expenses, anomalies.' },
      { id: 'gov', label: 'Government Engines', col: 3, detail: 'Procurement anomalies, budget utilisation, ledger audit, project monitoring.' },
      { id: 'viz', label: 'Plotly Charts', col: 4, detail: 'Interactive charts and KPI tiles with confidence scores.' },
      { id: 'report', label: 'PDF / HTML Report', col: 4, detail: 'Jinja2 templates rendered with WeasyPrint.' }
    ],
    edges: [['up','schema'],['schema','clean'],['clean','router'],['router','biz'],['router','gov'],['biz','viz'],['gov','viz'],['viz','report']]
  },
  timeline: [
    { date: 'Feb 2026', label: 'Technical blueprint and ingestion pipeline' },
    { date: 'Feb 2026', label: 'Business engines and first generated reports' },
    { date: 'Mar 2026', label: 'Government procurement and ledger engines completed' }
  ],
  source: { type: 'folder', path: 'C:\\Personal_Projects\\DataLens', updatePending: false },
  widget: 'benford'
},
{
  id: 'incubator',
  title: 'Incubator Monitoring App (IncuWatch)',
  short: 'Incubator Monitoring App',
  category: 'academic',
  status: 'Prototype',
  glyph: 'In',
  pitch: 'A solar-ready smart egg incubator: ESP32 firmware streams live chamber data to a Flutter farmer app, backed by a physics-based simulator.',
  overview: 'IncuWatch automates the 21-day chicken incubation cycle for off-grid farmers. An ESP32 reads a DHT22 temperature and humidity sensor every 2 seconds, drives the heater, lamp and fan with hysteresis control, and turns the eggs with two mirrored servos. It moves through four stages automatically — Pre-Heat, Setter, Hatcher (lockdown) and Complete — and the app reminds the farmer of each milestone. A Flask-SocketIO simulator speaks the exact same protocol, so the Flutter app can switch between the simulator and the real hardware just by changing an IP address.',
  features: [
    'Automatic 4-stage incubation programme over 21 days',
    'Heater, lamp and fan hysteresis control with egg turning every 2 hours',
    'Physics-based simulator: insulation loss, door-open penalty, room drift, sensor noise',
    'Flutter app: gauge rings, 120-point history charts, severity-sorted alerts, hatch calendar',
    'Same WebSocket JSON protocol for simulator and hardware',
    'Browser dashboard with an animated chamber and control sliders'
  ],
  stack: {
    'Hardware':  ['ESP32 Dev Module', 'DHT22', '2× servos', 'Relays', 'Solar + battery (proposed)'],
    'Firmware':  ['C++ (Arduino / PlatformIO)', 'ArduinoJson 7', 'WebSockets', 'ESP32Servo'],
    'Simulator': ['Python', 'Flask', 'Flask-SocketIO'],
    'Mobile':    ['Flutter', 'socket_io_client', 'fl_chart', 'provider', 'local notifications'],
    'Web':       ['HTML', 'CSS', 'JavaScript', 'PWA service worker']
  },
  langs: [['C++', 23], ['Dart', 40], ['JavaScript / Web', 31], ['Python', 6]],
  metrics: [
    { label: 'Incubation cycle', value: '21 days' },
    { label: 'Sensor interval', value: '2 s' },
    { label: 'Turn interval', value: '2 h' },
    { label: 'Lines of code', value: '~7.9k' }
  ],
  flow: {
    nodes: [
      { id: 'dht', label: 'DHT22 Sensor', col: 0, detail: 'Temperature and humidity every 2 seconds.' },
      { id: 'esp', label: 'ESP32 Firmware', col: 1, detail: 'Stage machine, heater/lamp/fan hysteresis and servo egg-turning.' },
      { id: 'act', label: 'Heater · Fan · Servos', col: 2, detail: 'Relays and mirrored servos driven by the firmware.' },
      { id: 'ws', label: 'WebSocket :5050', col: 2, detail: 'Broadcasts the JSON chamber state.' },
      { id: 'sim', label: 'Flask Simulator', col: 1, detail: 'Physics model that emits the same protocol for testing.' },
      { id: 'app', label: 'Flutter App', col: 3, detail: 'Overview, Analytics, Alerts and Calendar tabs.' }
    ],
    edges: [['dht','esp'],['esp','act'],['esp','ws'],['sim','ws'],['ws','app'],['app','ws']]
  },
  timeline: [
    { date: 'Mar 2026', label: 'Web simulator and monitor dashboard' },
    { date: 'Apr 2026', label: 'Flutter IncuWatch app' },
    { date: 'May 2026', label: 'ESP32 firmware with WebSocket protocol' }
  ],
  source: { type: 'zip', path: 'C:\\Personal_Projects\\Incubator_Techno.zip', updatePending: true },
  widget: 'incubator'
},

/* ────────────────────────────── CASUAL ────────────────────────────── */
{
  id: 'causal',
  title: 'Causal Discovery (CausalLab)',
  short: 'Causal Discovery',
  category: 'casual',
  status: 'Completed',
  glyph: 'Cd',
  pitch: 'Cause-and-effect graph learning written from scratch — the PC algorithm and BIC hill-climbing — benchmarked against the causal-learn library.',
  overview: 'CausalLab is a small Python library plus a web demo that learns causal graphs from observational data. The PC algorithm is implemented from scratch: skeleton discovery with Fisher-Z conditional-independence tests, v-structure orientation and Meek\'s rules. A score-based hill-climber searches DAGs using a Gaussian BIC score. Synthetic data comes from random structural causal models, and a benchmark compares both methods with causal-learn on structural Hamming distance, F1 and runtime. In the Flask demo the learned graph is drawn over the true one, with every edge marked correct, reversed, extra or missing.',
  features: [
    'PC algorithm from scratch with separating sets and CI-test counting',
    'Fisher-Z partial-correlation test behind a pluggable interface',
    'Greedy hill-climbing with cached BIC local scores',
    'Synthetic SCMs: linear-Gaussian, linear non-Gaussian and nonlinear noise',
    'Metrics: SHD, skeleton F1, oriented F1 and runtime',
    'Interactive Cytoscape.js demo with colour-coded edge status'
  ],
  stack: {
    'Core':     ['Python', 'NumPy', 'SciPy', 'pandas', 'NetworkX'],
    'Baseline': ['causal-learn'],
    'Web':      ['Flask', 'Cytoscape.js', 'Vanilla JS'],
    'Tooling':  ['Matplotlib', 'pytest']
  },
  langs: [['Python', 85], ['JavaScript', 10], ['HTML / CSS', 5]],
  metrics: [
    { label: 'Skeleton F1', value: '0.981' },
    { label: 'Oriented F1', value: '0.866' },
    { label: 'vs causal-learn', value: '~7× faster' },
    { label: 'Lines of code', value: '~2k' }
  ],
  flow: {
    nodes: [
      { id: 'gen', label: 'Data Generator', col: 0, detail: 'Random DAG → structural causal model → samples.' },
      { id: 'pc', label: 'PC Algorithm', col: 1, detail: 'Fisher-Z CI tests, v-structures, Meek rules → CPDAG.' },
      { id: 'hc', label: 'Hill-Climb (BIC)', col: 1, detail: 'Add / remove / reverse edges with cycle rejection.' },
      { id: 'eval', label: 'Metrics', col: 2, detail: 'SHD and F1 compared against the true CPDAG.' },
      { id: 'bench', label: 'Benchmark', col: 3, detail: 'CSV results and Matplotlib figures.' },
      { id: 'web', label: 'Flask + Cytoscape', col: 3, detail: 'Overlay of learned vs true graph.' }
    ],
    edges: [['gen','pc'],['gen','hc'],['pc','eval'],['hc','eval'],['eval','bench'],['eval','web']]
  },
  timeline: [
    { date: 'Jun 2026', label: 'Library, benchmark and web demo built in a focused sprint' }
  ],
  source: { type: 'folder', path: 'C:\\Personal_Projects\\Causal Discovery', updatePending: false },
  widget: 'causal'
},
{
  id: 'gestify',
  title: 'Gestify — Gesture-Controlled Music Player',
  short: 'Gestify',
  category: 'casual',
  status: 'Completed',
  glyph: 'Ge',
  pitch: 'A desktop music player you control entirely with hand gestures through your webcam — fully offline, with a classifier you train on your own hand.',
  overview: 'A webcam feed goes through MediaPipe Hands, which finds 21 landmarks on your hand. Static poses are recognised by finger-geometry rules or by a small neural network you train yourself, and swipes are recognised from the hand\'s path across frames. Ten gestures control playback. The design rule: frequent actions get effortless gestures, while rare or irreversible ones need a deliberate hold. A training wizard captures samples in bursts, augments them, trains the classifier and reports cross-validated accuracy. Everything runs locally in a native window — no server, no network.',
  features: [
    '10 gestures mapped by how often each action is used',
    'Two recognition modes: rule-based geometry or a personal MLP classifier',
    'Training wizard with burst capture and 4× data augmentation',
    'Swipe sensitivity calibration saved between sessions',
    'Playlists, shuffle, repeat and volume control through pygame',
    'Native pywebview window with a live hand-skeleton overlay'
  ],
  stack: {
    'Vision': ['MediaPipe Hands', 'OpenCV'],
    'ML':     ['scikit-learn MLP', 'StandardScaler', 'joblib'],
    'App':    ['Python', 'pywebview', 'pygame'],
    'UI':     ['HTML', 'CSS', 'JavaScript']
  },
  langs: [['Python', 47], ['JavaScript', 25], ['CSS', 20], ['HTML', 8]],
  metrics: [
    { label: 'Hand landmarks', value: '21' },
    { label: 'Gestures', value: '10' },
    { label: 'Training samples', value: '406' },
    { label: 'Hidden layers', value: '128 · 64' }
  ],
  flow: {
    nodes: [
      { id: 'cam', label: 'Webcam', col: 0, detail: 'OpenCV capture on a background thread.' },
      { id: 'mp', label: 'MediaPipe Hands', col: 1, detail: '21 × 3D landmarks → a 63-number vector.' },
      { id: 'det', label: 'Gesture Detector', col: 2, detail: 'Rules or trained MLP, plus a trajectory buffer for swipes.' },
      { id: 'map', label: 'Action Map', col: 3, detail: 'Gesture → play, pause, skip, volume, shuffle, repeat, quit.' },
      { id: 'player', label: 'pygame Player', col: 4, detail: 'MP3 / WAV / OGG playback.' },
      { id: 'ui', label: 'pywebview UI', col: 4, detail: 'Live camera frames and player state.' }
    ],
    edges: [['cam','mp'],['mp','det'],['det','map'],['map','player'],['map','ui']]
  },
  timeline: [
    { date: 'Feb 2026', label: 'Built over a weekend — detector, player and trainer' }
  ],
  source: { type: 'folder', path: 'C:\\Personal_Projects\\Gestify', updatePending: false },
  widget: 'gestures'
},
{
  id: 'librarian',
  title: 'Local AI Librarian',
  short: 'Librarian AI',
  category: 'casual',
  status: 'In Design',
  glyph: 'Li',
  pitch: 'Chat with your own documents, completely offline — retrieval-augmented generation with Ollama, LlamaIndex and ChromaDB in a native desktop window.',
  overview: 'A privacy-first desktop app, currently in the design phase. You add PDFs, Word files, text, Markdown and HTML, then ask questions in plain language and get answers with source citations — no cloud and no API keys. Documents are split into 512-token chunks with overlap, embedded locally with all-MiniLM-L6-v2 and stored in a persistent ChromaDB index. A question is embedded the same way, the five most similar chunks are retrieved, and a prompt that only allows answers from those documents goes to a local Ollama model.',
  features: [
    'Multi-format ingestion: PDF, DOCX, TXT, Markdown, HTML',
    'Semantic search over a persistent local vector index',
    'Answers with collapsible source citations',
    'Library view with chunk counts and index dates',
    'Switch between local Ollama models from the UI',
    'Native desktop window via PyWebView'
  ],
  stack: {
    'AI':       ['Ollama (llama3.2 / mistral)', 'LlamaIndex', 'sentence-transformers'],
    'Data':     ['ChromaDB', 'PyMuPDF', 'python-docx'],
    'Backend':  ['Python 3.11', 'Flask', 'Waitress'],
    'Frontend': ['HTMX', 'Tailwind CSS', 'PyWebView']
  },
  langs: [['Python', 70], ['HTML / HTMX', 20], ['CSS', 10]],
  metrics: [
    { label: 'Chunk size', value: '512 tok' },
    { label: 'Embedding', value: '384-d' },
    { label: 'Retrieved', value: 'top-5' },
    { label: 'Cloud calls', value: '0' }
  ],
  flow: {
    nodes: [
      { id: 'docs', label: 'Your Documents', col: 0, detail: 'PDF, DOCX, TXT, MD, HTML.' },
      { id: 'split', label: 'Chunker', col: 1, detail: 'SentenceSplitter — 512 tokens with 50-token overlap.' },
      { id: 'emb', label: 'MiniLM Embeddings', col: 2, detail: 'all-MiniLM-L6-v2, 384 dimensions, local.' },
      { id: 'chroma', label: 'ChromaDB', col: 3, detail: 'Persistent vector index with file/page metadata.' },
      { id: 'q', label: 'Your Question', col: 2, detail: 'Embedded the same way, top-5 by cosine similarity.' },
      { id: 'llm', label: 'Ollama LLM', col: 4, detail: 'Answers only from retrieved chunks, with citations.' }
    ],
    edges: [['docs','split'],['split','emb'],['emb','chroma'],['q','chroma'],['chroma','llm']]
  },
  timeline: [
    { date: 'Feb 2026', label: 'Project overview and 5-phase plan written' },
    { date: 'Next', label: 'Phase 1 — RAG pipeline in the terminal' }
  ],
  source: { type: 'folder', path: 'C:\\Personal_Projects\\Librarian_A.I', updatePending: false },
  widget: 'rag'
},
{
  id: 'local-llm',
  title: 'Local LLM — ARIA Desktop Companion',
  short: 'Local LLM (ARIA)',
  category: 'casual',
  status: 'Completed',
  glyph: 'Ar',
  pitch: 'An offline AI companion with a Live2D avatar that runs Llama 3.2 locally and reads your PC\'s live health data before every reply.',
  overview: 'ARIA pairs a local LLM running in Ollama with an animated Live2D Cubism avatar. Before every message, a live system snapshot — CPU, RAM, GPU, disk, network, temperatures, battery and top processes — is injected into the prompt, and recent Windows Event Log errors are added when you mention a crash. The result is a witty, casual assistant that can actually explain what your computer is doing. It greets you once a day by comparing today\'s snapshot with yesterday\'s, and the avatar matches its expression and lip-sync to the reply.',
  features: [
    'Local inference: Llama 3.2 3B by default, Mistral 7B as a heavy mode',
    'Live psutil / NVML system data injected into every prompt',
    'Windows Event Log errors added when crashes are mentioned',
    'Diagnostics panel refreshing every 5 s; click any stat for a comment',
    'Live2D avatar with 8 expressions, 7 motions and lip-sync',
    'Chat history and snapshots stored in SQLite; optional SearXNG search'
  ],
  stack: {
    'AI':       ['Ollama', 'Llama 3.2 3B', 'Mistral 7B'],
    'Backend':  ['Python', 'Flask 3', 'psutil', 'pynvml', 'SQLite'],
    'Frontend': ['Live2D Cubism 4', 'pixi.js', 'Vanilla JS'],
    'Optional': ['SearXNG']
  },
  langs: [['JavaScript', 42], ['CSS', 33], ['Python', 18], ['HTML', 7]],
  metrics: [
    { label: 'Target GPU', value: 'RTX 3050' },
    { label: 'Context', value: '10 turns' },
    { label: 'Stats refresh', value: '5 s' },
    { label: 'Expressions', value: '8' }
  ],
  flow: {
    nodes: [
      { id: 'ui', label: 'Chat + Avatar', col: 0, detail: 'Live2D canvas, chat and diagnostics panel.' },
      { id: 'flask', label: 'Flask /chat', col: 1, detail: 'Builds the prompt from persona, system data and history.' },
      { id: 'tools', label: 'System Snapshot', col: 2, detail: 'psutil, pynvml and Windows Event Log.' },
      { id: 'db', label: 'SQLite', col: 2, detail: 'messages, diagnostics_log, app_state.' },
      { id: 'ollama', label: 'Ollama :11434', col: 3, detail: 'Local Llama 3.2 3B or Mistral 7B.' },
      { id: 'avatar', label: 'Emotion → Avatar', col: 4, detail: 'Picks an expression and runs lip-sync.' }
    ],
    edges: [['ui','flask'],['flask','tools'],['flask','db'],['tools','ollama'],['db','ollama'],['ollama','avatar'],['avatar','ui']]
  },
  timeline: [
    { date: 'Mar 2026', label: 'Flask backend, Ollama integration and diagnostics' },
    { date: 'Mar 2026', label: 'Live2D avatar with expressions and lip-sync' }
  ],
  source: { type: 'folder', path: 'C:\\Personal_Projects\\Local_LLM', updatePending: false },
  widget: 'aria'
},
{
  id: 'predictive-maintenance',
  title: 'Predictive Maintenance Simulator',
  short: 'Predictive Maintenance',
  category: 'casual',
  status: 'In Design',
  glyph: 'Pm',
  pitch: 'Predict how many cycles a jet engine has left — a live desktop dashboard where a health gauge sinks toward red as sensors drift.',
  overview: 'A planned offline desktop app built on NASA\'s CMAPSS turbofan dataset. The pipeline computes each engine\'s remaining useful life (capped at 125 cycles), builds rolling-window features from 14 informative sensors, and trains three model families: an Isolation Forest for unusual readings, a classifier for Healthy / Warning / Critical, and XGBoost plus an LSTM for cycles remaining. SHAP explains which sensors drive each prediction. The simulator replays a test engine cycle by cycle and streams predictions to a live dashboard.',
  features: [
    'Live replay of an engine\'s sensor feed at 1×, 2× or 5× speed',
    'Health gauge with green / yellow / red zones and RUL countdown',
    'Anomaly alert banner from an Isolation Forest',
    'SHAP explanation view and side-by-side model comparison',
    'Manual failure injection for what-if demos',
    'Train / validation / test split by engine to prevent leakage'
  ],
  stack: {
    'ML':       ['scikit-learn', 'XGBoost', 'PyTorch LSTM', 'SHAP'],
    'Data':     ['NASA CMAPSS', 'pandas', 'NumPy', 'Parquet'],
    'Backend':  ['Python 3.11', 'Flask', 'Server-Sent Events'],
    'Frontend': ['Chart.js', 'Tailwind CSS', 'PyWebView']
  },
  langs: [['Python', 75], ['JavaScript', 15], ['HTML / CSS', 10]],
  metrics: [
    { label: 'Engines', value: '100' },
    { label: 'Sensors used', value: '14' },
    { label: 'RUL cap', value: '125 cyc' },
    { label: 'Inference', value: '~10 ms' }
  ],
  flow: {
    nodes: [
      { id: 'data', label: 'CMAPSS Data', col: 0, detail: '100 training engines, 21 sensors.' },
      { id: 'feat', label: 'Feature Builder', col: 1, detail: 'RUL target, rolling windows, 14 sensors kept.' },
      { id: 'iso', label: 'Isolation Forest', col: 2, detail: 'Flags unusual readings.' },
      { id: 'rul', label: 'XGBoost + LSTM', col: 2, detail: 'Predicts cycles remaining.' },
      { id: 'sim', label: 'Replay Simulator', col: 3, detail: 'Streams one cycle at a time over SSE.' },
      { id: 'dash', label: 'Live Dashboard', col: 4, detail: 'Gauge, charts, alerts and SHAP view.' }
    ],
    edges: [['data','feat'],['feat','iso'],['feat','rul'],['iso','sim'],['rul','sim'],['sim','dash']]
  },
  timeline: [
    { date: 'Feb 2026', label: 'Project overview and architecture written' },
    { date: 'Next', label: 'Data pipeline and baseline XGBoost model' }
  ],
  source: { type: 'folder', path: 'C:\\Personal_Projects\\Predictive_Maintenance_Simulator', updatePending: false },
  widget: 'rul'
},
{
  id: 'sentinel',
  title: 'Pre-Symptomatic Anomaly Sentinel',
  short: 'Pre-Symptomatic Sentinel',
  category: 'casual',
  status: 'In Design',
  glyph: 'Ps',
  pitch: 'A screening layer that flags medical scans which look normal but may carry the earliest signatures of disease.',
  overview: 'An expert-level medical imaging design, intended as a screening aid rather than a diagnostic tool. Stage one is a convolutional autoencoder trained only on healthy scans — high reconstruction error reveals subtle anomalies. Stage two uses contrastive learning to compare a scan\'s embedding against normal and pre-symptomatic clusters. Stage three is a survival-analysis head that estimates a time-to-diagnosis distribution. The outputs combine into a 0–100 risk score with tiers, an error heatmap and a clinician flag queue, with separate weights for brain MRI, lung CT and chest X-ray.',
  features: [
    'Autoencoder trained on healthy scans — reconstruction error as anomaly signal',
    'Contrastive embeddings (SimCLR / SupCon) against reference clusters',
    'DeepSurv-style survival head estimating onset windows',
    'Composite 0–100 risk score with Low / Moderate / High / Critical tiers',
    'Error heatmap overlay and clinician review queue',
    'Per-modality weights: brain MRI, lung CT, chest X-ray'
  ],
  stack: {
    'AI':       ['PyTorch', 'Autoencoder', 'SimCLR / SupCon', 'lifelines'],
    'Imaging':  ['pydicom', 'OpenCV'],
    'Backend':  ['Flask', 'Celery', 'Redis', 'PostgreSQL'],
    'Frontend': ['Jinja2', 'Chart.js', 'Canvas']
  },
  langs: [['Python', 80], ['JavaScript', 12], ['HTML / CSS', 8]],
  metrics: [
    { label: 'Pipeline stages', value: '3' },
    { label: 'Risk scale', value: '0–100' },
    { label: 'Modalities', value: '3' },
    { label: 'Difficulty', value: '5 / 5' }
  ],
  flow: {
    nodes: [
      { id: 'scan', label: 'DICOM Scan', col: 0, detail: 'Brain MRI, lung CT or chest X-ray.' },
      { id: 'ae', label: 'Autoencoder', col: 1, detail: 'Reconstruction error map from a healthy-only model.' },
      { id: 'con', label: 'Contrastive Layer', col: 1, detail: 'Distance to normal vs pre-symptomatic clusters.' },
      { id: 'surv', label: 'Survival Head', col: 2, detail: 'Time-to-diagnosis distribution.' },
      { id: 'score', label: 'Risk Composer', col: 3, detail: 'Composite 0–100 score and tier.' },
      { id: 'queue', label: 'Clinician Queue', col: 4, detail: 'Heatmap overlay and review flags.' }
    ],
    edges: [['scan','ae'],['scan','con'],['ae','surv'],['con','surv'],['ae','score'],['surv','score'],['score','queue']]
  },
  timeline: [
    { date: 'Jun 2026', label: 'Concept, three-stage architecture and dataset plan' },
    { date: 'Next', label: 'Autoencoder baseline on public datasets' }
  ],
  source: { type: 'folder', path: 'C:\\Personal_Projects\\Pre-Symptomatic Sentinel', updatePending: false },
  widget: 'sentinel'
},
{
  id: 'temporal',
  title: 'Temporal Disease Progression Engine',
  short: 'Temporal Progression Engine',
  category: 'casual',
  status: 'Prototype',
  glyph: 'Tp',
  pitch: 'Reads a patient\'s scans over time and projects what a future scan may look like — with explanations and honest uncertainty.',
  overview: 'A clinician uploads three or more dated scans and picks a 30, 60 or 90-day horizon. A five-stage background job (register → CNN → LSTM → decode → Grad-CAM) returns a clearly watermarked synthetic future scan, a heatmap showing what drove the prediction, a progression-velocity score, a risk tier and Monte-Carlo-dropout confidence. The prototype was built "mock-first": the async job system, progress tracking and every screen are real, while each model stage returns fixture data behind a single switch where the PyTorch model will plug in.',
  features: [
    'Async Celery jobs with stage-by-stage progress',
    'Synthetic-scan watermark and a disclaimer that can\'t be dismissed',
    'Risk always shown as colour + icon + label, never colour alone',
    'Roles (clinician, reviewer, admin) and an append-only audit log',
    'Colour-blind-safe heatmap toggle and reduced-motion support',
    'One switch (fixtures ↔ live) for plugging in the real model'
  ],
  stack: {
    'Backend':  ['Python', 'Flask 3', 'Celery 5', 'Redis 7', 'SQLAlchemy 2'],
    'Data':     ['SQLite', 'PostgreSQL 16'],
    'Model (planned)': ['ResNet-50 encoder', '2-layer LSTM', 'Grad-CAM', 'MC Dropout'],
    'Frontend': ['Jinja2', 'Chart.js', 'Canvas viewer'],
    'DevOps':   ['Docker Compose', 'pytest', 'ruff']
  },
  langs: [['Python', 50], ['HTML / Jinja', 25], ['JavaScript', 15], ['CSS', 10]],
  metrics: [
    { label: 'Job stages', value: '5' },
    { label: 'Horizons', value: '30/60/90 d' },
    { label: 'Screens', value: '10' },
    { label: 'Tests', value: '15' }
  ],
  flow: {
    nodes: [
      { id: 'up', label: 'Scan Sequence', col: 0, detail: '3+ timestamped scans uploaded by a clinician.' },
      { id: 'q', label: 'Celery + Redis', col: 1, detail: 'Async job with progress polling.' },
      { id: 'reg', label: 'Registration', col: 2, detail: 'Aligns scans across timepoints.' },
      { id: 'cnn', label: 'CNN → LSTM', col: 2, detail: 'Per-scan features, then the trajectory.' },
      { id: 'dec', label: 'Decoder + Grad-CAM', col: 3, detail: 'Synthetic future scan and heatmap.' },
      { id: 'res', label: 'Results & Report', col: 4, detail: 'Velocity, risk tier, confidence and PDF export.' }
    ],
    edges: [['up','q'],['q','reg'],['reg','cnn'],['cnn','dec'],['dec','res']]
  },
  timeline: [
    { date: 'Jun 2026', label: 'UI/UX build guide and mock-first prototype' },
    { date: 'Next', label: 'Swap fixtures for the live PyTorch model' }
  ],
  source: { type: 'folder', path: 'C:\\Personal_Projects\\Temporal Progression Engine', updatePending: false },
  widget: 'temporal'
},
{
  id: 'finance',
  title: 'Zenith — Savings Planner (Finance App)',
  short: 'Finance App',
  category: 'casual',
  status: 'In Progress',
  glyph: 'Ze',
  pitch: 'A private, offline savings and investment planner whose monthly targets rebalance themselves. No accounts, no ads.',
  overview: 'A Flutter app for Android. Users create "funds" across ten-plus asset classes — savings, UITF, REIT, stocks, bonds, crypto, precious metals and tokenised uranium — each with an optional target amount and date. The monthly recommendation spreads what is left over the remaining months, so skipping a month raises it and overpaying lowers it. Totals are converted into a base currency (Philippine peso by default) using free exchange-rate feeds with offline caching. It also tracks expenses, transfers and recurring plans, and exports JSON backups and PDF statements.',
  features: [
    'Adaptive monthly targets that rebalance after every deposit',
    'Goal progress capped per fund, so one surplus can\'t hide another shortfall',
    'Multi-currency, metals, crypto and uranium priced through one rate map',
    'Free rate feeds with fallbacks and offline cache',
    'Analytics: diversification, cash flow, assets over time',
    'JSON backup, PDF statements and a one-time Pro upgrade'
  ],
  stack: {
    'Mobile':   ['Flutter', 'Dart 3', 'provider', 'fl_chart'],
    'Storage':  ['shared_preferences', 'path_provider'],
    'Services': ['Exchange-rate APIs', 'CoinGecko', 'Google Play Billing'],
    'Export':   ['pdf', 'share_plus', 'file_picker']
  },
  langs: [['Dart', 100]],
  metrics: [
    { label: 'Asset classes', value: '10+' },
    { label: 'Dart files', value: '38' },
    { label: 'Tests', value: '34' },
    { label: 'Lines of code', value: '~9.2k' }
  ],
  flow: {
    nodes: [
      { id: 'api', label: 'Rate Feeds', col: 0, detail: 'Currency API → mirror → open.er-api, CoinGecko for uranium.' },
      { id: 'ex', label: 'ExchangeService', col: 1, detail: 'Per-USD rate map with offline cache.' },
      { id: 'prov', label: 'FundsProvider', col: 2, detail: 'State for funds, expenses, transfers and plans.' },
      { id: 'store', label: 'Local Storage', col: 2, detail: 'shared_preferences and JSON backups.' },
      { id: 'an', label: 'Analytics', col: 3, detail: 'Base-currency totals, targets and diversification.' },
      { id: 'ui', label: 'Flutter Screens', col: 4, detail: 'Plan, Assets, Expenses, Analytics, Settings.' }
    ],
    edges: [['api','ex'],['ex','prov'],['store','prov'],['prov','an'],['an','ui']]
  },
  timeline: [
    { date: 'Jun 2026', label: 'Core planner, funds and analytics' },
    { date: 'Jun 2026', label: 'Pro tier, PDF statements and Play Store listing drafted' }
  ],
  source: { type: 'zip', path: 'C:\\Personal_Projects\\Finance_App.zip', updatePending: true },
  widget: 'savings'
},
{
  id: 'system-diagnostic',
  title: 'System Diagnostic',
  short: 'System Diagnostic',
  category: 'casual',
  status: 'In Design',
  glyph: 'Sd',
  pitch: 'A lightweight, offline system-health monitor that watches CPU, memory, disk and temperatures and explains problems in plain language.',
  overview: 'A standalone spin-off of the diagnostics layer inside ARIA. Instead of a chat companion, it is a focused monitoring tool: it samples system health on a schedule, raises alerts when thresholds are crossed (CPU above 90%, RAM above 85%, disk above 95%), keeps a history for trend analysis, and summarises what is happening and what to do about it. This entry is a placeholder that will be expanded as the project takes shape.',
  features: [
    'Scheduled sampling of CPU, RAM, GPU, disk, network and temperatures',
    'Threshold alerts: CPU > 90%, RAM > 85%, disk > 95%',
    'Historical log for spotting trends and recurring spikes',
    'Plain-language summaries of problems and suggested fixes',
    'Runs offline with near-zero idle cost'
  ],
  stack: {
    'Core':     ['Python', 'psutil', 'pynvml'],
    'Storage':  ['SQLite'],
    'Optional': ['Ollama (local summaries)']
  },
  langs: [['Python', 100]],
  metrics: [
    { label: 'CPU alert', value: '> 90%' },
    { label: 'RAM alert', value: '> 85%' },
    { label: 'Disk alert', value: '> 95%' },
    { label: 'Cloud calls', value: '0' }
  ],
  flow: {
    nodes: [
      { id: 'os', label: 'Operating System', col: 0, detail: 'CPU, memory, disk, sensors and event logs.' },
      { id: 'sample', label: 'Sampler', col: 1, detail: 'psutil / pynvml on a schedule.' },
      { id: 'rules', label: 'Threshold Rules', col: 2, detail: 'Raises alerts when limits are crossed.' },
      { id: 'db', label: 'SQLite History', col: 2, detail: 'Stores snapshots for trends.' },
      { id: 'out', label: 'Alerts & Summary', col: 3, detail: 'Plain-language explanation of the issue.' }
    ],
    edges: [['os','sample'],['sample','rules'],['sample','db'],['rules','out'],['db','out']]
  },
  timeline: [
    { date: 'Aug 2026', label: 'Project folder created — scope defined from ARIA\'s diagnostics layer' },
    { date: 'Next', label: 'Sampler and alert rules' }
  ],
  source: { type: 'folder', path: 'C:\\Personal_Projects\\System_Diagnostic', updatePending: false },
  widget: 'diagnostic'
},
{
  id: 'vault',
  title: 'Vault — Ouroboros Second Brain',
  short: 'Vault',
  category: 'casual',
  status: 'Ongoing',
  glyph: 'Va',
  progress: 80,
  pitch: 'An Obsidian-style second brain over plain Markdown files it never converts — with the Ouroboros, a 3D serpent of your notes where the tail is the oldest thought and the head the newest.',
  overview: 'Vault opens an ordinary folder of Markdown notes and treats it the way Obsidian does: the files stay exactly as they are, and the app\'s own data lives in a hidden .vault folder beside them. On top of that folder it builds a link index, a search index and a timeline of when each note first appeared. The Flutter workspace gives you tabs, a file tree, search, bookmarks, tags, backlinks, an outline and properties, plus an editor with live highlighting and [[ autocomplete. Its signature is the Ouroboros: every note becomes a gem on a serpent eating its own tail, ordered from oldest to newest and coloured by project, with a time scrubber that replays how the vault grew. A newer web edition (v2) makes the serpent the whole interface, infers links between notes that never mention each other, and watches the folder live.',
  features: [
    'Wikilinks with headings, aliases and paths — renaming or moving a note rewrites every link to it',
    'Backlinks with unlinked mentions and a one-click "Link" action',
    'Search operators: "phrase", -exclude, tag:, path:, file:, line:',
    'Editor with live Markdown highlighting, [[ and #tag autocomplete, list continuation',
    'Reading view with callouts, embeds, tasks, tables, highlighted code and Mermaid diagrams',
    'Quick switcher (Ctrl+O), command palette (Ctrl+P), daily notes and templates',
    'Ouroboros graph (three.js): time scrubber, "Replay growth", project filters',
    'Web edition: inferred links (TF-IDF, shared tags), live file watching over SSE, offline snapshot'
  ],
  stack: {
    'App':      ['Flutter', 'Dart', 'markdown_widget', 'highlight', 'file_picker'],
    'State':    ['ChangeNotifier', 'InheritedNotifier'],
    'Storage':  ['Plain Markdown files (dart:io)', 'shared_preferences', 'JSON snapshot'],
    'Graph':    ['three.js', 'Mermaid', 'TypeScript', 'esbuild'],
    'Web (v2)': ['Vite', 'TypeScript', 'markdown-it', 'Node.js API + SSE', 'Service worker'],
    'Testing':  ['dart test', 'Puppeteer']
  },
  langs: [['Dart', 50], ['TypeScript', 46], ['JavaScript', 2], ['CSS / HTML', 2]],
  metrics: [
    { label: 'Lines of code', value: '~17k' },
    { label: 'Workspace panes', value: '11' },
    { label: 'Tests', value: '~43' },
    { label: '10k notes indexed', value: '~14 s' }
  ],
  flow: {
    nodes: [
      { id: 'md', label: 'Markdown Folder', col: 0, detail: 'Plain .md files, untouched; app data lives in a hidden .vault folder.' },
      { id: 'repo', label: 'VaultRepository', col: 1, detail: 'Reads, writes and lists notes — disk on desktop, a snapshot on the web.' },
      { id: 'idx', label: 'Core Indexes', col: 2, detail: 'Link index, search index, note metadata, timeline and the link rewriter.' },
      { id: 'ctl', label: 'Controllers', col: 3, detail: 'VaultController (files, settings) and WorkspaceController (tabs, panes, history).' },
      { id: 'ui', label: 'Workspace UI', col: 4, detail: 'Editor, reading view, 11 panes, palette and quick switcher.' },
      { id: 'graph', label: 'Ouroboros Engine', col: 4, detail: 'three.js serpent of notes: tail = oldest, head = newest.' },
      { id: 'pwa', label: 'Web Edition (SSE)', col: 2, detail: 'Node API streams file changes; links inferred by TF-IDF and shared tags.' }
    ],
    edges: [['md','repo'],['repo','idx'],['idx','ctl'],['ctl','ui'],['ctl','graph'],['md','pwa'],['pwa','graph']]
  },
  timeline: [
    { date: '23 Nov 2026', label: 'Flutter scaffold, core indexes, link rewriting and tests' },
    { date: '24 Nov 2026', label: 'Web preview and the Ouroboros graph' },
    { date: '24 Nov 2026', label: 'Web edition v2 — serpent-first interface with live sync' },
    { date: 'Next', label: 'Windows WebView2 graph host and native packaging' }
  ],
  roadmap: [
    { key: 'R1', label: 'Second-brain workspace (links, search, panes)', done: true },
    { key: 'R2', label: 'Ouroboros graph with time scrubber', done: true },
    { key: 'R3', label: 'Web edition with live file watching', done: true },
    { key: 'R4', label: 'Windows WebView2 graph host', done: false },
    { key: 'R5', label: 'Native Android / Windows packaging', done: false }
  ],
  source: { type: 'folder', path: 'C:\\Personal_Projects\\Obsidian_Vault', updatePending: false },
  widget: 'ouroboros'
},

/* ──────────────────────────── LONG TERM ───────────────────────────── */
{
  id: 'dear-day',
  title: 'Dear Day',
  short: 'Dear Day',
  category: 'longterm',
  status: 'In Progress',
  glyph: 'Dd',
  progress: 72,
  pitch: '"A little place for every kind of day." A private companion app — end-to-end encrypted, offline-first, running as a PWA plus Android and Windows apps, in English and Simplified Chinese.',
  overview: 'Dear Day gathers a set of quiet "places" in one app: a 3D comfort room, a scrapbook with an instant-film camera, a 3D observatory of the real night sky, a garden where nothing wilts, a make-up practice studio with paintable 3D heads, a journal, an offline map, a study corner and mini-games. Its product rules are strict and enforced by tests — no streaks, no guilt messages, no tracking or analytics. Records live first on the device in IndexedDB and sync through a Flask and PostgreSQL server with end-to-end encryption, so the server only ever holds ciphertext. The Android and Windows apps carry the same PWA inside a Flutter shell.',
  features: [
    'End-to-end encrypted sync: AES-256-GCM, HKDF, ECDH and ECDSA P-256 via WebCrypto',
    'Device pairing by QR code with six-digit confirmation; one-tap revoke-and-rekey',
    '3D night sky (three.js): HYG star catalogue, planets from orbital elements, 260 cities, 1800–2050',
    'Offline map with on-device A* routing — ~20 ms per route, within ~2% of the online router',
    'Make-up studio: 6 heads × 4 ages, 800+ shades in OKLCH, 22 procedural hairstyles',
    'Fully bilingual (≈2,240 translated strings) with signed content packs',
    'Flutter shells for Android (with a Kotlin home-screen widget) and Windows'
  ],
  stack: {
    'Frontend': ['React 19', 'TypeScript 5.9', 'Vite', 'three.js', 'Dexie (IndexedDB)', 'MapLibre GL', 'Workbox PWA'],
    'Security': ['WebCrypto', 'AES-256-GCM', 'ECDH / ECDSA P-256', 'HKDF-SHA-256'],
    'Backend':  ['Python 3.13', 'Flask / APIFlask', 'SQLAlchemy 2', 'Alembic', 'PostgreSQL'],
    'Native':   ['Flutter', 'Kotlin widget', 'WebView2'],
    'Tooling':  ['Vitest', 'Playwright', 'ruff', 'mypy', 'pnpm', 'Blender scripts']
  },
  langs: [['TypeScript', 69], ['CSS', 18], ['Python', 6], ['Dart / Kotlin', 2], ['Other', 5]],
  metrics: [
    { label: 'Lines of code', value: '~110k' },
    { label: 'Commits', value: '94' },
    { label: 'Unit tests', value: '540+' },
    { label: 'Places', value: '14' }
  ],
  flow: {
    nodes: [
      { id: 'ui', label: 'React Places', col: 0, detail: '14 places — sky, garden, journal, map, studio and more.' },
      { id: 'dexie', label: 'IndexedDB', col: 1, detail: 'Offline-first records via Dexie.' },
      { id: 'enc', label: 'Encrypt (AES-GCM)', col: 2, detail: 'Per-record keys derived from a master key; padded to hide size.' },
      { id: 'srv', label: 'Flask Sync API', col: 3, detail: 'Stores ciphertext only — never sees content.' },
      { id: 'pg', label: 'PostgreSQL', col: 4, detail: 'Encrypted blobs, device IDs, timestamps.' },
      { id: 'shell', label: 'Flutter Shell', col: 1, detail: 'Android / Windows wrapper with native bridges.' }
    ],
    edges: [['ui','dexie'],['dexie','enc'],['enc','srv'],['srv','pg'],['shell','ui']]
  },
  timeline: [
    { date: '9 Nov 2026', label: 'Blueprint v1.0, scaffold, first places, bilingual support' },
    { date: '10–15 Nov', label: 'Camera, music, make-up studio, English corner, comfort room' },
    { date: '16 Nov', label: 'Offline map routing, night-sky pass, PWA + Flutter shell' },
    { date: '17 Nov', label: 'Encrypted sync server, client crypto, QR pairing' },
    { date: '18–22 Nov', label: 'Content packs, Android widget, revoke-and-rekey, workshop console' }
  ],
  roadmap: [
    { key: 'R1', label: 'Invitation-based activation', done: false },
    { key: 'R2', label: '24-word recovery phrase', done: false },
    { key: 'R3', label: 'Passkeys vs device keys decision', done: false },
    { key: 'R4', label: 'Re-key after single-device removal', done: false },
    { key: 'R5', label: 'On-device encryption at rest', done: false },
    { key: 'R6', label: 'Hosting, domain and HTTPS', done: false },
    { key: 'R7', label: 'Independent security review', done: false }
  ],
  source: { type: 'folder', path: 'C:\\Personal_Projects\\Dear_day', updatePending: false },
  widget: 'e2e'
},
{
  id: 'aletheia',
  title: 'Aletheia — Visual Novel',
  short: 'Aletheia',
  category: 'longterm',
  status: 'In Progress',
  glyph: 'Al',
  progress: 38,
  pitch: 'A psychological-romance visual novel where the horror lives in the interface — the dialogue box, the menus and the title quietly break depending on how much of her you uncover.',
  overview: 'The player courts "Lethe" (Greek for oblivion), whose real name is Aletheia (Greek for truth). Three hidden meters — Affinity, Dread and Fixation — feed a single resolver that picks one of seven endings, and each dark ending breaks a different part of the interface. A save that persists across playthroughs means she remembers: the title screen changes to reflect the last ending, and its letters drift from LETHE toward ALETHEIA. It runs on a fully custom C# engine in Unity 6.5 with a bespoke scripting language, and one codebase produces four pitch builds.',
  features: [
    'Seven endings from one resolver grid over three hidden meters',
    'Four dialogue-box text modes (normal, scribble, choked, dead) and a "grammar-break" effects kit',
    'Title menu that remembers: seven identities, including a hand-drawn decay that plays while idle',
    'Custom URP shader that glitches only her figure (warp, datamosh, RGB split)',
    'Custom .vnscript language parsed by a hand-written engine — no Naninovel, Fungus or Ink',
    'Build profiles: one word switches between Prototype, First Playable, Vertical Slice and Full'
  ],
  stack: {
    'Engine':   ['Unity 6.5', 'URP 2D', 'C#', 'TextMeshPro', 'uGUI'],
    'Systems':  ['Custom .vnscript parser', 'DialogueRunner', 'MetaSave (cross-run memory)'],
    'Graphics': ['Custom HLSL shader', 'Post-processing'],
    'Tooling':  ['Git', 'PowerShell validator', 'Editor scene builder']
  },
  langs: [['C#', 78], ['.vnscript', 22]],
  metrics: [
    { label: 'Endings', value: '7' },
    { label: 'Chapters written', value: '4' },
    { label: 'C# lines', value: '~8.3k' },
    { label: 'Commits', value: '41' }
  ],
  flow: {
    nodes: [
      { id: 'script', label: '.vnscript Files', col: 0, detail: 'Story written in a custom scripting language.' },
      { id: 'parser', label: 'ScriptParser', col: 1, detail: 'Builds a command list and label map.' },
      { id: 'runner', label: 'DialogueRunner', col: 2, detail: 'Coroutine loop holding meters, flags and memory.' },
      { id: 'ui', label: 'UI · Characters · FX', col: 3, detail: 'Dialogue box modes, sprites, shader glitches, audio.' },
      { id: 'resolver', label: 'Ending Resolver', col: 3, detail: 'Affinity / Dread / Fixation → 1 of 7 endings.' },
      { id: 'meta', label: 'MetaSave', col: 4, detail: 'Cross-playthrough memory that rewrites the title screen.' }
    ],
    edges: [['script','parser'],['parser','runner'],['runner','ui'],['runner','resolver'],['resolver','meta'],['meta','ui']]
  },
  timeline: [
    { date: '4 Jul 2026', label: 'Custom engine and scene builder' },
    { date: '5–6 Jul', label: 'Seven-ending system and build profiles' },
    { date: '7 Jul', label: 'Title decay and custom figure shader' },
    { date: '9–10 Jul', label: 'Vertical Slice re-routed to the Good path' },
    { date: '11–13 Jul', label: 'Chapters 1–4 in game, UI shell, art imports' }
  ],
  roadmap: [
    { key: 'T0', label: 'Shader include and branding', done: false },
    { key: 'T1', label: 'UI shell (save, load, log, config)', done: true },
    { key: 'T2', label: 'Final art, audio and fonts', done: false },
    { key: 'T3', label: 'Chapters 5+ and reworked dark endings', done: false },
    { key: 'T4', label: 'Mini-games and optional Live2D', done: false },
    { key: 'T5', label: 'QA, save migration, accessibility', done: false },
    { key: 'T6', label: 'Steam / itch.io release and content rating', done: false }
  ],
  source: { type: 'folder', path: 'C:\\Personal_Projects\\Visual_Novel', updatePending: false },
  widget: 'resolver'
}
];
