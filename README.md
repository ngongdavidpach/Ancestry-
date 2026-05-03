# 🏺 Ancestry Records — Community Lineage System

A full-stack web application for African/South Sudanese communities to record, preserve, and explore their family lineages and biographies. Built with React + Firebase.

---

## ✨ Features

- **Multi-community** — Create or join multiple lineage communities
- **Real-time sync** — All changes appear live for every user (Firebase Firestore)
- **Authentication** — Google Sign-In or Email/Password
- **Member profiles** — Name, clan, birth/death year, place, occupation, biography
- **Photo uploads** — Portrait photos stored in Firebase Storage
- **Visual family tree** — Interactive branching tree with spouse connections
- **Search & filter** — By name, clan, gender, living/deceased
- **Export/Print** — Clean printable profile for every member
- **Role-based access** — Admins can add/edit/delete; members can view
- **Activity logging** — Tracks who added/edited what
- **22 South Sudanese clans** pre-loaded (Dinka, Nuer, Zande, Bari, etc.)

---

## 🚀 Quick Setup

### 1. Clone / download this project

```bash
cd ancestry-app
npm install
```

### 2. Create a Firebase Project

1. Go to [https://console.firebase.google.com](https://console.firebase.google.com)
2. Click **Add project** → name it (e.g. `ancestry-system`) → Continue
3. Disable Google Analytics (optional) → **Create project**

### 3. Register a Web App

1. In your project dashboard, click the **Web** icon `</>`
2. Name it (e.g. `ancestry-web`) → **Register app**
3. Copy the `firebaseConfig` object — you'll need it next

### 4. Add your Firebase config

Open `src/lib/firebase.js` and replace the placeholder values:

```js
const firebaseConfig = {
  apiKey: "AIza...",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123:web:abc123"
}
```

### 5. Enable Authentication

1. Firebase Console → **Authentication** → Get started
2. Sign-in method → Enable **Google**
3. Sign-in method → Enable **Email/Password**
4. Add your domain to **Authorized domains** when deploying

### 6. Create Firestore Database

1. Firebase Console → **Firestore Database** → Create database
2. Choose **Start in production mode** → select your region → Done
3. Go to **Rules** tab and paste the rules from `FIRESTORE_RULES.md`

### 7. Enable Firebase Storage

1. Firebase Console → **Storage** → Get started
2. Accept defaults → Done
3. Go to **Rules** tab and paste the Storage rules from `FIRESTORE_RULES.md`

### 8. Run locally

```bash
npm run dev
```

Visit `http://localhost:5173`

---

## 🌐 Deploy to Firebase Hosting

```bash
# Install Firebase CLI (once)
npm install -g firebase-tools

# Login
firebase login

# Update .firebaserc with your project ID
# Then build and deploy:
npm run build
firebase deploy
```

Your app will be live at `https://YOUR_PROJECT_ID.web.app`

---

## 📁 Project Structure

```
ancestry-app/
├── src/
│   ├── lib/
│   │   ├── firebase.js        # Firebase init + config
│   │   ├── db.js              # All Firestore + Storage operations
│   │   └── AuthContext.jsx    # Auth provider (login/logout/register)
│   ├── pages/
│   │   ├── AuthPage.jsx       # Login / Register screen
│   │   ├── CommunitiesPage.jsx # Dashboard — create/join communities
│   │   └── AncestryPage.jsx   # Main app — directory, tree, stats
│   ├── components/
│   │   └── LoadingScreen.jsx
│   ├── App.jsx                # Routes
│   ├── main.jsx               # Entry point
│   └── index.css              # Global styles + CSS variables
├── index.html
├── vite.config.js
├── firebase.json              # Firebase Hosting config
├── .firebaserc                # Firebase project alias
├── FIRESTORE_RULES.md         # Security rules to paste into console
└── package.json
```

---

## 🔐 Security Notes

- Firestore rules in `FIRESTORE_RULES.md` enforce authentication on all writes
- Community admins control member editing; public communities allow read-only viewing
- Storage rules limit uploads to images under 5MB, authenticated users only
- For production, tighten rules further to restrict writes to community members only

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + React Router v6 |
| Build | Vite 5 |
| Database | Firebase Firestore (real-time) |
| Auth | Firebase Authentication |
| Storage | Firebase Storage |
| Hosting | Firebase Hosting |
| Fonts | Cinzel + Crimson Text (Google Fonts) |

---

## 📞 Support

Built for South Sudanese and East African communities. Designed to preserve lineage across generations.
