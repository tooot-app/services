import cron from 'node-cron'
import cronDeepL from './cron/DeppL'
import cronIBM from './cron/IBM'

export const crons = async () => {
  return Promise.allSettled([cronDeepL(), cronIBM()])
}

cron.schedule('0 * * * *', () => {
  crons()
})
