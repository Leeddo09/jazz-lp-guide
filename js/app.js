// 화면 전환과 유튜브 재생 창. 판단은 다른 모듈이 하고 여기서는 연결만 한다.
import { validateData } from './validate.js';
import { createQuiz, sharedView } from './quiz.js';
import { encodeResult, decodeResult } from './share.js';
import { track } from './track.js';

const $ = id => document.getElementById(id);
const SCREENS = ['start', 'listen', 'result', 'error'];
const YT_WAIT_MS = 8000;

let data = null;
let quiz = null;
let currentTop = [];
let feedbackSent = false;

function show(name) {
  for (const s of SCREENS) $(`screen-${s}`).hidden = s !== name;
  window.scrollTo(0, 0);
}

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

// ---------- 목록 불러오기 ----------

async function loadData() {
  const names = ['lineages', 'tracks', 'albums'];
  const lists = await Promise.all(names.map(async name => {
    const response = await fetch(`data/${name}.json`);
    if (!response.ok) throw new Error(`${name}.json: ${response.status}`);
    return response.json();
  }));
  const loaded = Object.fromEntries(names.map((name, i) => [name, lists[i]]));
  const errors = validateData(loaded);
  if (errors.length > 0) {
    console.error('목록 파일 오류', errors);
    throw new Error('목록 파일이 규칙에 맞지 않음');
  }
  return loaded;
}

// ---------- 유튜브 재생 창 ----------

let youtubeApi = null; // Promise<boolean>: 재생 도구를 쓸 수 있는지
let player = null;
let playerReady = false;
let wantedVideo = null;

function loadYouTube() {
  if (youtubeApi) return youtubeApi;
  youtubeApi = new Promise(resolve => {
    const timer = setTimeout(() => resolve(false), YT_WAIT_MS);
    window.onYouTubeIframeAPIReady = () => { clearTimeout(timer); resolve(true); };
    const script = document.createElement('script');
    script.src = 'https://www.youtube.com/iframe_api';
    script.onerror = () => { clearTimeout(timer); resolve(false); };
    document.head.appendChild(script);
  });
  return youtubeApi;
}

function setUnavailable(message) {
  const note = $('player-note');
  note.textContent = message;
  note.hidden = false;
  $('answers').hidden = true;
  $('next-track').hidden = false;
}

function setAnswering(enabled) {
  for (const id of ['like', 'dislike', 'skip']) $(id).disabled = !enabled;
}

function cueVideo(videoId) {
  wantedVideo = videoId;
  if (!player) {
    player = new window.YT.Player('player', {
      host: 'https://www.youtube-nocookie.com',
      width: '100%',
      height: '100%',
      videoId,
      playerVars: { playsinline: 1, rel: 0 },
      events: {
        onReady() {
          playerReady = true;
          if (wantedVideo !== videoId) player.cueVideoById(wantedVideo);
        },
        // 삭제, 끼워 넣기 차단, 지역 제한 등. 지금 보고 있는 곡일 때만 알린다.
        onError() {
          if (quiz && !quiz.done && quiz.current()?.youtubeId === wantedVideo) {
            setUnavailable('이 곡은 지금 재생할 수 없어요');
          }
        },
      },
    });
  } else if (playerReady) {
    player.cueVideoById(videoId);
  }
}

// ---------- 청음 ----------

async function showTrack() {
  const current = quiz.current();
  $('progress').textContent = quiz.progress();
  const previous = quiz.previous();
  $('previous').textContent = previous ? `방금 들은 곡: ${previous.title} — ${previous.artist}` : '';

  $('answers').hidden = false;
  $('next-track').hidden = true;
  const note = $('player-note');
  note.textContent = '곡을 불러오는 중이에요';
  note.hidden = false;
  setAnswering(false);

  const usable = await loadYouTube();
  if (quiz.current() !== current) return; // 기다리는 사이 다른 곡으로 넘어감
  setAnswering(true);
  if (!usable) {
    setUnavailable('이 곡은 지금 재생할 수 없어요');
    return;
  }
  note.hidden = true;
  cueVideo(current.youtubeId);
}

function answer(value) {
  quiz.answer(value);
  if (quiz.done) {
    try { player?.stopVideo?.(); } catch { /* 재생 창이 없어도 계속 */ }
    const view = quiz.view();
    track('quiz_complete', { top: view.top.join(',') || 'none' });
    renderResult(view, false);
  } else {
    showTrack();
  }
}

