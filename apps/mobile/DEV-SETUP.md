# Mobile Dev Setup (Physical Device)

## Quick Start

1. **Terminal 1 – Backend**
   ```bash
   npm run backend
   ```
   Must show: `Uvicorn running on http://0.0.0.0:8000`

2. **Terminal 2 – Mobile**
   ```bash
   cd apps/mobile && npx expo start --clear
   ```

3. **Scan QR code** with Expo Go on your phone.

## How It Works

The app uses the **same host as Expo/Metro** for the API. If the app loads, the API URL is derived from that host (port 8000). No manual IP configuration needed.

## If Connection Fails

1. Run `npm run check-setup` to verify backend and network.
2. Ensure backend shows `0.0.0.0:8000` (not `127.0.0.1`).
3. Phone and computer must be on the same Wi‑Fi.
4. Fallback: set `EXPO_PUBLIC_API_URL=http://YOUR_IP:8000` in `apps/mobile/.env`, then `npx expo start --clear`.
