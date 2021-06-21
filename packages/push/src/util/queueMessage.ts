import { OUTDATED_ERRORS } from '../cron/cleanup'
import { messages } from '../cron/push'
import { ExpoToken } from '../entity/ExpoToken'
import { ServerAndAccount } from '../entity/ServerAndAccount'

export type MessageRaw = {
  context: {
    expoToken: ExpoToken['expoToken']
    errorCounts: ExpoToken['errorCounts']
    instanceUrl: ServerAndAccount['instanceUrl']
    accountId: ServerAndAccount['accountId']
    accountFull: ServerAndAccount['accountFull']
  }
  message?:
    | {
        notification_type:
          | 'follow'
          | 'favourite'
          | 'reblog'
          | 'mention'
          | 'poll'
        notification_id: string
        title: string
        body: string
      }
    | undefined
}

const queueMessage = (raw?: MessageRaw) => {
  if (!raw) {
    return
  }

  if (raw.context.errorCounts > OUTDATED_ERRORS) {
    return
  }

  if (raw.message) {
    messages.push({
      to: raw.context.expoToken,
      sound: 'default',
      badge: 1,
      title: raw.message.title,
      subtitle: raw.context.accountFull,
      body: raw.message.body,
      data: {
        instanceUrl: raw.context.instanceUrl,
        accountId: raw.context.accountId,
        notification_id: raw.message.notification_id,
        errorCounts: raw.context.errorCounts,
        expoToken: raw.context.expoToken
      },
      categoryId: raw.message.notification_type,
      channelId: `${raw.context.accountFull}_${raw.message.notification_type}`
    })
  } else {
    messages.push({
      to: raw.context.expoToken,
      sound: 'default',
      badge: 1,
      title: raw.context.accountFull,
      body: '🔔',
      data: {
        instanceUrl: raw.context.instanceUrl,
        accountId: raw.context.accountId,
        errorCounts: raw.context.errorCounts,
        expoToken: raw.context.expoToken
      },
      channelId: `${raw.context.accountFull}_default`
    })
  }
}

export default queueMessage
