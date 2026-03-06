import { describe, it, expect, beforeEach, vi } from 'vitest';
import { WeatherAdapter } from '../../src/adapters/weather/index.js';
import { createTestContextNoCache } from '../helpers/mock-http-client.js';
import { fixtureToHttpResponse } from '../helpers/fixture-loader.js';
import { CircuitOpenError, NetworkError } from '../../src/core/errors.js';

describe('Circuit breaker flow integration', () => {
  let adapter: WeatherAdapter;
  let context: ReturnType<typeof createTestContextNoCache>;
  const params = { baseDate: '20240115', baseTime: '0500', nx: 60, ny: 127 };

  beforeEach(() => {
    context = createTestContextNoCache({
      circuitBreaker: {
        failureThreshold: 3,
        resetTimeout: 100, // Short timeout for testing
        halfOpenMaxAttempts: 1,
      },
    });
    adapter = new WeatherAdapter(context);
  });

  it('opens circuit after failure threshold is reached', async () => {
    context.httpClient.request.mockRejectedValue(
      new NetworkError('Connection refused'),
    );

    // Trigger failures up to threshold
    for (let i = 0; i < 3; i++) {
      await expect(adapter.getVilageFcst(params)).rejects.toThrow(
        NetworkError,
      );
    }

    // Circuit should now be open — throws CircuitOpenError
    await expect(adapter.getVilageFcst(params)).rejects.toThrow(
      CircuitOpenError,
    );
  });

  it('transitions to half-open after reset timeout', async () => {
    context.httpClient.request.mockRejectedValue(
      new NetworkError('Connection refused'),
    );

    // Open the circuit
    for (let i = 0; i < 3; i++) {
      await expect(adapter.getVilageFcst(params)).rejects.toThrow(
        NetworkError,
      );
    }

    const cb = adapter.getCircuitBreaker();
    expect(cb.getState()).toBe('OPEN');

    // Wait for reset timeout
    await new Promise((resolve) => setTimeout(resolve, 150));

    // Should transition to HALF_OPEN
    expect(cb.getState()).toBe('HALF_OPEN');
  });

  it('recovers from half-open to closed on success', async () => {
    context.httpClient.request.mockRejectedValue(
      new NetworkError('Connection refused'),
    );

    // Open the circuit
    for (let i = 0; i < 3; i++) {
      await expect(adapter.getVilageFcst(params)).rejects.toThrow(
        NetworkError,
      );
    }

    // Wait for half-open
    await new Promise((resolve) => setTimeout(resolve, 150));

    // Now make a successful request
    const successResponse = fixtureToHttpResponse(
      'weather/forecast-success.json',
    );
    context.httpClient.request.mockResolvedValue(successResponse);

    const result = await adapter.getVilageFcst(params);
    expect(result.success).toBe(true);

    // Circuit should be closed again
    expect(adapter.getCircuitBreaker().getState()).toBe('CLOSED');
  });

  it('re-opens circuit on failure during half-open', async () => {
    context.httpClient.request.mockRejectedValue(
      new NetworkError('Connection refused'),
    );

    // Open the circuit
    for (let i = 0; i < 3; i++) {
      await expect(adapter.getVilageFcst(params)).rejects.toThrow(
        NetworkError,
      );
    }

    // Wait for half-open
    await new Promise((resolve) => setTimeout(resolve, 150));

    // Fail again during half-open
    await expect(adapter.getVilageFcst(params)).rejects.toThrow(NetworkError);

    // Should be back to OPEN
    expect(adapter.getCircuitBreaker().getState()).toBe('OPEN');
  });

  it('emits state-change events', async () => {
    const stateChanges: string[] = [];
    const cb = adapter.getCircuitBreaker();

    cb.on('state-change', (event) => {
      stateChanges.push(`${event.previousState} -> ${event.state}`);
    });

    context.httpClient.request.mockRejectedValue(
      new NetworkError('Connection refused'),
    );

    // Trigger failures
    for (let i = 0; i < 3; i++) {
      await expect(adapter.getVilageFcst(params)).rejects.toThrow();
    }

    expect(stateChanges).toContain('CLOSED -> OPEN');
  });
});
