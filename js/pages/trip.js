/**
 * 旅程页面脚本
 * 处理地图展示、旅程数据管理、新增/编辑/删除功能
 */

// 中国省份数据（用于下拉选择）
const PROVINCES = [
  '北京', '天津', '河北', '山西', '内蒙古',
  '辽宁', '吉林', '黑龙江',
  '上海', '江苏', '浙江', '安徽', '福建', '江西', '山东',
  '河南', '湖北', '湖南', '广东', '广西', '海南',
  '重庆', '四川', '贵州', '云南', '西藏',
  '陕西', '甘肃', '青海', '宁夏', '新疆',
  '台湾', '香港', '澳门'
];

// 省份名称映射（处理不同地图数据源的名称差异）
const PROVINCE_NAME_MAP = {
  '北京': ['北京', '北京市', 'Beijing'],
  '天津': ['天津', '天津市', 'Tianjin'],
  '河北': ['河北', '河北省', 'Hebei'],
  '山西': ['山西', '山西省', 'Shanxi'],
  '内蒙古': ['内蒙古', '内蒙古自治区', 'Inner Mongolia'],
  '辽宁': ['辽宁', '辽宁省', 'Liaoning'],
  '吉林': ['吉林', '吉林省', 'Jilin'],
  '黑龙江': ['黑龙江', '黑龙江省', 'Heilongjiang'],
  '上海': ['上海', '上海市', 'Shanghai'],
  '江苏': ['江苏', '江苏省', 'Jiangsu'],
  '浙江': ['浙江', '浙江省', 'Zhejiang'],
  '安徽': ['安徽', '安徽省', 'Anhui'],
  '福建': ['福建', '福建省', 'Fujian'],
  '江西': ['江西', '江西省', 'Jiangxi'],
  '山东': ['山东', '山东省', 'Shandong'],
  '河南': ['河南', '河南省', 'Henan'],
  '湖北': ['湖北', '湖北省', 'Hubei'],
  '湖南': ['湖南', '湖南省', 'Hunan'],
  '广东': ['广东', '广东省', 'Guangdong'],
  '广西': ['广西', '广西壮族自治区', 'Guangxi'],
  '海南': ['海南', '海南省', 'Hainan'],
  '重庆': ['重庆', '重庆市', 'Chongqing'],
  '四川': ['四川', '四川省', 'Sichuan'],
  '贵州': ['贵州', '贵州省', 'Guizhou'],
  '云南': ['云南', '云南省', 'Yunnan'],
  '西藏': ['西藏', '西藏自治区', 'Tibet', 'Xizang'],
  '陕西': ['陕西', '陕西省', 'Shaanxi'],
  '甘肃': ['甘肃', '甘肃省', 'Gansu'],
  '青海': ['青海', '青海省', 'Qinghai'],
  '宁夏': ['宁夏', '宁夏回族自治区', 'Ningxia'],
  '新疆': ['新疆', '新疆维吾尔自治区', 'Xinjiang'],
  '台湾': ['台湾', '台湾省', 'Taiwan'],
  '香港': ['香港', '香港特别行政区', 'Hong Kong'],
  '澳门': ['澳门', '澳门特别行政区', 'Macao']
};

let chart = null;
let mapDataLoaded = false;

// 地图加载完成后的回调
window.initChartWhenMapReady = function() {
  console.log('✓ 地图数据已加载并注册');
  mapDataLoaded = true;

  try {
    if (!chart) {
      initChart();
    }
    renderMapData();
  } catch (error) {
    console.error('地图初始化失败:', error);
  }
};

// ========== 初始化 ==========
document.addEventListener('DOMContentLoaded', () => {
  console.log('开始初始化旅程页面...');
  initProvinceSelect();

  // 等待地图数据加载（最多等待 5 秒）
  let attempts = 0;
  const maxAttempts = 10;

  const checkMapAndInit = setInterval(() => {
    attempts++;

    if (mapDataLoaded || echarts.getMap('china')) {
      clearInterval(checkMapAndInit);
      console.log('✓ 地图数据已就绪，开始初始化');

      try {
        if (!chart) {
          initChart();
        }
        renderMapData();
        console.log('✨ 旅程页面加载完成');
      } catch (error) {
        console.error('初始化失败:', error);
      }
    } else if (attempts >= maxAttempts) {
      clearInterval(checkMapAndInit);
      console.error('❌ 地图数据加载超时');
      alert('地图加载失败，请检查网络连接后刷新页面');
    } else {
      console.log(`等待地图数据加载... (${attempts}/${maxAttempts})`);
    }
  }, 500);
});

// ========== 省份选择初始化 ==========
function initProvinceSelect() {
  const select = document.getElementById('provinceSelect');
  PROVINCES.forEach(province => {
    const option = document.createElement('option');
    option.value = province;
    option.textContent = province;
    select.appendChild(option);
  });
}

