# University Announcement Kiosk System — Documentation

## 1. Overview

The University Announcement Kiosk System is a web-based application built for **Batangas State University**. It serves two purposes:

1. **Admin Panel** — A management interface where administrators create and manage announcements, esports tournaments, brackets, and user accounts.
2. **Kiosk Display** — A public-facing, touch-optimized interface designed to run on a tablet (via a mini PC) that displays announcements, tournament brackets, and provides an AI chatbot for students and visitors.

The system is built with **Python/Flask** on the backend and uses **HTML/Tailwind CSS/JavaScript** on the frontend. Data is stored in an **SQLite** database (with PostgreSQL support for production). Real-time updates between the admin panel and kiosk displays are handled via **WebSockets (Socket.IO)**.

---

## 2. Technology Stack

| Layer | Technology |
|---|---|
| Backend Framework | Flask 3.0 (Python) |
| Database ORM | Flask-SQLAlchemy / SQLAlchemy 2.0 |
| Database | SQLite (development), PostgreSQL (production) |
| Database Migrations | Flask-Migrate (Alembic) |
| Authentication | Flask-Login |
| Real-time Communication | Flask-SocketIO (WebSockets) |
| AI Chatbot | Google Gemini API (gemini-2.0-flash model) |
| Tournament Integration | Challonge API (pychallonge) |
| Frontend CSS | Tailwind CSS (CDN) |
| Icons | Font Awesome 6 |
| Image Processing | Pillow |
| Environment Config | python-dotenv |
| CORS | Flask-CORS |

---

## 3. Project Structure

```
Announcements_System/
├── app.py                  # Application entry point and factory
├── config.py               # Configuration classes (dev/prod)
├── models.py               # Database models (SQLAlchemy)
├── seed.py                 # Sample data seeder for testing
├── requirements.txt        # Python dependencies
├── .env                    # Environment variables (secret keys, API keys)
├── routes/
│   ├── admin.py            # Admin panel routes (CRUD, auth, dashboard)
│   ├── api.py              # API routes (chatbot, data endpoints, Challonge sync)
│   └── kiosk.py            # Kiosk display routes (public-facing pages)
├── templates/
│   ├── admin/              # Admin panel HTML templates
│   │   ├── base.html
│   │   ├── login.html
│   │   ├── dashboard.html
│   │   ├── announcements.html
│   │   ├── announcement_form.html
│   │   ├── tournaments.html
│   │   ├── tournament_form.html
│   │   ├── tournament_bracket.html
│   │   ├── tournament_participants.html
│   │   ├── users.html
│   │   ├── logs.html
│   │   └── chat_logs.html
│   └── kiosk/              # Kiosk display HTML templates
│       ├── base.html
│       ├── home.html
│       ├── announcements.html
│       ├── announcement_detail.html
│       ├── tournaments.html
│       └── tournament_detail.html
├── static/
│   ├── css/kiosk.css       # Kiosk-specific styles (touch, scrolling, screensaver)
│   ├── js/kiosk.js         # Kiosk JavaScript (WebSocket, chatbot, screensaver)
│   ├── img/                # Static images
│   └── uploads/            # User-uploaded images (announcement/tournament images)
└── instance/               # Flask instance folder (auto-created, holds SQLite DB)
```

---

## 4. Application Startup

The application uses the **Flask application factory pattern** defined in `app.py`:

1. `create_app()` is called, which reads the `FLASK_ENV` environment variable to choose between development and production configuration.
2. Flask extensions are initialized: SQLAlchemy (database), Flask-Migrate (migrations), Flask-Login (authentication), Flask-CORS, and Flask-SocketIO (WebSockets).
3. Three blueprints are registered:
   - `/admin` — Admin panel
   - `/kiosk` — Public kiosk display
   - `/api` — JSON API and chatbot endpoints
4. Database tables are created automatically on first run.
5. A default admin account is seeded if no users exist in the database (credentials come from environment variables).
6. The root URL (`/`) redirects to the admin login page.

The server runs on `0.0.0.0:5000` using SocketIO, which enables both HTTP and WebSocket connections.

---

## 5. Configuration

Configuration is managed through the `Config` class in `config.py` and environment variables loaded from a `.env` file.

Key settings:
- **SECRET_KEY** — Flask session encryption key.
- **DATABASE_URL** — Database connection string. Defaults to a local SQLite file (`kiosk.db`).
- **GEMINI_API_KEY** — Google Gemini API key for the AI chatbot.
- **CHALLONGE_USERNAME / CHALLONGE_API_KEY** — Challonge API credentials for tournament syncing.
- **ADMIN_USERNAME / ADMIN_PASSWORD / ADMIN_EMAIL** — Default admin account created on first run.
- **MAX_CONTENT_LENGTH** — 16 MB upload limit for images.
- **ALLOWED_EXTENSIONS** — png, jpg, jpeg, gif, webp.
- **SESSION_PERMANENT = False** — Admin sessions expire when the browser is closed.

