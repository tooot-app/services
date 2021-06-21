import Koa from 'koa'
import { getRepository } from 'typeorm'
import { ServerAndAccount } from '../entity/ServerAndAccount'

const updateDecode = async (ctx: Koa.Context, next: Koa.Next) => {
  // @ts-ignore
  const keys: ServerAndAccount['keys'] = ctx.request.body.keys

  const instanceUrl: ServerAndAccount['instanceUrl'] = ctx.state.instanceUrl
  const accountId: ServerAndAccount['accountId'] = ctx.state.accountId

  const repoSA = getRepository(ServerAndAccount)
  const foundSA = await repoSA.findOneOrFail({
    expoToken: ctx.state.expoTokenInstance,
    instanceUrl,
    accountId
  })

  repoSA.update(foundSA, {
    ...foundSA,
    ...(keys ? { keys: JSON.stringify(keys) } : { keys: undefined })
  })

  await next()
}

export default updateDecode
