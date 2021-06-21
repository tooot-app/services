import Koa from 'koa'
import log from 'loglevel'
import { getRepository } from 'typeorm'
import { ExpoToken } from '../entity/ExpoToken'

const getExpoToken = async (ctx: Koa.Context, next: Koa.Next) => {
  const expoToken: ExpoToken['expoToken'] = ctx.state.expoToken

  const repoET = getRepository(ExpoToken)
  const foundET = await repoET.findOne({ where: { expoToken } })

  if (!foundET) {
    log.warn('getExpoToken', 'cannot found corresponding Expo Token')
    ctx.throw(500, 'getExpoToken: cannot found corresponding Expo Token')
  }

  ctx.state.expoTokenInstance = foundET

  await next()
}

export default getExpoToken
