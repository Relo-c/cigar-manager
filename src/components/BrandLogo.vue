<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { brandLogoUrl } from '../services/brandLogos'

const props = withDefaults(defineProps<{ brand: string; size?: 'sm' | 'md' }>(), { size: 'md' })
const failed = ref(false)
const src = computed(() => failed.value ? undefined : brandLogoUrl(props.brand))

watch(() => props.brand, () => { failed.value = false })
</script>

<template>
  <span :class="['brand-logo', `brand-logo--${size}`]" :title="brand" aria-hidden="true">
    <img v-if="src" :src="src" :alt="`${brand} Logo`" loading="lazy" @error="failed = true" />
    <van-icon v-else name="label-o" />
  </span>
</template>
