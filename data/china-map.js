/**
 * 中国地图 GeoJSON 数据
 * 简化版，包含省份坐标
 */

window.chinaMapData = {
  "type": "FeatureCollection",
  "features": [
    {"type": "Feature", "id": "北京", "properties": {"name": "北京"}, "geometry": {"type": "Point", "coordinates": [116.4, 39.9]}},
    {"type": "Feature", "id": "天津", "properties": {"name": "天津"}, "geometry": {"type": "Point", "coordinates": [117.2, 39.1]}},
    {"type": "Feature", "id": "河北", "properties": {"name": "河北"}, "geometry": {"type": "Point", "coordinates": [114.5, 38.0]}},
    {"type": "Feature", "id": "山西", "properties": {"name": "山西"}, "geometry": {"type": "Point", "coordinates": [112.5, 37.9]}},
    {"type": "Feature", "id": "内蒙古", "properties": {"name": "内蒙古"}, "geometry": {"type": "Point", "coordinates": [111.8, 40.8]}},
    {"type": "Feature", "id": "辽宁", "properties": {"name": "辽宁"}, "geometry": {"type": "Point", "coordinates": [123.4, 41.8]}},
    {"type": "Feature", "id": "吉林", "properties": {"name": "吉林"}, "geometry": {"type": "Point", "coordinates": [125.3, 43.9]}},
    {"type": "Feature", "id": "黑龙江", "properties": {"name": "黑龙江"}, "geometry": {"type": "Point", "coordinates": [126.5, 45.8]}},
    {"type": "Feature", "id": "上海", "properties": {"name": "上海"}, "geometry": {"type": "Point", "coordinates": [121.5, 31.2]}},
    {"type": "Feature", "id": "江苏", "properties": {"name": "江苏"}, "geometry": {"type": "Point", "coordinates": [118.8, 32.0]}},
    {"type": "Feature", "id": "浙江", "properties": {"name": "浙江"}, "geometry": {"type": "Point", "coordinates": [120.2, 30.3]}},
    {"type": "Feature", "id": "安徽", "properties": {"name": "安徽"}, "geometry": {"type": "Point", "coordinates": [117.2, 31.8]}},
    {"type": "Feature", "id": "福建", "properties": {"name": "福建"}, "geometry": {"type": "Point", "coordinates": [119.3, 26.1]}},
    {"type": "Feature", "id": "江西", "properties": {"name": "江西"}, "geometry": {"type": "Point", "coordinates": [115.9, 28.7]}},
    {"type": "Feature", "id": "山东", "properties": {"name": "山东"}, "geometry": {"type": "Point", "coordinates": [117.1, 36.7]}},
    {"type": "Feature", "id": "河南", "properties": {"name": "河南"}, "geometry": {"type": "Point", "coordinates": [113.6, 34.7]}},
    {"type": "Feature", "id": "湖北", "properties": {"name": "湖北"}, "geometry": {"type": "Point", "coordinates": [114.3, 30.6]}},
    {"type": "Feature", "id": "湖南", "properties": {"name": "湖南"}, "geometry": {"type": "Point", "coordinates": [113.0, 28.2]}},
    {"type": "Feature", "id": "广东", "properties": {"name": "广东"}, "geometry": {"type": "Point", "coordinates": [113.3, 23.1]}},
    {"type": "Feature", "id": "广西", "properties": {"name": "广西"}, "geometry": {"type": "Point", "coordinates": [108.3, 22.8]}},
    {"type": "Feature", "id": "海南", "properties": {"name": "海南"}, "geometry": {"type": "Point", "coordinates": [110.3, 19.8]}},
    {"type": "Feature", "id": "重庆", "properties": {"name": "重庆"}, "geometry": {"type": "Point", "coordinates": [106.5, 29.5]}},
    {"type": "Feature", "id": "四川", "properties": {"name": "四川"}, "geometry": {"type": "Point", "coordinates": [104.1, 30.6]}},
    {"type": "Feature", "id": "贵州", "properties": {"name": "贵州"}, "geometry": {"type": "Point", "coordinates": [106.7, 26.6]}},
    {"type": "Feature", "id": "云南", "properties": {"name": "云南"}, "geometry": {"type": "Point", "coordinates": [102.7, 25.0]}},
    {"type": "Feature", "id": "西藏", "properties": {"name": "西藏"}, "geometry": {"type": "Point", "coordinates": [91.0, 29.7]}},
    {"type": "Feature", "id": "陕西", "properties": {"name": "陕西"}, "geometry": {"type": "Point", "coordinates": [108.9, 34.3]}},
    {"type": "Feature", "id": "甘肃", "properties": {"name": "甘肃"}, "geometry": {"type": "Point", "coordinates": [103.8, 36.1]}},
    {"type": "Feature", "id": "青海", "properties": {"name": "青海"}, "geometry": {"type": "Point", "coordinates": [101.8, 36.6]}},
    {"type": "Feature", "id": "宁夏", "properties": {"name": "宁夏"}, "geometry": {"type": "Point", "coordinates": [106.3, 38.5]}},
    {"type": "Feature", "id": "新疆", "properties": {"name": "新疆"}, "geometry": {"type": "Point", "coordinates": [87.6, 43.8]}},
    {"type": "Feature", "id": "台湾", "properties": {"name": "台湾"}, "geometry": {"type": "Point", "coordinates": [120.9, 23.7]}},
    {"type": "Feature", "id": "香港", "properties": {"name": "香港"}, "geometry": {"type": "Point", "coordinates": [114.2, 22.3]}},
    {"type": "Feature", "id": "澳门", "properties": {"name": "澳门"}, "geometry": {"type": "Point", "coordinates": [113.5, 22.2]}}
  ]
};

// 标记中国地图已加载
if (echarts) {
  echarts.registerMap('china', window.chinaMapData);
  console.log('✓ 中国地图已注册（本地数据）');
}
