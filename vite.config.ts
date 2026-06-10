import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  // PORT 환경변수가 있으면 그 포트로(프리뷰 도구 연동). 없으면 vite 기본(5173).
  server: {
    host: true,
    port: process.env.PORT ? Number(process.env.PORT) : undefined,
  },
  build: {
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            {
              name: "vendor",
              test: /node_modules/,
            },
          ],
        },
      },
    },
  },
});
