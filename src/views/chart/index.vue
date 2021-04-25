<template xmlns:el-col="http://www.w3.org/1999/html">
  <div>
    <el-row type="flex" align="middle">
      <el-col :span="4">
        <el-select v-model="timeSelect" placeholder="时间">
          <el-option
            v-for="item in timeOptions"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
      </el-col>
      <el-col :span="6">
        <el-checkbox-group v-model="checkedChart" :max="1">
          <el-checkbox-button v-for="item in checkboxLabel" :key="item.value" :label="item.value">{{
            item.label
          }}
          </el-checkbox-button>
        </el-checkbox-group>
      </el-col>
      <el-col :span="2">
        <el-cascader
          v-model="tableSelect"
          placeholder="数据管理"
          :options="tableOption"
          @change="tableChange"
        />
      </el-col>
      <el-col :span="2">
        <el-select v-model="sheetSelect" placeholder="报表管理" @change="sheetChange">
          <el-option
            v-for="item in sheetOption"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
      </el-col>
      <el-col :span="2">
        <el-button type="primary" round icon="el-icon-search" @click="initData">搜索</el-button>
      </el-col>
    </el-row>
    <el-row v-show="showChart" style="margin-top: 20px">
      <el-col :span="20">
        <div id="chart" ref="chart" style="width: 100%;height: 600px" />
      </el-col>
      <el-col :span="4">
        <el-row>
          <el-col :span="12">
            <el-switch
              active-text="行展示"
              inactive-text="列展示"
            />
          </el-col>
          <el-col :span="12">
            <el-button @click="chartReback(checkedChart[0])">还原</el-button>
          </el-col>
        </el-row>
        <el-divider />
        <p>横坐标标签</p>
        <el-tag
          v-for="item in yLabelList"
          :type="findGCTag(item)?'success':'info'"
          closable
          @close="closeTag(item,'y')"
        >{{ item }}
        </el-tag>
        <el-divider />
        <p>纵坐标标签</p>
        <el-tag
          v-for="item in Object.values(xLabelMap)"
          :type="findGCTag(item)?'success':'info'"
          closable
          @close="closeTag(item,'x')"
        >{{ item }}
        </el-tag>
      </el-col>
    </el-row>
    <el-table v-if="isOk" :data="chartData">
      <!--      <el-table-column type="selection" align="center"></el-table-column>-->
      <el-table-column prop="e_yAxis" label="年份" align="center" sortable />
      <el-table-column
        v-for="item in new Array(7).keys()"
        :key="item"
        :prop="`xLabel${item}`"
        :label="Object.values(xLabelMap)[parseInt(item)]"
        align="center"
        sortable
      />
    </el-table>
    <el-dialog
      title="编辑"
      :visible.sync="sheetEditVisible"
      :before-close="beforeDialogClose"
      width="40%"
      destroy-on-close
    >
      <el-radio v-model="sheetEditRC" label="xAxis">行</el-radio>
      <el-radio v-model="sheetEditRC" label="yAxis">列</el-radio>
      <el-transfer v-model="sheetEditModel" :data="sheetEditData" />
      <span slot="footer" class="dialog-footer">
        <el-button @click="sheetEditVisible = false;sheetSelect = ''">取 消</el-button>
        <el-button type="primary" @click="sheetEditModelSave">确 定</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
import { getData } from '@/api/chart'
import * as echarts from 'echarts'

const _ = require('lodash')

