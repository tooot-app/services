import log from 'loglevel'
import cron from 'node-cron'
import { getRepository, LessThan, MoreThan } from 'typeorm'
import { ExpoToken } from '../entity/ExpoToken'

export const OUTDATED_DAYS = 30
export const OUTDATED_ERRORS = 10

cron.schedule('0 3 * * *', async () => {
  log.info(
    'cron',
    'cleanup',
    `cleaning on ${new Date().toLocaleString(undefined, {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: 'Europe/Amsterdam'
    })}`
  )

  const today = new Date()
  const cleanDate = new Date(
    today.setDate(today.getDate() - OUTDATED_DAYS)
  ).toISOString()

  const repoET = getRepository(ExpoToken)
  const [foundETs, foundETsCount] = await repoET.findAndCount({
    where: [
      { connectedTimestamp: LessThan(cleanDate) },
      { errorCounts: MoreThan(OUTDATED_ERRORS) }
    ]
  })

  if (foundETsCount) {
    log.info(
      'cron',
      `found ${foundETsCount} outdated connections, removing them`
    )
    await repoET.remove(foundETs)
    log.info('cron', 'cleanup', 'outdated connections removed')
  } else {
    log.info('cron', 'cleanup', 'none outdated connections')
  }
})
