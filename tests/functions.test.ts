import { hasPrefix, fmt, isNotFromBot } from '../src/handler/utilities/messageHelpers';
describe('FUNCTIONS', () => {
  test('If hasPrefix is a function', () => {
    expect(typeof hasPrefix).toBe('function');
  });
  test('if fmt is a function', () => {
    expect(typeof fmt).toBe('function');
  });
  test('if isNotFromBot is a function', () => {
    expect(typeof isNotFromBot).toBe('function');
  });
});