// ========== 地图初始化 ==========
function initChart() {
  const mapContainer = document.getElementById('mapContainer');

  console.log('mapContainer:', mapContainer);
  console.log('mapContainer 大小:', mapContainer?.offsetWidth, 'x', mapContainer?.offsetHeight);

  if (!mapContainer) {
    console.error('地图容器不存在！');
    return;
  }

  // 检查地图数据是否已注册
  if (!echarts.getMap('china')) {
    console.warn('⚠️ 中国地图数据尚未加载，稍后重试...');
    return;
  }

  chart = echarts.init(mapContainer, 'light');
  console.log('ECharts 实例已创建:', chart);

  // 初始化空地图
  const option = {
    tooltip: {
      trigger: 'item',
      formatter: function(params) {
        return params.name || '';
      }
    },
    series: [
      {
        name: '旅程分布',
        type: 'map',
        map: 'china',
        roam: true,
        scaleLimit: {
          min: 1,
          max: 3
        },
        data: [],
        itemStyle: {
          normal: {
            areaColor: '#f0f0f0',
            borderColor: '#999',
            borderWidth: 1
          },
          emphasis: {
            areaColor: '#e0e0e0',
            borderColor: '#333',
            borderWidth: 2
          }
        },
        label: {
          normal: {
            show: false
          },
          emphasis: {
            show: true,
            color: '#000'
          }
        }
      }
    ]
  };

  chart.setOption(option);
  console.log('✓ 地图配置已应用');

  // 强制调整大小
  setTimeout(() => {
    chart.resize();
    console.log('✓ 地图已调整大小');
  }, 100);

  // 绑定地图点击事件
  chart.on('click', (params) => {
    if (params.seriesType === 'map' && params.data && params.data.trips) {
      const { name, trips } = params.data;

      // 如果该省份只有一条旅程，直接跳转
      if (trips.length === 1) {
        window.location.href = `trip-detail.html?id=${trips[0].id}`;
      }
      // 如果有多条，跳转到第一条（或可改为显示列表选择）
      else if (trips.length > 0) {
        window.location.href = `trip-detail.html?id=${trips[0].id}`;
      }
    }
  });

  // 响应式自适应
  window.addEventListener('resize', () => {
    if (chart) {
      chart.resize();
    }
  });
}

// ========== 渲染列表 ==========
function renderTripList() {
  const trips = StorageManager.getTrips();
  const tripList = document.getElementById('tripList');
  const tripCount = document.getElementById('tripCount');

  tripCount.textContent = `(${trips.length})`;

  if (trips.length === 0) {
    tripList.innerHTML = `
      <div class="trip-empty">
        <i class="fas fa-map"></i>
        <p>暂无旅程记录</p>
        <p style="font-size: var(--font-size-sm);">点击下方新增按钮开始记录</p>
      </div>
    `;
    return;
  }

  tripList.innerHTML = trips.map(trip => {
    const start = new Date(trip.startDate).toLocaleDateString('zh-CN');
    const end = new Date(trip.endDate).toLocaleDateString('zh-CN');
    return `
      <div class="trip-item" onclick="window.location.href='trip-detail.html?id=${trip.id}'">
        <div class="trip-item-main">
          <div class="trip-item-province">📍 ${trip.province}</div>
          <div class="trip-item-date">${start} 至 ${end}</div>
        </div>
        <div class="trip-item-arrow">
          <i class="fas fa-chevron-right"></i>
        </div>
      </div>
    `;
  }).join('');
}

// ========== 生成地图数据 ==========
function generateMapSeriesData() {
  const trips = StorageManager.getTrips();

  // 统计每个省份的旅程信息
  const provinceData = {};
  trips.forEach(trip => {
    if (!provinceData[trip.province]) {
      provinceData[trip.province] = [];
    }
    provinceData[trip.province].push(trip);
  });

  // 转换为 ECharts 需要的格式（为每个省份的所有名称变体都创建数据项）
  const seriesData = [];

  Object.entries(provinceData).forEach(([province, tripList]) => {
    // 计算评分平均值
    const avgRating = tripList.reduce((sum, t) => sum + (t.rating || 3), 0) / tripList.length;

    // 获取最近一次旅行时间
    const latestTrip = tripList[tripList.length - 1];
    const dateRange = `${latestTrip.startDate} 至 ${latestTrip.endDate}`;

    // 根据访问次数选择颜色
    let color = '#f0f0f0';  // 默认：未去过
    const times = tripList.length;
    if (times === 1) color = '#90CAF9';      // 浅蓝：去过1次
    else if (times === 2) color = '#42A5F5'; // 中蓝：去过2次
    else if (times === 3) color = '#1976D2'; // 深蓝：去过3次
    else if (times >= 4) color = '#0D47A1';  // 暗蓝：去过4+次

    // 为该省份的所有可能名称创建数据项
    const provinceNames = PROVINCE_NAME_MAP[province] || [province];
    provinceNames.forEach(name => {
      seriesData.push({
        name: name,
        value: times,
        trips: tripList,
        avgRating: avgRating.toFixed(1),
        dateRange: dateRange,
        itemStyle: {
          areaColor: color,
          color: color
        }
      });
    });
  });

  return seriesData;
}

