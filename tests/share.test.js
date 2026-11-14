import { test } from 'node:test';
import assert from 'node:assert/strict';
import { encodeResult, decodeResult } from '../js/share.js';
import { makeData } from './fixtures.js';

const { lineages } = makeData();

test('결과를 주소로 바꾸고 되돌린다', () => {
  assert.equal(encodeResult(['l1', 'l3']), '#r=l1,l3');
  assert.deepEqual(decodeResult('#r=l1,l3', lineages), ['l1', 'l3']);
  assert.deepEqual(decodeResult('#r=l4', lineages), ['l4']);
});
test('없는 계열, 빈 값, 엉뚱한 값은 null', () => {
  for (const h of ['', '#', '#r=', '#r=nope', '#r=l1,nope', '#x=l1', '#r=l1,l2,l3', '#r=l1,l1', null, undefined])
    assert.equal(decodeResult(h, lineages), null, String(h));
});
