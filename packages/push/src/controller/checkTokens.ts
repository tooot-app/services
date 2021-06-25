import Expo from 'expo-server-sdk'
import Koa from 'koa'
import log from 'loglevel'
import { getRepository } from 'typeorm'
import { ExpoToken } from '../entity/ExpoToken'
import { ServerAndAccount } from '../entity/ServerAndAccount'

const checkTokens = async (ctx: Koa.Context, next: Koa.Next) => {
  const expoToken: ExpoToken['expoToken'] = ctx.params.expoToken.includes(
    'ExponentPushToken'
  )
    ? ctx.params.expoToken
    : `ExponentPushToken[${ctx.params.expoToken}]`
  const instanceUrl: ServerAndAccount['instanceUrl'] = ctx.params.instanceUrl
  const accountId: ServerAndAccount['accountId'] = ctx.params.accountId

  if (!expoToken) {
    log.warn('checkTokens', 'missing expoToken')
    ctx.throw(400, 'checkTokens: missing expoToken')
  }
  if (!instanceUrl) {
    log.warn('checkTokens', 'missing instanceUrl')
    ctx.throw(400, 'checkTokens: missing instanceUrl')
  }
  if (!accountId) {
    log.warn('checkTokens', 'missing accountId')
    ctx.throw(400, 'checkTokens: missing accountId')
  }

  if (!Expo.isExpoPushToken(expoToken)) {
    log.warn('checkTokens', 'expoToken format error')
    ctx.throw(400, 'checkTokens: expoToken format error')
  }

  const repoSA = getRepository(ServerAndAccount)
  const foundSA = await repoSA.findOne({
    where: {
      expoToken: { expoToken },
      instanceUrl,
      accountId
    }
  })

  if (foundSA) {
    if (foundSA.keys) {
      try {
        ctx.state.keys = JSON.parse(foundSA.keys)
      } catch {
        log.error('checkTokens', 'keys not in JSON')
        ctx.throw(500, 'checkTokens: keys not in JSON')
      }
    }

    ctx.state.expoToken = expoToken
    ctx.state.errorCounts = foundSA.expoToken.errorCounts
    ctx.state.instanceUrl = instanceUrl
    ctx.state.accountId = accountId
    ctx.state.serverKey = foundSA.serverKey
    ctx.state.accountFull = foundSA.accountFull
  } else {
    log.warn('checkTokens', 'expoToken does not match or not found')
    ctx.throw(404, 'checkTokens: expoToken does not match or not found')
  }

  await next()
}

export default checkTokens
