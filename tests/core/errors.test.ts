import { describe, it, expect } from 'vitest';
import {
  PublicDataError,
  AuthenticationError,
  RateLimitError,
  ValidationError,
  NotFoundError,
  ServiceUnavailableError,
  NetworkError,
  ParseError,
  CircuitOpenError,
} from '../../src/core/errors.js';

describe('Error Class Hierarchy', () => {
  describe('PublicDataError (base)', () => {
    it('should set all properties correctly', () => {
      const error = new PublicDataError('test error', {
        code: 'TEST',
        statusCode: 500,
        retryable: true,
        originalError: new Error('original'),
      });

      expect(error.message).toBe('test error');
      expect(error.code).toBe('TEST');
      expect(error.statusCode).toBe(500);
      expect(error.retryable).toBe(true);
      expect(error.originalError).toBeInstanceOf(Error);
      expect(error.timestamp).toBeInstanceOf(Date);
      expect(error.name).toBe('PublicDataError');
    });

    it('should default retryable to false', () => {
      const error = new PublicDataError('test', { code: 'TEST' });
      expect(error.retryable).toBe(false);
    });

    it('should be instanceof Error', () => {
      const error = new PublicDataError('test', { code: 'TEST' });
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(PublicDataError);
    });

    it('should serialize to JSON', () => {
      const error = new PublicDataError('test', {
        code: 'TEST',
        statusCode: 400,
      });
      const json = error.toJSON();

      expect(json.name).toBe('PublicDataError');
      expect(json.message).toBe('test');
      expect(json.code).toBe('TEST');
      expect(json.statusCode).toBe(400);
      expect(json.retryable).toBe(false);
      expect(json.timestamp).toBeDefined();
    });
  });

  describe('AuthenticationError', () => {
    it('should have correct defaults', () => {
      const error = new AuthenticationError('Invalid key');
      expect(error).toBeInstanceOf(PublicDataError);
      expect(error.name).toBe('AuthenticationError');
      expect(error.code).toBe('AUTH_FAILED');
      expect(error.statusCode).toBe(401);
      expect(error.retryable).toBe(false);
    });

    it('should preserve original error', () => {
      const orig = new Error('orig');
      const error = new AuthenticationError('Invalid key', orig);
      expect(error.originalError).toBe(orig);
    });
  });

  describe('RateLimitError', () => {
    it('should have correct defaults', () => {
      const error = new RateLimitError('Too many requests');
      expect(error).toBeInstanceOf(PublicDataError);
      expect(error.name).toBe('RateLimitError');
      expect(error.code).toBe('RATE_LIMIT');
      expect(error.statusCode).toBe(429);
      expect(error.retryable).toBe(true);
      expect(error.retryAfter).toBe(60);
    });

    it('should accept custom retryAfter', () => {
      const error = new RateLimitError('Too many requests', {
        retryAfter: 120,
      });
      expect(error.retryAfter).toBe(120);
    });

    it('should include retryAfter in JSON', () => {
      const error = new RateLimitError('limit', { retryAfter: 30 });
      const json = error.toJSON();
      expect(json.retryAfter).toBe(30);
    });
  });

  describe('ValidationError', () => {
    it('should have correct defaults', () => {
      const error = new ValidationError('Invalid input');
      expect(error).toBeInstanceOf(PublicDataError);
      expect(error.name).toBe('ValidationError');
      expect(error.code).toBe('VALIDATION_ERROR');
      expect(error.statusCode).toBe(400);
      expect(error.retryable).toBe(false);
    });

    it('should accept field and constraint', () => {
      const error = new ValidationError('Invalid date', {
        field: 'baseDate',
        constraint: 'must be YYYYMMDD format',
      });
      expect(error.field).toBe('baseDate');
      expect(error.constraint).toBe('must be YYYYMMDD format');
    });

    it('should include field and constraint in JSON', () => {
      const error = new ValidationError('bad', {
        field: 'x',
        constraint: 'y',
      });
      const json = error.toJSON();
      expect(json.field).toBe('x');
      expect(json.constraint).toBe('y');
    });
  });

  describe('NotFoundError', () => {
    it('should have correct defaults', () => {
      const error = new NotFoundError('Resource not found');
      expect(error).toBeInstanceOf(PublicDataError);
      expect(error.name).toBe('NotFoundError');
      expect(error.code).toBe('NOT_FOUND');
      expect(error.statusCode).toBe(404);
      expect(error.retryable).toBe(false);
    });
  });

  describe('ServiceUnavailableError', () => {
    it('should be retryable', () => {
      const error = new ServiceUnavailableError('API down');
      expect(error).toBeInstanceOf(PublicDataError);
      expect(error.name).toBe('ServiceUnavailableError');
      expect(error.code).toBe('SERVICE_UNAVAILABLE');
      expect(error.statusCode).toBe(503);
      expect(error.retryable).toBe(true);
    });
  });

  describe('NetworkError', () => {
    it('should be retryable', () => {
      const error = new NetworkError('Connection refused');
      expect(error).toBeInstanceOf(PublicDataError);
      expect(error.name).toBe('NetworkError');
      expect(error.code).toBe('NETWORK_ERROR');
      expect(error.statusCode).toBeUndefined();
      expect(error.retryable).toBe(true);
    });
  });

  describe('ParseError', () => {
    it('should have correct defaults', () => {
      const error = new ParseError('Invalid JSON');
      expect(error).toBeInstanceOf(PublicDataError);
      expect(error.name).toBe('ParseError');
      expect(error.code).toBe('PARSE_ERROR');
      expect(error.retryable).toBe(false);
    });

    it('should store raw response', () => {
      const error = new ParseError('parse fail', {
        rawResponse: '<xml>bad data</xml>',
      });
      expect(error.rawResponse).toBe('<xml>bad data</xml>');
    });

    it('should truncate long rawResponse in JSON', () => {
      const longResponse = 'x'.repeat(1000);
      const error = new ParseError('fail', { rawResponse: longResponse });
      const json = error.toJSON();
      expect(json.rawResponse).toHaveLength(500);
    });
  });

  describe('CircuitOpenError', () => {
    it('should include adapter name', () => {
      const error = new CircuitOpenError('weather');
      expect(error).toBeInstanceOf(PublicDataError);
      expect(error.name).toBe('CircuitOpenError');
      expect(error.code).toBe('CIRCUIT_OPEN');
      expect(error.retryable).toBe(true);
      expect(error.adapterName).toBe('weather');
      expect(error.message).toContain('weather');
    });

    it('should include adapterName in JSON', () => {
      const error = new CircuitOpenError('business');
      const json = error.toJSON();
      expect(json.adapterName).toBe('business');
    });
  });

  describe('Retryable flag consistency', () => {
    it('retryable errors: ServiceUnavailable, Network, RateLimit, CircuitOpen', () => {
      expect(new ServiceUnavailableError('').retryable).toBe(true);
      expect(new NetworkError('').retryable).toBe(true);
      expect(new RateLimitError('').retryable).toBe(true);
      expect(new CircuitOpenError('x').retryable).toBe(true);
    });

    it('non-retryable errors: Auth, Validation, NotFound, Parse', () => {
      expect(new AuthenticationError('').retryable).toBe(false);
      expect(new ValidationError('').retryable).toBe(false);
      expect(new NotFoundError('').retryable).toBe(false);
      expect(new ParseError('').retryable).toBe(false);
    });
  });

  describe('instanceof checks', () => {
    it('all errors are instanceof PublicDataError', () => {
      const errors = [
        new AuthenticationError(''),
        new RateLimitError(''),
        new ValidationError(''),
        new NotFoundError(''),
        new ServiceUnavailableError(''),
        new NetworkError(''),
        new ParseError(''),
        new CircuitOpenError('x'),
      ];

      for (const error of errors) {
        expect(error).toBeInstanceOf(PublicDataError);
        expect(error).toBeInstanceOf(Error);
      }
    });
  });
});
