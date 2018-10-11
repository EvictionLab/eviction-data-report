<template>
  <div>
    <h4>{{ title }}</h4>
    <p>There are {{ geoids.length }} GEOIDs that appear in the eviction data that do not have corresponding demographics data.</p>
    <pre v-if="geoids.length">{{ geoids.join(', ') }}</pre>
    <p v-if="geoids.length > 0" class="data-message data-problem">
      The GEOIDs listed will not appear in the map or data exports!
    </p>
    <p v-if="geoids.length === 0" class="data-message data-no-problem">
      All of the GEOIDs in the Eviction Lab data set have been joined.
    </p>
  </div>
</template>

<script>
  export default {
    name: 'data-geoids',
    props: [ 'title', 'geoids' ]
  }
</script> 
 
<style scoped>
</style> 