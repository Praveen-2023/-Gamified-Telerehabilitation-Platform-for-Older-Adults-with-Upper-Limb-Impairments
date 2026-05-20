# Healthcare Gamification App

## Overview

The Healthcare Gamification App is an interactive web application designed to engage **senior citizen** in managing their health through gamified elements. Patients can track consultations, access educational content, participate in health-related chats, and play mini-games to earn rewards and badges. The app promotes proactive healthcare by integrating appointment scheduling, personalized doctor recommendations, and progress tracking.

Key features include:
- **User Dashboard**: A easy sidebar-navigated interface with sections for Home (overview stats), Consults (appointment history), Learn (health tips and quizzes), Chat (real-time messaging with doctors), and Play Game (interactive challenges).
- **Appointment Scheduling**: Calendar view starting from the upcoming week (today + 7 days onward), with time slots for morning (9 AM - 12 PM), afternoon (2 PM - 5 PM), and evening (6 PM - 9 PM). Prevents booking past dates.
- **Gamification Elements**: Earn points for completing learns, chats, and games; unlock badges for milestones like consistent check-ins.
- **Doctor Views**: Manage patient schedules, view analytics, and approve consultations.
- **Responsive Design**: Built with Tailwind CSS for seamless mobile and desktop experience.

The app is built for healthcare providers and patients, emphasizing user-friendly navigation and data privacy.

## Real-Life Exercise Game Demonstration

Below are actual recordings of senior citizens performing the exercise-based games integrated into the app.
These videos demonstrate the intended real-world use of the system during physical therapy and rehabilitation.

1️⃣ Arm Fruit Fetch — Real Exercise Demo

<video src="Arm-FruitFetch.mp4" autoplay loop muted playsinline width="400"></video>

2️⃣ Piano Reaction Game — Real Exercise Demo

<!-- <video src="PianoReactionGame.mp4" autoplay loop muted playsinline width="400"></video> -->
<!-- <video src="./PianoReactionGame.mp4" controls autoplay loop muted playsinline width="400">
  Your browser does not support the video element.
  <a href="./PianoReactionGame.mp4">Download / open the video</a>
</video> -->


https://github.com/user-attachments/assets/c5c461f2-54d6-4329-a62c-08cb835a3b5b


3️⃣ Shape Tracing — Real Exercise Demo

<!-- <video src="ShapeTracing.mp4" autoplay loop muted playsinline width="400"></video> -->
https://github.com/user-attachments/assets/983f3891-c87e-4132-bb23-13b75d11c15c

## Full App Navigation Demo

A Complite walkthrough over all the application and 3 user senarios

<video src="DemoNavigations.mp4" controls playsinline width="600"></video>

## Tech Stack

- **Frontend**: React.js with Tailwind CSS for styling and responsive layouts.
- **Backend**: Node.js with Express (serverless functions on Vercel).
- **Database**: Supabase (for user auth, appointments, and gamification data).
- **Other Tools**: React Router for navigation, react-toastify for notifications, and Linking API for external resources.

## Deployment

