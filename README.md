# 재즈 LP 길잡이

재즈 곡을 듣고 고르면 취향에 맞는 계열과 처음 살 만한 LP를 알려 주는 웹페이지.
서버 없이 돌아가는 정적 페이지이고, 설치할 패키지가 없다.

## 실행

```bash
python3 -m http.server 8000   # http://localhost:8000
npm test                      # Node 22 이상
```

## 구조

| 파일 | 역할 |
| --- | --- |
| `data/lineages.json` | 계열 7개: 이름과 설명 |
| `data/tracks.json` | 청음 곡 14개와 꼬리표 |
| `data/albums.json` | 추천 판 35장과 꼬리표, 구매 링크 |
| `js/validate.js` | 목록 파일이 규칙에 맞는지 검사 |
| `js/scoring.js` | 답을 계열 점수와 성향으로 바꿈 |
| `js/recommend.js` | 보여 줄 판과 문장을 고름 |
| `js/quiz.js` | 곡 순서, 진행 상태, 결과 내용 |
| `js/share.js` | 결과를 주소로 바꾸고 되돌림 |
| `js/track.js` | 기록 이벤트 전송 |
| `js/app.js` | 화면 전환과 유튜브 재생 창 |

## 목록 규칙

- 계열 7개. 계열마다 곡 2개, 입문 판(`role: "starter"`) 3장, 다음 판(`role: "next"`) 2장.
- 곡과 판에는 `mood`, `tempo`(`slow`/`mid`/`fast`), `instrument`, `vocal`(true/false)을 붙인다.
- `youtubeId`는 유튜브 주소의 `v=` 뒤 11자. 공식 채널 영상만 쓴다.
- 판은 지금 새 제품으로 살 수 있는 것만. `buyUrl`은 `https://`, `checkedAt`은 링크를 확인한 날짜.
- 널리 사랑받는 입문 판 3장에 `"fallback": true`.

규칙에 어긋나면 `npm test`가 실패하고, 페이지는 오류 화면을 보여 준다.

## 월 1회 점검

1. `node scripts/check-links.mjs` 실행.
2. 링크가 죽었거나 품절된 판을 다른 판으로 바꾼다.
3. 확인한 판의 `checkedAt`을 오늘 날짜로 고친다.
4. `npm test`가 통과하는지 확인하고 커밋한다.

## 기록

`index.html`의 `GA_ID`를 Google Analytics 4 측정 ID로 바꾸면 켜진다.
이벤트: `quiz_start`, `quiz_complete`, `feedback`, `buy_click`, `share_click`.
