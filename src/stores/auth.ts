import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { clearLocalData, db } from '../db/database'
import {
  createPasswordCredential,
  verifyPassword,
  type PasswordCredential
} from '../security/password'

const PASSWORD_KEY = 'password-credential'
const BACKGROUND_AT_KEY = 'background-at'
const LOCK_AFTER_MS = 5 * 60 * 1000

export const useAuthStore = defineStore('auth', () => {
  const initialized = ref(false)
  const hasPassword = ref(false)
  const unlocked = ref(false)
  const busy = ref(false)

  const needsPasswordSetup = computed(
    () => initialized.value && !hasPassword.value
  )

  async function initialize(): Promise<void> {
    const passwordSetting = await db.settings.get(PASSWORD_KEY)
    hasPassword.value = Boolean(passwordSetting)

    const backgroundSetting = await db.settings.get(BACKGROUND_AT_KEY)
    const backgroundAt =
      typeof backgroundSetting?.value === 'number'
        ? backgroundSetting.value
        : undefined

    unlocked.value = Boolean(
      passwordSetting &&
        backgroundAt &&
        Date.now() - backgroundAt < LOCK_AFTER_MS
    )
    initialized.value = true
  }

  async function setPassword(password: string): Promise<void> {
    busy.value = true
    try {
      const credential = await createPasswordCredential(password)
      await db.settings.put({
        key: PASSWORD_KEY,
        value: credential,
        updatedAt: new Date().toISOString()
      })
      hasPassword.value = true
      unlocked.value = true
    } finally {
      busy.value = false
    }
  }

  async function unlock(password: string): Promise<boolean> {
    busy.value = true
    try {
      const setting = await db.settings.get(PASSWORD_KEY)
      if (!setting) return false

      const valid = await verifyPassword(
        password,
        setting.value as PasswordCredential
      )
      unlocked.value = valid
      return valid
    } finally {
      busy.value = false
    }
  }

  function lock(): void {
    unlocked.value = false
  }

  async function recordBackgroundTime(): Promise<void> {
    await db.settings.put({
      key: BACKGROUND_AT_KEY,
      value: Date.now(),
      updatedAt: new Date().toISOString()
    })
  }

  async function handleVisibilityChange(): Promise<void> {
    if (document.visibilityState === 'hidden') {
      await recordBackgroundTime()
      return
    }

    const setting = await db.settings.get(BACKGROUND_AT_KEY)
    if (
      typeof setting?.value === 'number' &&
      Date.now() - setting.value >= LOCK_AFTER_MS
    ) {
      lock()
    }
  }

  async function resetAllData(): Promise<void> {
    await clearLocalData()
    hasPassword.value = false
    unlocked.value = false
  }

  return {
    initialized,
    hasPassword,
    unlocked,
    busy,
    needsPasswordSetup,
    initialize,
    setPassword,
    unlock,
    lock,
    handleVisibilityChange,
    resetAllData
  }
})
