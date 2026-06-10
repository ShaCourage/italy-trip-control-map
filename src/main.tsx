import React from "react";
import ReactDOM from "react-dom/client";
import "leaflet/dist/leaflet.css";
import "./styles.css";
import App from "./App";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

if ("serviceWorker" in navigator && import.meta.env.PROD) {
  // 새 서비스워커가 활성화(skipWaiting+claim)되면 한 번 자동 새로고침 → 새 배포가 즉시 반영.
  // (이게 없으면 옛 sw가 옛 JS를 계속 서빙해 "기능이 업데이트 안 됨"처럼 보인다)
  let refreshing = false;
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (refreshing) return;
    refreshing = true;
    window.location.reload();
  });
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register(`${import.meta.env.BASE_URL}sw.js`)
      .then((registration) => {
        registration.update();
        // 앱을 오래 켜두는 경우에도 1시간마다 새 배포 확인
        setInterval(() => registration.update(), 60 * 60 * 1000);
      })
      .catch(() => undefined);
  });
}

if ("serviceWorker" in navigator && import.meta.env.DEV) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    registrations.forEach((registration) => registration.unregister());
  });
}
