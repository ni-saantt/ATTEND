# Mobile Dev Setup (Physical Device)

## Quick Start

**From repo root (recommended)** — starts backend, mobile, Expo, and admin-desktop together:

```bash
npm run dev
```

Backend must show `Uvicorn running on http://0.0.0.0:8000` in the Turbo logs. Scan the Expo QR code with Expo Go on your phone.

**Or run mobile only** (if backend is already running):

```bash
cd apps/mobile && npx expo start --clear
```

The app uses the **same host as Expo/Metro** for the API (`apps/mobile/lib/api.ts`). When you scan the QR code on a physical device, the backend URL is `http://<your-lan-ip>:8000` automatically — no manual IP needed if phone and computer share WiFi.

**Optional override:** set `EXPO_PUBLIC_API_URL=http://YOUR_IP:8000` in `apps/mobile/.env`, then restart Expo with `--clear`.
Find IP: `ipconfig getifaddr en0` (macOS).

## If Connection Fails

1. Run `npm run check-setup` to verify backend and network.
2. Ensure backend shows `0.0.0.0:8000` (not `127.0.0.1`).
3. Phone and computer must be on the same Wi‑Fi.
4. Fallback: set `EXPO_PUBLIC_API_URL=http://YOUR_IP:8000` in `apps/mobile/.env`, then `npx expo start --clear`.
