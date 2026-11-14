// 규칙에 맞는 견본 목록. 테스트에서만 쓴다.
const traits = () => ({ mood: 'calm', tempo: 'mid', instrument: '피아노', vocal: false });

export function makeData() {
  const lineages = [];
  const tracks = [];
  const albums = [];
  for (let i = 1; i <= 7; i++) {
    const id = `l${i}`;
    lineages.push({ id, name: `계열 ${i}`, description: `계열 ${i} 설명` });
    for (let t = 1; t <= 2; t++) {
      tracks.push({
        id: `${id}-t${t}`, lineage: id, title: `곡 ${i}-${t}`, artist: `연주자 ${i}`,
        youtubeId: 'abcdefghijk', ...traits(),
      });
    }
    const album = (suffix, role) => ({
      id: `${id}-${suffix}`, lineage: id, role, title: `판 ${id}-${suffix}`, artist: `연주자 ${i}`,
      blurb: '소개', buyUrl: `https://example.com/${id}-${suffix}`, checkedAt: '2026-11-14', ...traits(),
    });
    for (let s = 1; s <= 3; s++) albums.push(album(`s${s}`, 'starter'));
    for (let n = 1; n <= 2; n++) albums.push(album(`n${n}`, 'next'));
  }
  for (const id of ['l1-s1', 'l2-s1', 'l3-s1']) albums.find(a => a.id === id).fallback = true;
  return { lineages, tracks, albums };
}
