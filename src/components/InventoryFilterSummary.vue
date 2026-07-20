<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  itemCount: number
  itemUnit: string
  stickCount: number
  totalValue: number
  brands: string[]
  cabinets: string[]
}>()

const brand = defineModel<string>('brand', { default: '' })
const cabinet = defineModel<string>('cabinet', { default: '' })

const formattedValue = computed(() =>
  new Intl.NumberFormat('zh-CN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(props.totalValue)
)

const resultFontSize = computed(() => {
  const digits = String(props.itemCount).length + String(props.stickCount).length
  return `${Math.max(14, 18 - Math.max(0, digits - 6) * 0.9)}px`
})

const valueFontSize = computed(() =>
  `${Math.max(14, 26 - Math.max(0, formattedValue.value.length - 8) * 1.9)}px`
)
</script>

<template>
  <section class="inventory-filter-summary" aria-label="库存筛选概览">
    <div
      class="inventory-filter-summary__metrics"
      :style="{
        '--inventory-result-size': resultFontSize,
        '--inventory-value-size': valueFontSize
      }"
    >
      <span class="inventory-filter-summary__icon"><van-icon name="filter-o" /></span>
      <div class="inventory-filter-summary__result">
        <span>筛选结果</span>
        <strong>{{ itemCount }}<small>{{ itemUnit }}</small> · {{ stickCount }}<small>支</small></strong>
      </div>
      <div class="inventory-filter-summary__value">
        <span>当前总价值</span>
        <strong>¥{{ formattedValue }}</strong>
      </div>
    </div>

    <label class="inventory-filter-row">
      <span>品牌</span>
      <select v-model="brand" aria-label="按品牌筛选">
        <option value="">全部品牌</option>
        <option v-for="name in brands" :key="name" :value="name">{{ name }}</option>
      </select>
      <button v-if="brand" type="button" aria-label="清除品牌筛选" @click.prevent="brand = ''">
        <van-icon name="cross" />
      </button>
      <van-icon v-else name="arrow-down" />
    </label>

    <label class="inventory-filter-row">
      <span>柜号</span>
      <select v-model="cabinet" aria-label="按柜号筛选">
        <option value="">全部柜号</option>
        <option v-for="name in cabinets" :key="name" :value="name">{{ name }}</option>
      </select>
      <button v-if="cabinet" type="button" aria-label="清除柜号筛选" @click.prevent="cabinet = ''">
        <van-icon name="cross" />
      </button>
      <van-icon v-else name="arrow-down" />
    </label>
  </section>
</template>
