import Koa from 'koa'
import { DEEPL_STATS, IBM_STATS } from '.'

const returnStatus = async (ctx: Koa.Context) => {
  ctx.response.body = {
    DeepL: DEEPL_STATS,
    IBM: IBM_STATS
  }
}

export default returnStatus
