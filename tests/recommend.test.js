import { test } from 'node:test';
import assert from 'node:assert/strict';
import { pickAlbums, fallbackAlbums, describeTraits } from '../js/recommend.js';
import { makeData } from './fixtures.js';

test('그 계열의 입문 판 3장과 다음 판 2장', () => {
  const { albums } = makeData();
  const r = pickAlbums(albums, 'l2', {});
  assert.deepEqual(r.starters.map(a => a.id), ['l2-s1', 'l2-s2', 'l2-s3']);
  assert.deepEqual(r.next.map(a => a.id), ['l2-n1', 'l2-n2']);
});
test('성향과 많이 겹치는 판이 앞에 온다', () => {
  const { albums } = makeData();
  const s3 = albums.find(a => a.id === 'l2-s3');
  s3.instrument = '기타'; s3.tempo = 'fast';
  const r = pickAlbums(albums, 'l2', { instrument: '기타', tempo: 'fast' });
  assert.equal(r.starters[0].id, 'l2-s3');
  assert.deepEqual(r.starters.slice(1).map(a => a.id), ['l2-s1', 'l2-s2']);
});
test('없는 계열이면 빈 목록', () => {
  const r = pickAlbums(makeData().albums, 'nope', {});
  assert.deepEqual(r, { starters: [], next: [] });
});
test('fallback 판 3장', () => {
  assert.deepEqual(fallbackAlbums(makeData().albums).map(a => a.id), ['l1-s1', 'l2-s1', 'l3-s1']);
});
test('성향 문장', () => {
  assert.equal(describeTraits({ instrument: '피아노', tempo: 'slow' }), '피아노 위주의 느린 곡을 좋아하시네요.');
  assert.equal(describeTraits({ instrument: '색소폰' }), '색소폰 소리가 중심인 곡을 좋아하시네요.');
  assert.equal(describeTraits({ tempo: 'fast' }), '빠른 곡을 좋아하시네요.');
  assert.equal(describeTraits({ tempo: 'mid' }), '중간 빠르기의 곡을 좋아하시네요.');
  assert.equal(describeTraits({}), '');
});
