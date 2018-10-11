
<template>
  <section class="app" id="app">
    <h1>Eviction Lab Data Report</h1>
    <p>This report is generated based on validation data that is created during the ETL pipeline execution.  It includes the following sections:</p>
    <div class="header-row">
      <h2>Join Summary <span v-if="flags.join">(Issues Detected)</span></h2>
      <button v-on:click="expanded.join=!expanded.join">
        {{ expanded.join ? 'Hide' : 'Show' }}
      </button>
    </div>
    <div v-if="expanded.join" class="join-summary">
      <h3>Missing GEOIDs in Demographics</h3>
      <p>This section highlights any GEOIDs that exist in the data set provided by the Eviction Lab research team, but do not have any corresponding geographic boundaries or demographic data in the census.</p>
      <data-geoids
        v-bind:title="'Staging'" 
        v-bind:geoids="missing_geoids['staging']"
      />
      <data-geoids
        v-bind:title="'Production'" 
        v-bind:geoids="missing_geoids['production']"
      />
      <h3>Data File Mismatches</h3>
      <data-mismatch-tables
        v-if="Object.keys(join_summary['staging']).length > 0"
        v-bind:title="'Staging'"
        v-bind:tables="join_summary['staging']"
      />
      <data-mismatch-tables 
        v-if="Object.keys(join_summary['production']).length > 0"
        v-bind:title="'Production'"
        v-bind:tables="join_summary['production']"
      />
    </div>
    <div class="header-row">
      <h2>Staging vs. Production <span v-if="flags.vs">(Issues Detected)</span></h2>
      <button v-on:click="expanded.vs=!expanded.vs"> {{ expanded.vs ? 'Hide' : 'Show' }}</button>
    </div>
    <div v-if="expanded.vs">
      <h3>Differences by Data Field</h3>
      <div v-for="(items, index) in missing_fields['diff']" v-bind:key="index">
        <div class="data-summary">
          <h4>{{ index | snakeToTitle }}</h4>
          <ol>
            <data-diff-item 
              v-for="(item, i) in items"
              v-bind:key="i"
              v-bind:label="missing_fields['staging'][index][i]['label']"
              v-bind:staging="missing_fields['staging'][index][i]"
              v-bind:production="getValue(missing_fields['production'][index], i)"
            />
          </ol>
        </div>
      </div>
      <p v-if="Object.keys(missing_fields['diff']).length === 0" class="data-message data-no-problem">
        Staging and Production environments have matching data for all data fields.
      </p>
      <p v-if="Object.keys(missing_fields['diff']).length > 0" class="data-message data-potential-problem">
        Staging has data differences for the above fields compared to the Production environment.
      </p>
      <h3>Differences by State</h3>
      <div v-for="(items, index) in missing_states['diff']" v-bind:key="index">
        <div class="data-summary">
          <h4>{{ index | snakeToTitle }}</h4>
          <ol>
            <data-diff-item 
              v-for="(item, i) in items"
              v-bind:key="i"
              v-bind:label="missing_states['staging'][index][i]['label']"
              v-bind:staging="missing_states['staging'][index][i]"
              v-bind:production="missing_states['production'][index][i]"
            />
          </ol>
        </div>
      </div>
      <p v-if="Object.keys(missing_states['diff']).length === 0" class="data-message data-no-problem">
        Staging and Production environments have matching data for all States.
      </p>
      <p v-if="Object.keys(missing_states['diff']).length > 0" class="data-message data-potential-problem">
        Staging has data differences for the above states compared to the Production environment.
      </p>
    </div>
    <div class="header-row">
      <h2>Staging Data Summary</h2>
      <button v-on:click="expanded.staging=!expanded.staging">
        {{ expanded.staging ? 'Hide' : 'Show' }}
      </button>
    </div>
    <div v-if="expanded.staging">
      <h3>Missing Data by Field</h3>
      <data-summary 
        v-for="(items, index) in missing_fields['staging']" 
        v-bind:key="'staging-field-'+index"
        v-bind:index="index" 
        v-bind:items="items"
      />
      <h3>Missing Data by State</h3> 
      <data-summary 
        v-for="(items, index) in missing_states['staging']" 
        v-bind:key="'staging-state-'+index"
        v-bind:index="index" 
        v-bind:items="items"
      />
    </div>
    <div class="header-row">
      <h2>Production Data Summary</h2>
      <button v-on:click="expanded.production=!expanded.production"> {{ expanded.production ? 'Hide' : 'Show' }}</button>
    </div>
    <div v-if="expanded.production">
      <h3>Missing Data by Field</h3>
      <data-summary 
        v-for="(items, index) in missing_fields['production']"
        v-bind:key="'prod-field-'+index"
        v-bind:index="index" 
        v-bind:items="items"
      />
      <h3>Missing Data by State</h3> 
      <data-summary 
        v-for="(items, index) in missing_states['production']"
        v-bind:key="'prod-state-'+index"
        v-bind:index="index" 
        v-bind:items="items"
      />
    </div>
  </section>
