<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppPageHeader from '../components/AppPageHeader.vue'
import BoxesView from './BoxesView.vue'
import LooseView from './LooseView.vue'

const route = useRoute()
const router = useRouter()

const activeMode = computed({
  get: () => (route.query.mode === 'loose' ? 1 : 0),
  set: (value: number) => {
    router.replace({
      path: '/inventory',
      query: value === 1 ? { mode: 'loose' } : {}
    })
  }
})
</script>

<template>
  <section class="inventory-workspace">
    <AppPageHeader eyebrow="库存" title="库存管理" description="原盒养护与散养库存" />

    <van-tabs
      v-model:active="activeMode"
      class="inventory-mode-tabs"
      color="var(--color-primary)"
      line-width="28"
      title-active-color="var(--color-primary)"
      title-inactive-color="var(--color-text-muted)"
    >
      <van-tab title="原盒养护">
        <BoxesView embedded />
      </van-tab>
      <van-tab title="散养库存">
        <LooseView embedded />
      </van-tab>
    </van-tabs>
  </section>
</template>
