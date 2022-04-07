import { hasPrefix, fmt, isFromBot } from '../src/handler/utilities/messageHelpers';

describe('FUNCTIONS', () => {
  test('If hasPrefix is a function', () => {
    expect(typeof hasPrefix).toBe('function');
  });
  test('if fmt is a function', () => {
    expect(typeof fmt).toBe('function');
  });
  test('if isBot is a function', () => {
    expect(typeof isFromBot).toBe('function');
  });
});
