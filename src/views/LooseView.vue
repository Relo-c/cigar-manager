<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { showConfirmDialog, showFailToast, showSuccessToast } from 'vant'
import BrandLogo from '../components/BrandLogo.vue'
import InventoryFilterSummary from '../components/InventoryFilterSummary.vue'
import LooseForm from '../components/LooseForm.vue'
import OutboundForm from '../components/OutboundForm.vue'
import { useInventoryFilters } from '../composables/useInventoryFilters'
import {
  createOrMergeLoose,
  deleteLoose,
  outboundLoose,
  updateLoose,
  type LooseInput
} from '../services/inventory'
import { useInventoryStore } from '../stores/inventory'
import type { LooseInventory, OutboundFormValue } from '../types/inventory'
import { formatAgingDuration } from '../utils/aging'
import { errorMessage } from '../utils/errors'

defineProps<{ embedded?: boolean }>()

const inventory = useInventoryStore()
const showForm = ref(false)
const showOutbound = ref(false)
const editing = ref<LooseInventory>()
const target = ref<LooseInventory>()

const {
  query,
  brandFilter,
  cabinetFilter,
  brands,
  cabinets,
  filtered,
  filteredStickCount,
  filteredValue
} = useInventoryFilters(
  () => inventory.looseStocks,
  (stock) => stock.quantity,
  (stock) => stock.quantity * stock.customStickPrice
)

onMounted(inventory.load)

function open(stock?: LooseInventory): void {
  editing.value = stock
  showForm.value = true
}

async function save(input: LooseInput): Promise<void> {
  if (editing.value) {
    await updateLoose(editing.value, input)
  } else {
    await createOrMergeLoose(input)
  }
  showForm.value = false
  await inventory.load()
  showSuccessToast('已保存')
}

async function remove(stock: LooseInventory): Promise<void> {
  try {
    await showConfirmDialog({
      title: '删除这条散养库存？',
      message: `${stock.brand} ${stock.model} · ${stock.quantity} 支`,
      confirmButtonText: '删除',
      confirmButtonColor: '#d54b4b'
    })
  } catch {
    return
  }

  try {
    await deleteLoose(stock)
    await inventory.load()
    showSuccessToast('已删除并记录')
  } catch (error) {
    showFailToast(errorMessage(error, '删除失败，请重试'))
  }
}

function openOutbound(stock: LooseInventory): void {
  target.value = stock
  showOutbound.value = true
}

async function saveOutbound(value: OutboundFormValue): Promise<void> {
  if (!target.value) return
  try {
    await outboundLoose(
      target.value,
      value.quantity,
      value.reason,
      value.occurredAt,
      value.note
    )
    showOutbound.value = false
    await inventory.load()
    showSuccessToast('出库完成')
  } catch (error) {
    showFailToast(errorMessage(error, '出库失败，请重试'))
  }
}
</script>

<template>
  <section>
    <header v-if="!embedded" class="page-header">
      <p class="eyebrow">散养</p>
      <h1>{{ inventory.looseStickCount }} 支库存</h1>
    </header>
    <InventoryFilterSummary
      v-model:brand="brandFilter"
      v-model:cabinet="cabinetFilter"
      :item-count="filtered.length"
      item-unit="组"
      :stick-count="filteredStickCount"
      :total-value="filteredValue"
      :brands="brands"
      :cabinets="cabinets"
    />
    <van-search
      v-model="query"
      class="inventory-search"
      placeholder="搜索品牌、型号、年份或柜号"
      shape="round"
    />

    <div v-if="filtered.length" class="stock-list">
      <article
        v-for="stock in filtered"
        :key="stock.id"
        class="stock-card"
        @click="open(stock)"
      >
        <BrandLogo :brand="stock.brand" />
        <div class="stock-card__content">
          <span class="stock-meta">
            {{ stock.brand }} · 柜 {{ stock.cabinet }}
          </span>
          <h2>{{ stock.model }}</h2>
          <div class="stock-tags">
            <span class="stock-tag stock-tag--aging">
              <van-icon name="clock-o" />
              {{ formatAgingDuration(stock.stockedAt) }}
            </span>
            <span class="stock-tag">
              <van-icon name="calendar-o" />
              {{ stock.year }}年
            </span>
          </div>
          <p>{{ stock.quantity }} 支 · ¥{{ stock.customStickPrice.toLocaleString() }}/支</p>
          <div class="card-actions">
            <button @click.stop="openOutbound(stock)">出库</button>
            <button class="danger" @click.stop="remove(stock)">删除</button>
          </div>
        </div>
        <div class="stock-value">
          ¥{{ (stock.quantity * stock.customStickPrice).toLocaleString() }}
        </div>
      </article>
    </div>
    <van-empty v-else description="暂无散养库存" />

    <van-floating-bubble
      icon="plus"
      axis="xy"
      magnetic="x"
      :gap="{ x: 24, y: 88 }"
      @click="open()"
    />
    <van-popup
      v-model:show="showForm"
      position="bottom"
      round
      :style="{ height: '78%' }"
    >
      <div class="sheet-header">
        <strong>{{ editing ? '编辑散养' : '新增散养' }}</strong>
        <van-icon name="cross" @click="showForm = false" />
      </div>
      <LooseForm :model-value="editing" @save="save" />
    </van-popup>
    <van-popup v-model:show="showOutbound" position="bottom" round>
      <div class="sheet-header">
        <strong>散养出库</strong>
        <van-icon name="cross" @click="showOutbound = false" />
      </div>
      <OutboundForm
        v-if="target"
        :max-quantity="target.quantity"
        @save="saveOutbound"
      />
    </van-popup>
  </section>
</template>
