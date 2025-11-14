import 'dotenv/config';
import WebSocket, { WebSocketServer } from 'ws';
import mysql from 'mysql2/promise';

const wss = new WebSocketServer({ port: 3001 });

const sessions = {};

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


wss.on('connection', ws => {
  console.log('Client connected');

  ws.on('message', async message => {
    const data = JSON.parse(message);
    const { type, payload } = data;
    console.log(`[${payload.sessionId || 'N/A'}] Received message: type=${type}, payload=`, payload);
    const { sessionId } = payload;

    if (!sessions[sessionId]) {
      sessions[sessionId] = {
        clients: new Set(),
        admin: null,
        students: new Set(),
        quizState: {
          isQuizStarted: false,
          isQuizEnded: false,
          scoringMode: 'individual',
          isBuzzerActive: false,
          activeStudent: null,
          currentQuestionIndex: 0,
          scores: {},
          remainingTime: 10000,
          timerId: null,
          ineligibleStudents: [],
          showAnswer: false,
        },
      };
    }

    const session = sessions[sessionId];

    const getCleanQuizState = () => {
      const cleanState = { ...session.quizState };
      delete cleanState.timerId;
      return cleanState;
    };

    const broadcast = (data) => {
      for (const client of session.clients) {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify(data));
        }
      }
    };

    const startTimer = () => {
      clearInterval(session.quizState.timerId);
      session.quizState.timerId = setInterval(() => {
        session.quizState.remainingTime -= 100;
        if (session.quizState.remainingTime <= 0) {
          clearInterval(session.quizState.timerId);
          session.quizState.isBuzzerActive = false;
        }
        broadcast({ type: 'TIMER_UPDATE', payload: getCleanQuizState() });
      }, 100);
    };

    switch (type) {
      case 'REGISTER':
        session.clients.add(ws);
        if (payload.role === 'admin') {
          session.admin = ws;
        } else if (payload.role === 'student') {
          session.students.add(ws);
        }
        ws.send(JSON.stringify({ type: 'QUIZ_STATE', payload: getCleanQuizState() }));
        break;

      case 'SET_SCORING_MODE':
        session.quizState.scoringMode = payload.mode;
        session.quizState.scores = {}; // Reset scores when mode changes
        broadcast({ type: 'QUIZ_STATE', payload: getCleanQuizState() });
        break;

      case 'START_QUIZ':
        // Clear any existing timer
        clearInterval(session.quizState.timerId);
        
        // Don't set isQuizStarted yet - only after countdown completes
        session.quizState.isQuizEnded = false;
        session.quizState.isBuzzerActive = false;
        session.quizState.remainingTime = 10000;
        session.quizState.showAnswer = false;
        session.quizState.ineligibleStudents = [];
        session.quizState.currentQuestionIndex = 0;
        session.quizState.scores = {};
        
        // Get server timestamp for synchronized countdown
        const countdownStartTime = Date.now();
        
        // Broadcast START_QUIZ for initial setup
        broadcast({ type: 'START_QUIZ', payload: getCleanQuizState() });
        
        // Send countdown info immediately with server timestamp
        broadcast({ 
          type: 'COUNTDOWN_START', 
          payload: { 
            serverTime: countdownStartTime,
            duration: 4000 // 4 second countdown
          } 
        });
        
        // Start quiz after 4 seconds
        setTimeout(() => {
          session.quizState.isQuizStarted = true;
          session.quizState.isBuzzerActive = true;
          session.quizState.remainingTime = 10000;
          startTimer();
          broadcast({ type: 'QUIZ_STARTED', payload: getCleanQuizState() });
        }, 3900);
        break;

      case 'RESET_STATE':
        clearInterval(session.quizState.timerId);
        session.quizState.isQuizStarted = false;
        session.quizState.isQuizEnded = false;
        session.quizState.isBuzzerActive = false;
        session.quizState.remainingTime = 10000;
        session.quizState.showAnswer = false;
        session.quizState.ineligibleStudents = [];
        session.quizState.currentQuestionIndex = 0;
        session.quizState.scores = {};
        broadcast({ type: 'QUIZ_STATE', payload: getCleanQuizState() });
        break;

      case 'NEXT_QUESTION':
        clearInterval(session.quizState.timerId);
        session.quizState.currentQuestionIndex += 1;
        session.quizState.isBuzzerActive = true;
        session.quizState.activeStudent = null;
        session.quizState.remainingTime = 10000;
        session.quizState.ineligibleStudents = [];
        session.quizState.showAnswer = false;
        startTimer();
        broadcast({ type: 'NEW_QUESTION', payload: getCleanQuizState() });
        break;

      case 'BUZZ':
        if (session.quizState.isBuzzerActive && !session.quizState.ineligibleStudents.includes(payload.studentId)) {
          clearInterval(session.quizState.timerId);
          session.quizState.isBuzzerActive = false;
          session.quizState.activeStudent = payload.studentId;
          broadcast({ type: 'BUZZER_ACTIVATED', payload: getCleanQuizState() });
        }
        break;

      case 'JUDGE_ANSWER':
        if (payload.correct) {
          clearInterval(session.quizState.timerId);
          const timeTaken = 10000 - session.quizState.remainingTime;
          let points = 0;
          if (timeTaken <= 3333) points = 3;
          else if (timeTaken <= 6666) points = 2;
          else points = 1;

          const db = await getDbConnection();
          const currentQuestionId = payload.questionId;
          const studentId = session.quizState.activeStudent;

          if (session.quizState.scoringMode === 'individual') {
            // Analytics write
            await retryDbOperation(async () => {
              await db.execute('INSERT INTO student_question_scores (session_id, student_id, question_id, score) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE score = VALUES(score)', [sessionId, studentId, currentQuestionId, points]);
            });
            // Update in-memory scores
            session.quizState.scores[studentId] = (session.quizState.scores[studentId] || 0) + points;

          } else { // department scoring
            const [rows] = await db.execute('SELECT d.id, d.name FROM students s JOIN departments d ON s.department_id = d.id WHERE s.student_id = ?', [studentId]);
            if (rows.length > 0) {
              const department = rows[0];
              
              // Analytics write for the individual student
              await retryDbOperation(async () => {
                await db.execute('INSERT INTO student_question_scores (session_id, student_id, question_id, score) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE score = VALUES(score)', [sessionId, studentId, currentQuestionId, points]);
              });

              // Update in-memory scores
              session.quizState.scores[department.name] = (session.quizState.scores[department.name] || 0) + points;
            }
          }
          session.quizState.activeStudent = null;
          session.quizState.showAnswer = true;
          session.quizState.isBuzzerActive = false;
          broadcast({ type: 'SCORES_UPDATED', payload: getCleanQuizState() });
        } else {
          session.quizState.ineligibleStudents.push(session.quizState.activeStudent);
          session.quizState.activeStudent = null;
          session.quizState.isBuzzerActive = true;
          startTimer();
          broadcast({ type: 'BUZZER_OPEN', payload: getCleanQuizState() });
        }
        break;

      case 'END_QUIZ':
        clearInterval(session.quizState.timerId);
        const db_end = await getDbConnection();
        await db_end.execute('UPDATE sessions SET is_active = 0 WHERE id = ?', [sessionId]);

        let finalScores = {};

        if (session.quizState.scoringMode === 'individual') {
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
            finalScores[row.name] = Number(row.total_total);
            // Insert or update into department_scores
            await db_end.execute(
              `INSERT INTO department_scores (department_id, session_id, score)
               VALUES (?, ?, ?)
               ON DUPLICATE KEY UPDATE score = VALUES(score)`,
              [row.department_id, sessionId, Number(row.total_score)]
            );
          }
        }
        session.quizState.isQuizStarted = false;
        session.quizState.isQuizEnded = true;
        session.quizState.scores = finalScores;
        broadcast({ type: 'QUIZ_ENDED', payload: { ...getCleanQuizState(), finalScores } });
        break;

      default:
        console.log('Unknown message type:', type);
    }
  });

  ws.on('close', () => {
    console.log('Client disconnected');
    for (const sessionId in sessions) {
      if (sessions[sessionId].clients.has(ws)) {
        sessions[sessionId].clients.delete(ws);
        if (sessions[sessionId].admin === ws) {
          sessions[sessionId].admin = null;
        }
        sessions[sessionId].students.delete(ws);
        break;
      }
    }
  });
});