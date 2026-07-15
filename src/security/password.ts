const ITERATIONS = 210_000
const HASH_ALGORITHM = 'SHA-256'

export interface PasswordCredential {
  salt: string
  hash: string
  iterations: number
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = ''
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte)
  })
  return btoa(binary)
}

function base64ToBytes(value: string): Uint8Array<ArrayBuffer> {
  const binary = atob(value)
  const bytes = new Uint8Array(new ArrayBuffer(binary.length))
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index)
  }
  return bytes
}

async function deriveHash(
  password: string,
  salt: Uint8Array<ArrayBuffer>,
  iterations: number
): Promise<Uint8Array<ArrayBuffer>> {
  const passwordBytes = new TextEncoder().encode(password)
  const key = await crypto.subtle.importKey(
    'raw',
    passwordBytes,
    'PBKDF2',
    false,
    ['deriveBits']
  )
  const bits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      hash: HASH_ALGORITHM,
      salt,
      iterations
    },
    key,
    256
  )
  return new Uint8Array(bits)
}

export function isValidPassword(password: string): boolean {
  return /^\d{6}$/.test(password)
}

export async function createPasswordCredential(
  password: string
): Promise<PasswordCredential> {
  if (!isValidPassword(password)) {
    throw new Error('密码必须是 6 位数字')
  }

  const salt = crypto.getRandomValues(new Uint8Array(16))
  const hash = await deriveHash(password, salt, ITERATIONS)

  return {
    salt: bytesToBase64(salt),
    hash: bytesToBase64(hash),
    iterations: ITERATIONS
  }
}

export async function verifyPassword(
  password: string,
  credential: PasswordCredential
): Promise<boolean> {
  if (!isValidPassword(password)) return false

  const actualHash = await deriveHash(
    password,
    base64ToBytes(credential.salt),
    credential.iterations
  )
  const expectedHash = base64ToBytes(credential.hash)

  if (actualHash.length !== expectedHash.length) return false

  let difference = 0
  for (let index = 0; index < actualHash.length; index += 1) {
    difference |= actualHash[index] ^ expectedHash[index]
  }
  return difference === 0
}
