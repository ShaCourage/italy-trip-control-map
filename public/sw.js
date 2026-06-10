// 서비스워커 — 배포 경로(base path)에 무관하게 동작하도록 sw.js 위치에서 BASE를 유도한다.
// 전략: 내비게이션은 network-first(배포 업데이트 보장), 해시된 정적 자산·사진은 cache-first.
const CACHE_NAME = "italy-trip-control-map-v2";
const BASE = self.location.pathname.replace(/sw\.js$/, "");
const APP_SHELL = [BASE, BASE + "index.html", BASE + "manifest.webmanifest", BASE + "icon.svg"];

// 런타임 캐시 허용 호스트 — 장소 사진(위키미디어), Pretendard 폰트(jsdelivr)
const RUNTIME_HOSTS = ["upload.wikimedia.org", "cdn.jsdelivr.net"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);

  // 앱 진입(HTML): 네트워크 우선 — 새 배포가 캐시에 막히지 않게. 오프라인이면 캐시 폴백.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(BASE + "index.html", copy));
          return response;
        })
        .catch(() => caches.match(BASE + "index.html").then((cached) => cached ?? caches.match(BASE)))
    );
    return;
  }

  const cacheable =
    url.origin === self.location.origin || RUNTIME_HOSTS.includes(url.hostname);
  if (!cacheable) return; // 지도 타일 등은 캐시하지 않음 — 용량 폭주 방지

  // 정적 자산·사진: 캐시 우선 + 백그라운드 적재 (빌드 자산은 해시 파일명이라 영구 캐시 안전)
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request).then((response) => {
        if (response.ok || response.type === "opaque") {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
        }
        return response;
      });
    })
  );
});
