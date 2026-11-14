import { test } from 'node:test';
import assert from 'node:assert/strict';
import { staleAlbums } from '../scripts/check-links.mjs';

test('확인한 지 30일이 넘은 판만 고른다', () => {
  const albums = [{ id: 'a', checkedAt: '2026-10-01' }, { id: 'b', checkedAt: '2026-11-10' }];
  assert.deepEqual(staleAlbums(albums, '2026-11-14').map(a => a.id), ['a']);
});
test('정확히 30일이면 아직 괜찮다', () => {
  assert.deepEqual(staleAlbums([{ id: 'a', checkedAt: '2026-10-15' }], '2026-11-14'), []);
});
test('날짜가 없거나 잘못된 판은 점검 대상이다', () => {
  const albums = [{ id: 'a' }, { id: 'b', checkedAt: 'soon' }];
  assert.deepEqual(staleAlbums(albums, '2026-11-14').map(a => a.id), ['a', 'b']);
});