export default {
  name: 'Index',
  data() {
    return {
      // 延时渲染表格
      isOk: false,
      // y轴数据集
      chartData: [],
      // x轴数据集
      xLabelMap: {},
      // y轴标签列表
      yLabelList: [],
      timeOptions: [
        {
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
          label: '维度转换'
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
            }
          ]
        }
      ],
      checkboxLabel: [
        {
          value: 'bar',
          label: '条形图'
        },
        {
          value: 'column',
          label: '柱状图'
        },
        {
          value: 'pie',
          label: '饼图'
        }
      ],
      checkedChart: [],
      // 数据管理选择值
      tableSelect: '',
      // 报表管理选择值
      sheetSelect: '',
      // 时间跨度选择值
      timeSelect: '',
      // 显示图表
      showChart: true,
      // 图表option
      chartOption: {},
      chart: undefined,
      sheetEditVisible: false,
      sheetEditData: [],
      sheetEditModel: [],
      sheetEditRC: 'xAxis',
      // 标签回收列表
      labelGC: [],
      barChartSource: [],
      barChartSeries: [],
      barChartGC: {},
      // 监听图表变化开关
      chartChange: false

    }
  },
  watch: {
    checkedChart(val) {
      switch (val[0]) {
        case 'bar':
          this.showChart = true
          this.barChartFunc()
          break
        case 'column':
          this.showChart = true
          this.columnChartFunc()
          break
        case 'pie':
          this.showChart = true
          this.pieChartFunc()
          break
        default :
          this.showChart = false
          this.chartOption = []
      }
    },
    sheetEditRC(val) {
      this.sheetEditInitData(val)
    },
    chartChange(val) {
      if (val) {
        this.chart.setOption(this.chartOption)
        this.chartChange = false
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
      this.chartData.map(item => item['e_yAxis']).forEach(item => {
        this.yLabelList.push(item)
      })
      // let index = 0
      // this.chartData = result.data['dataTable'].map(item => Object.assign({}, item, {id: index++}))
      this.timeSelect = ''
      this.isOk = true
    },
    barChartFunc() {
      this.barChartSource = []
      this.barChartSeries = []

      const newDataSource = this.chartData.map(item => _.omit(item, ['c_yAxis']))
      this.barChartSource.push(['product'].concat(Object.values(this.xLabelMap).splice(0)))
      newDataSource.forEach(item => {
        this.barChartSource.push(Object.values(item))
      })
      for (let i = 0; i < Object.values(this.xLabelMap).length; i++) {
        this.barChartSeries.push({ type: 'bar' })
      }
      this.chartOption = {
        legend: {},
        tooltip: {},
        dataset: {
          source: this.barChartSource
        },
        xAxis: { type: 'category' },
        yAxis: {},
        series: this.barChartSeries
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
        series.push({ type: 'bar' })
      }
      this.chartOption = {
        legend: {},
        tooltip: {},
        dataset: {
          source: source
        },
        xAxis: {},
        yAxis: { type: 'category' },
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
      // 维度转换
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
          this.sheetEditData.push({ key: item, label: item })
        })
      }
      // 纵坐标填充
      else {
        this.chartData.map(item => item['e_yAxis']).forEach(item => {
          this.sheetEditData.push({ key: item, label: item })
        })
      }
    },
    // 删除标签并从echart数据中删除
    closeTag(item, axias) {
      console.log(item)
      this.labelGC.indexOf(item) === -1 ? this.labelGC.push(item) : this.labelGC.splice(this.labelGC.indexOf(item), 1)
      if (axias === 'x') {
        // console.log(this.barChartSource)
      } else {
        let needDeleteId
        for (let i = 1; i < this.barChartSource.length; i++) {
          if (this.barChartSource[i][0] === item) {
            needDeleteId = i
            break
          }
        }
        if (needDeleteId !== undefined) {
          this.barChartGC[this.barChartSource[needDeleteId][0]] = this.barChartSource[needDeleteId]
          this.barChartSource.splice(needDeleteId, 1)
        }
        // }else {
        //   for (let i = 1; i < this.barChartSource.length; i++) {
        //
        //   }
        //   this.barChartGC[item]
        // }
        this.chartChange = true
        console.log(this.barChartGC)
      }
    },
    // 查找已经删除的标签
    findGCTag(item) {
      return this.labelGC.indexOf(item) === -1
    },
    chartReback(type){
      this.labelGC = []
      switch (type) {
        case 'bar':
          this.barChartFunc()
          break
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
