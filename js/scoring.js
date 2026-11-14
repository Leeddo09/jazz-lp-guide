// 답을 계열 점수와 성향으로 바꾼다.
const POINTS = { like: 1, dislike: -1, skip: 0 };
const AXES = ['mood', 'tempo', 'instrument', 'vocal'];

// 가장 많이 나온 값 하나. 동률이거나 값이 없으면 undefined.
function mostCommon(values) {
  const counts = new Map();
  for (const v of values) counts.set(v, (counts.get(v) ?? 0) + 1);
  const sorted = [...counts.entries()].sort((a, b) => b[1] - a[1]);
  if (sorted.length === 0) return undefined;
  if (sorted.length > 1 && sorted[0][1] === sorted[1][1]) return undefined;
  return sorted[0][0];
}

export function scoreAnswers(lineages, tracks, answers) {
  const scores = Object.fromEntries(lineages.map(l => [l.id, 0]));
  const liked = [];
  for (const track of tracks) {
    const answer = answers?.[track.id];
    if (!(answer in POINTS) || !(track.lineage in scores)) continue;
    scores[track.lineage] += POINTS[answer];
    if (answer === 'like') liked.push(track);
  }

  // sort는 안정 정렬이라 점수가 같으면 계열 파일 순서가 유지된다.
  const top = lineages
    .map(l => l.id)
    .filter(id => scores[id] > 0)
    .sort((a, b) => scores[b] - scores[a])
    .slice(0, 2);

  const traits = {};
  for (const axis of AXES) {
    const value = mostCommon(liked.map(t => t[axis]));
    if (value !== undefined) traits[axis] = value;
  }
  return { top, hasLikes: liked.length > 0, traits, scores };
}
