# 💪 VAH Health — Stake-to-Earn Student Fitness Platform

**VAH Health** is a full-stack web application that uses behavioral economics to help college and university students build lasting health habits. Users pledge a ₹2,000 deposit and earn it back in ₹500 weekly installments by hitting daily health goals and submitting live camera proof.

> _"Free health apps fail because there are zero consequences."_

---

## ✨ Features

### 🏦 Deposit-Based Accountability
- **₹2,000 smart escrow pledge** — fully refundable upon completing the 30-day challenge
- Weekly ₹500 milestone payouts tied to verified daily activity
- Built on proven **Loss Aversion** behavioral science

### 📊 15-Column Health Dashboard
- Track **steps, calories, water intake, sleep, workout type & duration, BPM**, and more
- Daily goal percentage calculation with visual progress indicators
- Historical log view with edit and delete capabilities

### 📸 Live Proof Verification
- In-browser **smartphone camera capture** — no app install required
- Cryptographic **timestamp + GPS watermark** stamped onto every proof image
- Proof status tracking: `pending → verified`

### 🏆 Community Leaderboard & Competitive Rewards
- Real-time rankings across all users sorted by today's steps, goal completion, and verified days
- Highlights current user and shows daily activity summaries
- **Daily reward redistribution** — top performers earn mild bonuses funded by bottom performers:

| Position | Daily Effect | 30-Day Max Impact |
|---|---|---|
| **Top 25%** | Earn ₹5–15 bonus | Up to +₹450 |
| **Middle 50%** | No change | ₹0 |
| **Bottom 25%** | Mild ₹5–15 deduction | Up to -₹450 |

> Zero-sum pool: total bonuses = total deductions. No money is created or destroyed. Deductions stop at ₹0 escrow (no negative balances). Users without a deposit are exempt.

### 🔐 Authentication System
- Email + password registration and login with **SHA-256 password hashing**
- Bearer token session management
- **1-click demo mode** for instant dashboard preview without signing up

### 📱 Fully Responsive
- Works seamlessly on **mobile browsers** (Chrome, Safari, Firefox)
- Designed for quick 10-second proof submissions between lectures

---

## 🛠 Tech Stack

| Layer       | Technology                                                    |
| ----------- | ------------------------------------------------------------- |
| **Frontend**| Vanilla HTML, CSS, JavaScript — Material Design inspired      |
| **Backend** | Node.js (v22.5+) with native `node:http` and `node:sqlite`   |
| **Database**| SQLite with WAL journaling (zero-dependency persistence)      |
| **Fonts**   | Google Fonts — Plus Jakarta Sans, Roboto                      |
| **Hosting** | Render (API + persistent disk) · Netlify (static frontend)    |

> No frameworks, no build steps, no bundlers. Pure vanilla JavaScript — fast and lightweight.

---

## 🚀 Getting Started

### Prerequisites

- **Node.js ≥ 22.5.0** (required for native `node:sqlite` support)

### Local Development

```bash
# 1. Clone the repository
git clone https://github.com/akshay-rpillai/fitnes-app.git
cd fitnes-app

# 2. Start the server
npm start
```

The app will be running at **http://localhost:3000**. The server serves both the API and the frontend — no separate build step needed.

### Environment Variables

| Variable        | Default                        | Description                     |
| --------------- | ------------------------------ | ------------------------------- |
| `PORT`          | `3000`                         | Server port                     |
| `DATABASE_FILE` | `./vah-health.db` (project root) | Path to the SQLite database file |

---

## 📡 API Reference

All API endpoints are prefixed with `/api`. Authenticated routes require a `Bearer <token>` header.

### Auth

| Method | Endpoint              | Body                              | Description          |
| ------ | --------------------- | --------------------------------- | -------------------- |
| POST   | `/api/auth/register`  | `{ name, email, password }`       | Create a new account |
| POST   | `/api/auth/login`     | `{ email, password }`             | Log into an account  |
| POST   | `/api/demo`           | _(none)_                          | 1-click demo login   |

### State & Leaderboard (🔒 Authenticated)

| Method | Endpoint           | Body                | Description                        |
| ------ | ------------------ | ------------------- | ---------------------------------- |
| GET    | `/api/state`       | —                   | Retrieve the user's saved state    |
| PUT    | `/api/state`       | `{ state: {...} }`  | Save/update the user's state       |
| GET    | `/api/leaderboard` | —                   | Get ranked leaderboard of all users |

---

## 📂 Project Structure

```
fitnes-app/
├── main.html          # Single-page frontend (landing + dashboard + modals)
├── style.css          # Full styling — Material Design inspired, responsive
├── app.js             # Frontend logic — auth, dashboard, proof capture, charts
├── api-config.js      # Auto-detects local vs production API endpoint
├── server.js          # Node.js HTTP server with REST API + static file serving
├── schema.sql         # SQLite schema (users + workout_logs tables)
├── vah-health.db      # SQLite database (auto-created on first run)
├── package.json       # Project metadata — npm start runs the server
├── render.yaml        # Render.com Blueprint for backend deployment
├── netlify.toml       # Netlify config — redirects / → main.html
├── DEPLOYMENT.md      # Step-by-step deployment guide
└── .gitignore         # Git ignore rules
```

---

## 🌐 Deployment

The app uses a **split deployment** architecture:

- **Backend (Render)** — Node.js API server with a persistent disk for the SQLite database
- **Frontend (Netlify)** — Static files served via CDN

See [`DEPLOYMENT.md`](./DEPLOYMENT.md) for the full step-by-step guide.

### Quick Summary

1. Push to GitHub
2. Deploy backend on **Render** using the included `render.yaml` Blueprint
3. Update the production URL in `api-config.js`
4. Deploy frontend on **Netlify** — it reads `netlify.toml` automatically

---

## 🗓 30-Day Challenge Curriculum

| Phase | Days    | Focus                          | Payout  |
| ----- | ------- | ------------------------------ | ------- |
| 1     | 1 – 7   | Circadian Reset & Hydration    | ₹500    |
| 2     | 8 – 14  | Nutritional Macro Balance      | ₹500    |
| 3     | 15 – 21 | Physical Posture & Stamina     | ₹500    |
| 4     | 22 – 30 | Habit Mastery & Graduation     | ₹500    |
|       |         | **Total Refunded**             | **₹2,000** |

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/my-feature`)
3. Commit your changes (`git commit -m 'Add my feature'`)
4. Push to the branch (`git push origin feature/my-feature`)
5. Open a Pull Request

---

## 📄 License

This project is private. All rights reserved.

---

<p align="center">
  Built with 🔥 for students who are ready to put their money where their health is.
</p>
