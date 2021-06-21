import log from 'loglevel'
import { getRepository } from 'typeorm'
import { CustomExpoPushMessage } from '../cron/push'
import { ExpoToken } from '../entity/ExpoToken'

const updateErrorCount = async (
  type: 'add' | 'reset',
  data: CustomExpoPushMessage
) => {
  const expoToken: ExpoToken['expoToken'] = data.data.expoToken

  const repoET = getRepository(ExpoToken)
  const foundET = await repoET.findOne({ where: { expoToken } })

  if (foundET) {
    switch (type) {
      case 'add':
        await repoET.save({
          expoToken: foundET.expoToken,
          errorCounts: data.data.errorCounts + 1
        })
        break
      case 'reset':
        await repoET.save({
          expoToken: foundET.expoToken,
          errorCounts: 0
        })
        break
    }
  } else {
    log.warn('updateErrorCount', 'cannot found corresponding Expo Token')
  }
}

export default updateErrorCount