- **Frontend**: Hosted on Vercel at [https://hci-proj-q8al.vercel.app/](https://hci-proj-q8al.vercel.app/).
- **Backend**: Also hosted on Vercel as serverless API endpoints (e.g., `/api/games`, `/api/appointments`, `/api/users`, `/api/reminders`).

Access the live demo directly via the frontend URL. No additional setup required for hosted version.

## Local Setup & Running the App

### Prerequisites
- Node.js (v18+)
- npm or yarn
- Git

### Steps

1. **Clone the Repository**:
   ```
   git clone https://github.com/yourusername/healthcare-gamification-app.git
   cd healthcare-gamification-app
   ```

2. **Install Dependencies**:
   - For Frontend (in `/frontend` directory):
     ```
     npm install
     ```
   - For Backend (in `/backend` directory):
     ```
     npm install
     ```

3. **Environment Setup**:
   - Create a `.env` file in both frontend and backend directories.
   - To obtain the actual environment variable values, please contact me at **[vipul.patil@iitgn.ac.in](mailto:vipul.patil@iitgn.ac.in)**.
     ```
     MONGODB_URI = # contact me at **vipul.patil@iitgn.ac.in**.
     JWT_SECRET = # contact me at **vipul.patil@iitgn.ac.in**.
     PORT = 5001
     NODE_ENV = development
     ```

4. **Run the Backend**:
   ```
   cd backend
   npm run dev
   ```
   - Server starts at `http://localhost:3001` (or port specified in `.env`).

5. **Run the Frontend**:
   ```
   cd frontend
   npm start
   ```
   - App opens at `http://localhost:5173` (or port specified in `.env`).

### Troubleshooting
- If you encounter CORS issues, ensure backend allows frontend origin in middleware.
- For appointment scheduling errors, verify date logic restricts to future weeks only.
- Check console for toast notifications on successful logins or bookings.

## Sample Login Credentials

The app supports three user roles: Patient, Doctor, and caretaker. Use these for testing (passwords are simple for demo purposes; change in production).

| Role    | Username/Email          | Password | Notes |
|---------|-------------------------|----------|-------|
| Patient | patient@gmail.com    | a@gmail.com | Access dashboard, book appointments, play games. Starts with sample stats (e.g., 150 points, 3 badges). |
| Doctor  | doctor@gmail.com     | vipul%colab25  | View patient schedules, chat history, approve consults. |
| Caretaker   | caretaker@gmail.com      | aa@gmail.com   |caretaker. |

- Login via the `/login` route.
- After login, redirect to `/dashboard` based on role.
- Forgot password? Use the reset flow (emails via Supabase).

## Contributing

1. Fork the repo.
2. Create a feature branch (`git checkout -b feature/amazing-feature`).
3. Commit changes (`git commit -m 'Add some amazing feature'`).
4. Push to branch (`git push origin feature/amazing-feature`).
5. Open a Pull Request.

### Backend (Express + MongoDB)
- Install: `cd backend && npm install`
- Dev server (nodemon): `npm run dev`
- Start (prod): `npm start`
- Health check: `curl http://localhost:5001/api/health`
- Notes: No test or lint scripts are defined for the backend.

Required env (loaded via dotenv):
- `MONGODB_URI` (Mongo connection string)
- `JWT_SECRET` (for auth middleware)
- Optional email creds if using password reset (see nodemailer usage)

### Frontend (Create React App)
- Install: `cd frontend && npm install`
- Dev server: `npm start`
- Build: `npm run build`
- Tests (Jest via CRA): `npm test`
  - Run once (CI mode): `CI=true npm test -- --watchAll=false`
  - Run a single test file/pattern: `npm test -- <pattern>` (e.g., `npm test -- GamePage`)
- Lint: No explicit script; CRA includes ESLint during development/build.

Env:
- Copy `frontend/.env.example` to `.env` and set `REACT_APP_API_URL` (defaults to `http://localhost:5001/api`).

### Typical dev flow
- Start backend first (`npm run dev` in `backend/`), then start frontend (`npm start` in `frontend/`). The frontend Axios client points to the backend via `REACT_APP_API_URL`.

## Architecture overview

### High level
- Two apps:
  - `backend/`: Node.js/Express API with MongoDB (Mongoose), JWT auth, and email utilities.
  - `frontend/`: React (CRA) client with role-based pages (doctor/caretaker/patient), charts (Recharts), and icons (lucide-react).

### Backend structure
- Entry: `backend/src/server.js`
  - Sets up CORS, JSON parsing, connects to Mongo via `MONGODB_URI`.
  - Mounts routes: `/api/auth`, `/api/users`, `/api/game`.
  - Error handler returns JSON; health endpoint at `/api/health`.
- Auth middleware: `backend/src/middleware/auth.middleware.js`
  - `protect`: extracts Bearer token, verifies with `JWT_SECRET`, attaches `req.user`.
  - `doctorOnly`: guards doctor-only routes.
- Data model: `backend/src/models/user.model.js`
  - Users have `type` = doctor | patient | caretaker.
  - Game data: sessions with `levelspan`, `play[{responsetime, correct}]` where `correct ∈ {-1,0,1}` and `responsetime` is `-1` when exceeding allowed time.
  - Scoring tracked in `totalScore`; `level = floor(totalScore/100) + 1`.
- Game endpoints: `backend/src/routes/game.routes.js` → `backend/src/controllers/game.controller.js`
  - `POST /api/game/save-session` (protected): persists a session, scores entries (+10 correct, −5 incorrect; not done = 0; session score floored at 0), updates `totalScore` and `level`.
  - `GET /api/game/levelspan/:userId?` (protected): fetches `currentlevelspan` (defaults to requester).
  - `PUT /api/game/levelspan/:userId` (protected): doctor/caretaker can update `currentlevelspan` (1–10).
  - `GET /api/game/analytics/:userId` (doctor-only): aggregates response/accuracy stats and returns last 10 sessions.
  - `GET /api/game/stats/:userId?` (protected): lightweight recent-session summary (defaults to requester).
- Auth routes: `backend/src/routes/auth.routes.js` (register, login, forgot-password, OTP verify/reset). Uses email utility for OTP.

### Frontend structure
- Axios client: `frontend/src/services/api.js`
  - `baseURL = REACT_APP_API_URL || http://localhost:5001/api`.
  - Attaches `Authorization: Bearer <token>` from `localStorage`.
- Domain services: `frontend/src/services/gameService.js` wraps `/game/*` endpoints.
- Routing/Auth:
  - `frontend/src/context/AuthContext.js` manages auth state/token.
  - `frontend/src/components/common/ProtectedRoute.js` guards private routes.
- Pages (selected):
  - Doctor: dashboards, patient analytics (`pages/doctor/PatientAnalytics.js`) visualizing response times and accuracy.
  - Caretaker/Patient: dashboards and settings.
  - Game: multiple game UIs under `pages/game/` implementing reaction/pose-based interactions.
- Tooling: CRA (react-scripts), Tailwind (present in devDependencies), Recharts for visualizations, lucide-react for icons.

## Important usage notes (from README)
- Response-time model: `responsetime` ∈ [0, `levelspan`] or `-1` if exceeded; `correct` ∈ {1, −1, 0}.
- `currentlevelspan` (1–10s) is adjustable by doctor/caretaker and used by the game timer.
- API endpoints for game/session management match those listed above; frontend analytics reflect these fields.

## Contact

For issues or feedback, open a GitHub issue or email [vipul.patil@iitgn.ac.in](mailto:vipul.patil@iitgn.ac.in).

---

*Last Updated: November 17, 2025*

