import Expo from 'expo-server-sdk'
import Koa from 'koa'
import log from 'loglevel'
import { RequestBodyBase } from './routes'

const prepareConnect = async (ctx: Koa.Context, next: Koa.Next) => {
  const body = ctx.request.body as RequestBodyBase

  if (!body.expoToken) {
    log.warn('prepareConnect', 'missing correct connect content')
    ctx.throw(400, 'prepareConnect: missing correct connect content')
  }

  if (!Expo.isExpoPushToken(body.expoToken)) {
    log.warn('prepareBaseData', 'expoToken format error')
    ctx.throw(400, 'prepareBaseData: expoToken format error')
  }

  ctx.state.expoToken = body.expoToken

  await next()
}

export default prepareConnect
