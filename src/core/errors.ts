/**
 * Unified error class hierarchy for the Public Data SDK.
 *
 * All SDK errors extend PublicDataError, enabling consistent
 * error handling via instanceof checks and the retryable flag.
 */

/** Base error class for all SDK errors. */
export class PublicDataError extends Error {
  readonly code: string;
  readonly statusCode?: number;
  readonly retryable: boolean;
  readonly originalError?: unknown;
  readonly timestamp: Date;

  constructor(
    message: string,
    options: {
      code: string;
      statusCode?: number;
      retryable?: boolean;
      originalError?: unknown;
    },
  ) {
    super(message);
    this.name = 'PublicDataError';
    this.code = options.code;
    this.statusCode = options.statusCode;
    this.retryable = options.retryable ?? false;
    this.originalError = options.originalError;
    this.timestamp = new Date();

    // Maintain proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, new.target.prototype);
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      statusCode: this.statusCode,
      retryable: this.retryable,
      timestamp: this.timestamp.toISOString(),
    };
  }
}

/** Invalid or expired service key. */
export class AuthenticationError extends PublicDataError {
  constructor(message: string, originalError?: unknown) {
    super(message, {
      code: 'AUTH_FAILED',
      statusCode: 401,
      retryable: false,
      originalError,
    });
    this.name = 'AuthenticationError';
  }
}

/** API rate limit exceeded. */
export class RateLimitError extends PublicDataError {
  readonly retryAfter: number;

  constructor(
    message: string,
    options?: { retryAfter?: number; originalError?: unknown },
  ) {
    super(message, {
      code: 'RATE_LIMIT',
      statusCode: 429,
      retryable: true,
      originalError: options?.originalError,
    });
    this.name = 'RateLimitError';
    this.retryAfter = options?.retryAfter ?? 60;
  }

  override toJSON() {
    return {
      ...super.toJSON(),
      retryAfter: this.retryAfter,
    };
  }
}

/** Invalid input parameters. */
export class ValidationError extends PublicDataError {
  readonly field?: string;
  readonly constraint?: string;

  constructor(
    message: string,
    options?: { field?: string; constraint?: string },
  ) {
    super(message, {
      code: 'VALIDATION_ERROR',
      statusCode: 400,
      retryable: false,
    });
    this.name = 'ValidationError';
    this.field = options?.field;
    this.constraint = options?.constraint;
  }

  override toJSON() {
    return {
      ...super.toJSON(),
      field: this.field,
      constraint: this.constraint,
    };
  }
}

/** Requested resource not found. */
export class NotFoundError extends PublicDataError {
  constructor(message: string, originalError?: unknown) {
    super(message, {
      code: 'NOT_FOUND',
      statusCode: 404,
      retryable: false,
      originalError,
    });
    this.name = 'NotFoundError';
  }
}

/** API server is unavailable. */
export class ServiceUnavailableError extends PublicDataError {
  constructor(message: string, originalError?: unknown) {
    super(message, {
      code: 'SERVICE_UNAVAILABLE',
      statusCode: 503,
      retryable: true,
      originalError,
    });
    this.name = 'ServiceUnavailableError';
  }
}

/** Network connectivity issue. */
export class NetworkError extends PublicDataError {
  constructor(message: string, originalError?: unknown) {
    super(message, {
      code: 'NETWORK_ERROR',
      retryable: true,
      originalError,
    });
    this.name = 'NetworkError';
  }
}

/** Response parsing failure. */
export class ParseError extends PublicDataError {
  readonly rawResponse?: string;

  constructor(
    message: string,
    options?: { rawResponse?: string; originalError?: unknown },
  ) {
    super(message, {
      code: 'PARSE_ERROR',
      retryable: false,
      originalError: options?.originalError,
    });
    this.name = 'ParseError';
    this.rawResponse = options?.rawResponse;
  }

  override toJSON() {
    return {
      ...super.toJSON(),
      rawResponse: this.rawResponse
        ? this.rawResponse.slice(0, 500)
        : undefined,
    };
  }
}

/** Circuit breaker is open; requests are blocked. */
export class CircuitOpenError extends PublicDataError {
  readonly adapterName: string;

  constructor(adapterName: string) {
    super(
      `Circuit breaker is open for adapter "${adapterName}". Requests are temporarily blocked.`,
      {
        code: 'CIRCUIT_OPEN',
        statusCode: 503,
        retryable: true,
      },
    );
    this.name = 'CircuitOpenError';
    this.adapterName = adapterName;
  }

  override toJSON() {
    return {
      ...super.toJSON(),
      adapterName: this.adapterName,
    };
  }
}
