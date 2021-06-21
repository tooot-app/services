import Koa from 'koa'
import log from 'loglevel'

const regexCryptoKey = new RegExp(/dh=.*;p256ecdsa=(.*)/)

const verifyServer = async (ctx: Koa.Context, next: Koa.Next) => {
  if (!ctx.req.headers['crypto-key']) {
    log.warn('verifyServer', 'are you a legit server?')
    ctx.throw(400, 'verifyServer: are you a legit server?')
  }

  const getCryptoKey = (ctx.req.headers['crypto-key'] as string).match(
    regexCryptoKey
  )

  if (!getCryptoKey || !getCryptoKey[1]) {
    log.warn('verifyServer', 'cannot find serverKey in crypto-key header')
    ctx.throw(400, 'verifyServer: cannot find serverKey in crypto-key header')
  }

  if (`${getCryptoKey[1]}=` !== ctx.state.serverKey) {
    log.warn(
      'verifyServer',
      'serverKey in crypto-key header does not match record'
    )
    ctx.throw(
      400,
      'verifyServer: serverKey in crypto-key header does not match record'
    )
  }

  await next()
}

export default verifyServer
