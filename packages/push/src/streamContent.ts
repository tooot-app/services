import { IncomingMessage } from 'http'
import Koa from 'koa'
import log from 'loglevel'
import decode from './util/decode'
import queueMessage from './util/queueMessage'

const streamToBuffer = async (stream: IncomingMessage): Promise<Buffer> => {
  return new Promise((resolve, reject) => {
    const data: any[] = []

    stream.on('data', chunk => {
      data.push(chunk)
    })

    stream.on('end', () => {
      resolve(Buffer.concat(data))
    })

    stream.on('error', err => {
      reject(err)
    })
  })
}

const streamContent = async (ctx: Koa.Context, next: Koa.Next) => {
  const context = {
    expoToken: ctx.state.expoToken,
    errorCounts: ctx.state.errorCounts,
    instanceUrl: ctx.state.instanceUrl,
    accountId: ctx.state.accountId,
    accountFull: ctx.state.accountFull
  }
  if (!ctx.state.keys) {
    process.env.NODE_ENV !== 'production' &&
      log.info('streamContent', 'queued undecoded push')
    queueMessage({ context })
  } else {
    const body = await streamToBuffer(ctx.req)
    const keys = {
      auth: ctx.state.keys.auth,
      public: ctx.state.keys.public,
      private: ctx.state.keys.private
    }
    const headers = {
      encryption: ctx.get('encryption'),
      crypto_key: ctx.get('crypto-key')
    }
    process.env.NODE_ENV !== 'production' &&
      log.info('streamContent', 'queued message that needs to be decoded')
    queueMessage(decode({ context, body, keys, headers }))
  }

  await next()
}

export default streamContent
