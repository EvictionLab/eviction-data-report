<template>
  <div>
    <h4>{{ title }}</h4>
    <div v-for="(items, geo) in tables" v-bind:key="geo">
      <h5>{{ geo | snakeToTitle }}</h5>
      <table v-if="items.length">
        <tbody>
        <tr>
          <th>State</th>
          <th>Demographic Records</th>
          <th>Eviction Records</th>
          <th>Joined Records</th>
          <th>Difference</th>
        </tr>
        <tr v-for="item in items" v-bind:key="item.state">
          <td>{{ item.state }}</td>
          <td>{{ item.demographics | numberString }}</td>
          <td>{{ item.evictions | numberString }}</td>
          <td v-bind:class="{ warn: item.difference < 0 }">{{ item.joined | numberString }}</td>
          <td><em v-if="item.difference > 0">+</em>{{ item.difference }}</td>
        </tr>
        </tbody>
      </table>
      <p v-if="getGeoDataState(geo) === 'warn'" class="data-message data-problem">
        Some records are missing in the join!  Eviction data will not be present in the map or exports.
      </p>
      <p v-if="getGeoDataState(geo) === 'info'" class="data-message data-potential-problem">
        Some eviction records do not have associated demographic data, or some places do not have associated eviction data.
      </p>
      <p v-if="getGeoDataState(geo) === 'good'" class="data-message data-no-problem">
        All eviction records have associated demographic data.
      </p>
    </div>
  </div>
</template>

<script>
  export default {
    name: 'data-mismatch-tables',
    props: [ 'title', 'tables' ],
    methods: {
      getGeoDataState(geo) {
        if (this.tables[geo].length === 0) {
          return 'good';
        }
        // return warn if there is a record with fewer entries
        // if not, just inform that there is a difference
        return this.tables[geo].filter(d => d.difference < 0).length > 0 ? 'warn' : 'info';
      }
    }
  }
</script> 
 
<style scoped>
</style> 