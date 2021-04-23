<template xmlns:el-col="http://www.w3.org/1999/html">
  <div>
    <el-row type="flex" align="middle">
      <el-col :span="4">
        <el-select v-model="timeSelect" placeholder="时间跨度选择">
          <el-option
            v-for="item in timeOptions"
            :key="item.value"
            :label="item.label"
            :value="item.value">
          </el-option>
        </el-select>
      </el-col>
      <el-col :span="1">条形图</el-col>
      <el-col :span="1">
        <el-switch v-model="barChartStatus"></el-switch>
      </el-col>
      <el-col :span="1">柱状图</el-col>
      <el-col :span="1">
        <el-switch v-model="columnChartStatus"></el-switch>
      </el-col>
      <el-col :span="1">饼图</el-col>
      <el-col :span="1">
        <el-switch v-model="pieChartStatus"></el-switch>
      </el-col>
      <el-col :span="2">
        <el-button type="primary" round icon="el-icon-search" @click="initData">搜索</el-button>
      </el-col>
    </el-row>
    <div v-show="showChart" id="chart" ref="chart" style="width: 100%;height: 600px"></div>
    <el-table v-if="isOk" :data="chartData">
      <el-table-column prop="e_yAxis" label="年份" align="center"></el-table-column>
      <el-table-column v-for="item in new Array(7).keys()" :key="item" :prop="`xLabel${item}`"
                       :label="Object.values(xLabelMap)[parseInt(item)]" align="center"></el-table-column>
    </el-table>
  </div>
</template>

<script>
import {getData} from '@/api/chart'
import * as echarts from "echarts";

const _ = require('lodash')

export default {
  name: 'Index',
  data() {
    return {
      isOk: false,
      chartData: [],
      xLabelMap: {},
      timeOptions: [{
        value: '5',
        label: '5年时间'
      }, {
        value: '10',
        label: '10年时间'
      }, {
        value: '20',
        label: '20年时间'
      }],
      timeSelect: '',
      showChart: true,
      barChartStatus: false,
      columnChartStatus: false,
      pieChartStatus: false,
      chartOption: {},
      chart: undefined
    }
  },
  watch: {
    barChartStatus(val) {
      if (val) {
        this.showChart = true
        this.barChartFunc()
      } else {
        this.showChart = false
      }
    },
    pieChartStatus(val){
      if (val) {
        this.showChart = true
        this.barChartFunc()
      } else {
        this.showChart = false
      }
    }
  },
  mounted() {
    this.showChart = false
    this.chart = echarts.init(document.getElementById('chart'))

  },
  created() {
    this.initData()
  },
  methods: {
    async initData() {
      const params = new URLSearchParams()
      params.append('tablename', 'income_engelcoefficient_info')
      params.append('count', this.timeSelect === '' ? 5 : this.timeSelect)
      const result = await getData(params)
      console.log(result.data)
      result.data['xLabelList'].forEach(item => {
        this.xLabelMap[item.pointer] = item.cname
      })
      this.chartData = result.data['dataTable']
      // let index = 0
      // this.chartData = result.data['dataTable'].map(item => Object.assign({}, item, {id: index++}))
      this.timeSelect = ''
      this.isOk = true
    },
    barChartFunc() {
      const newDataSource = this.chartData.map(item => _.omit(item, ['c_yAxis']))
      const source = []
      source.push(['product'].concat(Object.values(this.xLabelMap).splice(0)))
      newDataSource.forEach(item => source.push(Object.values(item)))
      console.log(source)
      this.chartOption = {
        legend: {},
        tooltip: {},
        dataset: {
          source: source
        },
        xAxis: {type: 'category'},
        yAxis: {},
        series: [
          {type: 'bar'},
          {type: 'bar'},
          {type: 'bar'},
          {type: 'bar'},
          {type: 'bar'},
          {type: 'bar'},
          {type: 'bar'}
        ]
      }
      console.log(this.chartOption)
      this.chart.setOption(this.chartOption)
    },
    pieChartFunc(){

    }
  }
}
</script>

<style scoped>

</style>
