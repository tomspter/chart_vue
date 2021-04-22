<template>
  <el-table>

  </el-table>
</template>

<script>
import {getData} from '@/api/chart'

export default {
  name: 'Index',
  data() {
    return {
      chartData: [],
      xLabelMap: {}
    }
  },
  mounted() {
    this.initData()
  },
  methods: {
    async initData() {
      let params = new URLSearchParams()
      params.append('tablename', 'income_engelcoefficient_info')
      params.append('count', '5')
      const result = await getData(params)
      console.log(result)
      this.xLabelMap = result.data
    }
  }
}
</script>

<style scoped>

</style>
