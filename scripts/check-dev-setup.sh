#!/bin/bash
# Run before testing on physical device. Ensures backend is reachable.
set -e
echo "=== Attend Dev Setup Check ==="
echo ""
echo "1. Backend (port 8000)..."
if curl -s -o /dev/null -w "" --connect-timeout 2 http://localhost:8000/docs 2>/dev/null; then
  echo "   OK - Backend is running"
else
  echo "   FAIL - Backend not reachable. Run: npm run backend"
  exit 1
fi

echo ""
echo "2. Backend listening on all interfaces..."
if lsof -i :8000 2>/dev/null | grep -q "0.0.0.0\|\\*:8000"; then
  echo "   OK - Backend accepts network connections"
else
  echo "   WARN - Backend may only listen on localhost. Restart with: npm run backend"
fi

echo ""
echo "3. Your machine IP (for .env if needed):"
ip=$(ifconfig 2>/dev/null | grep "inet " | grep -v 127.0.0.1 | awk '{print $2}' | head -1)
echo "   $ip"
echo "   Set in apps/mobile/.env: EXPO_PUBLIC_API_URL=http://${ip}:8000"
echo ""
echo "4. Start mobile: cd apps/mobile && npx expo start --clear"
echo ""
echo "=== Ready ==="
