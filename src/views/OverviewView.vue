<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { showConfirmDialog, showFailToast, showSuccessToast } from 'vant'
import BoxForm from '../components/BoxForm.vue'
import BrandLogo from '../components/BrandLogo.vue'
import LooseForm from '../components/LooseForm.vue'
import OutboundForm from '../components/OutboundForm.vue'
import { db } from '../db/database'
import {
  createBox,
  createOrMergeLoose,
  outboundBox,
  outboundLoose,
  unboxInventory,
  type BoxInput,
  type LooseInput
} from '../services/inventory'
import { useInventoryStore } from '../stores/inventory'
import type {
  BoxInventory,
  LooseInventory,
  OperationRecord,
  OutboundFormValue
} from '../types/inventory'
import { errorMessage } from '../utils/errors'

type HomeAction = 'box-in' | 'loose-in' | 'stock-out' | 'unbox' | null

const inventory = useInventoryStore()
const operations = ref<OperationRecord[]>([])
const lastBackupAt = ref<string>()
const activeAction = ref<HomeAction>(null)
const outboundTarget = ref<BoxInventory | LooseInventory>()
const showAction = ref(false)

const money = new Intl.NumberFormat('zh-CN', {
  style: 'currency',
  currency: 'CNY',
  maximumFractionDigits: 0
})

const integer = new Intl.NumberFormat('zh-CN', { maximumFractionDigits: 0 })

const todayStart = computed(() => {
  const date = new Date()
  date.setHours(0, 0, 0, 0)
  return date
})

const todayOperations = computed(() =>
  operations.value
    .filter((item) => new Date(item.occurredAt) >= todayStart.value)
    .sort((a, b) => b.occurredAt.localeCompare(a.occurredAt))
)

const totalSticks = computed(() => inventory.boxedStickCount + inventory.looseStickCount)
const cabinets = computed(() => new Set([
  ...inventory.boxes.map((item) => item.cabinet),
  ...inventory.looseStocks.map((item) => item.cabinet)
]).size)

const boxChange = computed(() => todayOperations.value.reduce((sum, item) => {
  if (item.inventoryKind !== 'box') return sum
  if (item.type === 'stock-in' || item.type === 'restore') return sum + (item.quantity ?? 1)
  if (['stock-out', 'delete', 'unbox'].includes(item.type)) return sum - (item.quantity === 1 ? 1 : 1)
  return sum
}, 0))

const looseChange = computed(() => todayOperations.value.reduce((sum, item) => {
  if (item.inventoryKind === 'loose') {
    if (item.type === 'stock-in' || item.type === 'restore') return sum + (item.quantity ?? 0)
    if (item.type === 'stock-out' || item.type === 'delete') return sum - (item.quantity ?? 0)
  }
  if (item.type === 'unbox') return sum + (item.quantity ?? 0)
  return sum
}, 0))

const valueChange = computed(() => todayOperations.value.reduce((sum, item) => {
  const snapshot = item.snapshot
  if (!snapshot) return sum
  const value = item.inventoryKind === 'box'
    ? (snapshot as BoxInventory).customBoxPrice * (item.quantity ?? 1)
    : (snapshot as LooseInventory).customStickPrice * (item.quantity ?? 0)
  if (item.type === 'stock-in' || item.type === 'restore') return sum + value
  if (item.type === 'stock-out' || item.type === 'delete') return sum - value
  if (item.type === 'price-change') {
    const quantity = item.inventoryKind === 'box' ? 1 : (snapshot as LooseInventory).quantity
    return sum + ((item.afterPrice ?? 0) - (item.beforePrice ?? 0)) * quantity
  }
  return sum
}, 0))

