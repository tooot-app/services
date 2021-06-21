import Expo from 'expo-server-sdk'
import Koa from 'koa'
import log from 'loglevel'
import { RequestBodyBase } from './routes'

const prepareBaseData = async (ctx: Koa.Context, next: Koa.Next) => {
  const body = ctx.request.body as RequestBodyBase

  if (!body.expoToken || !body.instanceUrl || !body.accountId) {
    log.warn('prepareBaseData', 'missing correct register content')
    ctx.throw(400, 'prepareBaseData: missing correct register content')
  }

  if (!Expo.isExpoPushToken(body.expoToken)) {
    log.warn('prepareBaseData', 'expoToken format error')
    ctx.throw(400, 'prepareBaseData: expoToken format error')
  }

  ctx.state.expoToken = body.expoToken
  ctx.state.instanceUrl = body.instanceUrl
  ctx.state.accountId = body.accountId

  await next()
}

export default prepareBaseData
