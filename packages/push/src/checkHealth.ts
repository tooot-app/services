import Koa from 'koa'
import { messages } from './cron/push'

const checkHealth = async (ctx: Koa.Context, next: Koa.Next) => {
  ctx.response.body = {
    awaiting: messages.length
  }

  await next()
}

export default checkHealth
