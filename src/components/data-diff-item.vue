<template>
  <li>
    <span class="data-label">{{ label | snakeToTitle }}</span>
    <div class="data-diff-item">
      <span class="data-env-label">Production</span>
      <div v-if="Object.keys(production).length">
        <span class="data-stat" v-if="production['total']">
          <strong>Records:</strong> {{ production['total'] | numberString }} | 
        </span>
        <span class="data-stat">
          <strong>Missing data:</strong> {{ production['count'] | numberString }}
        </span> | 
        <span class="data-stat">
          <strong>Percent of data set:</strong> {{ production['percent'] }}%
        </span>
        <span class="data-bar" v-bind:style="{'width': production['percent']/maxValue*100+'%'}"></span>
      </div>
      <div v-if="Object.keys(production).length===0">
        <span class="data-stat">No values missing</span>
      </div>
    </div>
    <div class="data-diff-item" v-bind:class="{ warn: !isStagingBetter, good: isStagingBetter }">
      <span class="data-env-label">Staging</span>
      <div v-if="Object.keys(staging).length">
        <span class="data-stat" v-if="production['total']">
          <strong>Records:</strong> {{ staging['total'] | numberString }} | 
        </span>
        <span class="data-stat">
          <strong>Missing data:</strong> {{ staging['count'] | numberString }}
        </span> | 
        <span class="data-stat">
          <strong>Percent of data set:</strong> {{ staging['percent'] }}%
        </span>
        <span class="data-bar" v-bind:style="{ width: staging['percent']/maxValue*100+'%' }"></span>
      </div>
      <div v-if="Object.keys(staging).length===0">
        <span class="data-stat">No values missing</span>
      </div>
    </div>
  </li>
</template>
 
<script>
  export default {
    name: 'data-diff-item',
    props: [ 'label', 'staging', 'production' ],
    computed: {
      isStagingBetter() {
        if (this.staging.hasOwnProperty('percent') && this.production.hasOwnProperty('percent')) {
          return this.staging['percent'] < this.production['percent']
        }
        return false;
      },
      maxValue() {
        return this.staging.hasOwnProperty('percent') && this.production.hasOwnProperty('percent') ?
          Math.max(this.production['percent'],this.staging['percent']) :     
          (this.staging.hasOwnProperty('percent') ? this.staging.percent : this.production.percent);
      }
    }
  }
</script> 
 
<style lang="scss" scoped>
$bar-color: #e0e0e0;
$warn-dark: #c00;
$warn-light: #fcc;
$good-dark: #060;
$good-light: #cfc;

$warn-alt1: #fee;
$warn-alt2: #fdd;
  .data-diff-item {
    position: relative;
    padding: 4px 0 10px 0;
    &.warn {
      color: $warn-dark;
      .data-bar { background: $warn-light; }
    }
    &.good {
      color: $good-dark;
      .data-bar { background: $good-light; }
    }
    .data-bar {
      left:0;
    }
  }
</style> 