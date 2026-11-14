// 구매 링크 점검: node scripts/check-links.mjs
// 응답이 200이 아닌 판과, 확인한 지 30일이 넘은 판을 알려 준다.
// 품절 여부는 자동으로 알 수 없으니 목록을 보고 직접 확인한다.
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const DAY_MS = 24 * 60 * 60 * 1000;

export function staleAlbums(albums, today, days = 30) {
  const now = Date.parse(today);
  return albums.filter(album => {
    const checked = Date.parse(album.checkedAt ?? '');
    return Number.isNaN(checked) || now - checked > days * DAY_MS;
  });
}

async function linkStatus(url) {
  try {
    const response = await fetch(url, { redirect: 'follow', signal: AbortSignal.timeout(15000) });
    return response.status;
  } catch (error) {
    return error.name;
  }
}

async function main() {
  const file = new URL('../data/albums.json', import.meta.url);
  const albums = JSON.parse(await readFile(file, 'utf8'));
  const today = new Date().toISOString().slice(0, 10);

  const dead = [];
  for (const album of albums) {
    const status = await linkStatus(album.buyUrl);
    if (status !== 200) dead.push({ album, status });
  }
  const stale = staleAlbums(albums, today);

  for (const { album, status } of dead) console.log(`링크 이상 (${status}): ${album.id} ${album.title} ${album.buyUrl}`);
  for (const album of stale) console.log(`확인한 지 30일 넘음 (${album.checkedAt ?? '날짜 없음'}): ${album.id} ${album.title}`);
  console.log(`판 ${albums.length}장 중 링크 이상 ${dead.length}장, 다시 확인할 판 ${stale.length}장`);
  process.exitCode = dead.length > 0 || stale.length > 0 ? 1 : 0;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) await main();
