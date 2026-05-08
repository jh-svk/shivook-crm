import { createServer } from 'http'
import { parse } from 'url'
import next from 'next'
import cron from 'node-cron'

const dev = process.env.NODE_ENV !== 'production'
const port = parseInt(process.env.PORT ?? '3000', 10)

const app = next({ dev })
const handle = app.getRequestHandler()

app.prepare().then(async () => {
  cron.schedule('0 * * * *', async () => {
    const { runCalendarPoller } = await import('./src/lib/poller')
    try {
      await runCalendarPoller()
    } catch (err) {
      console.error('[cron] Calendar poller failed:', err)
    }
  })

  cron.schedule('0 9 * * *', async () => {
    const { runFollowupChecker } = await import('./src/lib/followup')
    try {
      await runFollowupChecker()
    } catch (err) {
      console.error('[cron] Follow-up checker failed:', err)
    }
  })

  console.log('[server] Cron jobs scheduled: hourly poller, daily 9am follow-up checker')

  createServer((req, res) => {
    const parsedUrl = parse(req.url!, true)
    handle(req, res, parsedUrl)
  }).listen(port, () => {
    console.log(`[server] Ready on http://localhost:${port}`)
  })
})
