<script setup lang="ts">
import { computed, ref } from 'vue'
import BrandLogo from '../components/BrandLogo.vue'

type ThemeId = 'glacier' | 'lavender' | 'aurora'

const themes: Array<{ id: ThemeId; name: string; note: string; colors: string[] }> = [
  { id: 'glacier', name: '冰川蓝', note: '冰白 · 钴蓝 · 冷青柔光', colors: ['#4774cf', '#7ea8d7', '#86c3c9'] },
  { id: 'lavender', name: '雾紫蓝', note: '银灰 · 蓝紫 · 低饱和薰衣草', colors: ['#6574c3', '#8b78bc', '#769fc6'] },
  { id: 'aurora', name: '极光深蓝', note: '雾蓝 · 深海蓝 · 冷绿微光', colors: ['#324f88', '#5674a8', '#5fa3a4'] }
]

const active = ref<ThemeId>('glacier')
const activeTheme = computed(() => themes.find((theme) => theme.id === active.value)!)
</script>

<template>
  <section class="theme-lab">
    <header class="theme-lab__header">
      <div><small>THEME LAB</small><h1>首页色彩实验</h1></div>
      <router-link to="/">返回首页</router-link>
    </header>

    <div class="theme-switcher" role="group" aria-label="选择首页主题">
      <button
        v-for="theme in themes"
        :key="theme.id"
        type="button"
        :class="{ active: active === theme.id }"
        :aria-pressed="active === theme.id"
        @click="active = theme.id"
      >
        <span>{{ theme.name }}</span>
        <i><b v-for="color in theme.colors" :key="color" :style="{ background: color }" /></i>
      </button>
    </div>
    <p class="theme-lab__note">{{ activeTheme.note }}</p>

    <article :class="['theme-phone', `theme-phone--${active}`]">
      <header class="preview-hero">
        <div class="preview-date"><span>2026年7月20日周一</span><button type="button"><van-icon name="records-o" /> 已备份 今天 <van-icon name="arrow" /></button></div>
        <h2>下午好，收藏家</h2>
        <p>今日库存概览</p>
      </header>

      <div class="preview-metrics">
        <section><van-icon name="goods-collect-o" /><strong>31<small>盒</small></strong><span>原盒总数</span></section>
        <section><van-icon name="edit" /><strong>1,188<small>支</small></strong><span>库存总支数</span></section>
        <section class="preview-value"><div><van-icon name="gold-coin-o" /><span>库存总价值</span></div><strong>¥2,443,669</strong><i aria-hidden="true" /></section>
      </div>

      <section class="preview-section">
        <h3>快速操作</h3>
        <div class="preview-actions">
          <button type="button"><van-icon name="goods-collect-o" /><b>入原盒</b><small>整盒入库</small></button>
          <button type="button"><van-icon name="edit" /><b>入散支</b><small>散支入库</small></button>
          <button type="button"><van-icon name="upgrade" /><b>出库</b><small>出库出柜</small></button>
          <button type="button"><van-icon name="apps-o" /><b>拆盒</b><small>拆盒转散养</small></button>
        </div>
      </section>

      <section class="preview-section">
        <div class="preview-title"><h3>今日操作记录</h3><span>查看全部 <van-icon name="arrow" /></span></div>
        <div class="preview-ledger">
          <div><BrandLogo brand="蒙特克里斯托" size="sm" /><time>13:16</time><p><b>蒙特克里斯托 书本</b><small>入库 · 1 盒 · 柜 M</small></p><strong>—</strong></div>
          <div><BrandLogo brand="高希霸" size="sm" /><time>13:15</time><p><b>高希霸 世纪六（10）</b><small>入库 · 1 盒 · 柜 M</small></p><strong>¥11,000</strong></div>
        </div>
      </section>

      <section class="preview-pulse">
        <div class="preview-title"><h3>库存脉搏</h3><span>查看库存 <van-icon name="arrow" /></span></div>
        <div class="preview-pulse-grid">
          <div><van-icon name="goods-collect-o" /><span>原盒</span><strong>31<small>盒</small></strong><em>今日 +2</em></div>
          <div><van-icon name="edit" /><span>散支</span><strong>704<small>支</small></strong><em>今日 +0</em></div>
          <div><van-icon name="location-o" /><span>柜位</span><strong>3<small>个</small></strong><em>使用中</em></div>
        </div>
        <div class="preview-change"><div><van-icon name="exchange" /><span>今日价值变化</span></div><strong>+¥11,000</strong><small>较昨日</small></div>
      </section>

      <nav class="preview-nav" aria-label="预览底部导航">
        <span class="selected"><van-icon name="home-o" />首页</span><span><van-icon name="apps-o" />库存</span><span><van-icon name="records-o" />操作记录</span><span><van-icon name="setting-o" />设置</span>
      </nav>
    </article>
  </section>
