import { registerRootComponent } from 'expo';
import { ExpoRoot } from 'expo-router';

// Workaround for EXPO_ROUTER_APP_ROOT in monorepo/web - manually provide context
export function App() {
  const ctx = require.context('./app');
  return <ExpoRoot context={ctx} />;
}

registerRootComponent(App);