// ========== 渲染地图数据 ==========
function renderMapData() {
  const trips = StorageManager.getTrips();
  renderTripList(); // 同时更新列表

  const seriesData = generateMapSeriesData();

  console.log('生成的地图数据:', seriesData);

  // 计算访问次数的最大值
  const maxTimes = seriesData.length > 0 ? Math.max(...seriesData.map(d => d.value)) : 1;

  // 更新配置 - 使用 map 类型而非 scatter
  const option = {
    tooltip: {
      trigger: 'item',
      formatter: function(params) {
        if (params.seriesType === 'map' && params.data) {
          const { name, value, trips, avgRating, dateRange } = params.data;

          if (!trips || trips.length === 0) {
            return name; // 未去过的省份
          }

          // 格式化浮窗内容
          const stars = '★'.repeat(Math.round(avgRating)) + '☆'.repeat(5 - Math.round(avgRating));
          return `
            <strong>${name}</strong><br/>
            访问: ${value}次<br/>
            最近: ${dateRange}<br/>
            ⭐ 平均评分: ${stars} (${avgRating}/5)
          `;
        }
        return params.name || '';
      }
    },
    series: [
      {
        name: '旅程分布',
        type: 'map',
        map: 'china',
        roam: true,
        scaleLimit: {
          min: 1,
          max: 3
        },
        data: seriesData,
        itemStyle: {
          normal: {
            areaColor: '#f0f0f0',
            borderColor: '#999',
            borderWidth: 1
          },
          emphasis: {
            areaColor: '#e0e0e0',
            borderColor: '#333',
            borderWidth: 2
          }
        },
        label: {
          normal: {
            show: false
          },
          emphasis: {
            show: true,
            color: '#000'
          }
        }
      }
    ]
  };

  chart.setOption(option, true);  // 第二个参数 true 表示不合并，完全替换
  console.log('✓ 地图数据已更新，共', trips.length, '条旅程');
}

// ========== 评分显示更新 ==========
function updateRatingDisplay() {
  const rating = parseInt(document.getElementById('tripRating')?.value || '3');
  const stars = '★'.repeat(rating) + '☆'.repeat(5 - rating);
  document.getElementById('ratingDisplay').textContent = `${stars} (${rating}/5)`;
}

document.getElementById('tripRating')?.addEventListener('input', updateRatingDisplay);

// ========== 新增旅程模态框 ==========
function openAddTripModal() {
  const modal = document.getElementById('addTripModal');
  modal.classList.add('active');

  // 重置表单
  document.getElementById('tripForm').reset();
  document.getElementById('startDate').value = '';
  document.getElementById('endDate').value = '';
  document.getElementById('tripRating').value = '3';
  updateRatingDisplay();
}

function closeAddTripModal() {
  const modal = document.getElementById('addTripModal');
  modal.classList.remove('active');
}

// ========== 保存旅程 ==========
function saveTrip() {
  const form = document.getElementById('tripForm');

  // 验证必填项
  if (!form.checkValidity()) {
    alert('请填写所有必填项');
    return;
  }

  const province = document.getElementById('provinceSelect').value;
  const startDate = document.getElementById('startDate').value;
  const endDate = document.getElementById('endDate').value;
  const description = document.getElementById('tripDescription').value;

  // 验证日期逻辑
  if (new Date(endDate) < new Date(startDate)) {
    alert('结束日期不能早于开始日期');
    return;
  }

  // 创建旅程对象
  const trip = {
    province,
    startDate,
    endDate,
    description,
    companions: document.getElementById('tripCompanions')?.value || '',  // 同行人
    rating: parseInt(document.getElementById('tripRating')?.value || '3'),  // 五星评分
    photos: [] // 用于后续添加照片
  };

  // 保存到 StorageManager
  if (StorageManager.addTrip(trip)) {
    console.log('✓ 旅程已保存:', trip);
    alert('✓ 旅程添加成功！');

    // 关闭模态框并重新渲染
    closeAddTripModal();
    renderMapData();
    renderTripList();

    // 调整地图大小以适应新数据
    if (chart) {
      setTimeout(() => {
        chart.resize();
      }, 100);
    }
  } else {
    alert('✗ 保存失败，请重试');
  }
}


// ========== 返回导航页 ==========
function goBack() {
  if (window.history.length > 1) {
    window.history.back();
  } else {
    window.location.href = '../nav.html';
  }
}

// ========== 关闭模态框（背景点击） ==========
document.getElementById('addTripModal')?.addEventListener('click', (e) => {
  if (e.target.id === 'addTripModal') {
    closeAddTripModal();
  }
});

// ========== 键盘快捷键 ==========
document.addEventListener('keydown', (e) => {
  // Esc 关闭模态框
  if (e.key === 'Escape') {
    closeAddTripModal();
  }
});
