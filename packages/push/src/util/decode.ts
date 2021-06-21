import crypto from 'crypto'
import log from 'loglevel'
import { ExpoToken } from '../entity/ExpoToken'
import { ServerAndAccount } from '../entity/ServerAndAccount'
import { MessageRaw } from './queueMessage'

export type DecodeData = {
  context: {
    expoToken: ExpoToken['expoToken']
    errorCounts: ExpoToken['errorCounts']
    instanceUrl: ServerAndAccount['instanceUrl']
    accountId: ServerAndAccount['accountId']
    accountFull: ServerAndAccount['accountFull']
  }
  body: Buffer
  keys: { auth: string; public: string; private: string }
  headers: { encryption: string; crypto_key: string }
}

function decodeBase64 (src: string) {
  return Buffer.from(src, 'base64')
}

function hkdf (salt: Buffer, ikm: Buffer, info: Buffer, length: number) {
  if (length > 32) {
    throw new Error(
      'Cannot return keys of more than 32 bytes, ${length} requested'
    )
  }

  const keyHmac = crypto.createHmac('sha256', salt)
  keyHmac.update(ikm)
  const key = keyHmac.digest()

  const infoHmac = crypto.createHmac('sha256', key)
  infoHmac.update(info)

  const ONE_BUFFER = Buffer.alloc(1).fill(1)
  infoHmac.update(ONE_BUFFER)
  return infoHmac.digest().slice(0, length)
}

function createInfo (
  type: 'aesgcm' | 'nonce',
  clientPublicKey: Buffer,
  serverPublicKey: Buffer
) {
  const len = type.length

  const info = Buffer.alloc(18 + len + 1 + 5 + 1 + 2 + 65 + 2 + 65)

  info.write('Content-Encoding: ')
  info.write(type, 18)
  info.write('\0', 18 + len)
  info.write('P-256', 19 + len)
  info.write('\0', 24 + len)
  info.writeUInt16BE(clientPublicKey.length, 25 + len)
  clientPublicKey.copy(info, 27 + len)
  info.writeUInt16BE(serverPublicKey.length, 92 + len)

  serverPublicKey.copy(info, 94 + len)

  return info
}

const regexSalt = new RegExp(/salt=(.*)/)
const regexCryptoKey = new RegExp(/dh=(.*);p256ecdsa=/)

const decode = (data: DecodeData): MessageRaw | undefined => {
  log.info('decode', 'start')

  const decodeAuth = decodeBase64(data.keys.auth)
  const decodePublic = decodeBase64(data.keys.public)
  const decodePrivate = decodeBase64(data.keys.private)

  const getEncryption = data.headers.encryption.match(regexSalt)
  const getCryptoKey = data.headers.crypto_key.match(regexCryptoKey)

  if (
    !getEncryption ||
    !getEncryption[1] ||
    !getCryptoKey ||
    !getCryptoKey[1]
  ) {
    log.warn('decode', 'cannot find keys in header')
    return
  }
  const salt = decodeBase64(getEncryption[1])
  const cryptoKey = decodeBase64(getCryptoKey[1])

  const receiver_curve = crypto.createECDH('prime256v1')
  receiver_curve.setPrivateKey(decodePrivate)
  const sharedSecret = receiver_curve.computeSecret(cryptoKey)

  const authInfo = Buffer.from('Content-Encoding: auth\0', 'utf8')
  const prk = hkdf(decodeAuth, sharedSecret, authInfo, 32)

  const contentEncryptionKeyInfo = createInfo('aesgcm', decodePublic, cryptoKey)
  const contentEncryptionKey = hkdf(salt, prk, contentEncryptionKeyInfo, 16)

  const nonceInfo = createInfo('nonce', decodePublic, cryptoKey)
  const nonce = hkdf(salt, prk, nonceInfo, 12)

  // @ts-ignore
  const body = decodeBase64(data.body)

  const decipher = crypto.createCipheriv(
    'id-aes128-GCM',
    contentEncryptionKey,
    nonce
  )
  let result = decipher.update(body)

  var pad_length = 0
  if (result.length >= 3 && result[2] == 0) {
    pad_length = 2 + result.readUInt16BE(0)
  }
  result = result.slice(pad_length, result.length - 16)

  const message = JSON.parse(result.toString('utf-8').substring(2))
  if (process.env.NODE_ENV !== 'production') {
    log.info('decode', message)
  }

  process.env.NODE_ENV !== 'production' &&
    log.info('decode', 'queued message to push')
  return { context: data.context, message }
}

export default decode
