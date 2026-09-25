<h1 align="center">
  <img src="client/public/favicon.svg" alt="CodeMate logo" width="28" height="auto"/>
  CodeMate
</h1>
<p align="center">Code Here. Code Now. Live coding rooms with one shared editor, real code execution, raised hands and voice.</p>

<img width="1535" height="730" alt="home-desktop" src="https://github.com/user-attachments/assets/b5acff1a-8b5e-41ab-9b32-98ddc46318f4" />

<img width="1536" height="730" alt="session-room" src="https://github.com/user-attachments/assets/784f6ee0-908d-40e1-a275-34741e79e673" />

## 🌟 Features

- 👥 **Shared editor** - Everyone in a room edits the same file in real time, with named cursors that show while someone is typing
- ▶️ **Real code execution** - Run Python, JavaScript, Java and C++; the result appears for the whole room along with who ran it
- ✋ **Raised hands** - Students raise a hand, the TA sees who is waiting and lowers it when they are done
- 🔒 **Edit control** - The TA can lock the editor and hand editing to individual students
- 🎙️ **Voice chat** - Browser-to-browser audio with per-person mute controls for the TA
- 🗂️ **Sessions dashboard** - Create rooms with a short code (`abc-defg-hij`), join by code or link, reopen ended sessions read-only
- 🌗 **Light and dark themes** - Follows the system setting, with a manual override
- 🔐 **Student and TA accounts** - Pick a role at sign-up; TAs host sessions, students join them

## 🛠️ Technology Stack

<table>
  <tr>
    <td align="center"><b>Frontend</b></td>
    <td>
      <img src="https://img.shields.io/badge/-React_19-61DAFB?style=flat-square&logo=react&logoColor=black" alt="React"/>
      <img src="https://img.shields.io/badge/-Vite-646CFF?style=flat-square&logo=vite&logoColor=white" alt="Vite"/>
      <img src="https://img.shields.io/badge/-Tailwind_CSS_4-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white" alt="Tailwind CSS"/>
      <img src="https://img.shields.io/badge/-React_Router-CA4245?style=flat-square&logo=reactrouter&logoColor=white" alt="React Router"/>
      <img src="https://img.shields.io/badge/-CodeMirror_6-D30707?style=flat-square&logo=codemirror&logoColor=white" alt="CodeMirror"/>
      <img src="https://img.shields.io/badge/-Yjs-30BCED?style=flat-square" alt="Yjs"/>
      <img src="https://img.shields.io/badge/-Socket.IO_client-010101?style=flat-square&logo=socketdotio&logoColor=white" alt="Socket.IO client"/>
      <img src="https://img.shields.io/badge/-Motion-0055FF?style=flat-square&logo=framer&logoColor=white" alt="Motion"/>
      <img src="https://img.shields.io/badge/-Phosphor_Icons-3C402B?style=flat-square" alt="Phosphor Icons"/>
    </td>
  </tr>
  <tr>
    <td align="center"><b>Backend</b></td>
    <td>
      <img src="https://img.shields.io/badge/-Node.js-339933?style=flat-square&logo=nodedotjs&logoColor=white" alt="Node.js"/>
      <img src="https://img.shields.io/badge/-Express_5-000000?style=flat-square&logo=express&logoColor=white" alt="Express"/>
      <img src="https://img.shields.io/badge/-MongoDB-47A248?style=flat-square&logo=mongodb&logoColor=white" alt="MongoDB"/>
      <img src="https://img.shields.io/badge/-Mongoose-880000?style=flat-square&logo=mongoose&logoColor=white" alt="Mongoose"/>
      <img src="https://img.shields.io/badge/-Socket.IO-010101?style=flat-square&logo=socketdotio&logoColor=white" alt="Socket.IO"/>
      <img src="https://img.shields.io/badge/-JWT-000000?style=flat-square&logo=jsonwebtokens&logoColor=white" alt="JWT"/>
      <img src="https://img.shields.io/badge/-Bcrypt-003A70?style=flat-square" alt="Bcrypt"/>
      <img src="https://img.shields.io/badge/-Zod-3E67B1?style=flat-square&logo=zod&logoColor=white" alt="Zod"/>
      <img src="https://img.shields.io/badge/-Helmet-2F2F2F?style=flat-square" alt="Helmet"/>
    </td>
  </tr>
  <tr>
    <td align="center"><b>Services</b></td>
    <td>
      <img src="https://img.shields.io/badge/-WebRTC-333333?style=flat-square&logo=webrtc&logoColor=white" alt="WebRTC"/>
      <img src="https://img.shields.io/badge/-Wandbox-4A6D8C?style=flat-square" alt="Wandbox"/>
      <img src="https://img.shields.io/badge/-MongoDB_Atlas-47A248?style=flat-square&logo=mongodb&logoColor=white" alt="MongoDB Atlas"/>
    </td>
  </tr>
  <tr>
    <td align="center"><b>DevOps</b></td>
    <td>
      <img src="https://img.shields.io/badge/-Git-F05032?style=flat-square&logo=git&logoColor=white" alt="Git"/>
      <img src="https://img.shields.io/badge/-npm-CB3837?style=flat-square&logo=npm&logoColor=white" alt="npm"/>
      <img src="https://img.shields.io/badge/-ESLint-4B32C3?style=flat-square&logo=eslint&logoColor=white" alt="ESLint"/>
      <img src="https://img.shields.io/badge/-Prettier-F7B93E?style=flat-square&logo=prettier&logoColor=black" alt="Prettier"/>
      <img src="https://img.shields.io/badge/-Vercel-000000?style=flat-square&logo=vercel&logoColor=white" alt="Vercel"/>
      <img src="https://img.shields.io/badge/-Netlify-00C7B7?style=flat-square&logo=netlify&logoColor=white" alt="Netlify"/>
      <img src="https://img.shields.io/badge/-Render-46E3B7?style=flat-square&logo=render&logoColor=black" alt="Render"/>
    </td>
  </tr>