Two configurations exist: `DevelopmentConfig` (debug on) and `ProductionConfig` (debug off).

---

## 6. Database Models

All models are defined in `models.py` using Flask-SQLAlchemy.

### 6.1 User
Stores admin accounts. Fields include username, email, password hash, admin flag, and creation timestamp. Passwords are hashed using Werkzeug's `generate_password_hash` and verified with `check_password_hash`. Integrates with Flask-Login via the `UserMixin` class.

### 6.2 Announcement
Stores announcements displayed on the kiosk. Key fields:
- **title, content** — The announcement text.
- **category** — One of: General, Event, Esports, Academic, Urgent.
- **image_filename** — Optional uploaded image.
- **priority** — Integer; higher values appear first.
- **is_active** — Toggle to show/hide the announcement.
- **scheduled_at** — Optional future publish date (announcement hidden until this time).
- **expires_at** — Optional expiration date (announcement hidden after this time).
- **views** — View counter incremented each time the kiosk displays it.
- **created_by** — Foreign key to the User who created it.

A computed property `is_published` checks whether the announcement should be visible based on active status, schedule, and expiration.

### 6.3 Tournament
Stores esports tournament information. Key fields:
- **name, game, description** — Basic tournament info.
- **tournament_type** — Single elimination, double elimination, or round robin.
- **status** — One of: upcoming, registration, ongoing, completed.
- **max_teams** — Maximum number of participating teams.
- **registration_open** — Boolean flag for registration status.
- **challonge_id / challonge_url** — Optional Challonge integration fields.
- **image_filename** — Optional banner image.
- **start_date / end_date** — Tournament schedule.
- **prize_info / rules** — Additional tournament details.

Has relationships to `TournamentParticipant` and `TournamentMatch` (cascade delete).

### 6.4 TournamentParticipant
Stores teams/players registered for a tournament. Fields include team name, seed number, and optional Challonge participant ID.

### 6.5 TournamentMatch
Stores individual matches within a tournament bracket. Fields include round number, match number, team names, scores, winner, status (pending/ongoing/completed), and optional Challonge match ID.

### 6.6 ChatLog
Logs every AI chatbot conversation. Stores the session ID, user message, AI response, and timestamp.

### 6.7 ActivityLog
Logs admin actions for auditing. Stores the user ID, action description, details, IP address, and timestamp.

---

## 7. Features

### 7.1 Admin Panel (`/admin`)

Accessible at `/admin/login`. Requires authentication. The admin panel provides:

#### Authentication
- Login/logout with username and password.
- Sessions are non-permanent (expire on browser close).
- Strong session protection (sessions invalidated on client change).
- An `admin_required` decorator restricts certain actions (like user management) to admin users.

#### Dashboard (`/admin/dashboard`)
Displays a summary overview with:
- Total and active announcement counts.
- Total and ongoing tournament counts.
- Total user and chat log counts.
- 10 most recent activity log entries.
- 5 most recent announcements.

#### Announcement Management (`/admin/announcements`)
Full CRUD (Create, Read, Update, Delete) for announcements:
- **Create**: Set title, content, category, priority, optional image upload, optional schedule and expiration dates.
- **Edit**: Modify all fields; replace image (old image is deleted from disk).
- **Delete**: Removes the announcement and its associated image file.
- **Toggle**: Quickly activate or deactivate an announcement.
- **Pagination**: 10 announcements per page with category filtering.

Every create/edit/delete/toggle action emits a WebSocket event (`announcement_update`) so connected kiosk displays refresh in real time.

#### Tournament Management (`/admin/tournaments`)
Full CRUD for tournaments:
- **Create/Edit**: Set name, game, description, type, status, max teams, dates, prize info, rules, and banner image.
- **Delete**: Removes the tournament and all associated participants and matches (cascade).

#### Participant Management (`/admin/tournaments/<id>/participants`)
- Add teams/players to a tournament with an optional seed number.
- Remove participants.

#### Bracket Management (`/admin/tournaments/<id>/bracket`)
- **Auto-generate bracket**: Creates a single-elimination bracket from the participant list. Handles BYE slots when the participant count isn't a power of two. BYE matches are auto-completed.
- **Score updates**: Enter scores for each match and declare a winner. When a winner is declared, the system automatically advances them to the correct slot in the next round. When all matches are completed, the tournament status is set to "completed."

