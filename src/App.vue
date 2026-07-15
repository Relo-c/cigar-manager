<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import PasswordGate from './components/PasswordGate.vue'
import { useAuthStore } from './stores/auth'

const auth = useAuthStore()
const route = useRoute()
const router = useRouter()
const activeTab = computed({
  get: () => Number(route.meta.tab ?? 0),
  set: (value: number) => router.push(['/', '/inventory', '/records', '/settings'][value])
})

onMounted(async () => {
  await auth.initialize()
  document.addEventListener('visibilitychange', auth.handleVisibilityChange)
})

onBeforeUnmount(() => {
  document.removeEventListener('visibilitychange', auth.handleVisibilityChange)
})
</script>

<template>
  <div v-if="!auth.initialized" class="loading-screen">
    <van-loading size="28px" vertical>正在载入本地数据</van-loading>
  </div>

  <PasswordGate v-else-if="!auth.unlocked" />

  <main v-else class="app-shell">
    <router-view />

    <van-tabbar v-model="activeTab" class="app-tabbar" safe-area-inset-bottom>
      <van-tabbar-item icon="home-o">首页</van-tabbar-item>
      <van-tabbar-item icon="apps-o">库存</van-tabbar-item>
      <van-tabbar-item icon="records-o">操作记录</van-tabbar-item>
      <van-tabbar-item icon="setting-o">设置</van-tabbar-item>
    </van-tabbar>
  </main>
</template>
