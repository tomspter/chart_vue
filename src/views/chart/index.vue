<template xmlns:el-col="http://www.w3.org/1999/html">
  <div>
    <el-row type="flex" align="middle">
      <el-col :span="4">
        <el-select v-model="timeSelect" placeholder="时间">
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
        <el-cascader v-model="tableSelect" placeholder="数据管理" @change="tableChange"
                     :options="tableOption"></el-cascader>
      </el-col>
      <el-col :span="2">
        <el-select v-model="sheetSelect" placeholder="报表管理" @change="sheetChange">
          <el-option
            v-for="item in sheetOption"
            :key="item.value"
            :label="item.label"
            :value="item.value">
          </el-option>
        </el-select>
      </el-col>
      <el-col :span="2">
        <el-button type="primary" round icon="el-icon-search" @click="initData">搜索</el-button>
      </el-col>
    </el-row>
    <div v-show="showChart" id="chart" ref="chart" style="width: 100%;height: 600px"></div>
    <el-table v-if="isOk" :data="chartData">
      <!--      <el-table-column type="selection" align="center"></el-table-column>-->
      <el-table-column prop="e_yAxis" label="年份" align="center" width="70"></el-table-column>
      <el-table-column v-for="item in new Array(7).keys()" :key="item" :prop="`xLabel${item}`"
                       :label="Object.values(xLabelMap)[parseInt(item)]" align="center"></el-table-column>
    </el-table>
    <el-dialog title="编辑" :visible.sync="sheetEditVisible" :before-close="beforeDialogClose" width="40%"
               destroy-on-close>
      <el-radio v-model="sheetEditRC" label="xAxis">行</el-radio>
      <el-radio v-model="sheetEditRC" label="yAxis">列</el-radio>
      <el-transfer v-model="sheetEditModel" :data="sheetEditData"></el-transfer>
      <span slot="footer" class="dialog-footer">
        <el-button @click="sheetEditVisible = false;sheetSelect = ''">取 消</el-button>
        <el-button type="primary" @click="sheetEditModelSave">确 定</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
import {getData} from '@/api/chart'
import * as echarts from 'echarts'

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
      sheetOption: [
        {
          value: '1',
          label: '编辑'
        }, {
          value: '2',
          label: '转置'
        }, {
          value: '3',
          label: '维度转换',
        }
      ],
      tableOption: [
        {
          value: '1',
          label: '新增指标'
        }, {
          value: '2',
          label: '筛选'
        }, {
          value: '3',
          label: '对行运算',
          children: [
            {
              value: 'sum',
              label: 'SUM求和'
            }, {
              value: 'avg',
              label: 'X平均值'
            }, {
              value: 'max',
              label: 'MAX最大值'
            }, {
              value: 'min',
              label: 'MIN最小值'
            },
          ]
        }
      ],
      tableSelect: '',
      sheetSelect: '',
      timeSelect: '',
      showChart: true,
      barChartStatus: false,
      columnChartStatus: false,
      pieChartStatus: false,
      chartOption: {},
      chart: undefined,
      sheetEditVisible: false,
      sheetEditData: [],
      sheetEditModel: [],
      sheetEditRC: 'xAxis',

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
    pieChartStatus(val) {
      if (val) {
        this.showChart = true
        this.pieChartFunc()
      } else {
        this.showChart = false
      }
    },
    columnChartStatus(val) {
      if (val) {
        this.showChart = true
        this.columnChartFunc()
      } else {
        this.showChart = false
      }
    },
    sheetEditRC(val) {
      this.sheetEditInitData(val)
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
      const series = []
      source.push(['product'].concat(Object.values(this.xLabelMap).splice(0)))
      newDataSource.forEach(item => {
        source.push(Object.values(item))
      })
      for (let i = 0; i < Object.values(this.xLabelMap).length; i++) {
        series.push({type: 'bar'})
      }
      this.chartOption = {
        legend: {},
        tooltip: {},
        dataset: {
          source: source
        },
        xAxis: {type: 'category'},
        yAxis: {},
        series: series
      }
      this.chart.clear()
      this.chart.setOption(this.chartOption)
    },
    pieChartFunc() {

    },
    columnChartFunc() {
      const newDataSource = this.chartData.map(item => _.omit(item, ['c_yAxis']))
      const source = []
      const series = []
      source.push(['product'].concat(Object.values(this.xLabelMap).splice(0)))
      newDataSource.forEach(item => {
        source.push(Object.values(item))
      })
      for (let i = 0; i < Object.values(this.xLabelMap).length; i++) {
        series.push({type: 'bar'})
      }

      this.chartOption = {
        legend: {},
        tooltip: {},
        dataset: {
          source: source
        },
        xAxis: {},
        yAxis: {type: 'category'},
        series: series
      }
      console.log(this.chartOption)
      this.chart.clear()
      this.chart.setOption(this.chartOption)
    },
    sheetChange(val) {
      // 编辑
      if (val === '1') {
        this.sheetEditInitData('xAxis')
      }
      // 转置
      else if (val === '2') {
        return
      }
      //维度转换
      else if (val === '3') {
        return
      }
    },
    tableChange(val) {
      console.log(val)
    },
    beforeDialogClose(done) {
      this.sheetSelect = ''
      done()
    },
    sheetEditModelSave() {
      this.sheetSelect = ''
      this.sheetEditVisible = false
      console.log(this.sheetEditModel)
    },
    sheetEditInitData(type) {
      this.sheetEditVisible = true
      this.sheetEditModel = []
      this.sheetEditData = []
      // 将横坐标填充到sheetEditData中
      if (type === 'xAxis') {
        Object.values(this.xLabelMap).forEach(item => {
          this.sheetEditData.push({key: item, label: item})
        })
      }
      // 纵坐标填充
      else {
        this.chartData.map(item => item['e_yAxis']).forEach(item => {
          this.sheetEditData.push({key: item, label: item})
        })
      }
    }
  }
}
</script>

<style scoped>
/deep/ .el-transfer-panel {
  width: 350px !important;
}
</style>
