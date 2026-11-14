import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { validateData } from '../js/validate.js';

// 실제로 페이지가 쓰는 목록 파일 세 개를 읽는다.
function loadRealData() {
  const read = name => JSON.parse(readFileSync(new URL(`../data/${name}.json`, import.meta.url), 'utf8'));
  return { lineages: read('lineages'), tracks: read('tracks'), albums: read('albums') };
}

test('실제 목록 파일이 규칙을 통과한다', () => {
  assert.deepEqual(validateData(loadRealData()), []);
});
test('임시 id가 남아 있지 않다', () => {
  assert.equal(loadRealData().lineages.some(l => /^l\d$/.test(l.id)), false);
});
test('곡과 판의 id가 겹치지 않는다', () => {
  const { tracks, albums } = loadRealData();
  const ids = [...tracks, ...albums].map(x => x.id);
  assert.equal(new Set(ids).size, ids.length);
});
test('구매 링크는 모두 예스24 상품 페이지다', () => {
  for (const album of loadRealData().albums)
    assert.match(album.buyUrl, /^https:\/\/www\.yes24\.com\/product\/goods\/\d+$/, album.id);
});
