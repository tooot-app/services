import Koa from 'koa'
import log from 'loglevel'
import { getRepository } from 'typeorm'
import { ExpoToken } from '../entity/ExpoToken'
import { ServerAndAccount } from '../entity/ServerAndAccount'

const removeUnregister = async (ctx: Koa.Context, next: Koa.Next) => {
  const expoToken: ExpoToken['expoToken'] = ctx.state.expoToken
  const instanceUrl: ServerAndAccount['instanceUrl'] = ctx.state.instanceUrl
  const accountId: ServerAndAccount['accountId'] = ctx.state.accountId

  const repoSA = getRepository(ServerAndAccount)
  const foundSA = await repoSA.findOne({
    expoToken: { expoToken },
    instanceUrl,
    accountId
  })

  if (foundSA) {
    await repoSA.remove(foundSA)
  } else {
    log.warn('removeUnregister', `not found any`)
  }

  await next()
}

export default removeUnregister