</template>

<script>
import * as d3 from 'd3';
import * as _ from 'lodash';
import states_fips from './utils/STATES_FIPS.js'
import DataGeoids from './components/data-geoids.vue'
import DataMismatchTables from './components/data-mismatch-tables.vue'
import DataSummary from './components/data-summary.vue'
import DataItem from './components/data-item.vue'
import DataDiffItem from './components/data-diff-item.vue'

export default {
  name: 'app',
  components: {
    DataGeoids,
    DataMismatchTables,
    DataSummary,
    DataItem,
    DataDiffItem
  },
  created() {
    console.log('created');
    var self = this;
    // load missing GEOIDs
    this.loadMissingGeoIDs('staging')
      .then(d => { if (d) { self.missing_geoids['staging'] = d; } })
      .then(this.loadMissingGeoIDs('production'))
      .then(d => { if (d) { self.missing_geoids['production'] = d; } })
      .then(() => {
        if (self.missing_geoids['production'] > 0 || self.missing_geoids['staging'] > 0) {
          self.flags.join = true;
          self.expanded.join = true;
        }
      });
    // load join summary
    this.loadAllJoinSummaries('staging')
      .then(d => { if (d) { self.join_summary['staging'] = d; } })
      .then(this.loadAllJoinSummaries('production'))
      .then(d => { if (d) { self.join_summary['production'] = d; } })
      .then(() => {
        // set flag and expand if issues
        const hasIssues = self.checkJoinIssues('staging') || self.checkJoinIssues('production');
        console.log(hasIssues)
        if (hasIssues) {
          self.flags.join = true;
          self.expanded.join = true;
        }
      });
    // load missing data
    this.loadAllMissingDataForStates('staging')
      .then(d => { self.missing_states['staging'] = self.reshapeData(d); })
      .then(() => this.loadAllMissingFields('staging'))
      .then(d => { self.missing_fields['staging'] = self.reshapeData(d); })
      .then(() => this.loadAllMissingDataForStates('production'))
      .then(d => { self.missing_states['production'] = self.reshapeData(d); })
      .then(() => this.loadAllMissingFields('production'))
      .then(d => { self.missing_fields['production'] = self.reshapeData(d); })
      .then(() => {
        // load diffs between staging and production
        var sFieldsObj = (self.missing_fields['staging']);
        var pFieldsObj = (self.missing_fields['production']);
        var sStatesObj = (self.missing_states['staging']);
        var pStatesObj = (self.missing_states['production']);
        self.missing_fields['diff'] = self.difference(sFieldsObj, pFieldsObj);
        self.missing_states['diff'] = self.difference(sStatesObj, pStatesObj);
        // expand vs area if differences
        if (
          Object.keys(self.missing_fields['diff']).length || 
          Object.keys(self.missing_states['diff']).length
        ) { 
          self.expanded.vs = true; 
          self.flags.vs = true;
        }
      });
  },
  data() {
    return {
      geos: [ 'states', 'counties', 'cities', 'tracts', 'block-groups' ],
      data_buckets: {
        staging: 'https://s3.amazonaws.com/eviction-lab-validation/staging',
        production: 'https://s3.amazonaws.com/eviction-lab-validation/production'
      },
      missing_geoids: {
        staging: [],
        production: []
      },
      join_summary: {
        staging: {},
        production: {}
      },
      missing_fields: {
        staging: {},
        production: {},
        diff: {}
      },
      missing_states: {
        staging: {},
        production: {},
        diff: {}
      },
      flags: {
        join: false,
        vs: false
      },
      expanded: {
        join: false,
        vs: false,
        staging: false,
        production: false
      }
    }
  },
  methods: {
    checkJoinIssues(env = 'staging') {
      var self = this;
      if (!self.join_summary) { return false; }
      return Object.keys(self.join_summary[env])
          .reduce((acc, cur) => {
            return acc ? acc : self.join_summary[env][cur].length > 0
          }, false);
    },
    getValue(obj, index) {
      return obj.hasOwnProperty(index) ? obj[index] : {};
    },
    loadMissingGeoIDs(env = 'staging') {
      return d3.dsv(",", this.data_buckets[env] + "/missing_geoids.csv")
        .then(d => {
          return d.reduce((acc, cur) => {
            acc.push(cur['GEOID']);
            return acc;
          }, []);
        });
    },
    loadAllJoinSummaries(env = 'staging') {
      var self = this;
      var data_promises = this.geos.map((g) => this.loadJoinSummary(g, env));
      return Promise.all(data_promises)
        .then(data => {
          return self.geos.reduce((acc, cur, i) => {
            acc[cur] = data[i];
            return acc;
          }, {});
        });
    },
    loadJoinSummary(geography, env) {
      return d3.dsv(",", this.data_buckets[env] + "/joins/"+geography+".csv", (d) => {
        return {
          state: states_fips[d.state],
          evictions: parseInt(d['eviction_records']),
          demographics: parseInt(d['demographic_records']),
          joined: parseInt(d['joined_records']),
          difference: parseInt(d['joined_records'])-Math.max(parseInt(d['eviction_records']),parseInt(d['demographic_records']))
        };
      }).then(d => {
        return d.filter(item => item.difference !== 0).sort((a,b) => b['difference']-a['difference']);
      });
    },
    loadMissingDataForStates(geography, env) {
      return d3.dsv(",", this.data_buckets[env] + "/by-state/"+geography+".csv", (d) => {
        return {
          label: d.location,
          count: parseInt(d.missing),
          total: parseInt(d.total),
          percent: Math.round(parseFloat(d['missing_percent'])*10000)/100
        };
      });
    },
    loadMissingFieldsForGeo(geography, env) {
      return d3.dsv(",", this.data_buckets[env] + "/by-field/"+geography+".csv", (d) => {
        return {
          label: d.field,
          count: parseInt(d.missing),
          percent: Math.round(parseFloat(d['missing_percent'])*10000)/100
        };
      });
    },
    loadAllMissingDataForStates(env = 'staging') {
      var self = this;
      var data_promises = this.geos.map((g) => this.loadMissingDataForStates(g, env));
      return Promise.all(data_promises)
        .then(data => {
          return self.geos.reduce((acc, cur, i) => {
            acc[cur] = data[i].sort((a,b) => { return b['percent']-a['percent'] });
            return acc;
          }, {});
        });
    },
    loadAllMissingFields(env = 'staging') {
      var self = this;
      var data_promises = this.geos.map((g) => this.loadMissingFieldsForGeo(g, env));
      return Promise.all(data_promises)
        .then(data => {
          return self.geos.reduce((acc, cur, i) => {
            acc[cur] = data[i].sort((a,b) => { return b['percent']-a['percent'] });
            return acc;
          }, {});
        });
    },
    difference(object, base) {
      function changes(object, base) {
        return _.transform(object, function(result, value, key) {
          if (!_.isEqual(value, base[key])) {
            result[key] = (_.isObject(value) && _.isObject(base[key])) ? changes(value, base[key]) : value;
          }
        });
      }
      return changes(object, base);
    },
    reshapeData(data) {
      var reshaped = {};
      Object.keys(data).forEach((key) => {
        reshaped[key] = data[key].reduce((acc, cur) => {
          acc[cur['label']] = cur;
          return acc;
        }, {});
      });
      return reshaped;
    }
  }
}
</script>

