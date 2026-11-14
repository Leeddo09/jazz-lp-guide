import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateData } from '../js/validate.js';
import { makeData } from './fixtures.js';

test('규칙에 맞는 목록은 오류가 없다', () => {
  assert.deepEqual(validateData(makeData()), []);
});
test('계열에 곡이 2개가 아니면 그 계열 id를 담은 오류를 낸다', () => {
  const d = makeData(); d.tracks.pop();
  assert.ok(validateData(d).some(e => e.includes('l7')));
});
test('입문 판 3장, 다음 판 2장이 아니면 오류', () => {
  const d = makeData(); d.albums = d.albums.filter(a => a.id !== 'l1-n2');
  assert.ok(validateData(d).some(e => e.includes('l1')));
});
test('youtubeId가 11자가 아니면 오류', () => {
  const d = makeData(); d.tracks[0].youtubeId = 'abc';
  assert.equal(validateData(d).length, 1);
});
test('buyUrl이 https가 아니면 오류', () => {
  const d = makeData(); d.albums[0].buyUrl = 'http://x.kr';
  assert.equal(validateData(d).length, 1);
});
test('없는 계열을 가리키면 오류', () => {
  const d = makeData(); d.tracks[0].lineage = 'nope';
  assert.ok(validateData(d).length >= 1);
});
test('fallback 판이 3장이 아니면 오류', () => {
  const d = makeData(); delete d.albums.find(a => a.fallback).fallback;
  assert.equal(validateData(d).length, 1);
});
test('목록 자체가 배열이 아니면 던지지 않고 오류를 돌려준다', () => {
  assert.ok(validateData({ lineages: null, tracks: {}, albums: undefined }).length >= 1);
});
