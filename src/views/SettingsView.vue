<script setup lang="ts">
import { ref } from 'vue'
import AppPageHeader from '../components/AppPageHeader.vue'
import DataTools from '../components/DataTools.vue'

const showDataTools = ref(false)
</script>

<template>
  <section>
    <AppPageHeader eyebrow="设置" title="应用设置" description="管理数据、安全与安装" />

    <div class="settings-group">
      <p class="settings-group__label">数据</p>
      <button class="settings-row" type="button" @click="showDataTools = true">
        <span class="settings-row__icon"><van-icon name="exchange" /></span>
        <span class="settings-row__content">
          <strong>数据与备份</strong>
          <small>导入、导出与恢复 XLSX</small>
        </span>
        <van-icon name="arrow" />
      </button>
    </div>

    <div class="settings-group">
      <p class="settings-group__label">安全</p>
      <div class="settings-row">
        <span class="settings-row__icon"><van-icon name="shield-o" /></span>
        <span class="settings-row__content">
          <strong>本地密码</strong>
          <small>6 位密码 · 离开 5 分钟后锁定</small>
        </span>
      </div>
    </div>

    <div class="settings-group">
      <p class="settings-group__label">关于</p>
      <div class="settings-row">
        <span class="settings-row__icon"><van-icon name="desktop-o" /></span>
        <span class="settings-row__content">
          <strong>Cigar Manager</strong>
          <small>本地优先的雪茄库存 PWA</small>
        </span>
      </div>
    </div>

    <van-popup
      v-model:show="showDataTools"
      position="bottom"
      round
      :style="{ minHeight: '56%' }"
    >
      <DataTools @close="showDataTools = false" />
    </van-popup>
  </section>
</template>
