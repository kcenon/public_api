import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const FIXTURES_DIR = join(import.meta.dirname, '..', 'fixtures');

/**
 * Load a fixture file and return its contents as a string.
 * @param relativePath - Path relative to tests/fixtures/ (e.g., 'weather/forecast-success.json')
 */
export function loadFixture(relativePath: string): string {
  return readFileSync(join(FIXTURES_DIR, relativePath), 'utf-8');
}

/**
 * Load a JSON fixture file and parse it.
 * @param relativePath - Path relative to tests/fixtures/ (e.g., 'weather/forecast-success.json')
 */
export function loadJsonFixture<T = unknown>(relativePath: string): T {
  return JSON.parse(loadFixture(relativePath)) as T;
}

/**
 * Create a mock HTTP response from a fixture file.
 * Returns an object matching the RawHttpResponse interface.
 */
export function fixtureToHttpResponse(
  relativePath: string,
  options: { status?: number; responseTime?: number } = {},
): {
  status: number;
  headers: Record<string, string>;
  body: string;
  responseTime: number;
} {
  const body = loadFixture(relativePath);
  const isXml = relativePath.endsWith('.xml');

  return {
    status: options.status ?? 200,
    headers: {
      'content-type': isXml ? 'application/xml' : 'application/json',
    },
    body,
    responseTime: options.responseTime ?? 50,
  };
}
