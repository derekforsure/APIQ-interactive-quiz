<div align="center">
  <h1>Advanced Platform for Interactive Quizzes</h1>
</div>

<div align="center">
  <img src="public/logo.svg" alt="APIQ Logo" width="500" />
  
  **Transform learning and assessment with real-time, interactive quizzes**
  
  [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE.md)
  [![Node.js](https://img.shields.io/badge/Node.js-18+-green)](https://nodejs.org/)
  [![Next.js](https://img.shields.io/badge/Next.js-14+-blue)](https://nextjs.org/)
</div>

---

## 🎯 Overview

APIQ is a comprehensive, real-time quiz platform designed for educators, trainers, and event organizers. Whether you're conducting classroom assessments, corporate training sessions, or hosting competitive trivia events, APIQ delivers an engaging, responsive experience with powerful administrative controls and seamless participant interaction.

Built with cutting-edge web technologies, APIQ combines real-time WebSocket communication, robust backend architecture, and an intuitive user interface to create memorable learning experiences.

---

## ✨ Key Features

### 🎛️ Administrator Dashboard

- **Session Management**: Create, start, pause, and end quiz sessions with intuitive controls
- **Question Bank**: Comprehensive system to organize questions by topic and difficulty level
- **Real-time Control**: Advance questions, reveal answers, and manage the buzzer system instantly
- **Participant Management**: Monitor active participants, track progress, and remove inactive users
- **Flexible Scoring**: Switch between individual and department-based scoring modes
- **Live Leaderboard**: Real-time score updates and rankings to drive engagement
- **Presentation Mode**: Clean, dedicated interface optimized for audience display
- **Advanced Analytics**: Track participation metrics and quiz performance

### 👥 Student Interface

- **Quick Join**: Enter a session ID to instantly join a quiz
- **Real-time Updates**: Questions appear instantly as the admin advances
- **Interactive Buzzer**: Quick-fire participation with responsive feedback
- **Direct Answer Submission**: Submit answers seamlessly through the interface
- **Personal Dashboard**: Track individual scores and overall rankings
- **Responsive Design**: Optimized for desktop, tablet, and mobile devices

### ⚡ Technical Highlights

- **Real-time Communication**: WebSocket-powered instant updates with zero latency
- **Scalable Architecture**: Built to handle multiple concurrent sessions
- **Secure Authentication**: Bcrypt-hashed passwords and session management
- **High Performance**: Redis caching for optimal response times
- **Type Safety**: Full TypeScript support for maintainable code
- **Modern UI**: Tailwind CSS for consistent, responsive design

---

## 🛠️ Technology Stack

**Frontend**
- **Next.js 14+** - React framework for production-grade applications
- **React 18+** - Dynamic user interfaces
- **TypeScript** - Type-safe, maintainable code
- **Tailwind CSS** - Utility-first styling framework
- **Zod** - Schema validation and type checking

**Backend**
- **Node.js** - Server-side JavaScript runtime
- **WebSockets (ws)** - Real-time bidirectional communication
- **Express/Custom Server** - HTTP and WebSocket handling
- **Bcrypt** - Secure password hashing
- **ioredis** - High-performance Redis client

**Database & Caching**
- **MySQL 8.0+** - Reliable relational database
- **Redis 6.0+** - Session management and caching layer

---

## 🚀 Quick Start

### Prerequisites

Ensure you have the following installed:

- **Node.js** 18+ (LTS recommended)
- **npm** 9+ or **Yarn** 3+ (comes with Node.js)
- **MySQL** 8.0+
- **Redis** 6.0+

### Installation Steps

1. **Clone the repository:**
   ```bash
   git clone https://github.com/tainyantun/APIQ-interactive-quiz.git
   cd APIQ-interactive-quiz
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   
   Create a `.env` file in the project root by copying the sample file:
   ```bash
   cp .env.sample .env
   ```
   Then, fill in the required values in the `.env` file.

4. **Initialize the database:**
   ```bash
   # Create the database
   mysql -u root -p -e "CREATE DATABASE quiz_app;"
   
   # Run migrations
   mysql -u root -p quiz_app < backend/schema.sql
   
   # (Optional) Populate sample questions
   node populate-questions.js
   ```

5. **Start the development server:**

   ```bash
   npm run dev
   ```
   The app will be available at `http://localhost:3000` and the WebSocket server will run on `ws://localhost:3001`.

---

## 📖 Usage Guide

### For Administrators

1. **Access the Dashboard**: Navigate to `http://localhost:3000/admin`
2. **Create a Session**: Click "New Session" and configure your quiz
3. **Add Questions**: Build your question bank or import existing ones
4. **Start the Quiz**: Launch the session and monitor participants in real-time
5. **Control Flow**: Advance questions, reveal answers, and manage scoring
6. **View Results**: Access detailed analytics and performance metrics

### For Students

1. **Join a Session**: Go to `http://localhost:3000/join`
2. **Enter Session ID**: Use the code provided by your administrator
3. **Participate**: Answer questions and compete on the live leaderboard
4. **Track Progress**: View your score and ranking in real-time

### Presentation Mode

Display quiz questions and leaderboards on a projector or external screen:
- Navigate to the presentation view from the admin dashboard
- Full-screen mode optimized for large audiences
- Automatic score updates during the quiz

---

## 📁 Project Structure

```
APIQ-interactive-quiz/
├── app/                  # Next.js App Router pages and API routes
├── backend/              # Database schema
├── components/           # Reusable React components
├── public/               # Static assets (images, sounds)
├── .env.sample           # Sample environment variables
├── populate-questions.js # Script to seed the database with questions
├── socket-server.mjs     # WebSocket server
└── package.json          # Dependencies and scripts
```

---

## 🔧 Development

### Available Scripts

```bash
# Run the development server (Next.js and WebSocket)
npm run dev

# Build the Next.js application for production
npm run build

# Start the production Next.js server
npm start

# Run ESLint to check for code style issues
npm run lint

# Populate the database with sample questions
node populate-questions.js
```

### Environment Configuration

| Variable | Description | Default |
|----------|-------------|---------|
| `DB_HOST` | MySQL server address | localhost |
| `DB_PORT` | MySQL port | 3306 |
| `DB_USER` | MySQL username | root |
| `DB_PASSWORD` | MySQL password | Required |
| `DB_DATABASE` | Database name | quiz_app |
| `REDIS_HOST` | Redis server address | localhost |
| `REDIS_PORT` | Redis port | 6379 |
| `WEBSOCKET_URL` | WebSocket server URL | ws://localhost:3001 |

---

## 🔒 Security Best Practices

- Keep your `.env` file out of version control
- Use strong, unique passwords for database and Redis
- Regularly update dependencies: `npm audit fix`
- Enable HTTPS in production
- Implement rate limiting for API endpoints
- Use environment variables for all sensitive data

---

## 🐛 Troubleshooting

**WebSocket Connection Issues**
- Verify Redis is running: `redis-cli ping`
- Check that the WebSocket server is listening on port 3001
- Ensure `WEBSOCKET_URL` is correctly configured

**Database Connection Errors**
- Confirm MySQL is running and accessible
- Verify database credentials in `.env`
- Check that the database `quiz_app` exists

**Performance Issues**
- Clear Redis cache: `redis-cli FLUSHALL`
- Check MySQL slow query logs
- Review WebSocket connection limits

For additional help, open an issue on GitHub with detailed logs and reproduction steps.

---

## 🤝 Contributing

We welcome contributions from the community! Please see our [CONTRIBUTING.md](CONTRIBUTING.md) file for more details on how to get involved.

---

## 📊 Roadmap

Planned features and improvements:

- [ ] Question randomization and shuffling
- [ ] Advanced analytics dashboard
- [ ] Integration with LMS platforms
- [ ] Mobile app (React Native)
- [ ] Automated question generation with AI
- [ ] Export quiz results as PDF/CSV
- [ ] Dark mode support
- [ ] Multi-language support

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details.

---

## 📞 Support & Contact

Have questions or need help?

- **GitHub Issues**: [Open an issue](https://github.com/tainyantun/APIQ-interactive-quiz/issues)
- **Email**: leotainyan18@gmail.com
- **Documentation**: [Full docs](https://docs.apiq.app)

---

<div align="center">
  Made with ❤️ for educators and learners everywhere
  
  <a href="https://github.com/tainyantun/APIQ-interactive-quiz">⭐ Star us on GitHub</a> • <a href="https://x.com/Leo_tainyan">Follow us on X</a>
</div>