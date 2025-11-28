# Codebase Improvement Report

This document outlines potential improvements for the APIQuiz codebase, based on a static analysis of the project structure and key files.

## 1. Architecture & Scalability

### **Socket Server Refactoring (Critical)**
- **Current State**: The `socket-server.mjs` is a monolithic file (~300 lines) handling WebSocket connections, game logic, database interactions, and in-memory state.
- **Problem**:
  - **Single Point of Failure**: If the server crashes, all game state (scores, active questions) is lost because it's stored in a local `sessions` object.
  - **Scalability**: You cannot run multiple instances of the socket server because state is not shared.
  - **Maintainability**: Game logic is mixed with transport logic (WebSocket handling).
- **Recommendation**:
  - **Use Redis**: Store game state in Redis instead of memory. This allows state persistence and scalability.
  - **Modularize**: Split the server into:
    - `SocketManager`: Handles connection/disconnection.
    - `GameEngine`: Pure logic for quiz state transitions.
    - `StateStore`: Interface for Redis/Memory storage.
  - **Handlers**: Create separate files for message handlers (e.g., `handlers/quizHandler.js`, `handlers/adminHandler.js`).

### **Frontend "God Component"**
- **Current State**: `components/QuizControl.tsx` is over 500 lines long.
- **Problem**: It handles UI rendering, WebSocket communication, audio playback, and complex state management all in one place.
- **Recommendation**:
  - **Custom Hooks**: Extract logic into hooks like `useQuizSocket`, `useQuizState`, `useAudio`.
  - **Sub-components**: Break down the UI into smaller components:
    - `<QuizHeader />`
    - `<QuestionDisplay />`
    - `<LiveStatusPanel />`
    - `<Leaderboard />`

## 2. Code Quality & Maintainability

### **Hardcoded Values & Magic Numbers**
- **Observation**:
  - `socket-server.mjs` has hardcoded timers (`100ms`, `3900ms`, `5000ms`).
  - `QuizControl.tsx` hardcodes the WebSocket URL (`ws://localhost:3001`).
- **Recommendation**:
  - Use a `constants.ts` or config file for game rules (timers, points).
  - Use Environment Variables for URLs (e.g., `NEXT_PUBLIC_WS_URL`).

### **Error Handling & Logging**
- **Observation**:
  - `socket-server.mjs` uses `console.log` for everything.
  - `JSON.parse` in the socket server is not wrapped in a try-catch block, which could crash the server on malformed input.
- **Recommendation**:
  - Implement a proper logger (e.g., `winston` or `pino`) for the backend.
  - **CRITICAL**: Wrap `JSON.parse` in `try-catch` in `socket-server.mjs`.

### **Database Connection Management**
- **Observation**:
  - `socket-server.mjs` creates a single DB pool but the connection handling in `getDbConnection` is a bit manual.
  - `app/api/login/route.ts` manually releases connections.
- **Recommendation**:
  - Ensure the database client (likely `mysql2`) is used with a proper pool abstraction that handles connection lifecycle automatically (e.g., using a query helper that gets, executes, and releases).

## 3. Security

### **Input Validation**
- **Observation**:
  - API routes (e.g., `/api/login`) use `zod` for validation, which is **excellent**.
  - Socket server reads `payload` directly without validation (e.g., `payload.sessionId`).
- **Recommendation**:
  - Apply `zod` schemas to WebSocket messages as well to ensure payloads match expected shapes before processing.

### **Authentication**
- **Observation**:
  - Uses `bcrypt` for passwords, which is standard and secure.
  - Session IDs are generated using `randomBytes`, which is good.
- **Recommendation**:
  - Ensure session cookies are set with `HttpOnly`, `Secure`, and `SameSite` attributes (check `lib/session.ts`).

## 4. Performance

### **React Rendering**
- **Observation**: `QuizControl` updates state frequently (timer updates every 100ms via socket).
- **Recommendation**:
  - Ensure the timer updates don't cause re-renders of the entire component tree. Use `memo` for expensive sub-components.
  - Consider handling high-frequency timer updates locally in the client (with server sync) to reduce socket traffic if it becomes a bottleneck.

## Summary of Action Items

1.  **[High Priority]** Wrap `JSON.parse` in `socket-server.mjs` to prevent crashes.
2.  **[High Priority]** Extract WebSocket URL to environment variable.
3.  **[Medium Priority]** Refactor `QuizControl.tsx` into smaller components.
4.  **[Medium Priority]** Implement Redis for socket server state.
5.  **[Low Priority]** Standardize logging and error handling.