Tournament bracket changes also emit WebSocket events for real-time kiosk updates.

#### User Management (`/admin/users`)
- View all admin accounts.
- Create new admin accounts.
- Delete admin accounts (cannot delete your own account).
- Restricted to admin-level users via the `admin_required` decorator.

#### Activity Logs (`/admin/logs`)
Paginated list of all admin actions (logins, logouts, creates, edits, deletes, etc.) with timestamps and IP addresses.

#### Chat Logs (`/admin/chat-logs`)
Paginated list of all AI chatbot conversations, showing user messages and AI responses.

---

### 7.2 Kiosk Display (`/kiosk`)

The public-facing display optimized for touch-screen tablets. Uses a dark theme with red accent colors matching the university branding.

#### Home Page (`/kiosk/`)
- Displays an auto-sliding carousel of all active, non-expired, currently-scheduled announcements.
- Sorted by priority (highest first), then by creation date (newest first).
- Each view increments the announcement's view counter.

#### Announcements List (`/kiosk/announcements`)
- Scrollable list of all active announcements.
- Filterable by category (General, Event, Esports, Academic, Urgent).
- Touch-optimized with smooth scrolling.

#### Announcement Detail (`/kiosk/announcements/<id>`)
- Full detail view of a single announcement with its image, content, and category.
- Increments the view counter.

#### Tournaments List (`/kiosk/tournaments`)
- Lists all tournaments (upcoming, registration, ongoing, completed).
- Sorted by start date (most recent first).

#### Tournament Detail (`/kiosk/tournaments/<id>`)
- Displays tournament information, participant list, and the full bracket.
- Matches are grouped by round for bracket visualization.

#### Kiosk UI Features
- **Bottom navigation bar**: Thumb-reachable navigation at the bottom of the screen (home, announcements, tournaments, chat).
- **Touch optimization**: Disabled text selection, disabled right-click, disabled pull-to-refresh, smooth touch scrolling.
- **Screensaver**: After 2 minutes of inactivity, a screensaver with a clock display appears. Any touch interaction dismisses it.
- **Auto-refresh**: When the screensaver is active, the page auto-refreshes every 5 minutes to keep content current.
- **Tablet sleep/wake handling**: Reconnects WebSocket and resets timers when the device wakes from sleep.
- **Kiosk lockdown**: Common keyboard shortcuts (F11, Escape, Ctrl+L/T/N/W) are blocked to prevent users from leaving the kiosk browser.
- **Page transitions**: Smooth fade/slide animations between pages.
- **Responsive design**: CSS media queries for small tablets (600-899px), large tablets (900px+), and phone-sized screens (<600px).

---

### 7.3 AI Chatbot (`/api/chat`)

An AI-powered chatbot accessible from the kiosk display. Students can ask questions about announcements, tournaments, schedules, and match results.

#### How It Works
1. The user sends a message from the kiosk chat interface.
2. The server builds a **context string** containing current announcements, tournament info, participant lists, and recent match results from the database.
3. If a valid Gemini API key is configured and the API quota has not been exhausted, the message is sent to **Google Gemini (gemini-2.0-flash)** along with the context and conversation history.
4. If the API is unavailable (no key, quota exhausted, or error), an **offline fallback** system handles the response using keyword matching against the database.
5. The response is returned with contextual quick-reply suggestion buttons.
6. Every conversation is logged to the `ChatLog` table.

#### Gemini Integration
- The system prompt tells Gemini it is the "AI Assistant for the Batangas State University Esports Kiosk."
- Up to 6 previous conversation turns (12 messages) are included for context continuity.
- Current announcements (up to 10) and tournaments (up to 10, with participants and recent match results) are included as context data.
- Responses are kept under 150 words and formatted for tablet reading.

#### Offline Fallback
When Gemini is unavailable, the system uses keyword-based matching to answer common questions:
- Announcements/news queries → returns latest active announcements.
- Tournament/bracket/game queries → returns current tournaments and teams.
- Results/winner/score queries → returns recent completed match results.
- Participant/team queries → returns tournament participant lists.
- Schedule/date queries → returns upcoming event dates.
- Greetings, help requests, thanks, and goodbyes → returns appropriate canned responses.
- Unrecognized queries → returns a general help message.

#### Rate Limiting
- Maximum 10 messages per minute per session.
- Messages are capped at 500 characters.
- Rate-limited users receive a friendly "please wait" message.

#### Gemini Quota Management
- The system tracks when a Gemini API quota error occurs (HTTP 429 or resource exhausted).
- After a quota error, the system automatically falls back to offline mode for 65 seconds before retrying the API.
- This prevents repeated failed API calls and provides uninterrupted service.

---