function start() {
  track('quiz_start');
  quiz = createQuiz(data);
  show('listen');
  showTrack();
}

// ---------- 결과 ----------

function albumCard(album) {
  const item = el('li', 'album');
  item.append(el('p', 'album-title', album.title), el('p', 'album-artist', album.artist));
  if (album.blurb) item.append(el('p', 'album-blurb', album.blurb));
  const link = el('a', 'buy', '판 보러 가기');
  link.href = album.buyUrl;
  link.target = '_blank';
  link.rel = 'noopener sponsored';
  link.dataset.album = album.id;
  link.dataset.lineage = album.lineage;
  item.append(link);
  return item;
}

function albumList(albums) {
  const list = el('ul', 'albums');
  list.append(...albums.map(albumCard));
  return list;
}

function renderResult(view, shared) {
  currentTop = view.top;
  feedbackSent = false;
  const results = $('results');
  results.replaceChildren();

  if (view.kind === 'fallback') {
    $('result-title').textContent = '아직 딱 맞는 계열을 찾지 못했어요';
    $('sentence').textContent = '많은 사람이 좋아한 입문 판부터 들어 보세요.';
    results.append(albumList(view.albums));
  } else {
    const names = view.sections.map(s => s.lineage.name).join(', ');
    $('result-title').textContent = `${names} 쪽에 가까워요`;
    $('sentence').textContent = view.sentence;
    for (const section of view.sections) {
      const box = el('section', 'lineage');
      box.append(
        el('h2', '', section.lineage.name),
        el('p', '', section.lineage.description),
        el('h3', '', '입문 판'),
        albumList(section.starters),
        el('h3', '', '이게 좋았다면 다음은'),
        albumList(section.next),
      );
      results.append(box);
    }
  }

  const matched = view.kind === 'match';
  $('shared-label').hidden = !shared;
  $('feedback').hidden = shared || !matched;
  $('fb-yes').disabled = false;
  $('fb-no').disabled = false;
  $('fb-thanks').hidden = true;
  $('share').hidden = !matched;
  $('share-done').hidden = true;
  $('restart').textContent = shared ? '나도 해 보기' : '처음부터 다시';
  show('result');
}

function sendFeedback(value) {
  if (feedbackSent) return;
  feedbackSent = true;
  track('feedback', { top: currentTop.join(','), value });
  $('fb-yes').disabled = true;
  $('fb-no').disabled = true;
  $('fb-thanks').hidden = false;
}

async function share() {
  const url = `${location.origin}${location.pathname}${encodeResult(currentTop)}`;
  track('share_click', { top: currentTop.join(',') });
  const done = $('share-done');
  try {
    await navigator.clipboard.writeText(url);
    done.textContent = '링크를 복사했어요';
  } catch {
    done.textContent = `이 주소를 복사해 주세요: ${url}`;
  }
  done.hidden = false;
}

function restart() {
  history.replaceState(null, '', location.pathname);
  show('start');
}

// ---------- 시작 ----------

function route() {
  const top = decodeResult(location.hash, data.lineages);
  if (top) renderResult(sharedView(data, top), true);
  else show('start');
}

async function init() {
  try {
    data = await loadData();
  } catch (error) {
    console.error(error);
    show('error');
    return;
  }
  loadYouTube(); // 시작 버튼을 누르기 전에 미리 받아 둔다
  route();
}

$('start').addEventListener('click', start);
$('like').addEventListener('click', () => answer('like'));
$('dislike').addEventListener('click', () => answer('dislike'));
$('skip').addEventListener('click', () => answer('skip'));
$('next-track').addEventListener('click', () => answer('skip'));
$('fb-yes').addEventListener('click', () => sendFeedback('yes'));
$('fb-no').addEventListener('click', () => sendFeedback('no'));
$('share').addEventListener('click', share);
$('restart').addEventListener('click', restart);
$('retry').addEventListener('click', init);
$('results').addEventListener('click', event => {
  const link = event.target.closest?.('.buy');
  if (link) track('buy_click', { album: link.dataset.album, lineage: link.dataset.lineage });
});
window.addEventListener('hashchange', () => { if (data && (!quiz || quiz.done)) route(); });

init();
