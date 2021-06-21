import Expo, { ExpoPushMessage } from 'expo-server-sdk'
import log from 'loglevel'
import cron from 'node-cron'
import updateErrorCount from '../controller/updateErrorCount'
import { ExpoToken } from '../entity/ExpoToken'
import { ServerAndAccount } from '../entity/ServerAndAccount'

export type CustomExpoPushMessage = ExpoPushMessage & {
  to: string
  data: {
    instanceUrl: ServerAndAccount['instanceUrl']
    accountId: ServerAndAccount['accountId']
    notification_id?: string
    errorCounts: ExpoToken['errorCounts']
    expoToken: ExpoToken['expoToken'] // Original one
  }
  categoryId?: string // In master but not in v3.6.0 yet
}

export const messages: CustomExpoPushMessage[] = []

cron.schedule('*/5 * * * * *', async () => {
  if (messages.length === 0) {
    process.env.NODE_ENV !== 'production' &&
      log.info('push', 'no job to process')
    return
  }

  const processingMessages = [...messages]
  messages.length = 0

  log.info('push', `Processing ${processingMessages.length} jobs`)

  const expo = new Expo({ accessToken: process.env.EXPO_ACCESS_TOKEN_PUSH })

  const chunks = expo.chunkPushNotifications(processingMessages)
  const tickets = []

  for (const chunk of chunks) {
    const customChunk = chunk as CustomExpoPushMessage[]
    try {
      const ticketChunk = await expo.sendPushNotificationsAsync(customChunk)
      tickets.push(...ticketChunk)

      for (const [index, ticket] of tickets.entries()) {
        if (ticket.status === 'error') {
          log.info(ticket)
          if (ticket.details?.error === 'DeviceNotRegistered') {
            log.warn('push', 'add error count')
            updateErrorCount('add', customChunk[index])
          }
        } else {
          if (customChunk[index].data?.errorCounts > 0) {
            log.warn('push', 'reset error count')
            updateErrorCount('reset', customChunk[index])
          }
        }
      }
    } catch (error) {
      // Retry due to API error
      log.error('push', error)
      messages.push(...customChunk)
    }
  }

  return Promise.resolve()
})