</template>

<style scoped>
.theme-lab { display:grid; gap:14px; padding-bottom:24px; color:#15171a; font-variant-numeric:tabular-nums; }
.theme-lab__header { display:flex; align-items:end; justify-content:space-between; gap:12px; }
.theme-lab__header small { color:#7a7e86; font-size:9px; font-weight:700; letter-spacing:.16em; }
.theme-lab__header h1 { margin:3px 0 0; font-size:24px; }
.theme-lab__header a { color:#555b64; font-size:12px; text-decoration:none; }
.theme-switcher { display:grid; grid-template-columns:repeat(3,1fr); gap:7px; }
.theme-switcher button { display:grid; gap:7px; min-width:0; border:1px solid #dfe2e6; border-radius:11px; padding:10px 7px; color:#555b64; background:#fff; font-size:11px; }
.theme-switcher button.active { border-color:#16191d; color:#111317; box-shadow:inset 0 0 0 1px #16191d; }
.theme-switcher i { display:flex; justify-content:center; gap:4px; }
.theme-switcher b { width:14px; height:5px; border-radius:3px; }
.theme-lab__note { margin:-5px 2px 0; color:#7a7f87; font-size:10px; text-align:center; }
.theme-phone { --bg:#f4f7fb; --surface:#fbfdff; --ink:#171b24; --muted:#687486; --line:#d9e0ea; --a:#4774cf; --b:#7ea8d7; --c:#86c3c9; --soft:#e9eff8; position:relative; overflow:hidden; border:1px solid var(--line); border-radius:19px; padding:17px 16px 61px; color:var(--ink); background:linear-gradient(155deg,#fbfdff 0%,#f1f6fc 45%,#f6f8fc 100%); box-shadow:0 18px 50px rgb(35 55 86 / 11%); }
.theme-phone--lavender { --bg:#f5f5fa; --surface:#fcfcff; --ink:#1b1b27; --muted:#6f7082; --line:#deddeb; --a:#6574c3; --b:#8b78bc; --c:#769fc6; --soft:#ececf6; background:linear-gradient(150deg,#fcfcff 0%,#f0f1f9 42%,#f6f3fa 72%,#eef5fa 100%); }
.theme-phone--aurora { --bg:#eef3f7; --surface:#f9fcfd; --ink:#18202b; --muted:#657383; --line:#d4dfe7; --a:#324f88; --b:#5674a8; --c:#5fa3a4; --soft:#e3ebf2; background:linear-gradient(155deg,#f8fbfd 0%,#eaf1f7 48%,#eef5f4 100%); box-shadow:0 20px 55px rgb(32 55 78 / 14%); }
.preview-hero { position:relative; z-index:1; }
.preview-date { display:flex; align-items:center; justify-content:space-between; color:var(--muted); font-size:8px; }
.preview-date button { display:flex; align-items:center; gap:3px; border:0; border-radius:7px; padding:6px 7px; color:var(--ink); background:linear-gradient(120deg,color-mix(in srgb,var(--a) 12%,var(--surface)),color-mix(in srgb,var(--c) 15%,var(--surface))); font-size:8px; }
.preview-hero h2 { margin:13px 0 2px; font-size:22px; letter-spacing:-.04em; }
.preview-hero p { margin:0; color:var(--muted); font-size:10px; }
.preview-metrics { display:grid; grid-template-columns:1fr 1fr; margin-top:12px; }
.preview-metrics section { display:grid; grid-template-columns:auto 1fr; align-items:center; gap:1px 7px; min-width:0; padding:5px 8px 7px; border-right:1px solid var(--line); }
.preview-metrics section:nth-child(2) { border:0; }
.preview-metrics .van-icon { grid-row:1/3; color:var(--a); font-size:20px; }
.preview-metrics strong { font-size:21px; white-space:nowrap; }
.preview-metrics strong small { margin-left:2px; font-size:9px; }
.preview-metrics span { color:var(--muted); font-size:8px; }
.preview-metrics .preview-value { position:relative; display:grid; grid-column:1/-1; gap:5px; overflow:hidden; margin-top:7px; border:0; border-radius:13px; padding:10px 12px; background:var(--soft); }
.preview-value div { display:flex; align-items:center; gap:6px; }
.preview-value .van-icon { grid-row:auto; color:var(--b); font-size:15px; }
.preview-value strong { position:relative; z-index:1; font-size:25px; letter-spacing:-.03em; }
.preview-value i { position:absolute; right:-15px; bottom:-24px; width:65px; height:65px; border-radius:50%; background:color-mix(in srgb,var(--a) 14%,transparent); }
.preview-value { background:linear-gradient(120deg,color-mix(in srgb,var(--a) 13%,var(--surface)) 0%,color-mix(in srgb,var(--b) 10%,var(--surface)) 55%,color-mix(in srgb,var(--c) 12%,var(--surface)) 100%) !important; }
.preview-section { display:grid; gap:7px; margin-top:12px; }
.preview-section h3,.preview-pulse h3 { margin:0; font-size:13px; }
.preview-actions { display:grid; grid-template-columns:repeat(4,1fr); gap:6px; }
.preview-actions button { display:grid; place-items:center; gap:3px; min-width:0; border:0; border-radius:11px; padding:8px 2px 7px; color:var(--ink); background:var(--surface); box-shadow:0 4px 12px rgb(25 29 34 / 5%); }
.preview-actions button:nth-child(1) { color:#fff; background:linear-gradient(145deg,var(--a),color-mix(in srgb,var(--a) 72%,var(--b))); }
.preview-actions button:nth-child(3) .van-icon { color:var(--b); }
.preview-actions button:nth-child(4) .van-icon { color:var(--c); }
.preview-actions .van-icon { font-size:18px; }
.preview-actions b { font-size:9px; }
.preview-actions small { color:var(--muted); font-size:7px; white-space:nowrap; }
.preview-actions button:first-child small { color:rgb(255 255 255 / 72%); }
.preview-title { display:flex; align-items:center; justify-content:space-between; }
.preview-title > span { display:flex; align-items:center; color:var(--muted); font-size:8px; }
.preview-ledger > div { display:grid; grid-template-columns:28px 28px minmax(0,1fr) auto; align-items:center; gap:5px; border-bottom:1px solid var(--line); padding:5px 0; }
.preview-ledger > div:last-child { border:0; }
.preview-ledger .brand-logo { width:27px; height:27px; }
.preview-ledger time { color:var(--muted); font-size:7px; }
.preview-ledger p { display:grid; gap:2px; min-width:0; margin:0; }
.preview-ledger p b,.preview-ledger p small { overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.preview-ledger p b { font-size:8px; }
.preview-ledger p small { color:var(--muted); font-size:7px; }
.preview-ledger > div > strong { font-size:8px; white-space:nowrap; }
.preview-pulse { display:grid; gap:8px; margin-top:9px; border:1px solid var(--line); border-radius:13px; padding:10px; background:linear-gradient(145deg,color-mix(in srgb,var(--surface) 76%,var(--soft)),color-mix(in srgb,var(--c) 8%,var(--surface))); }
.preview-pulse-grid { display:grid; grid-template-columns:repeat(3,1fr); }
.preview-pulse-grid > div { display:grid; gap:2px; border-right:1px solid var(--line); text-align:center; }
.preview-pulse-grid > div:last-child { border:0; }
.preview-pulse-grid .van-icon { color:var(--a); font-size:14px; }
.preview-pulse-grid span { color:var(--muted); font-size:7px; }
.preview-pulse-grid strong { font-size:10px; }
.preview-pulse-grid strong small { margin-left:1px; font-size:7px; }
.preview-pulse-grid em { color:var(--muted); font-size:7px; font-style:normal; }
.preview-change { display:grid; grid-template-columns:minmax(0,1fr) auto; grid-template-areas:'label value' 'label note'; align-items:center; gap:1px 10px; border-top:1px solid var(--line); padding-top:8px; }
.preview-change > div { grid-area:label; display:flex; align-items:center; gap:7px; color:var(--muted); font-size:9px; }
.preview-change .van-icon { color:var(--b); font-size:15px; }
.preview-change > strong { grid-area:value; font-size:14px; white-space:nowrap; }
.preview-change > small { grid-area:note; color:var(--muted); font-size:7px; text-align:right; }
.preview-nav { position:absolute; right:0; bottom:0; left:0; display:grid; grid-template-columns:repeat(4,1fr); border-top:1px solid var(--line); padding:7px 8px 8px; background:color-mix(in srgb,var(--surface) 92%,transparent); }
.preview-nav span { display:grid; place-items:center; gap:1px; color:var(--muted); font-size:7px; }
.preview-nav .van-icon { font-size:16px; }
.preview-nav span.selected { color:var(--a); }
@media (max-width:360px) { .theme-lab { margin-inline:-4px; }.theme-phone { padding-inline:12px; }.theme-switcher button { padding-inline:3px; font-size:10px; } }
</style>
