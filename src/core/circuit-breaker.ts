import { EventEmitter } from 'node:events';
import { CircuitOpenError } from './errors.js';

/** Circuit breaker states. */
export type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

/** Event payload emitted on state transitions. */
export interface CircuitStateChangeEvent {
  state: CircuitState;
  previousState: CircuitState;
  adapterName: string;
  timestamp: Date;
}

/** Circuit breaker events. */
export interface CircuitBreakerEvents {
  'state-change': [CircuitStateChangeEvent];
}

/**
 * Circuit breaker for API resilience.
 *
 * States:
 * - CLOSED: Normal operation, requests pass through.
 * - OPEN: All requests fail immediately with CircuitOpenError.
 * - HALF_OPEN: Limited probe requests allowed to test recovery.
 */
export class CircuitBreaker extends EventEmitter {
  private state: CircuitState = 'CLOSED';
  private failureCount = 0;
  private halfOpenAttempts = 0;
  private lastFailureTime = 0;

  private readonly failureThreshold: number;
  private readonly resetTimeout: number;
  private readonly halfOpenMaxAttempts: number;
  readonly adapterName: string;

  constructor(
    adapterName: string,
    options: {
      failureThreshold?: number;
      resetTimeout?: number;
      halfOpenMaxAttempts?: number;
    } = {},
  ) {
    super();
    this.adapterName = adapterName;
    this.failureThreshold = options.failureThreshold ?? 5;
    this.resetTimeout = options.resetTimeout ?? 30000;
    this.halfOpenMaxAttempts = options.halfOpenMaxAttempts ?? 1;
  }

  /** Get current circuit state. */
  getState(): CircuitState {
    this.checkOpenToHalfOpen();
    return this.state;
  }

  /**
   * Execute a function through the circuit breaker.
   * Throws CircuitOpenError if the circuit is open.
   */
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    this.checkOpenToHalfOpen();

    if (this.state === 'OPEN') {
      throw new CircuitOpenError(this.adapterName);
    }

    if (
      this.state === 'HALF_OPEN' &&
      this.halfOpenAttempts >= this.halfOpenMaxAttempts
    ) {
      throw new CircuitOpenError(this.adapterName);
    }

    try {
      if (this.state === 'HALF_OPEN') {
        this.halfOpenAttempts++;
      }

      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  /** Record a successful request. */
  private onSuccess(): void {
    if (this.state === 'HALF_OPEN') {
      this.transitionTo('CLOSED');
    }
    this.failureCount = 0;
  }

  /** Record a failed request. */
  private onFailure(): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();

    if (this.state === 'HALF_OPEN') {
      this.transitionTo('OPEN');
      return;
    }

    if (this.state === 'CLOSED' && this.failureCount >= this.failureThreshold) {
      this.transitionTo('OPEN');
    }
  }

  /** Check if an OPEN circuit should transition to HALF_OPEN. */
  private checkOpenToHalfOpen(): void {
    if (
      this.state === 'OPEN' &&
      Date.now() - this.lastFailureTime >= this.resetTimeout
    ) {
      this.transitionTo('HALF_OPEN');
    }
  }

  /** Transition to a new state and emit event. */
  private transitionTo(newState: CircuitState): void {
    const previousState = this.state;
    if (previousState === newState) return;

    this.state = newState;

    if (newState === 'HALF_OPEN') {
      this.halfOpenAttempts = 0;
    }

    if (newState === 'CLOSED') {
      this.failureCount = 0;
      this.halfOpenAttempts = 0;
    }

    this.emit('state-change', {
      state: newState,
      previousState,
      adapterName: this.adapterName,
      timestamp: new Date(),
    } satisfies CircuitStateChangeEvent);
  }

  /** Reset the circuit breaker to CLOSED state. */
  reset(): void {
    this.state = 'CLOSED';
    this.failureCount = 0;
    this.halfOpenAttempts = 0;
    this.lastFailureTime = 0;
  }
}
