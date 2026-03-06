import { describe, it, expect } from 'vitest';
import { PublicDataSDK } from '../src/sdk.js';

describe('PublicDataSDK', () => {
  it('should create SDK instance with service key', () => {
    const sdk = new PublicDataSDK({ serviceKey: 'test-key-12345678' });
    expect(sdk).toBeInstanceOf(PublicDataSDK);
  });

  it('should throw when no service key is provided', () => {
    expect(() => new PublicDataSDK()).toThrow('Service key is required');
  });

  it('should mask service key in getConfig', () => {
    const sdk = new PublicDataSDK({ serviceKey: 'abcdefghijklmnop' });
    const config = sdk.getConfig();
    expect(config.serviceKey).toBe('abcd****mnop');
    expect(config.serviceKey).not.toBe('abcdefghijklmnop');
  });

  it('should mask short service key', () => {
    const sdk = new PublicDataSDK({ serviceKey: 'short' });
    const config = sdk.getConfig();
    expect(config.serviceKey).toBe('****');
  });
});
