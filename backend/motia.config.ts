import { defineConfig } from 'motia'
import observability from '@motiadev/plugin-observability/plugin'
import states from '@motiadev/plugin-states/plugin'
import logs from '@motiadev/plugin-logs/plugin'

export default defineConfig({
  redis: {
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: parseInt(process.env.REDIS_PORT || '6380'),
    useMemoryServer: false, // Using Docker Redis
  },
  plugins: [
    observability,
    states,
    logs,
  ],
})