<style lang="scss">
$bar-color: #e0e0e0;
$warn-dark: #c00;
$warn-light: #fcc;
$info-light: #fff3c7;
$info-mid: #ffd4a9;
$info-dark: #bf5c1a;

$good-dark: #060;
$good-light: #ecf6ec;

$warn-alt1: #fee;
$warn-alt2: #fdd;

.app {
  -ms-text-size-adjust: 100%;
  -webkit-text-size-adjust: 100%;
  line-height: 1.5;
  color: #24292e;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol";
  font-size: 16px;
  line-height: 1.5;
  word-wrap: break-word;
  text-align:left;
  width: 100%;
  max-width: 780px;
  margin:auto;
}

section {
  max-width: 800px;
  padding: 24px;
  margin: auto;
}

.data-summary {
  li {
    &.bad {
      color: $warn-dark;
      .data-bar {
        background: $warn-dark;
      }
    }
    &.warn {
      color: $info-dark;
      .data-bar {
        background: $info-mid;
      }
    }
    
  }
}

.data-message {
  padding: 8px 8px 6px;
  background:#eee;
  font-weight:bold;
  vertical-align: middle;
  &.data-problem {
    background: $warn-alt1;
    border-bottom: 2px solid $warn-dark;
    color: $warn-dark;
    
  }
  &.data-no-problem {
    background: $good-light;
    border-bottom: 2px solid $good-dark;
    color: $good-dark;
  }
  &.data-potential-problem {
    background: $info-light;
    border-bottom: 2px solid $info-dark;
    color: $info-dark;
  }
}

