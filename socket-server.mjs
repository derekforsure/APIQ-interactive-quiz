import 'dotenv/config';
import WebSocket, { WebSocketServer } from 'ws';
import mysql from 'mysql2/promise';
import Redis from 'ioredis';
import { WebSocketMessageSchema } from './websocket-schemas.mjs';
import {
  QUIZ_TIMER_DURATION,
  COUNTDOWN_BUFFER,
  READING_PERIOD_DURATION,
  SCORE_3_THRESHOLD,
  SCORE_2_THRESHOLD,
  REDIS_SESSION_TTL,
  TIMER_UPDATE_INTERVAL,
  DEFAULT_READING_TIME,
  DEFAULT_QUIZ_TIME
} from './lib/constants.mjs';

const wss = new WebSocketServer({ port: 3001 });
const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
});

// In-memory map for active WebSocket connections (cannot be stored in Redis)
// Structure: sessionId -> { admin: ws | null, students: Set<ws> }
const activeConnections = {};

let db;

async function getDbConnection() {
  if (!db) {
    db = await mysql.createPool({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_DATABASE,
    });
  }
  return db;
}

async function retryDbOperation(operation) {
  let attempts = 3;
  while (attempts > 0) {
    try {
      return await operation();
    } catch (error) {
      attempts--;
      if (attempts === 0) {
        throw error;
      }
      await new Promise(res => setTimeout(res, 100)); // wait 100ms before retrying
    }
  }
}



// Helper to get quiz state from Redis
async function getQuizState(sessionId) {
  const state = await redis.get(`quiz:${sessionId}`);
  if (state) {
    return JSON.parse(state);
  }
  // Default state if not found
  return {
    isQuizStarted: false,
    isQuizEnded: false,
    scoringMode: 'individual',
    isBuzzerActive: false,
    activeStudent: null,
    currentQuestionIndex: 0,
    scores: {},
    remainingTime: QUIZ_TIMER_DURATION,
    ineligibleStudents: [],
    showAnswer: false,
    isReadingPeriod: false,
    readingTime: DEFAULT_READING_TIME,
    quizTime: DEFAULT_QUIZ_TIME,
  };
}

// Helper to save quiz state to Redis
async function saveQuizState(sessionId, state) {
  // Save with 24h TTL to prevent stale data piling up
  await redis.set(`quiz:${sessionId}`, JSON.stringify(state), 'EX', REDIS_SESSION_TTL);
}



// Helper to get active connections for a session
function getConnections(sessionId) {
  if (!activeConnections[sessionId]) {
    activeConnections[sessionId] = {
      admin: null,
      students: new Set(),
      spectators: new Set(),
    };
  }
  return activeConnections[sessionId];
}

// Helper to broadcast to all clients in a session
function broadcast(sessionId, data) {
  const connections = getConnections(sessionId);
  const message = JSON.stringify(data);

  if (connections.admin && connections.admin.readyState === WebSocket.OPEN) {
    connections.admin.send(message);
  }

  for (const client of connections.students) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  }

  for (const client of connections.spectators) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  }
}

// Timer management (kept in memory for simplicity, but state synced to Redis)
const sessionTimers = {};



function startTimer(sessionId) {
  if (sessionTimers[sessionId]) {
    clearInterval(sessionTimers[sessionId]);
  }

  sessionTimers[sessionId] = setInterval(async () => {
    const state = await getQuizState(sessionId);

    if (state.remainingTime > 0) {
      state.remainingTime -= 100;
      if (state.remainingTime <= 0) {
        state.remainingTime = 0;
        state.isBuzzerActive = false;
        clearInterval(sessionTimers[sessionId]);
        delete sessionTimers[sessionId];
      }

      await saveQuizState(sessionId, state);
      broadcast(sessionId, { type: 'TIMER_UPDATE', payload: state });
    } else {
      clearInterval(sessionTimers[sessionId]);
      delete sessionTimers[sessionId];
    }
  }, 100);
}



