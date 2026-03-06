import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CircuitBreaker } from '../../src/core/circuit-breaker.js';
import { CircuitOpenError } from '../../src/core/errors.js';
import type { CircuitStateChangeEvent } from '../../src/core/circuit-breaker.js';

describe('CircuitBreaker', () => {
  let breaker: CircuitBreaker;

  beforeEach(() => {
    breaker = new CircuitBreaker('test-adapter', {
      failureThreshold: 3,
      resetTimeout: 1000,
      halfOpenMaxAttempts: 1,
    });
  });

  describe('CLOSED state', () => {
    it('should start in CLOSED state', () => {
      expect(breaker.getState()).toBe('CLOSED');
    });

    it('should pass through successful requests', async () => {
      const result = await breaker.execute(() => Promise.resolve('ok'));
      expect(result).toBe('ok');
      expect(breaker.getState()).toBe('CLOSED');
    });

    it('should pass through and rethrow failing requests', async () => {
      await expect(
        breaker.execute(() => Promise.reject(new Error('fail'))),
      ).rejects.toThrow('fail');
      expect(breaker.getState()).toBe('CLOSED');
    });

    it('should remain CLOSED below failure threshold', async () => {
      for (let i = 0; i < 2; i++) {
        await breaker
          .execute(() => Promise.reject(new Error('fail')))
          .catch(() => {});
      }
      expect(breaker.getState()).toBe('CLOSED');
    });
  });

  describe('CLOSED -> OPEN transition', () => {
    it('should open after consecutive failures hit threshold', async () => {
      for (let i = 0; i < 3; i++) {
        await breaker
          .execute(() => Promise.reject(new Error('fail')))
          .catch(() => {});
      }
      expect(breaker.getState()).toBe('OPEN');
    });

    it('should reset failure count on success', async () => {
      await breaker
        .execute(() => Promise.reject(new Error('fail')))
        .catch(() => {});
      await breaker
        .execute(() => Promise.reject(new Error('fail')))
        .catch(() => {});
      await breaker.execute(() => Promise.resolve('ok'));
      // Failure count reset, need 3 more to open
      await breaker
        .execute(() => Promise.reject(new Error('fail')))
        .catch(() => {});
      expect(breaker.getState()).toBe('CLOSED');
    });
  });

  describe('OPEN state', () => {
    beforeEach(async () => {
      for (let i = 0; i < 3; i++) {
        await breaker
          .execute(() => Promise.reject(new Error('fail')))
          .catch(() => {});
      }
    });

    it('should throw CircuitOpenError immediately', async () => {
      await expect(
        breaker.execute(() => Promise.resolve('ok')),
      ).rejects.toThrow(CircuitOpenError);
    });

    it('should include adapter name in error', async () => {
      try {
        await breaker.execute(() => Promise.resolve('ok'));
      } catch (error) {
        expect(error).toBeInstanceOf(CircuitOpenError);
        expect((error as CircuitOpenError).adapterName).toBe('test-adapter');
      }
    });

    it('should not execute the function when open', async () => {
      const fn = vi.fn().mockResolvedValue('ok');
      await breaker.execute(fn).catch(() => {});
      expect(fn).not.toHaveBeenCalled();
    });
  });

  describe('OPEN -> HALF_OPEN transition', () => {
    it('should transition to HALF_OPEN after reset timeout', async () => {
      vi.useFakeTimers();
      try {
        for (let i = 0; i < 3; i++) {
          await breaker
            .execute(() => Promise.reject(new Error('fail')))
            .catch(() => {});
        }
        expect(breaker.getState()).toBe('OPEN');

        vi.advanceTimersByTime(1001);
        expect(breaker.getState()).toBe('HALF_OPEN');
      } finally {
        vi.useRealTimers();
      }
    });

    it('should remain OPEN before reset timeout', async () => {
      vi.useFakeTimers();
      try {
        for (let i = 0; i < 3; i++) {
          await breaker
            .execute(() => Promise.reject(new Error('fail')))
            .catch(() => {});
        }

        vi.advanceTimersByTime(500);
        expect(breaker.getState()).toBe('OPEN');
      } finally {
        vi.useRealTimers();
      }
    });
  });

  describe('HALF_OPEN state', () => {
    beforeEach(async () => {
      vi.useFakeTimers();
      for (let i = 0; i < 3; i++) {
        await breaker
          .execute(() => Promise.reject(new Error('fail')))
          .catch(() => {});
      }
      vi.advanceTimersByTime(1001);
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should transition to CLOSED on successful probe', async () => {
      expect(breaker.getState()).toBe('HALF_OPEN');
      await breaker.execute(() => Promise.resolve('ok'));
      expect(breaker.getState()).toBe('CLOSED');
    });

    it('should transition back to OPEN on failed probe', async () => {
      expect(breaker.getState()).toBe('HALF_OPEN');
      await breaker
        .execute(() => Promise.reject(new Error('probe fail')))
        .catch(() => {});
      expect(breaker.getState()).toBe('OPEN');
    });

    it('should limit probe attempts', async () => {
      expect(breaker.getState()).toBe('HALF_OPEN');
      // First probe succeeds partially (fails but uses up the attempt)
      await breaker
        .execute(() => Promise.reject(new Error('fail')))
        .catch(() => {});
      // Second attempt should be rejected (circuit back to OPEN)
      await expect(
        breaker.execute(() => Promise.resolve('ok')),
      ).rejects.toThrow(CircuitOpenError);
    });
  });

  describe('State change events', () => {
    it('should emit state-change on CLOSED -> OPEN', async () => {
      const listener = vi.fn();
      breaker.on('state-change', listener);

      for (let i = 0; i < 3; i++) {
        await breaker
          .execute(() => Promise.reject(new Error('fail')))
          .catch(() => {});
      }

      expect(listener).toHaveBeenCalledTimes(1);
      const event: CircuitStateChangeEvent = listener.mock.calls[0][0];
      expect(event.previousState).toBe('CLOSED');
      expect(event.state).toBe('OPEN');
      expect(event.adapterName).toBe('test-adapter');
      expect(event.timestamp).toBeInstanceOf(Date);
    });

    it('should emit state-change on OPEN -> HALF_OPEN', async () => {
      vi.useFakeTimers();
      try {
        const listener = vi.fn();
        breaker.on('state-change', listener);

        for (let i = 0; i < 3; i++) {
          await breaker
            .execute(() => Promise.reject(new Error('fail')))
            .catch(() => {});
        }

        vi.advanceTimersByTime(1001);
        breaker.getState(); // triggers transition

        expect(listener).toHaveBeenCalledTimes(2);
        const event: CircuitStateChangeEvent = listener.mock.calls[1][0];
        expect(event.previousState).toBe('OPEN');
        expect(event.state).toBe('HALF_OPEN');
      } finally {
        vi.useRealTimers();
      }
    });

    it('should emit state-change on HALF_OPEN -> CLOSED', async () => {
      vi.useFakeTimers();
      try {
        const listener = vi.fn();
        breaker.on('state-change', listener);

        for (let i = 0; i < 3; i++) {
          await breaker
            .execute(() => Promise.reject(new Error('fail')))
            .catch(() => {});
        }

        vi.advanceTimersByTime(1001);
        await breaker.execute(() => Promise.resolve('ok'));

        expect(listener).toHaveBeenCalledTimes(3);
        const event: CircuitStateChangeEvent = listener.mock.calls[2][0];
        expect(event.previousState).toBe('HALF_OPEN');
        expect(event.state).toBe('CLOSED');
      } finally {
        vi.useRealTimers();
      }
    });
  });

  describe('Independent circuits', () => {
    it('should isolate failures per adapter', async () => {
      const breaker1 = new CircuitBreaker('adapter-1', {
        failureThreshold: 2,
      });
      const breaker2 = new CircuitBreaker('adapter-2', {
        failureThreshold: 2,
      });

      // Fail adapter-1 to open
      for (let i = 0; i < 2; i++) {
        await breaker1
          .execute(() => Promise.reject(new Error('fail')))
          .catch(() => {});
      }

      expect(breaker1.getState()).toBe('OPEN');
      expect(breaker2.getState()).toBe('CLOSED');

      // adapter-2 still works
      const result = await breaker2.execute(() => Promise.resolve('ok'));
      expect(result).toBe('ok');
    });
  });

  describe('reset', () => {
    it('should reset to CLOSED state', async () => {
      for (let i = 0; i < 3; i++) {
        await breaker
          .execute(() => Promise.reject(new Error('fail')))
          .catch(() => {});
      }
      expect(breaker.getState()).toBe('OPEN');

      breaker.reset();
      expect(breaker.getState()).toBe('CLOSED');

      // Should work normally after reset
      const result = await breaker.execute(() => Promise.resolve('ok'));
      expect(result).toBe('ok');
    });
  });

  describe('Custom thresholds', () => {
    it('should use default thresholds', () => {
      const defaultBreaker = new CircuitBreaker('default');
      expect(defaultBreaker.getState()).toBe('CLOSED');
    });

    it('should respect custom failure threshold', async () => {
      const custom = new CircuitBreaker('custom', { failureThreshold: 1 });
      await custom
        .execute(() => Promise.reject(new Error('fail')))
        .catch(() => {});
      expect(custom.getState()).toBe('OPEN');
    });
  });
});
