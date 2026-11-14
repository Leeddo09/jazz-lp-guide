import { test } from 'node:test';
import assert from 'node:assert/strict';
import { orderTracks, createQuiz, sharedView } from '../js/quiz.js';
import { makeData } from './fixtures.js';

// 씨앗이 있는 난수. 테스트가 매번 같은 순서를 보게 한다.
const seeded = seed => () => (seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296;

test('곡 순서: 모든 곡이 한 번씩, 같은 계열이 연달아 나오지 않는다', () => {
  const { tracks } = makeData();
  for (let seed = 1; seed <= 200; seed++) {
    const order = orderTracks(tracks, seeded(seed));
    assert.deepEqual(order.map(t => t.id).sort(), tracks.map(t => t.id).sort());
    for (let i = 1; i < order.length; i++)
      assert.notEqual(order[i].lineage, order[i - 1].lineage, `seed ${seed}, index ${i}`);
  }
});
test('곡 순서: 한 계열뿐이라 피할 수 없으면 그대로 돌려준다', () => {
  const tracks = makeData().tracks.slice(0, 2);
  assert.equal(orderTracks(tracks, seeded(1)).length, 2);
});

const play = (quiz, pick) => { while (!quiz.done) quiz.answer(pick(quiz.current())); };

test('진행 표시와 완료', () => {
  const quiz = createQuiz(makeData(), seeded(1));
  assert.equal(quiz.progress(), '1 / 14');
  quiz.answer('skip');
  assert.equal(quiz.progress(), '2 / 14');
  play(quiz, () => 'skip');
  assert.equal(quiz.done, true);
  assert.equal(quiz.current(), null);
});
test('방금 답한 곡을 알려 준다', () => {
  const quiz = createQuiz(makeData(), seeded(1));
  assert.equal(quiz.previous(), null);
  const first = quiz.current();
  quiz.answer('like');
  assert.equal(quiz.previous().id, first.id);
});
test('전부 별로예요면 입문 판 3장 안내', () => {
  const quiz = createQuiz(makeData(), seeded(2));
  play(quiz, () => 'dislike');
  const view = quiz.view();
  assert.equal(view.kind, 'fallback');
  assert.equal(view.albums.length, 3);
  assert.deepEqual(view.top, []);
});
test('한 계열을 좋아하면 그 계열의 판 5장', () => {
  const quiz = createQuiz(makeData(), seeded(3));
  play(quiz, t => (t.lineage === 'l2' ? 'like' : 'skip'));
  const view = quiz.view();
  assert.equal(view.kind, 'match');
  assert.deepEqual(view.top, ['l2']);
  assert.equal(view.sections.length, 1);
  assert.equal(view.sections[0].lineage.id, 'l2');
  assert.equal(view.sections[0].starters.length, 3);
  assert.equal(view.sections[0].next.length, 2);
  assert.equal(view.sentence, '피아노 위주의 중간 빠르기의 곡을 좋아하시네요.');
});
test('끝난 뒤의 답과 모르는 답은 무시한다', () => {
  const quiz = createQuiz(makeData(), seeded(4));
  quiz.answer('banana');
  assert.equal(quiz.progress(), '1 / 14');
  play(quiz, () => 'like');
  const before = JSON.stringify(quiz.view());
  quiz.answer('dislike');
  assert.equal(JSON.stringify(quiz.view()), before);
});
test('공유받은 결과는 계열과 판만 보여 주고 성향 문장은 없다', () => {
  const view = sharedView(makeData(), ['l1', 'l3']);
  assert.equal(view.kind, 'match');
  assert.deepEqual(view.sections.map(s => s.lineage.id), ['l1', 'l3']);
  assert.equal(view.sentence, '');
});
