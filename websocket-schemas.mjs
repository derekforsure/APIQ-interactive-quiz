import { z } from 'zod';

// Base payload schema with sessionId
const BasePayloadSchema = z.object({
    sessionId: z.string().min(1, 'Session ID is required'),
});

// REGISTER message schema
export const RegisterSchema = z.object({
    type: z.literal('REGISTER'),
    payload: z.object({
        role: z.enum(['admin', 'student', 'spectator']),
        sessionId: z.string().min(1),
        studentId: z.string().optional(), // Only for students
    }),
});

// SET_SCORING_MODE message schema
export const SetScoringModeSchema = z.object({
    type: z.literal('SET_SCORING_MODE'),
    payload: BasePayloadSchema.extend({
        mode: z.enum(['individual', 'department']),
    }),
});

// START_QUIZ message schema
export const StartQuizSchema = z.object({
    type: z.literal('START_QUIZ'),
    payload: BasePayloadSchema.extend({
        readingTime: z.number().int().min(3000).max(30000).optional(), // 3-30 seconds in ms
        quizTime: z.number().int().min(5000).max(60000).optional(), // 5-60 seconds in ms
    }),
});

// RESET_STATE message schema
export const ResetStateSchema = z.object({
    type: z.literal('RESET_STATE'),
    payload: BasePayloadSchema,
});

// NEXT_QUESTION message schema
export const NextQuestionSchema = z.object({
    type: z.literal('NEXT_QUESTION'),
    payload: BasePayloadSchema.extend({
        questionId: z.number().int().positive(),
    }),
});

// BUZZ message schema
export const BuzzSchema = z.object({
    type: z.literal('BUZZ'),
    payload: BasePayloadSchema.extend({
        studentId: z.string().min(1, 'Student ID is required'),
    }),
});

// JUDGE_ANSWER message schema
export const JudgeAnswerSchema = z.object({
    type: z.literal('JUDGE_ANSWER'),
    payload: BasePayloadSchema.extend({
        correct: z.boolean(),
        questionId: z.number().int().positive(),
    }),
});

// END_QUIZ message schema
export const EndQuizSchema = z.object({
    type: z.literal('END_QUIZ'),
    payload: BasePayloadSchema,
});

// Union of all message schemas for validation
export const WebSocketMessageSchema = z.discriminatedUnion('type', [
    RegisterSchema,
    SetScoringModeSchema,
    StartQuizSchema,
    ResetStateSchema,
    NextQuestionSchema,
    BuzzSchema,
    JudgeAnswerSchema,
    EndQuizSchema,
]);
