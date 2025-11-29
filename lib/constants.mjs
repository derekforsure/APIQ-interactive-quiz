// Quiz timing constants (in milliseconds)
export const QUIZ_TIMER_DURATION = 10000; // 10 seconds
export const COUNTDOWN_DURATION = 4000; // 4 seconds before quiz starts
export const COUNTDOWN_BUFFER = 3900; // Slight buffer for countdown
export const READING_PERIOD_DURATION = 5000; // 5 seconds to read question
export const TIMER_UPDATE_INTERVAL = 100; // Update timer every 100ms

// Default timer values (configurable per quiz)
export const DEFAULT_READING_TIME = 5000; // 5 seconds
export const DEFAULT_QUIZ_TIME = 10000; // 10 seconds

// Scoring thresholds (in milliseconds)
export const SCORE_3_THRESHOLD = 3333; // Answer within 3.33s = 3 points
export const SCORE_2_THRESHOLD = 6666; // Answer within 6.66s = 2 points
// Everything else = 1 point

// Redis TTL (in seconds)
export const REDIS_SESSION_TTL = 86400; // 24 hours
