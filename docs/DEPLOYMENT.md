# Attend – Deployment Guide

## Backend (AWS EC2)

### Prerequisites

- AWS account
- Supabase project (URL + service key)
- JWT secret for token signing

### 1. EC2 Setup

1. Launch an EC2 instance (Ubuntu 22.04 LTS recommended).
2. For CPU-only: `t3.medium` or similar.
3. For GPU (face recognition): choose an instance with NVIDIA GPU (e.g. `g4dn.xlarge`), install NVIDIA drivers and `nvidia-container-toolkit` if using Docker with GPU.

### 2. Docker Deployment (CPU)

```bash
# Clone repo
git clone <repo-url> Attend && cd Attend

# Create .env from template
cp apps/backend/.env.example apps/backend/.env
# Edit apps/backend/.env with your Supabase URL, service key, JWT secret

# Run with Docker Compose
docker compose up -d backend
```

Backend will be available at `http://<ec2-ip>:8000`. Use a reverse proxy (nginx) and HTTPS in production.

### 3. Docker Deployment (GPU)

For GPU instances:

```bash
# Build GPU image
docker build -f apps/backend/Dockerfile.gpu -t attend-backend-gpu ./apps/backend

# Run (requires nvidia-docker)
docker run -d -p 8000:8000 \
  -e SUPABASE_URL=... \
  -e SUPABASE_SERVICE_KEY=... \
  -e JWT_SECRET=... \
  -e FACE_EXECUTION_PROVIDER=cuda \
  --gpus all \
  attend-backend-gpu
```

### 4. Systemd Service (Optional)

Create `/etc/systemd/system/attend-backend.service`:

```ini
[Unit]
Description=Attend Backend API
After=network.target

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/home/ubuntu/Attend
ExecStart=/usr/bin/docker compose up
ExecStop=/usr/bin/docker compose down
Restart=on-failure

[Install]
WantedBy=multi-user.target
```

Then: `sudo systemctl enable attend-backend && sudo systemctl start attend-backend`

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| SUPABASE_URL | Yes | Supabase project URL |
| SUPABASE_SERVICE_KEY | Yes | Supabase service role key |
| JWT_SECRET | Yes | Secret for JWT signing |
| RECOGNITION_THRESHOLD | No | Face match threshold (default: 0.5) |
| FACE_EXECUTION_PROVIDER | No | `auto`, `cuda`, `coreml`, or `cpu` (default: auto) |

---

## Mobile (Android APK)

### EAS Build (Expo Application Services)

1. Install EAS CLI: `npm install -g eas-cli`
2. Login: `eas login`
3. Configure: `cd apps/mobile && eas build:configure`
4. Build APK: `eas build --platform android --profile preview`

Or use local build:

```bash
cd apps/mobile
npx expo prebuild
npx expo run:android
```

APK output: `android/app/build/outputs/apk/` (or EAS build artifacts).

---

## Admin Desktop (Windows Installer)

```bash
cd apps/admin-desktop
npm run build:electron
```

Output: `release/` directory with Windows NSIS installer.

Build targets are configured in `package.json` (`"win": { "target": "nsis" }`).