const dateLabel = computed(() => new Intl.DateTimeFormat('zh-CN', {
  year: 'numeric', month: 'long', day: 'numeric', weekday: 'short'
}).format(new Date()).replace(/\//g, ''))

const greeting = computed(() => {
  const hour = new Date().getHours()
  if (hour < 6) return '夜深了，收藏家'
  if (hour < 11) return '早上好，收藏家'
  if (hour < 14) return '中午好，收藏家'
  if (hour < 18) return '下午好，收藏家'
  return '晚上好，收藏家'
})

const backup = computed(() => {
  if (!lastBackupAt.value) return { label: '尚未备份', tone: 'alert', detail: '建议立即备份' }
  const days = Math.floor((Date.now() - new Date(lastBackupAt.value).getTime()) / 86400000)
  if (days <= 7) return { label: `已备份 ${days || '今'}天`, tone: 'safe', detail: '数据状态良好' }
  if (days <= 14) return { label: `待备份 ${days} 天`, tone: 'warn', detail: '建议近期备份' }
  return { label: `已 ${days} 天未备份`, tone: 'alert', detail: '请尽快导出备份' }
})

const actionTitle = computed(() => ({
  'box-in': '入原盒',
  'loose-in': '入散支',
  'stock-out': outboundTarget.value ? '确认出库' : '选择出库库存',
  unbox: '选择要拆的原盒'
}[activeAction.value ?? 'box-in']))

const selectionItems = computed(() => activeAction.value === 'unbox'
  ? inventory.boxes
  : [...inventory.boxes, ...inventory.looseStocks]
)

function operationLabel(type: OperationRecord['type']): string {
  return ({ 'stock-in': '入库', 'stock-out': '出库', unbox: '拆盒', 'price-change': '调价', delete: '删除', restore: '恢复' })[type]
}

function operationIcon(type: OperationRecord['type']): string {
  return ({ 'stock-in': 'down', 'stock-out': 'upgrade', unbox: 'apps-o', 'price-change': 'exchange', delete: 'delete-o', restore: 'replay' })[type]
}

function operationValue(item: OperationRecord): number {
  if (!item.snapshot) return 0
  if (item.type === 'price-change') return item.afterPrice ?? 0
  return item.inventoryKind === 'box'
    ? (item.snapshot as BoxInventory).customBoxPrice * (item.quantity ?? 1)
    : (item.snapshot as LooseInventory).customStickPrice * (item.quantity ?? 0)
}

function isBox(item: BoxInventory | LooseInventory): item is BoxInventory {
  return 'sticksPerBox' in item
}

async function load(): Promise<void> {
  await inventory.load()
  operations.value = await db.operations.orderBy('occurredAt').reverse().toArray()
  const setting = await db.settings.get('lastBackupAt')
  lastBackupAt.value = typeof setting?.value === 'string' ? setting.value : undefined
}

function openAction(action: HomeAction): void {
  outboundTarget.value = undefined
  activeAction.value = action
  showAction.value = true
}

function resetAction(): void {
  activeAction.value = null
  outboundTarget.value = undefined
}

async function saveBox(value: BoxInput): Promise<void> {
  await createBox(value)
  showAction.value = false
  await load()
  showSuccessToast('原盒已入库')
}

async function saveLoose(value: LooseInput): Promise<void> {
  await createOrMergeLoose(value)
  showAction.value = false
  await load()
  showSuccessToast('散支已入库')
}

async function selectUnbox(box: BoxInventory): Promise<void> {
  const stickPrice = box.customBoxPrice / box.sticksPerBox
  try {
    await showConfirmDialog({
      title: `拆盒 ${box.brand} ${box.model}？`,
      message: `${box.sticksPerBox} 支将转入柜 ${box.cabinet}，默认单支价 ${money.format(stickPrice)}`,
      confirmButtonText: '确认拆盒'
    })
  } catch {
    return
  }
  try {
    await unboxInventory(box, stickPrice)
    showAction.value = false
    await load()
    showSuccessToast('拆盒完成')
  } catch (error) {
    showFailToast(errorMessage(error, '拆盒失败，请重试'))
  }
}

async function saveOutbound(value: OutboundFormValue): Promise<void> {
  if (!outboundTarget.value) return
  try {
    if (isBox(outboundTarget.value)) {
      await outboundBox(outboundTarget.value, value.quantity, value.unit, value.reason, value.occurredAt, value.note)
    } else {
      await outboundLoose(outboundTarget.value, value.quantity, value.reason, value.occurredAt, value.note)
    }
    showAction.value = false
    await load()
    showSuccessToast('出库完成')
  } catch (error) {
    showFailToast(errorMessage(error, '出库失败，请重试'))
  }
}

onMounted(load)
</script>

<template>
  <section class="steward-home">
    <header class="steward-hero">
      <div class="steward-date-row">
        <span>{{ dateLabel }}</span>
        <button :class="['backup-pill', `backup-pill--${backup.tone}`]" type="button" @click="$router.push('/settings')">
          <van-icon name="records-o" />
          {{ backup.label }}
          <van-icon name="arrow" />
        </button>
      </div>
      <h1>{{ greeting }}</h1>
      <p>今日库存概览</p>
    </header>

    <div class="steward-metrics">
      <article>
        <van-icon name="goods-collect-o" />
        <strong>{{ integer.format(inventory.boxCount) }}<small>盒</small></strong>
        <span>原盒总数</span>
      </article>
      <article>
        <van-icon name="edit" />
        <strong>{{ integer.format(totalSticks) }}<small>支</small></strong>
        <span>库存总支数</span>
      </article>
      <article class="steward-metrics__value">
        <van-icon name="gold-coin-o" />
        <span>库存总价值</span>
        <div><strong>{{ money.format(inventory.totalValue) }}</strong></div>
      </article>
    </div>

    <div v-if="!inventory.boxCount && !inventory.looseStickCount" class="inventory-empty-state">
      <van-icon name="goods-collect-o" />
      <div><strong>库存还是空的</strong><span>从“入原盒”或“入散支”开始建立收藏</span></div>
    </div>

    <section class="home-section">
      <div class="home-section__title"><h2>快速操作</h2></div>
      <div class="quick-action-grid">
        <button type="button" @click="openAction('box-in')"><van-icon name="goods-collect-o" /><strong>入原盒</strong><span>整盒入库</span></button>
        <button type="button" @click="openAction('loose-in')"><van-icon name="edit" /><strong>入散支</strong><span>散支入库</span></button>
        <button type="button" @click="openAction('stock-out')"><van-icon name="upgrade" /><strong>出库</strong><span>出库出柜</span></button>
        <button type="button" @click="openAction('unbox')"><van-icon name="apps-o" /><strong>拆盒</strong><span>拆盒转散养</span></button>
      </div>
    </section>

    <section class="home-section">
      <div class="home-section__title">
        <h2>今日操作记录</h2>
        <button type="button" @click="$router.push('/records')">查看全部 <van-icon name="arrow" /></button>
      </div>
      <div v-if="todayOperations.length" class="today-ledger">
        <article v-for="item in todayOperations.slice(0, 3)" :key="item.id">
          <BrandLogo v-if="item.snapshot?.brand" :brand="item.snapshot.brand" size="sm" />
          <span v-else class="ledger-icon"><van-icon :name="operationIcon(item.type)" /></span>
          <time>{{ new Date(item.occurredAt).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false }) }}</time>
          <div><strong>{{ item.snapshot?.brand }} {{ item.snapshot?.model }}</strong><span>{{ operationLabel(item.type) }} · {{ item.quantity ?? 1 }} {{ item.inventoryKind === 'box' ? '盒' : '支' }} · 柜 {{ item.snapshot?.cabinet || '—' }}</span></div>
          <b>{{ operationValue(item) ? money.format(operationValue(item)) : '—' }}</b>
        </article>
      </div>
      <div v-else class="home-empty"><van-icon name="notes-o" /><span>今天还没有库存操作</span></div>
    </section>

    <section class="inventory-pulse">
      <div class="home-section__title"><h2>库存脉搏</h2><button type="button" @click="$router.push('/inventory')">查看库存 <van-icon name="arrow" /></button></div>
      <div class="pulse-grid">
        <article><van-icon name="goods-collect-o" /><span>原盒</span><strong>{{ inventory.boxCount }}<small>盒</small></strong><em :class="{ negative: boxChange < 0 }">今日 {{ boxChange >= 0 ? '+' : '' }}{{ boxChange }}</em></article>
        <article><van-icon name="edit" /><span>散支</span><strong>{{ inventory.looseStickCount }}<small>支</small></strong><em :class="{ negative: looseChange < 0 }">今日 {{ looseChange >= 0 ? '+' : '' }}{{ looseChange }}</em></article>
        <article><van-icon name="location-o" /><span>柜位</span><strong>{{ cabinets }}<small>个</small></strong><em>使用中</em></article>
      </div>
      <div class="pulse-value-row">
        <div><van-icon name="exchange" /><span>今日价值变化</span></div>
        <strong :class="{ negative: valueChange < 0 }">{{ valueChange >= 0 ? '+' : '' }}{{ money.format(valueChange) }}</strong>
        <em>较昨日</em>
      </div>
    </section>

    <van-popup
      v-model:show="showAction"
      position="bottom"
      round
      :style="{ maxHeight: '88%' }"
      @closed="resetAction"
    >
      <div class="sheet-header"><strong>{{ actionTitle }}</strong><van-icon name="cross" @click="showAction = false" /></div>
      <BoxForm v-if="activeAction === 'box-in'" @save="saveBox" />
      <LooseForm v-else-if="activeAction === 'loose-in'" @save="saveLoose" />
      <OutboundForm v-else-if="activeAction === 'stock-out' && outboundTarget" :max-quantity="isBox(outboundTarget) ? outboundTarget.sticksPerBox : outboundTarget.quantity" :is-box="isBox(outboundTarget)" @save="saveOutbound" />
      <div v-else class="action-picker">
        <button v-for="item in selectionItems" :key="item.id" type="button" @click="activeAction === 'unbox' ? selectUnbox(item as BoxInventory) : (outboundTarget = item)">
          <BrandLogo :brand="item.brand" size="sm" />
          <span><strong>{{ item.brand }} {{ item.model }}</strong><small>{{ item.year }} · 柜 {{ item.cabinet }}</small></span>
          <b>{{ isBox(item) ? '1 盒' : `${item.quantity} 支` }}</b>
          <van-icon name="arrow" />
        </button>
        <van-empty v-if="!selectionItems.length" description="暂无可操作库存" />
      </div>
    </van-popup>
  </section>
</template>
