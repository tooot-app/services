process.env.NODE_ENV === 'production' && require('newrelic')

import Koa from 'koa'
import bodyParser from 'koa-bodyparser'
import logger from 'koa-logger'
import log from 'loglevel'
import { createConnection } from 'typeorm'
import './cron/cleanup'
import './cron/push'
import appRoutes from './routes'

export const PREFIX = 'push'
export const PUSH_PATH = 'send'
const DOMAIN =
  process.env.NODE_ENV === 'production' ? 'api.tooot.app' : 'testapi.tooot.app'
export const URL = `https://${DOMAIN}/${PREFIX}`

if (!process.env.EXPO_ACCESS_TOKEN_PUSH) {
  throw new Error('Missing Expo access token')
}

const main = async () => {
  // Setup SQLite3
  try {
    await createConnection({
      type: 'better-sqlite3',
      database:
        process.env.NODE_ENV === 'production'
          ? '/usr/local/data/db.sql'
          : '../../data/push/db.sql',
      entities:
        process.env.NODE_ENV === 'production'
          ? [__dirname + '/entity/*.js']
          : [__dirname + '/entity/*.ts'],
      logging: false,
      synchronize: true
    })
  } catch (err) {
    log.error('DB', err)
    throw new Error()
  }

  // Koa connections
  const app = new Koa()

  process.env.NODE_ENV !== 'production' ? log.enableAll() : log.setLevel('WARN')
  process.env.NODE_ENV !== 'production' && app.use(logger())

  app.use(
    bodyParser({
      enableTypes: ['json'],
      onerror: (_, ctx) => {
        ctx.throw(422, 'Body parse error')
      }
    })
  )
  app.use(appRoutes())
  app.listen(5000, () => {
    log.info('Koa', `listening at ${URL}`)
    log.info('Koa', `listening on port ${5000}`)
  })
}

main()
