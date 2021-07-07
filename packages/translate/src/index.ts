process.env.NODE_ENV === 'production' && require('newrelic')

import Router from '@koa/router'
import Koa from 'koa'
import logger from 'koa-logger'
import log from 'loglevel'
import { crons } from './cron'
import prepareOriginal from './prepareOriginal'
import returnStatus from './returnStatus'
import useDeepL from './useDeepL'
import useIBM from './useIBM'
import useLibre from './useLibre'

type Stats = {
  counts: {
    current: number
    limit: number
  }
  languages: string[]
}
export const DEEPL_STATS: Stats = {
  counts: {
    current: 0,
    limit: 500000
  },
  languages: []
}
export const IBM_STATS: Stats = {
  counts: {
    current: 0,
    limit: 1000000
  },
  languages: []
}

const main = async () => {
  log.debug('Stats', 'updating')
  await crons()
  log.debug('Stats', 'updated')

  const app = new Koa()
  const router = new Router()

  process.env.NODE_ENV !== 'production' ? log.enableAll() : log.setLevel('INFO')
  process.env.NODE_ENV !== 'production' && app.use(logger())

  router.get('/status', returnStatus)
  router.get(
    '/source/:base64/target/:target',
    // -> headers Base64 { source?: string, text: string[] }
    // <- { provider: string, sourceLanguage: string, text: string[] }
    prepareOriginal,
    useIBM,
    useDeepL
    // useLibre
  )

  app.use(router.routes())

  app.listen(5000, () => {
    log.debug('Koa', `listening on port ${5000}`)
  })
}

main()
