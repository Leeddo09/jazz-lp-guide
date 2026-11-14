import { test } from 'node:test';
import assert from 'node:assert/strict';
import { track } from '../js/track.js';

test('gtag가 있으면 이벤트를 보낸다', () => {
  const calls = []; globalThis.gtag = (...a) => calls.push(a);
  track('buy_click', { album: 'l1-s1' });
  assert.deepEqual(calls, [['event', 'buy_click', { album: 'l1-s1' }]]);
});
test('값이 없으면 빈 객체로 보낸다', () => {
  const calls = []; globalThis.gtag = (...a) => calls.push(a);
  track('quiz_start');
  assert.deepEqual(calls, [['event', 'quiz_start', {}]]);
});
test('gtag가 없거나 오류를 던져도 조용히 넘어간다', () => {
  delete globalThis.gtag; assert.doesNotThrow(() => track('x'));
  globalThis.gtag = () => { throw new Error(); }; assert.doesNotThrow(() => track('x'));
});