</table>

## 📋 Prerequisites

- Node.js 22.22 or newer (the server alone runs on 20.19+)
- MongoDB: a free [MongoDB Atlas](https://www.mongodb.com/atlas) cluster or a local `mongod`
- npm
- Internet access in the browser, because code runs on the public [Wandbox](https://wandbox.org) service

## 🚀 Installation

### Clone the repository

```bash
git clone https://github.com/radsadsoap/CodeMate.git
cd CodeMate
```

### Install dependencies

```bash
# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

### Set up environment variables

Copy `server/.env.example` to `server/.env` and fill it in:

```
NODE_ENV=development
PORT=5000
MONGO_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/?retryWrites=true&w=majority
MONGO_DB_NAME=codemate
JWT_SECRET=<at least 32 random characters>
CLIENT_ORIGIN=http://localhost:5173
```

| Variable                                        | Required | Notes                                                                                               |
| ----------------------------------------------- | -------- | --------------------------------------------------------------------------------------------------- |
| `MONGO_URI`                                     | Yes      | Any MongoDB connection string. On Atlas, add your IP under **Network Access**.                      |
| `MONGO_DB_NAME`                                 | No       | Defaults to `codemate`.                                                                             |
| `JWT_SECRET`                                    | Yes      | Generate one with `node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"`. |
| `CLIENT_ORIGIN`                                 | Yes      | Comma-separated frontend origins allowed to call the API and open sockets.                          |
| `TURN_URLS`, `TURN_USERNAME`, `TURN_CREDENTIAL` | No       | A TURN relay for voice chat on strict networks. Without it, voice uses public STUN only.            |

The client needs no `.env` in development: Vite proxies `/api` and `/socket.io` to `http://localhost:5000`. See `client/.env.example` for the two optional variables.

### Run the application

```bash
# Run server
cd server
npm run dev

# Run client (in a new terminal)
cd client
npm run dev
```

Open http://localhost:5173, sign up as a TA, create a session and share its code. Open a second browser profile, sign up as a student and join with that code.

### Check the backend

With the server running, `npm run smoke` in `server/` signs up two throwaway accounts, walks through the REST and realtime flows (auth, sessions, concurrent editing, locking, hands, runs, ending) and deletes what it created. It refuses to run with `NODE_ENV=production`.

## 📁 Project Structure

```
CodeMate/
├── client/                    # React frontend (Vite)
│   ├── public/                # Favicon
│   ├── src/
│   │   ├── components/
│   │   │   ├── dashboard/     # Create and join dialogs, session rows
│   │   │   ├── editor/        # CodeMirror setup, collaborative editor, remote cursors
│   │   │   ├── landing/       # Home page sections and the animated demo
│   │   │   ├── room/          # Live room, people panel, output, voice dock, ended view
│   │   │   ├── shell/         # App layout: sessions sidebar, user panel, page header
│   │   │   └── ui/            # Button, Dialog, Sheet, Select, Tabs, Switch and friends
│   │   ├── context/           # Auth, sessions, shell, theme and toast providers
│   │   ├── hooks/             # useRoom (Yjs + Socket.IO), useVoice (WebRTC), useMediaQuery
│   │   ├── lib/               # API client, socket, code runner, languages, formatting
│   │   └── pages/             # Home, Auth, Dashboard, Room, NotFound
│   ├── netlify.toml           # SPA fallback + /api proxy for Netlify
│   └── vercel.json            # SPA fallback + /api proxy for Vercel
│
├── server/                    # Express API and Socket.IO server
│   ├── config/                # Environment validation, MongoDB connection
│   ├── controllers/           # Auth and session handlers
│   ├── middlewares/           # Auth, validation, rate limits, errors
│   ├── models/                # User and Session schemas
│   ├── realtime/              # Socket auth, room state (Y.Doc per room), event handlers
│   ├── routes/                # /api/auth and /api/sessions
│   ├── scripts/               # End-to-end smoke test
│   ├── utils/                 # Tokens, room codes, colors, constants
│   └── server.js              # Entry point: Express app, Socket.IO, graceful shutdown
│
└── docs/                      # Before and after write-ups and screenshots
```

## 🔒 Authentication

Accounts use a JWT stored in an HTTP-only, `SameSite=Lax` cookie (Secure in production) that lasts 7 days. Passwords are hashed with bcrypt, emails are normalized, and sign-in failures return one generic message so they do not reveal which emails exist. Failed sign-ins are limited to 10 per 15 minutes per network.

The Socket.IO connection goes straight to the API host, where that cookie is not sent, so the client first asks `/api/auth/socket-token` for a 60-second token and passes it in the handshake. Every realtime action is checked on the server against the authenticated user: only the host can lock the room, grant editing or mute someone, and only people allowed to edit can change the code.

## ▶️ Running Code

Code runs on [Wandbox](https://wandbox.org), a free public compiler service, straight from the browser of the person who clicks **Run**. The server only coordinates: one run at a time per room, and the output is shared with everyone together with who ran it.

| Language   | Runtime      |
| ---------- | ------------ |
| Python     | CPython 3.14 |
| JavaScript | Node.js 20   |
| Java       | OpenJDK 22   |
| C++        | GCC 13.2     |

Wandbox allows about 10 runs a minute from one network and stops programs after about 30 seconds. Running other people's code on the API server would hand them the server, and running it inside the page would give it your session, which is why it runs on an isolated service instead.

## 🌐 Deployment

The client and server deploy separately.

1.  **Server** on Render, Railway or any Node host: set the variables above with `NODE_ENV=production` and `CLIENT_ORIGIN` set to your frontend URL. Health check: `GET /api/health`.
2.  **Client** on Vercel or Netlify: replace `YOUR-API-HOST` in `client/vercel.json` or `client/netlify.toml` with the server host, and set `VITE_SOCKET_URL` to the server origin. The `/api` rewrite keeps the session cookie first-party.

## 📱 Responsive Design

The app works from phone to desktop. On small screens the sessions sidebar and the people panel open as slide-over sheets, and the editor keeps the full width.

## 📖 Docs

- [Before and after](docs/BEFORE_AND_AFTER.md): what changed in the code, security and features
- [Design before and after](docs/DESIGN_BEFORE_AND_AFTER.md): screen-by-screen comparison with screenshots

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
