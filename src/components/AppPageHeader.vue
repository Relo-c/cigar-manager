<script setup lang="ts">
defineProps<{
  eyebrow?: string
  title: string
  description?: string
}>()
</script>

<template>
  <header class="app-page-header">
    <p v-if="eyebrow" class="app-page-header__eyebrow">{{ eyebrow }}</p>
    <h1 class="app-page-header__title">{{ title }}</h1>
    <p v-if="description" class="app-page-header__description">{{ description }}</p>
    <slot />
  </header>
</template>
