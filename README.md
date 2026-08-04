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
- React.js
- Tailwind CSS
- React Router
- Axios
- Context API

### Backend
- Node.js
- Express.js
- JWT Authentication
- Bcrypt.js

### Database
- MongoDB
- Mongoose

### AI Integration
- Google Gemini API *(or update with your AI provider if different)*

### Deployment
- Frontend: Render
- Backend: Render
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
git clone https://github.com/your-username/interviewiq.git
```

```bash
cd interviewiq
```

---

### Install Frontend

```bash
cd client
npm install
```

---

### Install Backend

```bash
cd ../server
npm install
```

---

## 🔑 Environment Variables

Create a `.env` file inside the server directory.

```env
PORT=5000

MONGODB_URI=your_mongodb_connection_string

JWT_SECRET=your_secret_key

GEMINI_API_KEY=your_api_key

PAYMENT_GATEWAY_KEY=your_payment_key

CLIENT_URL=http://localhost:5173
```

---

## ▶️ Run the Project

### Backend

```bash
npm run server
```

### Frontend

```bash
npm run dev
```

---


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

LinkedIn: https://www.linkedin.com/in/your-linkedin/

GitHub: https://github.com/khushi375
