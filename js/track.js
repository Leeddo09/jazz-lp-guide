// 기록 이벤트를 보낸다. 기록 도구가 없거나 고장 나도 화면은 계속 동작해야 한다.
export function track(name, params = {}) {
  try {
    if (typeof globalThis.gtag === 'function') globalThis.gtag('event', name, params);
  } catch {
    // 기록 실패는 무시한다.
  }
}
