<script setup lang="ts">
import { computed, ref } from 'vue'
import { showConfirmDialog, showToast } from 'vant'
import { useAuthStore } from '../stores/auth'

const auth = useAuthStore()
const password = ref('')
const confirmation = ref('')

const isSetup = computed(() => auth.needsPasswordSetup)
const canSubmit = computed(() => {
  if (!/^\d{6}$/.test(password.value)) return false
  return !isSetup.value || password.value === confirmation.value
})

async function submit(): Promise<void> {
  if (!canSubmit.value) return

  if (isSetup.value) {
    await auth.setPassword(password.value)
    showToast('密码设置成功')
    return
  }

  const valid = await auth.unlock(password.value)
  if (!valid) {
    password.value = ''
    showToast('密码错误')
  }
}

async function reset(): Promise<void> {
  try {
    await showConfirmDialog({
      title: '清除全部数据？',
      message: '此操作无法撤销。库存、记录、设置和密码都会被删除。',
      confirmButtonText: '确认清除',
      confirmButtonColor: '#d54b4b'
    })
    await auth.resetAllData()
    password.value = ''
    confirmation.value = ''
    showToast('数据已清除')
  } catch {
    // User cancelled the destructive reset.
  }
}
</script>

<template>
  <main class="password-page">
    <section class="password-panel">
      <p class="eyebrow">CIGAR MANAGER</p>
      <h1>{{ isSetup ? '设置解锁密码' : '欢迎回来' }}</h1>
      <p class="password-hint">
        {{ isSetup ? '设置一个 6 位数字密码保护本机库存' : '输入 6 位密码查看库存' }}
      </p>

      <van-password-input
        :value="password"
        :focused="true"
        :gutter="6"
        @focus="password = ''"
      />
      <van-number-keyboard
        v-model="password"
        :show="true"
        :maxlength="6"
      />

      <template v-if="isSetup">
        <label class="confirmation-label" for="password-confirmation">
          再输入一次密码
        </label>
        <van-field
          id="password-confirmation"
          v-model="confirmation"
          type="digit"
          maxlength="6"
          placeholder="确认 6 位密码"
          clearable
        />
      </template>

      <van-button
        class="password-submit"
        type="primary"
        block
        round
        :disabled="!canSubmit"
        :loading="auth.busy"
        @click="submit"
      >
        {{ isSetup ? '设置并进入' : '解锁' }}
      </van-button>

      <button v-if="!isSetup" class="reset-link" type="button" @click="reset">
        忘记密码，清除全部数据
      </button>
    </section>
  </main>
</template>
