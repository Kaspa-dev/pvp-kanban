import fs from 'fs'
import path from 'path'
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

function resolveBackendUrl(mode: string): string | undefined {
  const env = loadEnv(mode, __dirname, '');
  if (env.VITE_BACKEND_URL) {
    return env.VITE_BACKEND_URL;
  }

  const launchSettingsPath = [
    path.resolve(__dirname, '../BE/Properties/launchSettings.json'),
    path.resolve(__dirname, 'BE/Properties/launchSettings.json'),
  ].find((candidate) => fs.existsSync(candidate));

  if (!launchSettingsPath) {
    return undefined;
  }

  try {
    const launchSettings = JSON.parse(fs.readFileSync(launchSettingsPath, 'utf-8')) as {
      profiles?: Record<string, { applicationUrl?: string }>;
    };

    const applicationUrls = Object.values(launchSettings.profiles ?? {})
      .flatMap((profile) => (profile.applicationUrl ?? '').split(';'))
      .map((url) => url.trim())
      .filter(Boolean);

    const preferredProtocol = mode === 'development' ? 'http://' : 'https://';

    return applicationUrls.find((url) => url.startsWith(preferredProtocol))
      ?? applicationUrls.find((url) => url.startsWith('https://'))
      ?? applicationUrls.find((url) => url.startsWith('http://'))
      ?? applicationUrls[0];
  } catch {
    return undefined;
  }
}

export default defineConfig(({ mode }) => {
  const backendUrl = resolveBackendUrl(mode);

  return {
    define: {
      __BANBAN_BACKEND_URL__: JSON.stringify(backendUrl ?? ""),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: backendUrl
      ? {
          proxy: {
            '/hubs': {
              target: backendUrl,
              changeOrigin: true,
              secure: false,
              ws: true,
            },
            '/api': {
              target: backendUrl,
              changeOrigin: true,
              secure: false,
            },
          },
        }
      : undefined,
    plugins: [tailwindcss(), react()],
  };
})
