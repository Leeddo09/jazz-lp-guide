// 청음의 진행 상태와 결과 화면에 보여 줄 내용. 화면(DOM)을 모른다.
import { scoreAnswers } from './scoring.js';
import { pickAlbums, fallbackAlbums, describeTraits } from './recommend.js';

const ANSWERS = ['like', 'dislike', 'skip'];

function shuffle(list, rng) {
  const out = [...list];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

const hasNeighbours = list => list.some((t, i) => i > 0 && t.lineage === list[i - 1].lineage);

// 같은 계열이 연달아 나오지 않게 섞는다. 피할 수 없는 목록이면 마지막으로 섞은 순서를 쓴다.
export function orderTracks(tracks, rng = Math.random) {
  let order = shuffle(tracks, rng);
  for (let tries = 0; tries < 200 && hasNeighbours(order); tries++) order = shuffle(tracks, rng);
  return order;
}

function matchView(data, top, traits) {
  const byId = new Map(data.lineages.map(l => [l.id, l]));
  return {
    kind: 'match',
    top,
    sentence: describeTraits(traits),
    sections: top.map(id => ({ lineage: byId.get(id), ...pickAlbums(data.albums, id, traits) })),
  };
}

// 공유 링크로 열었을 때: 계열과 판만 보여 준다.
export function sharedView(data, top) {
  return matchView(data, top, {});
}

export function createQuiz(data, rng = Math.random) {
  const order = orderTracks(data.tracks, rng);
  const answers = {};
  let index = 0;

  return {
    get done() { return index >= order.length; },
    current: () => order[index] ?? null,
    previous: () => order[index - 1] ?? null,
    progress: () => `${Math.min(index + 1, order.length)} / ${order.length}`,
    answer(value) {
      if (index >= order.length || !ANSWERS.includes(value)) return;
      answers[order[index].id] = value;
      index++;
    },
    view() {
      const result = scoreAnswers(data.lineages, data.tracks, answers);
      if (result.top.length === 0) {
        return { kind: 'fallback', top: [], albums: fallbackAlbums(data.albums) };
      }
      return matchView(data, result.top, result.traits);
    },
  };
}
