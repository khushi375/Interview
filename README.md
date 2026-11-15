# 🚀 InterviewIQ – AI Powered Interview Preparation Platform

InterviewIQ is a full-stack web application that helps users prepare for technical interviews through AI-powered interview sessions. The platform allows users to practice interviews, receive AI-generated questions, and improve their interview skills in an interactive environment.

> **Note:** This project was built as part of my learning journey to explore AI integration in a MERN Stack application. The payment flow is configured in **test/sandbox mode** for demonstration purposes and does not process real transactions.

---

## 🌐 Live Demo

🔗 https://interviewiq-client-md3a.onrender.com/

---

## ✨ Features

- 🔐 Secure User Authentication (JWT)
- 🤖 AI-powered Interview Generation
- 💬 Interactive Interview Sessions
- 📊 AI Feedback & Performance Analysis
- 👤 Personalized User Dashboard
- 💳 Payment Gateway Integration (Sandbox/Test Mode)
- 📱 Fully Responsive Design
- ⚡ Fast and Modern UI

---

## 🛠️ Tech Stack

### Frontend
- React
- Redux Toolkit
- Tailwind CSS
- React Router
- Vite

### Backend
- Node.js
- Express.js
- MongoDB and Mongoose
- Firebase Admin ID-token verification
- JWT session cookies

### AI Integration
- Google Gemini API

### Deployment
- Frontend and backend: Render
- Database: MongoDB Atlas

---

## 📂 Project Structure

```
InterviewIQ
│
├── client/
│   ├── src/
│   ├── public/
│   └── package.json
│
├── server/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── config/
│   └── package.json
│
└── README.md
```

---

## ⚙️ Installation

### Clone the Repository

```bash
git clone https://github.com/khushi375/Interview.git
cd Interview
npm ci
```

---

## 🔑 Environment Variables

Create `server/.env` and `client/.env` using the matching example files. Keep real credentials out of Git.

```env
# server/.env
NODE_ENV=development
PORT=8000
MONGODB_URL=your_mongodb_connection_string
JWT_SECRET=your_long_random_secret
GEMINI_API_KEY=your_gemini_api_key
FIREBASE_ADMIN_PROJECT_ID=terviewiq
FIREBASE_ADMIN_CLIENT_EMAIL=your_firebase_service_account_email
FIREBASE_ADMIN_PRIVATE_KEY="your_firebase_private_key_with_escaped_newlines"
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
CLIENT_URL=http://localhost:5173

# client/.env
VITE_FIREBASE_APIKEY=your_firebase_web_api_key
VITE_FIREBASE_PROJECT_ID=terviewiq
# Leave empty locally to use the Vite proxy; set to the API URL in production.
VITE_API_URL=
```

For `FIREBASE_ADMIN_PRIVATE_KEY`, use the key from a Firebase service-account JSON file; Render accepts it with `\n` between lines. Do not commit the service-account JSON or real `.env` files.

---

## ▶️ Run the Project

Run these commands in separate terminals from the repository root:

```bash
npm run dev --workspace server
```

```bash
npm run dev --workspace client
```

### Tests and production build

```bash
npm test --workspace server
npm run build --workspace client
npm run lint --workspace client
```

## 🚀 Deploy on Render

Create a Web Service for the backend and a Static Site for the frontend, both connected to the `master` branch of this repository. Set each service's root directory to the repository root and enable Auto-Deploy.

### Backend Web Service

- Build command: `npm ci`
- Start command: `npm start`
- Set `NODE_ENV=production` and the server variables above. Set `CLIENT_URL` to the deployed frontend URL. Render supplies `PORT`.

### Frontend Static Site

- Build command: `npm ci && npm run build --workspace client`
- Publish directory: `client/dist`
- Set `VITE_API_URL` to the deployed backend URL, plus `VITE_FIREBASE_APIKEY` and `VITE_FIREBASE_PROJECT_ID`.

Render deploys each service after a push when Auto-Deploy is enabled. Frontend `VITE_` variables are applied at build time, so redeploy the Static Site after changing them.


## 🚧 Future Improvements

- Voice-based AI interviews
- Video interview simulation
- Resume analysis
- AI-generated interview roadmap
- Coding assessment module
- Leaderboard
- Interview history
- Certificates
- Dark Mode
- Multi-language support

---

## 📚 What I Learned

This project helped me strengthen my understanding of:

- AI integration with MERN applications
- Authentication & Authorization
- REST API development
- MongoDB data modeling
- Frontend and Backend communication
- Secure API handling
- Deployment on Render
- Environment variable management
- Building scalable full-stack applications

---

## ⚠️ Disclaimer

This project was developed for educational and learning purposes.

The payment functionality is configured in **sandbox/test mode**, meaning no real financial transactions are processed.

---

## 👩‍💻 Author

**Khushi Jain**

B.Tech CSE Student

Full Stack Web Developer

---

## ⭐ Support

If you found this project useful, consider giving it a ⭐ on GitHub!

---

## 📬 Connect With Me


GitHub: https://github.com/khushi375
