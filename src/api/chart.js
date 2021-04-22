import request from '@/utils/request'

export function getData(data) {
  return request({
    url: '/data',
    method: 'post',
    data
  })
}
