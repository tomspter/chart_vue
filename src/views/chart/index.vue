<template xmlns:el-col="http://www.w3.org/1999/html">
  <div>
    <!--    搜索区域-->
    <el-row type="flex" align="middle" style="margin-top: 20px" justify="center">
      <el-col :span="3" />
      <el-col :span="1">图表查看:</el-col>
      <el-col :span="5">
        <el-checkbox-group v-model="checkedChart" :max="1">
          <el-checkbox-button v-for="item in checkboxLabel" :key="item.value" :label="item.value">
            {{ item.label }}
          </el-checkbox-button>
        </el-checkbox-group>
      </el-col>
      <el-col :span="3">
        <el-dropdown @command="timeSelectFunc">
          <span class="el-dropdown-link">
            时间跨度选择<i class="el-icon-arrow-down el-icon--right" />
          </span>
          <el-dropdown-menu slot="dropdown">
            <el-dropdown-item v-for="item in timeOptions" :key="item.value" :command="item.value">{{
              item.label
            }}
            </el-dropdown-item>
          </el-dropdown-menu>
        </el-dropdown>
      </el-col>
      <el-col :span="2">
        <el-dropdown @command="tableChange">
          <span class="el-dropdown-link">
            数据管理<i class="el-icon-arrow-down el-icon--right" />
          </span>
          <el-dropdown-menu slot="dropdown">
            <template v-for="item in tableOption">
              <el-dropdown-item v-if="!item.children" :command="item.value">{{ item.label }}</el-dropdown-item>
              <el-dropdown-item v-else>
                <el-dropdown placement="right-start" @command="tableChange">
                  <span class="el-dropdown-link">
                    {{ item.label }}<i class="el-icon-arrow-down el-icon--right" />
                  </span>
                  <el-dropdown-menu slot="dropdown">
                    <template v-for="items in item.children">
                      <el-dropdown-item :command="items.value">{{ items.label }}</el-dropdown-item>
                    </template>
                  </el-dropdown-menu>
                </el-dropdown>
              </el-dropdown-item>
            </template>
          </el-dropdown-menu>
        </el-dropdown>
      </el-col>
      <el-col :span="2">
        <el-dropdown @command="sheetChange">
          <span class="el-dropdown-link">
            报表管理<i class="el-icon-arrow-down el-icon--right" />
          </span>
          <el-dropdown-menu slot="dropdown">
            <el-dropdown-item command="1">编辑</el-dropdown-item>
            <el-dropdown-item command="2">转置</el-dropdown-item>
            <el-dropdown-item command="3">维度转换</el-dropdown-item>
          </el-dropdown-menu>
        </el-dropdown>
      </el-col>
      <el-col :span="4" />
      <el-col :span="4">
        <el-button type="primary" round icon="el-icon-search" @click="initData">搜索</el-button>
      </el-col>
      <!--      <el-col :span="2">-->
      <!--        <el-button type="primary" round icon="el-icon-refresh-left" @click="reback">还原</el-button>-->
      <!--      </el-col>-->
    </el-row>
    <!--    图表层-->
    <el-row v-show="showChart" style="margin-top: 20px">
      <el-col :span="20">
        <div id="chart" ref="chart" style="width: 100%;height: 600px" />
      </el-col>
      <el-col :span="4">
        <!--        右侧功能栏-->
        <el-row type="flex" align="middle">
          <el-col :span="14">
            <el-switch
              v-model="changeChartDirection"
              active-text="行展示"
              inactive-text="列展示"
            />
          </el-col>
          <el-col :span="10">
            <el-button plain size="small" type="primary" icon="el-icon-refresh" @click="chartReback(checkedChart[0])">
              还原
            </el-button>
          </el-col>
        </el-row>
        <div v-if="chartRightUtil">
          <el-divider>横坐标标签</el-divider>
          <el-tag
            v-for="item in yLabelList"
            :type="findGCTag(item)?'success':'info'"
            closable
            style="margin-right: 10px;margin-bottom: 10px"
            @close="closeTag(item,'y')"
          >{{ item }}
          </el-tag>
          <el-divider>纵坐标标签</el-divider>
          <el-tag
            v-for="item in Object.values(xLabelMap)"
            :type="findGCTag(item)?'success':'info'"
            closable
            style="margin-right: 50px;margin-bottom: 10px"
            @close="closeTag(item,'x')"
          >{{ item }}
          </el-tag>
        </div>
        <div v-else>
          <el-divider>横坐标标签</el-divider>
          <el-tag
            v-for="item in yLabelList"
            :type="item===pieSelect?'success':'info'"
            style="margin-right: 10px;margin-bottom: 10px"
            @click="pieTagClick(item)"
          >{{ item }}
          </el-tag>
        </div>
      </el-col>
    </el-row>

    <!--    表格-->
    <el-table v-if="isOk" :data="chartData" style="margin-top: 20px" stripe border>
      <el-table-column v-if="hlzj" prop="c_yAxis" label="年份" align="center" sortable />
      <el-table-column v-else prop="c_yAxis" label="指标" align="center" sortable />
      <el-table-column
        v-for="item in new Array(Object.values(xLabelMap).length).keys()"
        :key="item"
        :prop="`xLabel${item}`"
        :label="Object.values(xLabelMap)[parseInt(item)]"
        align="center"
        sortable
      />
    </el-table>

    <!--    图表编辑弹窗-->
    <el-dialog
      title="行列编辑"
      :visible.sync="sheetEditVisible"
      :before-close="beforeDialogClose"
      width="50%"
      destroy-on-close
    >
      <div style="margin-bottom: 20px">
        <el-radio v-model="sheetEditRC" label="xAxis">行</el-radio>
        <el-radio v-model="sheetEditRC" label="yAxis">列</el-radio>
      </div>
      <el-transfer
        v-model="sheetEditModel"
        :data="sheetEditData"
        :titles="['原始数据', '待展示数据']"
        :button-texts="['左选', '右选']"
        :format="{
          noChecked: '${total}',
          hasChecked: '${checked}/${total}'
        }"
      />
      <span slot="footer" class="dialog-footer">
        <el-button @click="sheetEditVisible = false;sheetSelect = ''">取 消</el-button>
        <el-button type="primary" @click="sheetEditModelSave">确 定</el-button>
      </span>
    </el-dialog>

    <!--    筛选页面-->
    <el-dialog title="筛选" :visible.sync="filterVisible" width="60%" destroy-on-close :before-close="beforeDialogClose">
      <el-row>
        <!--        第一选择框-->
        <el-col :span="8">
          <el-card>
            <div slot="header" class="clearfix">
              <span>行/列</span>
              <div style="float: right">
                <el-radio v-model="filterEditRC" label="xAxis">行</el-radio>
                <el-radio v-model="filterEditRC" label="yAxis">列</el-radio>
              </div>
            </div>
            <el-radio-group v-model="filterFirstSelect">
              <el-row v-for="item in sheetEditData" :key="item.key">
                <el-radio :label="item.label" style="margin-bottom: 10px">{{ item.label }}</el-radio>
              </el-row>
            </el-radio-group>
          </el-card>
        </el-col>
        <!--        第二选择框-->
        <el-col :span="6">
          <el-card style="margin-left: 20px">
            <el-radio-group v-model="filterSecondSelect">
              <el-row v-for="item in filterOption" :key="item.value">
                <el-radio :label="item.label" style="margin-bottom: 10px">{{ item.label }}</el-radio>
              </el-row>
            </el-radio-group>
          </el-card>
          <el-input-number v-model="filterSelectNum" size="medium" style="margin-top: 30px;margin-left: 20px" />
        </el-col>
        <!--        选择按钮-->
        <el-col :span="2">
          <el-button
            style="margin-top: 60%;margin-left: 15px"
            round
            :type="filterCanClick?'success':'danger'"
            icon="el-icon-plus"
            @click="filterCanClick?filterAddResult:$message.warning('请输入完整参数后再点击按钮')"
          />
        </el-col>
        <!--        选择结果-->
        <el-col :span="8">
          <el-card>
            <el-row v-for="item in filterResultTags" :key="item">
              <el-tag style="margin-bottom: 10px">{{ item }}</el-tag>
            </el-row>
          </el-card>
        </el-col>
      </el-row>
      <span slot="footer" class="dialog-footer">
        <el-button @click="filterVisible = false;">取 消</el-button>
        <el-button type="primary" @click="filterSave">确 定</el-button>
      </span>
    </el-dialog>
    <!--    新增指标-->
    <el-dialog
      title="新增指标"
      :visible.sync="dataAddVisible"
      width="60%"
      destroy-on-close
      :before-close="beforeDialogClose"
    >
      <el-row>
        <el-col :span="11" style="margin-right: 10px">
          <el-card style="margin-bottom: 10px;">
            <div slot="header" class="clearfix">
              <span>行/列</span>
              <div style="float: right">
                <el-radio v-model="addDataRC" label="xAxis">行</el-radio>
                <el-radio v-model="addDataRC" label="yAxis">列</el-radio>
              </div>
            </div>
            <el-tag
              v-for="item in sheetEditData"
              :key="item.label"
              type="warning"
              style="margin-right: 500px;margin-bottom: 10px"
              @click="addDataClickTag(item,false)"
            >{{ item.label }}
            </el-tag>
          </el-card>
          <el-card>
            <el-tag
              v-for="item in ['+','-','*','/']"
              :key="item"
              style="margin-right: 10px"
              @click="addDataClickTag(item,true)"
            >{{ item }}
            </el-tag>
          </el-card>
        </el-col>
        <el-col :span="12">
          <el-input v-model="addDataNewField" placeholder="请输入新增字段名称" style="margin-bottom: 10px" />
          <el-card>
            <el-tag
              v-for="item in addDataObject"
              :type="!item.isSymbol?'warning':''"
              style="margin-right: 10px;margin-bottom: 10px"
              closable
              @close="addDataCloseTag(item)"
            >{{ item.label }}
            </el-tag>
          </el-card>
        </el-col>
      </el-row>

      <span slot="footer" class="dialog-footer">
        <el-button @click="dataAddVisible = false;">取 消</el-button>
        <el-button type="primary" @click="addDataSave">确 定</el-button>
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
      // x轴原始数据集
      xLableList: [],
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
      filterOption: [
        {
          value: 'lt',
          label: '小于(<)'
        },
        {
          value: 'gt',
          label: '大于(>)'
        },
        {
          value: 'le',
          label: '小于等于(<=)'
        },
        {
          value: 'ge',
          label: '大于等于(>=)'
        }
      ],
      // 图表种类多选
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
      columnChartSource: [],
      columnChartSeries: [],
      // 监听图表变化开关
      chartChange: false,
      // 图表内工具栏翻转
      changeChartDirection: true,
      // 筛选页面
      filterVisible: false,
      // 转置标记
      hlzj: true,
      filterEditRC: 'xAxis',
      filterFirstSelect: '',
      filterSecondSelect: '',
      filterSelectNum: 0,
      filterCanClick: false,
      filterResultTags: [],
      filterResultJson: [],
      type: 'row',
      func: '',
      chartRightUtil: true,
      pieSelect: '',
      dataAddVisible: false,
      addDataRC: 'xAxis',
      addDataObject: [],
      addDataSendArray: [],
      addDataNewField: '',
      sheetEditModelArray: []
    }
  },
  computed: {
    listenFilterInput() {
      const { filterFirstSelect, filterSecondSelect, filterSelectNum } = this
      return { filterFirstSelect, filterSecondSelect, filterSelectNum }
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
          this.chartRightUtil = false
          this.pieSelect = this.yLabelList[0]
          this.pieChartFunc(0)
          break
        default :
          this.showChart = false
          this.chartRightUtil = true
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
    },
    async changeChartDirection(val) {
      this.hlzj = val
      await this.initData()
    },
    filterEditRC(val) {
      this.filterEditInitData(val)
    },
    addDataRC(val) {
      this.addDataInitData(val)
    },
    listenFilterInput(val) {
      console.log(this.xLableList)
      console.log('筛选条件:', val)
      if (val.filterFirstSelect !== '' && val.filterSecondSelect !== '' && val.filterSelectNum !== 0) {
        this.filterCanClick = true
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
  beforeDestroy() {
    echarts.dispose(this.chart)
    this.chart = undefined
  },
  methods: {
    async initData() {
      this.yLabelList = []
      this.xLabelMap = {}
      // 接口请求
      const params = new URLSearchParams()
      params.append('tablename', 'income_engelcoefficient_info')
      params.append('count', this.timeSelect === '' ? 5 : this.timeSelect)
      params.append('hlzh', Number(this.hlzj))
      params.append('search_list', JSON.stringify(this.filterResultJson))
      params.append('type', this.type)
      params.append('func', this.func)
      params.append('formula', this.addDataSendArray.join())
      params.append('newField', this.addDataNewField)
      params.append('filter_array', this.sheetEditModelArray.join())
      const result = await getData(params)
      console.log(result.data)

      this.xLableList = result.data['xLabelList']
      result.data['xLabelList'].forEach(item => {
        this.xLabelMap[item.pointer] = item.cname
      })
      this.chartData = result.data['dataTable']
      this.chartData.map(item => item['c_yAxis']).forEach(item => {
        this.yLabelList.push(item)
      })

      // let index = 0
      // this.chartData = result.data['dataTable'].map(item => Object.assign({}, item, {id: index++}))
      this.timeSelect = ''
      this.isOk = true
      if (this.checkedChart[0] !== '') {
        this.chartReback(this.checkedChart[0])
      }
      this.func = ''
      this.filterResultJson = ''
      this.addDataSendArray = []
      this.addDataNewField = ''
      this.sheetEditModelArray = []
    },
    // 条形图功能
    barChartFunc() {
      this.barChartSource = []
      this.barChartSeries = []

      // 创建dataset,每个对象数组填充product字段
      this.barChartSource.push(['product'].concat(Object.values(this.xLabelMap).splice(0)))
      this.chartData.map(item => _.omit(item, ['e_yAxis'])).forEach(item => {
        this.barChartSource.push(Object.values(item))
      })
      for (let i = 0; i < Object.values(this.xLabelMap).length; i++) {
        this.barChartSeries.push({ type: 'bar' })
      }
      this.chartOption = {
        grid: {
          right: '50px'
        },
        tooltip: {},
        toolbox: {
          feature: {
            magicType: { show: true, type: ['line', 'bar', 'stack'] },
            saveAsImage: { show: true }
          },
          bottom: '5px',
          right: '50px'
        },
        legend: {},
        dataset: {
          source: this.barChartSource
        },
        xAxis: {
          type: 'category', axisPointer: {
            type: 'shadow'
          }
        },
        yAxis: {},
        series: this.barChartSeries
      }
      this.chart.clear()
      this.chart.setOption(this.chartOption)
    },
    // 饼图功能
    pieChartFunc(yIndex) {
      const pieData = []
      console.log(this.yLabelList, this.xLableList, this.chartData, this.xLabelMap)
      const namesArray = Object.keys(this.chartData[yIndex]).slice(2)
        .map(item => this.xLabelMap[item])
        .filter(item => item !== undefined)
      const valueArray = Object.values(this.chartData[yIndex]).slice(2)
      namesArray.forEach((item, index) => pieData.push({ name: item, value: valueArray[index] }))
      console.log(pieData)
      this.chartOption = {
        tooltip: {
          trigger: 'item'
        },
        legend: {
          top: '5%',
          left: 'center'
        },
        grid: {
          right: '50px'
        },
        toolbox: {
          feature: {
            saveAsImage: { show: true }
          },
          bottom: '5px',
          right: '50px'
        },
        series: [
          {
            type: 'pie',
            radius: ['30%', '60%'],
            avoidLabelOverlap: false,
            itemStyle: {
              borderRadius: 10,
              borderColor: '#fff',
              borderWidth: 2
            },
            label: {
              show: false,
              position: 'center'
            },
            emphasis: {
              label: {
                show: true,
                fontSize: '15',
                fontWeight: 'bold'
              }
            },
            labelLine: {
              show: false
            },
            data: pieData
          }
        ]
      }
      this.chart.clear()
      this.chart.setOption(this.chartOption)
    },
    // 柱状图功能
    columnChartFunc() {
      this.columnChartSource = []
      this.columnChartSeries = []

      const newDataSource = this.chartData.map(item => _.omit(item, ['e_yAxis']))
      this.columnChartSource.push(['product'].concat(Object.values(this.xLabelMap).splice(0)))
      newDataSource.forEach(item => {
        this.columnChartSource.push(Object.values(item))
      })
      for (let i = 0; i < Object.values(this.xLabelMap).length; i++) {
        this.columnChartSeries.push({ type: 'bar' })
      }
      this.chartOption = {
        legend: {},
        tooltip: {},
        toolbox: {
          feature: {
            magicType: { show: true, type: ['bar', 'stack'] },
            saveAsImage: { show: true }
          },
          bottom: '5px',
          right: '50px'
        },
        grid: {
          right: '50px'
        },
        dataset: {
          source: this.columnChartSource
        },
        xAxis: {},
        yAxis: { type: 'category' },
        series: this.columnChartSeries
      }
      this.chart.clear()
      this.chart.setOption(this.chartOption)
    },
    // 报表管理功能菜单
    async sheetChange(val) {
      // 编辑
      if (val === '1') {
        this.sheetEditInitData('xAxis')
      }
      // 转置
      else if (val === '2') {
        this.hlzj = !this.hlzj
        await this.initData()
      }
      // 维度转换
      else if (val === '3') {

      }
    },
    // 数据管理功能菜单
    tableChange(val) {
      switch (val) {
        case '1':
          this.addDataInitData('xAxis')
          this.dataAddVisible = true
          break
        case '2':
          this.filterEditInitData('xAxis')
          this.filterVisible = true
          break
        default:
          this.tableCalcFunc(val)
          break
      }
    },
    // 弹窗关闭前
    beforeDialogClose(done) {
      this.sheetSelect = ''
      done()
    },
    // 报表管理->编辑保存
    async sheetEditModelSave() {
      console.log(this.sheetEditModel, this.xLableList)
      this.sheetEditModel.forEach(item => {
        const number = Object.values(this.xLabelMap).indexOf(item)
        if (number !== -1) {
          this.sheetEditModelArray.push(Object.keys(this.xLabelMap)[number])
        }
      })
      console.log('ename输出', this.sheetEditModelArray)
      await this.initData()
      this.sheetSelect = ''
      this.sheetEditVisible = false
    },
    // 编辑初始化
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
        this.chartData.map(item => [item['e_yAxis'], item['c_yAxis']]).forEach(item => {
          this.sheetEditData.push({ key: item[0], label: item[1] })
        })
      }
    },
    // 筛选初始化
    filterEditInitData(type) {
      this.filterVisible = true
      this.sheetEditModel = []
      this.sheetEditData = []
      this.filterFirstSelect = ''
      this.filterSecondSelect = ''
      this.filterSelectNum = 0
      this.filterCanClick = false
      this.filterResultTags = []
      this.filterResultJson = []
      // 将横坐标填充到sheetEditData中
      if (type === 'xAxis') {
        Object.values(this.xLabelMap).forEach(item => {
          this.sheetEditData.push({ key: item, label: item })
        })
      }
      // 纵坐标填充
      else {
        this.chartData.map(item => [item['e_yAxis'], item['c_yAxis']]).forEach(item => {
          this.sheetEditData.push({ key: item[0], label: item[1] })
        })
      }
    },
    // 新增指标初始化
    addDataInitData(type) {
      this.dataAddVisible = true
      this.addDataObject = []
      this.sheetEditData = []
      if (type === 'xAxis') {
        console.log(this.xLabelMap)
        Object.keys(this.xLabelMap).forEach((item, index) => {
          this.sheetEditData.push({ key: item, label: Object.values(this.xLabelMap)[index] })
        })
        console.log(this.sheetEditData)
      }
      // 纵坐标填充
      else {
        this.chartData.map(item => [item['e_yAxis'], item['c_yAxis']]).forEach(item => {
          this.sheetEditData.push({ key: item[0], label: item[1] })
        })
      }
    },
    // 删除标签并从echart数据中删除
    closeTag(item, axias) {
      this.labelGC.indexOf(item) === -1 ? this.labelGC.push(item) : this.labelGC.splice(this.labelGC.indexOf(item), 1)
      if (axias === 'x') {
        // TODO 转为折线图
        this.changeLine(item)
      } else {
        this.closeTagInnerFunc(item)
      }
    },
    // 查找已经删除的标签
    findGCTag(item) {
      return this.labelGC.indexOf(item) === -1
    },
    // chart图还原右侧按钮
    chartReback(type) {
      this.labelGC = []
      switch (type) {
        case 'bar':
          this.barChartFunc()
          break
        case 'column':
          this.columnChartFunc()
          break
      }
    },
    // 标签删除点击时间
    closeTagInnerFunc(item) {
      let needDeleteId
      if (this.checkedChart[0] === 'bar') {
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
        this.chartChange = true
      }
    },
    // 筛选添加到右侧card中
    filterAddResult() {
      // 添加到显示数组
      const tagName = this.filterFirstSelect + ' ' + this.filterSecondSelect + ' ' + this.filterSelectNum

      const jsonValue = this.filterSelectNum
      let jsonKey
      let jsonSymbol
      if (this.filterEditRC === 'xAxis') {
        this.type = 'row'
        console.log('select row')
        jsonKey = this.xLableList.filter(item => item.cname === this.filterFirstSelect)[0].ename
        jsonSymbol = this.filterOption.filter(item => item.label === this.filterSecondSelect)[0].value
      } else {
        this.type = 'column'
        console.log('select column')
        jsonKey = this.chartData.filter(item => item['c_yAxis'] === this.filterFirstSelect)[0].e_yAxis
        jsonSymbol = this.filterOption.filter(item => item.label === this.filterSecondSelect)[0].value
      }
      // 添加到发送结果
      let isExistJsonKey = false
      for (const filterResultJsonElement of this.filterResultJson) {
        if (Object.keys(filterResultJsonElement).includes(jsonKey)) {
          isExistJsonKey = true
          if (filterResultJsonElement[jsonKey].filter(item => item[jsonSymbol]).length !== 0) {
            this.$message.warning('请勿重复添加')
          } else {
            this.filterResultTags.push(tagName)
            filterResultJsonElement[jsonKey].push(
              {
                [jsonSymbol]: jsonValue
              }
            )
          }
        }
      }
      if (!isExistJsonKey) {
        this.filterResultTags.push(tagName)
        this.filterResultJson.push(
          {
            [jsonKey]: [
              {
                [jsonSymbol]: jsonValue
              }
            ]
          }
        )
      }
      console.log(JSON.stringify(this.filterResultJson))
    },
    // 过滤确定按钮实现
    async filterSave() {
      await this.initData()
      this.filterVisible = false
    },
    // 对行运算
    async tableCalcFunc(func) {
      this.func = func
      await this.initData()
    },
    // 时间跨度选择
    async timeSelectFunc(val) {
      this.timeSelect = val
      await this.initData()
    },
    // 饼图中横坐标选择
    pieTagClick(item) {
      this.pieSelect = item
      this.pieChartFunc(this.yLabelList.indexOf(item))
    },
    // 将某一指标转为折线图
    changeLine(value) {
      const lineData = []
      const valueIndex = this.barChartSource[0].indexOf(value)
      this.barChartSource.forEach(item => {
        lineData.push(item[valueIndex])
      })
      console.log('line数组', lineData.slice(1))
      this.barChartSeries.push({
        name: lineData[0],
        type: 'line',
        data: lineData.slice(1)
      })
      this.chart.setOption(this.chartOption)
    },
    // 新增指标到右侧
    addDataClickTag(item, isSymbol) {
      // 判断是否和之前重复
      if (this.addDataObject.length > 0) {
        if (this.addDataObject[this.addDataObject.length - 1]['isSymbol'] === isSymbol) {
          return this.$message.error('请按照语法规则添加')
        }
      }
      if (isSymbol) {
        const symbolObject = {
          key: item,
          label: item,
          isSymbol: isSymbol
        }
        this.addDataObject.push(symbolObject)
      } else {
        item.isSymbol = isSymbol
        this.addDataObject.push(item)
      }
      this.addDataSendArray = this.addDataObject.map(item => item.key)
      console.log('添加对象数组', this.addDataObject, this.addDataSendArray)
    },
    addDataCloseTag(item) {
      console.log(item)
      // 先删除对象
      this.addDataObject.splice(this.addDataObject.indexOf(item), 1)
      // 重新生成sendArray
      this.addDataSendArray = this.addDataObject.map(item => item.key)
    },
    // 新增指标确定按钮
    async addDataSave() {
      await this.initData()
      this.dataAddVisible = false
    }
  }
}

</script>

<style scoped>
/deep/ .el-transfer-panel {
  width: 300px !important;
}
.clearfix:before,
.clearfix:after {
  display: table;
  content: "";
}
.clearfix:after {
  clear: both
}
/*.el-checkbox+.el-checkbox {*/
/*  margin-left: 0px;*/
/*}*/
/*.el-checkbox {*/
/*  margin-right: 25px;*/
/*}*/
</style>