// Heartbeat mechanism to detect and clean up stale connections
const heartbeatInterval = setInterval(() => {
  wss.clients.forEach((ws) => {
    if (ws.isAlive === false) {
      console.log('Terminating stale connection');
      return ws.terminate();
    }

    ws.isAlive = false;
    ws.ping();
  });
}, 30000); // Check every 30 seconds

wss.on('connection', ws => {
  console.log('Client connected');

  // Initialize heartbeat tracking
  ws.isAlive = true;
  ws.on('pong', () => {
    ws.isAlive = true;
  });

  ws.on('message', async message => {
    try {
      let data;
      try {
        data = JSON.parse(message);
      } catch (e) {
        console.error('Failed to parse message:', message);
        return;
      }

      // Validate message structure with Zod
      const validationResult = WebSocketMessageSchema.safeParse(data);
      if (!validationResult.success) {
        console.error('Invalid message structure:', validationResult.error.errors);
        ws.send(JSON.stringify({
          type: 'ERROR',
          payload: {
            message: 'Invalid message format',
            errors: validationResult.error.errors,
          },
        }));
        return;
      }

      const { type, payload } = validationResult.data;
      console.log(`[${payload.sessionId || 'N/A'}] Received message: type=${type}, payload=`, payload);
      const { sessionId } = payload;

      const connections = getConnections(sessionId);

      switch (type) {
        case 'REGISTER':
          ws.id = `client-${Date.now()}-${Math.random()}`; // Assign a unique ID to the WebSocket connection
          ws.send(JSON.stringify({ type: 'CLIENT_ID', payload: { clientId: ws.id } }));

          if (payload.role === 'admin') {
            connections.admin = ws;
          } else if (payload.role === 'student') {
            connections.students.add(ws);
          } else if (payload.role === 'spectator') {
            connections.spectators.add(ws);
          }
          // Send current state immediately upon connection
          const currentState = await getQuizState(sessionId);
          ws.send(JSON.stringify({ type: 'QUIZ_STATE', payload: currentState }));

          break;

        case 'SET_SCORING_MODE':
          {
            const state = await getQuizState(sessionId);
            state.scoringMode = payload.mode;
            state.scores = {}; // Reset scores when mode changes
            await saveQuizState(sessionId, state);
            broadcast(sessionId, { type: 'QUIZ_STATE', payload: state });
          }
          break;

        case 'START_QUIZ':
          {
            // Clear any existing timer
            if (sessionTimers[sessionId]) clearInterval(sessionTimers[sessionId]);

            const state = await getQuizState(sessionId);
            // Extract timer config from payload (with defaults)
            const readingTime = payload.readingTime || DEFAULT_READING_TIME;
            const quizTime = payload.quizTime || DEFAULT_QUIZ_TIME;

            console.log(`[START_QUIZ] Timer config - Reading: ${readingTime}ms, Quiz: ${quizTime}ms`);

            state.isQuizEnded = false;
            state.isBuzzerActive = false;
            state.remainingTime = quizTime;
            state.showAnswer = false;
            state.isReadingPeriod = false;
            state.ineligibleStudents = [];
            state.currentQuestionIndex = 0;
            state.scores = {};
            state.readingTime = readingTime;
            state.quizTime = quizTime;

            await saveQuizState(sessionId, state);

            // Get server timestamp for synchronized countdown
            const countdownStartTime = Date.now();

            // Broadcast START_QUIZ for initial setup
            broadcast(sessionId, { type: 'START_QUIZ', payload: state });

            // Send countdown info immediately with server timestamp
            broadcast(sessionId, {
              type: 'COUNTDOWN_START',
              payload: {
                serverTime: countdownStartTime,
                duration: 4000 // 4 second countdown
              }
            });

            // Start quiz after 4 seconds
            setTimeout(async () => {
              const freshState = await getQuizState(sessionId);
              freshState.isQuizStarted = true;
              freshState.isBuzzerActive = true;
              freshState.remainingTime = freshState.quizTime;
              await saveQuizState(sessionId, freshState);

              startTimer(sessionId);
              broadcast(sessionId, { type: 'QUIZ_STARTED', payload: freshState });
            }, 3900);
          }
          break;

        case 'RESET_STATE':
          {
            if (sessionTimers[sessionId]) clearInterval(sessionTimers[sessionId]);

            const state = await getQuizState(sessionId);
            state.isQuizStarted = false;
            state.isQuizEnded = false;
            state.isBuzzerActive = false;
            state.remainingTime = 10000;
            state.showAnswer = false;
            state.isReadingPeriod = false;
            state.ineligibleStudents = [];
            state.currentQuestionIndex = 0;
            state.scores = {};

            await saveQuizState(sessionId, state);
            broadcast(sessionId, { type: 'QUIZ_STATE', payload: state });
          }
          break;

        case 'NEXT_QUESTION':
          {
            if (sessionTimers[sessionId]) clearInterval(sessionTimers[sessionId]);

            const state = await getQuizState(sessionId);
            state.currentQuestionIndex += 1;
            state.isBuzzerActive = false;
            state.activeStudent = null;
            state.remainingTime = state.quizTime || DEFAULT_QUIZ_TIME;
            state.ineligibleStudents = [];
            state.showAnswer = false;
            state.isReadingPeriod = true;

            await saveQuizState(sessionId, state);

            // Broadcast immediately so students see the new question
            broadcast(sessionId, { type: 'NEW_QUESTION', payload: state });

            // Start reading period (use configured time)
            const readingPeriod = state.readingTime || DEFAULT_READING_time;
            setTimeout(async () => {
              const freshState = await getQuizState(sessionId);
              freshState.isBuzzerActive = true;
              freshState.isReadingPeriod = false;
              await saveQuizState(sessionId, freshState);

              startTimer(sessionId);
              broadcast(sessionId, { type: 'BUZZER_OPEN', payload: freshState });
            }, readingPeriod);
          }
          break;

        case 'BUZZ':
          {
            const state = await getQuizState(sessionId);
            if (state.isBuzzerActive && !state.ineligibleStudents.includes(payload.studentId)) {
              if (sessionTimers[sessionId]) clearInterval(sessionTimers[sessionId]);

              state.isBuzzerActive = false;
              state.activeStudent = payload.studentId;

              await saveQuizState(sessionId, state);
              broadcast(sessionId, { type: 'BUZZER_ACTIVATED', payload: state });
            }
          }
          break;

        case 'JUDGE_ANSWER':
          {
            const state = await getQuizState(sessionId);

            if (payload.correct) {
              if (sessionTimers[sessionId]) clearInterval(sessionTimers[sessionId]);

              const timeTaken = QUIZ_TIMER_DURATION - state.remainingTime;
              let points = 0;
              if (timeTaken <= SCORE_3_THRESHOLD) points = 3;
              else if (timeTaken <= SCORE_2_THRESHOLD) points = 2;
              else points = 1;

              const db = await getDbConnection();
              const currentQuestionId = payload.questionId;
              const studentId = state.activeStudent;

              if (state.scoringMode === 'individual') {
                // Analytics write
                await retryDbOperation(async () => {
                  await db.execute('INSERT INTO student_question_scores (session_id, student_id, question_id, score) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE score = VALUES(score)', [sessionId, studentId, currentQuestionId, points]);
                });
                // Update scores
                state.scores[studentId] = (state.scores[studentId] || 0) + points;

              } else { // department scoring
                const [rows] = await db.execute('SELECT d.id, d.name FROM students s JOIN departments d ON s.department_id = d.id WHERE s.student_id = ?', [studentId]);
                if (rows.length > 0) {
                  const department = rows[0];

                  // Analytics write for the individual student
                  await retryDbOperation(async () => {
                    await db.execute('INSERT INTO student_question_scores (session_id, student_id, question_id, score) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE score = VALUES(score)', [sessionId, studentId, currentQuestionId, points]);
                  });

                  // Update scores
                  state.scores[department.name] = (state.scores[department.name] || 0) + points;
                }
              }
              state.activeStudent = null;
              state.showAnswer = true;
              state.isBuzzerActive = false;

              await saveQuizState(sessionId, state);
              broadcast(sessionId, { type: 'SCORES_UPDATED', payload: state });
            } else {
              state.ineligibleStudents.push(state.activeStudent);
              state.activeStudent = null;
              state.isBuzzerActive = true;

              await saveQuizState(sessionId, state);

              startTimer(sessionId);
              broadcast(sessionId, { type: 'BUZZER_OPEN', payload: state });
            }
          }
          break;

        case 'END_QUIZ':
          {
            if (sessionTimers[sessionId]) clearInterval(sessionTimers[sessionId]);

            const state = await getQuizState(sessionId);
            const db_end = await getDbConnection();
            await db_end.execute('UPDATE sessions SET is_active = 0 WHERE id = ?', [sessionId]);

            let finalScores = {};

            if (state.scoringMode === 'individual') {
              const [studentTotalScores] = await db_end.execute('SELECT student_id, SUM(score) as total_score FROM student_question_scores WHERE session_id = ? GROUP BY student_id', [sessionId]);
              for (const row of studentTotalScores) {
                finalScores[row.student_id] = Number(row.total_score);
                // Insert or update into student_scores
                await db_end.execute(
                  `INSERT INTO student_scores (student_id, session_id, score)
                 VALUES (?, ?, ?)
                 ON DUPLICATE KEY UPDATE score = VALUES(score)`,
                  [row.student_id, sessionId, Number(row.total_score)]
                );
              }
            } else { // department scoring
              const [departmentTotalScores] = await db_end.execute(`
              SELECT d.name, SUM(sqs.score) as total_score, s.department_id
              FROM student_question_scores sqs
              JOIN students s ON sqs.student_id = s.student_id
              JOIN departments d ON s.department_id = d.id
              WHERE sqs.session_id = ?
              GROUP BY d.name, s.department_id
            `, [sessionId]);

              for (const row of departmentTotalScores) {
                finalScores[row.name] = Number(row.total_score); // Fixed typo from total_total
                // Insert or update into department_scores
                await db_end.execute(
                  `INSERT INTO department_scores (department_id, session_id, score)
                 VALUES (?, ?, ?)
                 ON DUPLICATE KEY UPDATE score = VALUES(score)`,
                  [row.department_id, sessionId, Number(row.total_score)]
                );
              }
            }
            state.isQuizStarted = false;
            state.isQuizEnded = true;
            state.scores = finalScores;

            await saveQuizState(sessionId, state);

            broadcast(sessionId, { type: 'QUIZ_ENDED', payload: { ...state, finalScores } });
          }
          break;



        default:
          console.log('Unknown message type:', type);
      }
    } catch (error) {
      console.error(`[${data.payload.sessionId || 'N/A'}]-Error processing message:`, error);
    }
  });

  ws.on('close', () => {
    console.log('Client disconnected');
    for (const sessionId in activeConnections) {
      const connections = activeConnections[sessionId];
      if (connections.students.has(ws)) {
        connections.students.delete(ws);
      }
      if (connections.spectators.has(ws)) {
        connections.spectators.delete(ws);
      }
      if (connections.admin === ws) {
        connections.admin = null;
      }
    }
  });
});

// Graceful shutdown handling
async function gracefulShutdown(signal) {
  console.log(`\n${signal} received. Starting graceful shutdown...`);

  // Stop accepting new connections
  wss.close(() => {
    console.log('WebSocket server closed');
  });

  // Clear heartbeat interval
  clearInterval(heartbeatInterval);

  // Notify all connected clients
  wss.clients.forEach((ws) => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: 'SERVER_SHUTDOWN',
        payload: { message: 'Server is shutting down' }
      }));
      ws.close(1001, 'Server shutting down');
    }
  });

  // Clear all session timers
  for (const sessionId in sessionTimers) {
    clearInterval(sessionTimers[sessionId]);
  }

  // Close database connection
  if (db) {
    await db.end();
    console.log('Database connection closed');
  }

  // Close Redis connection
  redis.disconnect();
  console.log('Redis connection closed');

  console.log('Graceful shutdown complete');
  process.exit(0);
}

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

console.log('WebSocket server running on port 3001');