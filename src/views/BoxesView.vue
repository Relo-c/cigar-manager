<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { showConfirmDialog, showFailToast, showSuccessToast } from 'vant'
import BoxForm from '../components/BoxForm.vue'
import BrandLogo from '../components/BrandLogo.vue'
import InventoryFilterSummary from '../components/InventoryFilterSummary.vue'
import OutboundForm from '../components/OutboundForm.vue'
import { useInventoryFilters } from '../composables/useInventoryFilters'
import {
  createBox,
  deleteBox,
  outboundBox,
  unboxInventory,
  updateBox,
  type BoxInput
} from '../services/inventory'
import { useInventoryStore } from '../stores/inventory'
import type { BoxInventory, OutboundFormValue } from '../types/inventory'
import { formatAgingDuration } from '../utils/aging'
import { errorMessage } from '../utils/errors'

defineProps<{ embedded?: boolean }>()

const inventory = useInventoryStore()
const showForm = ref(false)
const showOutbound = ref(false)
const editing = ref<BoxInventory>()
const target = ref<BoxInventory>()

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
  () => inventory.boxes,
  (box) => box.sticksPerBox,
  (box) => box.customBoxPrice
)

onMounted(inventory.load)

function open(box?: BoxInventory): void {
  editing.value = box
  showForm.value = true
}

async function save(input: BoxInput): Promise<void> {
  if (editing.value) {
    await updateBox(editing.value, input)
  } else {
    await createBox(input)
  }
  showForm.value = false
  await inventory.load()
  showSuccessToast('已保存')
}

async function remove(box: BoxInventory): Promise<void> {
  try {
    await showConfirmDialog({
      title: '删除这盒库存？',
      message: `${box.brand} ${box.model} · ${box.year}`,
      confirmButtonText: '删除',
      confirmButtonColor: '#d54b4b'
    })
  } catch {
    return
  }

  try {
    await deleteBox(box)
    await inventory.load()
    showSuccessToast('已删除并记录')
  } catch (error) {
    showFailToast(errorMessage(error, '删除失败，请重试'))
  }
}

async function unbox(box: BoxInventory): Promise<void> {
  const suggestedPrice = box.customBoxPrice / box.sticksPerBox
  try {
    await showConfirmDialog({
      title: '整盒转入散养？',
      message: `${box.sticksPerBox} 支将转入柜 ${box.cabinet}\n默认散支价 ¥${suggestedPrice.toFixed(2)}`,
      confirmButtonText: '确认拆盒'
    })
  } catch {
    return
  }

  try {
    await unboxInventory(box, suggestedPrice)
    await inventory.load()
    showSuccessToast('拆盒完成')
  } catch (error) {
    showFailToast(errorMessage(error, '拆盒失败，请重试'))
  }
}

function openOutbound(box: BoxInventory): void {
  target.value = box
  showOutbound.value = true
}

async function saveOutbound(value: OutboundFormValue): Promise<void> {
  if (!target.value) return
  try {
    await outboundBox(
      target.value,
      value.quantity,
      value.unit,
      value.reason,
      value.occurredAt,
      value.note
    )
    showOutbound.value = false
    await inventory.load()
    showSuccessToast(
      value.unit === 'stick' ? '按支出库完成，余量已转散养' : '整盒出库完成'
    )
  } catch (error) {
    showFailToast(errorMessage(error, '出库失败，请重试'))
  }
}
</script>

<template>
  <section>
    <header v-if="!embedded" class="page-header">
      <p class="eyebrow">原盒养护</p>
      <h1>{{ inventory.boxCount }} 盒库存</h1>
    </header>
    <InventoryFilterSummary
      v-model:brand="brandFilter"
      v-model:cabinet="cabinetFilter"
      :item-count="filtered.length"
      item-unit="盒"
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
        v-for="box in filtered"
        :key="box.id"
        class="stock-card"
        @click="open(box)"
      >
        <BrandLogo :brand="box.brand" />
        <div class="stock-card__content">
          <span class="stock-meta">
            {{ box.brand }} · 柜 {{ box.cabinet }}
          </span>
          <h2>{{ box.model }}</h2>
          <div class="stock-tags">
            <span class="stock-tag stock-tag--aging">
              <van-icon name="clock-o" />
              {{ formatAgingDuration(box.stockedAt) }}
            </span>
            <span class="stock-tag">
              <van-icon name="calendar-o" />
              {{ box.year }}年
            </span>
            <span v-if="box.source" class="stock-tag stock-tag--source" :title="box.source">
              <van-icon name="shop-o" />
              <span>{{ box.source }}</span>
            </span>
          </div>
          <p>
            {{ box.sticksPerBox }} 支/盒
            <template v-if="box.serialNumber">· {{ box.serialNumber }}</template>
          </p>
          <div class="card-actions">
            <button @click.stop="unbox(box)">拆盒</button>
            <button @click.stop="openOutbound(box)">出库</button>
            <button class="danger" @click.stop="remove(box)">删除</button>
          </div>
        </div>
        <div class="stock-value">¥{{ box.customBoxPrice.toLocaleString() }}</div>
      </article>
    </div>
    <van-empty v-else description="暂无原盒库存" />

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
      :style="{ height: '88%' }"
    >
      <div class="sheet-header">
        <strong>{{ editing ? '编辑原盒' : '新增原盒' }}</strong>
        <van-icon name="cross" @click="showForm = false" />
      </div>
      <BoxForm :model-value="editing" @save="save" />
    </van-popup>
    <van-popup v-model:show="showOutbound" position="bottom" round>
      <div class="sheet-header">
        <strong>原盒出库</strong>
        <van-icon name="cross" @click="showOutbound = false" />
      </div>
      <OutboundForm
        v-if="target"
        :max-quantity="target.sticksPerBox"
        is-box
        @save="saveOutbound"
      />
    </van-popup>
  </section>
</template>
