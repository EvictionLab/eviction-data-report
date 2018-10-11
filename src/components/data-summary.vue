<template>
  <div class="data-summary">
    <h4>{{ index | snakeToTitle }}</h4>
    <ol>
      <data-item 
        v-for="(item, i) in items" 
        v-bind:key="i"
        v-bind:percent="item['percent']"
        v-bind:count="item['count']" 
        v-bind:label="i" 
        v-bind:max="items[Object.keys(items)[0]]['percent']"
      />
    </ol>
  </div>
</template>

<script>
  import DataItem from './data-item.vue'

  export default {
    name: 'data-summary',
    props: ['index', 'items'],
    components: { DataItem }
  }
</script> 
 
<style lang="scss" scoped>
</style> 