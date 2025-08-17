// Session Manager exports
export { TrainingSessionManager } from './training-session-manager'
export { SessionPersistence } from './session-persistence'
export { SessionRecovery } from './session-recovery'

// Re-export types for convenience
export type {
  SessionStatus,
  SessionRecoveryData,
  SessionMetrics
} from './training-session-manager'

export type {
  SessionSyncOptions,
  SessionUpdateEvent
} from './session-persistence'

export type {
  RecoverableSession,
  RecoveryOptions
} from './session-recovery'