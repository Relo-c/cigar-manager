<script setup lang="ts">
import { ref } from 'vue'
import { showConfirmDialog, showFailToast, showSuccessToast } from 'vant'
import {
  applyImport,
  exportWorkbook,
  previewWorkbook,
  type ImportPreview
} from '../services/excel'
import { useInventoryStore } from '../stores/inventory'

const emit = defineEmits<{ close: [] }>()
const preview = ref<ImportPreview>()
const busy = ref(false)
const inventory = useInventoryStore()
const templateUrl = `${import.meta.env.BASE_URL}cigar-import-template.xlsx`

async function selectFile(event: Event): Promise<void> {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file) return
  busy.value = true
  try {
    preview.value = await previewWorkbook(file)
  } catch {
    showFailToast('无法解析这个 XLSX 文件')
  } finally {
    busy.value = false
  }
}

async function apply(): Promise<void> {
  if (!preview.value) return
  try {
    await showConfirmDialog({
      className: 'import-confirm-dialog',
      title: '确认导入？',
      message: `新增原盒 ${preview.value.boxes.length} 条、散支 ${preview.value.looseStocks.length} 条、历史记录 ${preview.value.operations.length} 条；跳过 ${preview.value.skipped} 条。`,
      confirmButtonText: '执行导入'
    })
  } catch {
    return
  }

  busy.value = true
  try {
    await applyImport(preview.value)
    await inventory.load()
    const inventoryCount = preview.value.boxes.length + preview.value.looseStocks.length
    showSuccessToast(`导入完成：${inventoryCount} 条库存`)
    emit('close')
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.error('XLSX import failed', error)
    showFailToast({
      message: `导入失败：${message}`,
      duration: 5000,
      wordBreak: 'break-word'
    })
  } finally {
    busy.value = false
  }
}

async function backup(): Promise<void> {
  busy.value = true
  try {
    await exportWorkbook()
    showSuccessToast('备份文件已生成')
  } catch {
    showFailToast('导出失败')
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <div class="data-tools">
    <h2>数据管理</h2>
    <p>导入现有 Excel，或将当前库存和记录导出为 XLSX 备份。</p>
    <div class="import-entry">
      <label class="file-button">
        <input type="file" accept=".xlsx" :disabled="busy" @change="selectFile" />
        选择 XLSX 文件
      </label>
      <a
        class="template-download"
        :href="templateUrl"
        download="雪茄库存导入模板.xlsx"
      >
        <van-icon name="down" />
        下载导入模板
      </a>
    </div>
    <van-loading v-if="busy" />
    <div v-if="preview" class="import-preview">
      <strong>导入预览</strong>
      <span>原盒 {{ preview.boxes.length }} 条</span>
      <span>散支 {{ preview.looseStocks.length }} 条</span>
      <span>历史记录 {{ preview.operations.length }} 条</span>
      <span>跳过 {{ preview.skipped }} 条</span>
      <small v-if="preview.warnings.length">
        {{ preview.warnings.length }} 条数据缺少必要字段
      </small>
      <van-button
        class="import-confirm-button"
        type="primary"
        block
        round
        :disabled="busy"
        @click="apply"
      >
        确认导入
      </van-button>
    </div>
    <van-button block plain round icon="down" @click="backup">
      导出 XLSX 备份
    </van-button>
    <section class="install-guide">
      <strong>安装到 iPhone</strong>
      <ol>
        <li>使用 Safari 打开已发布的 HTTPS 网站</li>
        <li>点击 Safari 底部的“分享”按钮</li>
        <li>选择“添加到主屏幕”</li>
        <li>点击右上角“添加”完成安装</li>
      </ol>
      <small>安装并首次打开后，应用可离线使用。</small>
    </section>
  </div>
</template>
