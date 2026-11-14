import { test } from 'node:test';
import assert from 'node:assert/strict';
import { scoreAnswers } from '../js/scoring.js';
import { makeData } from './fixtures.js';

const { lineages, tracks } = makeData();
const run = a => scoreAnswers(lineages, tracks, a);

test('좋아요 +1, 별로예요 -1, 모르겠어요 0', () => {
  const r = run({ 'l1-t1': 'like', 'l1-t2': 'like', 'l2-t1': 'dislike', 'l3-t1': 'skip' });
  assert.equal(r.scores.l1, 2); assert.equal(r.scores.l2, -1); assert.equal(r.scores.l3, 0);
});
test('점수가 0보다 큰 계열 중 상위 2개', () => {
  const r = run({ 'l1-t1': 'like', 'l1-t2': 'like', 'l2-t1': 'like', 'l3-t1': 'like', 'l3-t2': 'like' });
  assert.deepEqual(r.top, ['l1', 'l3']);
});
test('양수인 계열이 하나면 하나만', () => {
  assert.deepEqual(run({ 'l4-t1': 'like' }).top, ['l4']);
});
test('점수가 같으면 계열 파일 순서', () => {
  const r = run({ 'l5-t1': 'like', 'l2-t1': 'like', 'l6-t1': 'like', 'l6-t2': 'like', 'l7-t1': 'like', 'l7-t2': 'like', 'l1-t1': 'dislike' });
  assert.deepEqual(r.top, ['l6', 'l7']);
  assert.deepEqual(run({ 'l5-t1': 'like', 'l2-t1': 'like' }).top, ['l2', 'l5']);
});
test('좋아요와 별로예요가 상쇄된 계열은 결과에 들지 않는다', () => {
  assert.deepEqual(run({ 'l1-t1': 'like', 'l1-t2': 'dislike' }).top, []);
});
test('좋아요가 없으면 hasLikes는 false, top은 빈 배열', () => {
  const r = run({ 'l1-t1': 'dislike', 'l2-t1': 'skip' });
  assert.equal(r.hasLikes, false); assert.deepEqual(r.top, []);
});
test('답이 비어 있어도 오류 없이 빈 결과', () => {
  assert.deepEqual(run({}).top, []);
});
test('목록에 없는 곡이나 모르는 답은 무시한다', () => {
  const r = run({ nope: 'like', 'l1-t1': 'banana' });
  assert.equal(r.hasLikes, false); assert.equal(r.scores.l1, 0);
});
test('성향은 좋아요한 곡에서 가장 많은 값, 동률이면 비움', () => {
  const t = structuredClone(tracks);
  t[0].instrument = '피아노'; t[1].instrument = '피아노'; t[2].instrument = '색소폰';
  t[0].tempo = 'slow'; t[1].tempo = 'fast'; t[2].tempo = 'mid';
  const r = scoreAnswers(lineages, t, { [t[0].id]: 'like', [t[1].id]: 'like', [t[2].id]: 'like' });
  assert.equal(r.traits.instrument, '피아노');
  assert.equal('tempo' in r.traits, false);
});