.app h2 span { font-style: italic; color: $warn-dark; }

.app .join-summary {
  
  h4 {
    position: sticky;
    top:0;
    background:#fff;
    z-index:10;
    padding: 16px 0;
    border-bottom: 1px solid #eee;
    line-height:1;
  }
  table {
    table-layout: fixed;
    display: table;
  }
  table, tbody {
    table-layout: fixed;
    width: 100%;
  }
  td span {
    display:block;
    margin-top:2px;
    font-size: 0.8333em;
    color: $warn-dark;
    font-weight:bold;
    float:right;
  }
  td.warn {
    background: $warn-alt1;
  }
  tr:nth-child(even) td.warn {
    background: $warn-alt2;
  }
}

.data-summary {
  h4 {
    position: sticky;
    top:0;
    background:#fff;
    z-index:10;
    padding: 16px 0;
    border-bottom: 1px solid #eee;
    line-height:1;
  }
  ol {
    margin:0;
    padding: 0 0 0 27px;
  }
  li { 
    position:relative;
    padding: 8px 8px 10px 8px;
    line-height:1;
    margin: 8px 0;

    span {
      position:relative;
      z-index:2;
    }
    .data-label {
      display:block;
      margin-bottom: 4px;
      font-weight: 900;
      
    }
    .data-stat {
      font-size: 0.83333em;
      strong { font-weight: 600; }
    }
    .data-bar { 
      position: absolute;
      left:8px;
      bottom:0;
      z-index:1;
      display:block; 
      background: $bar-color; 
      height: 6px; 
    }
    .data-env-label {
      display:block;
      font-size: 0.83333em;
      font-weight:900;
      margin: 8px 0 4px;
      text-transform: uppercase;
    }
  }
}

.header-row {
  position: relative;
  button {
    position: absolute;
    right:0;
    top:0;
  }
}
</style>
