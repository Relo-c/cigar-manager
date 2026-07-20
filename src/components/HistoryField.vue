<script setup lang="ts">
import { computed, ref } from 'vue'

const props = withDefaults(defineProps<{
  label: string
  suggestions?: string[]
  placeholder?: string
  type?: 'text' | 'digit' | 'number'
  required?: boolean
  maxlength?: string | number
}>(), { suggestions: () => [], placeholder: '', type: 'text', required: false })
const model = defineModel<string>({ required: true })
const emit = defineEmits<{ select: [value: string] }>()
const focused = ref(false)

const filtered = computed(() => {
  const query = model.value.trim().toLocaleLowerCase()
  return [...new Set(props.suggestions.map((value) => String(value).trim()).filter(Boolean))]
    .filter((value) => !query || value.toLocaleLowerCase().includes(query))
    .slice(0, 8)
})
const show = computed(() => focused.value && filtered.value.length > 0)

function select(value: string): void {
  model.value = value
  focused.value = false
  emit('select', value)
}

function blur(): void {
  window.setTimeout(() => { focused.value = false }, 120)
}
</script>

<template>
  <div class="history-autocomplete">
    <van-field
      v-model="model"
      :label="label"
      :placeholder="placeholder"
      :type="type"
      :required="required"
      :maxlength="maxlength"
      autocomplete="off"
      @focus="focused = true"
      @blur="blur"
    />
    <div v-if="show" class="history-autocomplete__menu">
      <button v-for="value in filtered" :key="value" type="button" @mousedown.prevent="select(value)">
        <span>{{ value }}</span><small>历史数据</small>
      </button>
    </div>
  </div>
</template>
