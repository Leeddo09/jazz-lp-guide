// 목록 파일(계열, 곡, 판)이 규칙에 맞는지 검사한다. 오류 하나에 문자열 하나.
const TEMPOS = ['slow', 'mid', 'fast'];
const YOUTUBE_ID = /^[\w-]{11}$/;
const DATE = /^\d{4}-\d{2}-\d{2}$/;

function checkTraits(item, errors) {
  if (typeof item.mood !== 'string' || !item.mood) errors.push(`${item.id}: mood가 비어 있음`);
  if (!TEMPOS.includes(item.tempo)) errors.push(`${item.id}: tempo는 slow, mid, fast 중 하나`);
  if (typeof item.instrument !== 'string' || !item.instrument) errors.push(`${item.id}: instrument가 비어 있음`);
  if (typeof item.vocal !== 'boolean') errors.push(`${item.id}: vocal은 true 또는 false`);
}

export function validateData(data) {
  const { lineages, tracks, albums } = data ?? {};
  if (!Array.isArray(lineages) || !Array.isArray(tracks) || !Array.isArray(albums)) {
    return ['목록 파일 형식이 올바르지 않음: lineages, tracks, albums는 배열이어야 함'];
  }
  const errors = [];
  const ids = lineages.map(l => l.id);
  if (lineages.length !== 7) errors.push(`계열은 7개여야 함 (지금 ${lineages.length}개)`);
  if (new Set(ids).size !== ids.length) errors.push('계열 id가 중복됨');

  for (const id of ids) {
    const count = (list, pred) => list.filter(x => x.lineage === id && pred(x)).length;
    const t = count(tracks, () => true);
    const s = count(albums, a => a.role === 'starter');
    const n = count(albums, a => a.role === 'next');
    if (t !== 2) errors.push(`${id}: 곡은 2개여야 함 (지금 ${t}개)`);
    if (s !== 3) errors.push(`${id}: 입문 판은 3장이어야 함 (지금 ${s}장)`);
    if (n !== 2) errors.push(`${id}: 다음 판은 2장이어야 함 (지금 ${n}장)`);
  }

  for (const track of tracks) {
    if (!ids.includes(track.lineage)) errors.push(`${track.id}: 없는 계열 ${track.lineage}`);
    if (!YOUTUBE_ID.test(track.youtubeId ?? '')) errors.push(`${track.id}: youtubeId는 11자`);
    checkTraits(track, errors);
  }

  for (const album of albums) {
    if (!ids.includes(album.lineage)) errors.push(`${album.id}: 없는 계열 ${album.lineage}`);
    if (!['starter', 'next'].includes(album.role)) errors.push(`${album.id}: role은 starter 또는 next`);
    if (!String(album.buyUrl ?? '').startsWith('https://')) errors.push(`${album.id}: buyUrl은 https://로 시작`);
    if (!DATE.test(album.checkedAt ?? '')) errors.push(`${album.id}: checkedAt은 YYYY-MM-DD`);
    checkTraits(album, errors);
  }

  const fallbacks = albums.filter(a => a.fallback === true).length;
  if (fallbacks !== 3) errors.push(`fallback 판은 3장이어야 함 (지금 ${fallbacks}장)`);
  return errors;
}
