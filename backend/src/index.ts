// ŠotoGO API bootstrap.
import express, { type ErrorRequestHandler } from 'express'
import cors from 'cors'
import { config } from './config.js'
import { authRouter } from './routes/auth.js'
import { catalogRouter } from './routes/catalog.js'
import { meRouter } from './routes/me.js'
import { reportRouter } from './routes/report.js'

const app = express()

app.use(cors({ origin: config.clientOrigins }))
app.use(express.json())

app.get('/api/health', (_req, res) => {
  res.json({ ok: true })
})

app.use('/api/auth', authRouter)
app.use('/api/me', meRouter)
app.use('/api/report', reportRouter)
app.use('/api', catalogRouter)

// Final error handler — keeps unexpected failures from leaking internals.
const onError: ErrorRequestHandler = (err, _req, res, _next) => {
  console.error(err)
  res.status(500).json({ error: 'Něco se na serveru pokazilo.' })
}
app.use(onError)

app.listen(config.port, () => {
  console.log(`ŠotoGO API běží na http://localhost:${config.port}`)
})
