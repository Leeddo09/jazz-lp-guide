// 판정 결과로 보여 줄 판과 문장을 고른다.
const AXES = ['mood', 'tempo', 'instrument', 'vocal'];
const TEMPO_WORDS = { slow: '느린', mid: '중간 빠르기의', fast: '빠른' };

const overlap = (album, traits) => AXES.filter(axis => axis in traits && album[axis] === traits[axis]).length;

// 성향과 겹치는 축이 많은 판이 앞. 같으면 파일 순서(안정 정렬).
const byOverlap = (list, traits) => [...list].sort((a, b) => overlap(b, traits) - overlap(a, traits));

export function pickAlbums(albums, lineageId, traits = {}) {
  const mine = albums.filter(a => a.lineage === lineageId);
  return {
    starters: byOverlap(mine.filter(a => a.role === 'starter'), traits),
    next: byOverlap(mine.filter(a => a.role === 'next'), traits),
  };
}

export function fallbackAlbums(albums) {
  return albums.filter(a => a.fallback === true);
}

export function describeTraits(traits = {}) {
  const tempo = TEMPO_WORDS[traits.tempo];
  const { instrument } = traits;
  if (instrument && tempo) return `${instrument} 위주의 ${tempo} 곡을 좋아하시네요.`;
  if (instrument) return `${instrument} 소리가 중심인 곡을 좋아하시네요.`;
  if (tempo) return `${tempo} 곡을 좋아하시네요.`;
  return '';
}
