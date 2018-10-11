<template>
  <li v-bind:class="{ bad: percent >= 90, warn: percent > 50 && percent < 90 }">
    <span class="data-label">{{ label | snakeToTitle }}</span>
    <span class="data-stat"><strong>Records with data missing:</strong> {{ count | numberString }}</span> |
    <span class="data-stat"><strong>Percent of data set:</strong> {{ percent }}%</span>
    <span class="data-bar" v-bind:style="{ width: percent/max*100+'%' }"></span>
  </li>
</template>

<script>
  export default {
    name: 'data-item',
    props: ['label', 'count', 'percent', 'max']
  }
</script> 
 
<style scoped>
</style> 