### 7.4 Real-Time Updates (WebSocket)

The system uses Flask-SocketIO for real-time communication between the admin panel and kiosk displays.

- When an admin creates, edits, deletes, or toggles an announcement, an `announcement_update` event is emitted.
- When an admin updates a tournament, generates a bracket, or updates a match score, a `tournament_update` event is emitted.
- Kiosk clients listen for these events. On receiving an `announcement_update`, the kiosk page reloads after a 1-second delay. On receiving a `tournament_update`, tournament pages reload similarly.
- The kiosk JavaScript automatically reconnects the WebSocket if the connection drops or the tablet wakes from sleep.

---

### 7.5 Challonge Integration (`/api/challonge/sync/<id>`)

Tournaments can optionally be linked to Challonge (a popular tournament bracket platform):
- Each tournament has optional `challonge_id` and `challonge_url` fields.
- The sync endpoint pulls participants and match data from Challonge and updates the local database.
- Requires Challonge username and API key to be configured in the environment variables.

---

### 7.6 JSON API Endpoints

The API blueprint (`/api`) provides JSON endpoints used by the kiosk JavaScript for live data:

| Endpoint | Method | Description |
|---|---|---|
| `/api/announcements` | GET | Returns all active, non-expired announcements as JSON. |
| `/api/tournaments` | GET | Returns all tournaments with participant counts. |
| `/api/tournaments/<id>/bracket` | GET | Returns bracket data grouped by round. |
| `/api/chat` | POST | Sends a message to the AI chatbot and returns a response. |
| `/api/challonge/sync/<id>` | POST | Syncs a tournament with external Challonge data. |

---

## 8. Image Upload Handling

- Uploaded images are saved to `static/uploads/` with a UUID-based filename to prevent name collisions.
- Allowed file types: PNG, JPG, JPEG, GIF, WEBP.
- Maximum upload size: 16 MB.
- When an announcement or tournament image is replaced, the old file is deleted from disk.
- When an announcement is deleted, its associated image is also deleted.

---

## 9. Security Features

- **Password hashing**: All passwords are hashed using Werkzeug's secure hashing (PBKDF2).
- **Login required**: All admin routes require authentication via Flask-Login.
- **Admin-only routes**: Sensitive routes (user management) require the `admin_required` decorator.
- **Session protection**: Set to "strong" — sessions are invalidated if the client fingerprint changes.
- **Non-permanent sessions**: Sessions expire when the browser closes; no "remember me" persistence.
- **Secure file uploads**: Filenames are sanitized and replaced with UUIDs. File extensions are validated against an allowlist.
- **Input validation**: Announcements require title and content; tournaments require name and game; messages are capped at 500 characters.
- **Rate limiting**: Chatbot endpoint enforces 10 requests per minute per session.
- **CORS enabled**: Cross-origin requests are allowed (configured via Flask-CORS).
- **Environment variables**: Sensitive values (secret key, API keys, database URL) are stored in `.env` and loaded via python-dotenv.

---

## 10. Activity Logging

Every significant admin action is recorded in the `ActivityLog` table:
- Login and logout events.
- Announcement create, edit, delete, and toggle actions.
- Tournament create, edit, and delete actions.
- Participant add and remove actions.
- Bracket generation and score updates.
- User create and delete actions.

Each log entry records the user ID, action name, details string, client IP address, and timestamp.

---

## 11. How to Run

### Prerequisites
- Python 3.9 or higher.
- A virtual environment is recommended.

### Setup Steps

1. Create and activate a virtual environment:
   ```
   python -m venv venv
   venv\Scripts\activate        # Windows
   source venv/bin/activate     # Linux/Mac
   ```

2. Install dependencies:
   ```
   pip install -r requirements.txt
   ```

3. Copy `.env.example` to `.env` and fill in your values:
   ```
   copy .env.example .env
   ```

4. Run the application:
   ```
   python app.py
   ```

5. Access the system:
   - Admin panel: `http://localhost:5000/admin`
   - Kiosk display: `http://localhost:5000/kiosk`

6. (Optional) Seed sample data for testing:
   ```
   python seed.py
   ```

### Default Admin Credentials
- Username: `admin`
- Password: `admin123`

These can be changed via the `ADMIN_USERNAME` and `ADMIN_PASSWORD` environment variables before first run, or by editing the user account in the admin panel after login.

---

## 12. Summary

The system provides a complete solution for managing and displaying university announcements and esports tournaments on a tablet kiosk. Admins manage content through a web-based dashboard, and changes appear on the kiosk display in real time via WebSockets. An AI chatbot powered by Google Gemini (with an offline fallback) allows students to ask questions about announcements and tournaments directly from the kiosk.
