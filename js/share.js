// 결과(계열 id 1~2개)를 주소 뒤에 붙는 값으로 바꾸고 되돌린다.
export function encodeResult(top) {
  return `#r=${top.join(',')}`;
}

// 유효하지 않으면 null. 하나라도 모르는 계열이면 전체를 버린다.
export function decodeResult(hash, lineages) {
  if (typeof hash !== 'string' || !hash.startsWith('#r=')) return null;
  const ids = hash.slice(3).split(',');
  const known = new Set(lineages.map(l => l.id));
  if (ids.length < 1 || ids.length > 2) return null;
  if (new Set(ids).size !== ids.length) return null;
  if (!ids.every(id => known.has(id))) return null;
  return ids;
}
