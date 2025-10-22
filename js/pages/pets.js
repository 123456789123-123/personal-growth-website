// 宠物模块 JavaScript

// ========== 全局变量 ==========
let petData = {
  profile: null,
  weightRecords: [],
  tags: [],
  growthRecords: [],
  photos: [],
  diaries: []
};

let currentEditingGrowthId = null;
let currentEditingDiaryId = null;
let weightChart = null;
let currentMonth = new Date();

// ========== 初始化 ==========
document.addEventListener('DOMContentLoaded', function() {
  // 加载数据
  loadPetData();

  // 初始化 Tab 切换
  initTabs();

  // 初始化档案页面
  renderProfile();
  initWeightChart();
  renderTags();

  // 初始化其他页面
  renderGrowthTimeline();
  renderPhotos();
  renderCalendar();
  renderDiaryList();

  // 初始化筛选器
  initPhotoFilters();

  // 事件监听
  setupEventListeners();
});

// ========== 数据管理 ==========

// 加载数据
function loadPetData() {
  const saved = StorageManager.getItem(StorageManager.KEYS.PETS);
  if (saved) {
    petData = saved;
  } else {
    // 初始化默认数据
    petData = {
      profile: {
        name: '我的宠物',
        breed: '',
        gender: 'male',
        birthday: '',
        color: '',
        description: ''
      },
      weightRecords: [],
      tags: ['活泼', '粘人', '贪吃'],
      growthRecords: [],
      photos: [],
      diaries: []
    };
    savePetData();
  }
}

// 保存数据
function savePetData() {
  StorageManager.setItem(StorageManager.KEYS.PETS, petData);
}

// ========== Tab 切换 ==========
function initTabs() {
  const tabBtns = document.querySelectorAll('.tab-btn');
  const tabPanes = document.querySelectorAll('.tab-pane');

  tabBtns.forEach(btn => {
    btn.addEventListener('click', function() {
      const targetTab = this.dataset.tab;

      // 更新按钮状态
      tabBtns.forEach(b => b.classList.remove('active'));
      this.classList.add('active');

      // 更新内容显示
      tabPanes.forEach(pane => pane.classList.remove('active'));
      document.getElementById(`${targetTab}-tab`).classList.add('active');

      // 特殊处理
      if (targetTab === 'profile' && weightChart) {
        // 重新渲染图表
        setTimeout(() => {
          weightChart.resize();
        }, 100);
      } else if (targetTab === 'photos') {
        renderPhotos();
      } else if (targetTab === 'diary') {
        renderCalendar();
        renderDiaryList();
      }
    });
  });
}

// ========== 档案 Tab ==========

// 渲染档案信息
function renderProfile() {
  const container = document.getElementById('profileContent');
  const profile = petData.profile;

  if (!profile) {
    container.innerHTML = '<p class="empty-state">暂无档案信息，请点击编辑添加</p>';
    return;
  }

  const age = profile.birthday ? calculateAge(profile.birthday) : '未知';
  const genderText = profile.gender === 'male' ? '公' : '母';

  container.innerHTML = `
    <div class="profile-item">
      <div class="profile-label">姓名</div>
      <div class="profile-value">${profile.name || '未设置'}</div>
    </div>
    <div class="profile-item">
      <div class="profile-label">品种</div>
      <div class="profile-value">${profile.breed || '未设置'}</div>
    </div>
    <div class="profile-item">
      <div class="profile-label">性别</div>
      <div class="profile-value">${genderText}</div>
    </div>
    <div class="profile-item">
      <div class="profile-label">生日</div>
      <div class="profile-value">${profile.birthday || '未设置'}</div>
    </div>
    <div class="profile-item">
      <div class="profile-label">年龄</div>
      <div class="profile-value">${age}</div>
    </div>
    <div class="profile-item">
      <div class="profile-label">毛色</div>
      <div class="profile-value">${profile.color || '未设置'}</div>
    </div>
    ${profile.description ? `
      <div class="profile-item" style="grid-column: 1 / -1;">
        <div class="profile-label">简介</div>
        <div class="profile-value">${profile.description}</div>
      </div>
    ` : ''}
  `;
}

// 计算年龄
function calculateAge(birthday) {
  const birth = new Date(birthday);
  const today = new Date();
  const months = (today.getFullYear() - birth.getFullYear()) * 12 + (today.getMonth() - birth.getMonth());

  if (months < 12) {
    return `${months}个月`;
  } else {
    const years = Math.floor(months / 12);
    const remainingMonths = months % 12;
    return remainingMonths > 0 ? `${years}岁${remainingMonths}个月` : `${years}岁`;
  }
}

// 编辑档案
function editProfile() {
  const profile = petData.profile;

  document.getElementById('petName').value = profile.name || '';
  document.getElementById('petBreed').value = profile.breed || '';
  document.getElementById('petGender').value = profile.gender || 'male';
  document.getElementById('petBirthday').value = profile.birthday || '';
  document.getElementById('petColor').value = profile.color || '';
  document.getElementById('petDescription').value = profile.description || '';

  showModal('editProfileModal');
}

function closeEditProfileModal() {
  hideModal('editProfileModal');
}

function saveProfile() {
  petData.profile = {
    name: document.getElementById('petName').value,
    breed: document.getElementById('petBreed').value,
    gender: document.getElementById('petGender').value,
    birthday: document.getElementById('petBirthday').value,
    color: document.getElementById('petColor').value,
    description: document.getElementById('petDescription').value
  };

  savePetData();
  renderProfile();
  closeEditProfileModal();

  showNotification('档案已保存');
}

// 初始化体重折线图
function initWeightChart() {
  const chartDom = document.getElementById('weightChart');
  weightChart = echarts.init(chartDom);

  updateWeightChart();
}

// 更新体重折线图
function updateWeightChart() {
  if (!weightChart) return;

  const records = petData.weightRecords.sort((a, b) => new Date(a.date) - new Date(b.date));

  const dates = records.map(r => r.date);
  const weights = records.map(r => r.weight);

  const option = {
    title: {
      text: records.length === 0 ? '暂无数据' : '',
      left: 'center',
      top: 'middle',
      textStyle: {
        color: '#999',
        fontSize: 16
      }
    },
    tooltip: {
      trigger: 'axis',
      formatter: function(params) {
        if (params.length === 0) return '';
        return `${params[0].name}<br/>体重: ${params[0].value} kg`;
      }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      top: '10%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: dates,
      name: '日期',
      nameTextStyle: {
        fontSize: 12
      }
    },
    yAxis: {
      type: 'value',
      name: '体重(kg)',
      nameTextStyle: {
        fontSize: 12
      }
    },
    series: [{
      name: '体重',
      type: 'line',
      data: weights,
      smooth: true,
      itemStyle: {
        color: '#5470c6'
      },
      areaStyle: {
        color: {
          type: 'linear',
          x: 0,
          y: 0,
          x2: 0,
          y2: 1,
          colorStops: [{
            offset: 0,
            color: 'rgba(84, 112, 198, 0.3)'
          }, {
            offset: 1,
            color: 'rgba(84, 112, 198, 0.05)'
          }]
        }
      }
    }]
  };

  weightChart.setOption(option);

  // 响应式
  window.addEventListener('resize', () => {
    weightChart.resize();
  });
}

// 添加体重记录
function addWeightRecord() {
  document.getElementById('weightDate').value = new Date().toISOString().split('T')[0];
  document.getElementById('weightValue').value = '';
  showModal('addWeightModal');
}

function closeAddWeightModal() {
  hideModal('addWeightModal');
}

function saveWeightRecord() {
  const date = document.getElementById('weightDate').value;
  const weight = parseFloat(document.getElementById('weightValue').value);

  if (!date || !weight) {
    alert('请填写完整信息');
    return;
  }

  petData.weightRecords.push({
    id: Date.now(),
    date,
    weight
  });

  savePetData();
  updateWeightChart();
  closeAddWeightModal();

  showNotification('体重记录已添加');
}

// 渲染性格标签
function renderTags() {
  const container = document.getElementById('tagsContent');

  if (petData.tags.length === 0) {
    container.innerHTML = '<p class="empty-state">暂无标签</p>';
    return;
  }

  container.innerHTML = petData.tags.map(tag => `
    <span class="tag">${tag}</span>
  `).join('');
}

// 编辑标签
function editTags() {
  renderEditTagsList();
  showModal('editTagsModal');

  // 回车添加标签
  document.getElementById('newTag').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag();
    }
  });
}

function renderEditTagsList() {
  const container = document.getElementById('tagsList');

  if (petData.tags.length === 0) {
    container.innerHTML = '<p style="color: #999; text-align: center; padding: 1rem;">暂无标签</p>';
    return;
  }

  container.innerHTML = petData.tags.map((tag, index) => `
    <span class="tag-removable">
      ${tag}
      <button class="tag-remove" onclick="removeTag(${index})">×</button>
    </span>
  `).join('');
}

function addTag() {
  const input = document.getElementById('newTag');
  const tag = input.value.trim();

  if (!tag) return;

  if (petData.tags.includes(tag)) {
    alert('标签已存在');
    return;
  }

  petData.tags.push(tag);
  input.value = '';
  renderEditTagsList();
}

function removeTag(index) {
  petData.tags.splice(index, 1);
  renderEditTagsList();
}

function closeEditTagsModal() {
  hideModal('editTagsModal');
}

function saveTags() {
  savePetData();
  renderTags();
  closeEditTagsModal();
  showNotification('标签已保存');
}

// ========== 成长记录 Tab ==========

function renderGrowthTimeline() {
  const container = document.getElementById('timelineContainer');
  const records = petData.growthRecords.sort((a, b) => new Date(b.date) - new Date(a.date));

  if (records.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-seedling"></i>
        <p>暂无成长记录，点击上方按钮添加</p>
      </div>
    `;
    return;
  }

  container.innerHTML = records.map(record => `
    <div class="timeline-item">
      <div class="timeline-dot ${record.type}"></div>
      <div class="timeline-content">
        <div class="timeline-date">${formatDate(record.date)}</div>
        <div class="timeline-title">${record.title}</div>
        ${record.content ? `<div class="timeline-text">${record.content}</div>` : ''}
        ${record.weight ? `<span class="timeline-weight">体重: ${record.weight} kg</span>` : ''}
        <div class="timeline-actions">
          <button class="btn btn-sm btn-outline" onclick="editGrowthRecord(${record.id})">
            <i class="fas fa-edit"></i> 编辑
          </button>
          <button class="btn btn-sm btn-outline" onclick="deleteGrowthRecord(${record.id})">
            <i class="fas fa-trash"></i> 删除
          </button>
        </div>
      </div>
    </div>
  `).join('');
}

function addGrowthRecord() {
  currentEditingGrowthId = null;
  document.getElementById('growthModalTitle').textContent = '添加成长记录';
  document.getElementById('growthType').value = 'milestone';
  document.getElementById('growthDate').value = new Date().toISOString().split('T')[0];
  document.getElementById('growthTitle').value = '';
  document.getElementById('growthWeight').value = '';
  document.getElementById('growthContent').value = '';
  document.getElementById('weightInputGroup').style.display = 'none';
  showModal('addGrowthModal');

  // 监听类型变化
  document.getElementById('growthType').addEventListener('change', function() {
    document.getElementById('weightInputGroup').style.display =
      this.value === 'weight' ? 'block' : 'none';
  });
}

function editGrowthRecord(id) {
  const record = petData.growthRecords.find(r => r.id === id);
  if (!record) return;

  currentEditingGrowthId = id;
  document.getElementById('growthModalTitle').textContent = '编辑成长记录';
  document.getElementById('growthType').value = record.type;
  document.getElementById('growthDate').value = record.date;
  document.getElementById('growthTitle').value = record.title;
  document.getElementById('growthWeight').value = record.weight || '';
  document.getElementById('growthContent').value = record.content || '';
  document.getElementById('weightInputGroup').style.display =
    record.type === 'weight' ? 'block' : 'none';
  showModal('addGrowthModal');
}

function closeAddGrowthModal() {
  hideModal('addGrowthModal');
  currentEditingGrowthId = null;
}

function saveGrowthRecord() {
  const type = document.getElementById('growthType').value;
  const date = document.getElementById('growthDate').value;
  const title = document.getElementById('growthTitle').value;
  const weight = document.getElementById('growthWeight').value;
  const content = document.getElementById('growthContent').value;

  if (!date || !title) {
    alert('请填写必填项');
    return;
  }

  const record = {
    id: currentEditingGrowthId || Date.now(),
    type,
    date,
    title,
    content,
    weight: type === 'weight' && weight ? parseFloat(weight) : null
  };

  if (currentEditingGrowthId) {
    const index = petData.growthRecords.findIndex(r => r.id === currentEditingGrowthId);
    petData.growthRecords[index] = record;
  } else {
    petData.growthRecords.push(record);
  }

  // 如果是体重记录，同步到体重记录数组
  if (type === 'weight' && weight) {
    const weightRecord = {
      id: record.id,
      date,
      weight: parseFloat(weight)
    };

    const existingIndex = petData.weightRecords.findIndex(w => w.id === record.id);
    if (existingIndex >= 0) {
      petData.weightRecords[existingIndex] = weightRecord;
    } else {
      petData.weightRecords.push(weightRecord);
    }

    updateWeightChart();
  }

  savePetData();
  renderGrowthTimeline();
  closeAddGrowthModal();

  showNotification(currentEditingGrowthId ? '记录已更新' : '记录已添加');
}

function deleteGrowthRecord(id) {
  if (!confirm('确定要删除这条成长记录吗？')) return;

  const index = petData.growthRecords.findIndex(r => r.id === id);
  if (index === -1) return;

  // 如果是体重记录，同时删除体重数组中的记录
  const record = petData.growthRecords[index];
  if (record.type === 'weight') {
    const weightIndex = petData.weightRecords.findIndex(w => w.id === id);
    if (weightIndex >= 0) {
      petData.weightRecords.splice(weightIndex, 1);
      updateWeightChart();
    }
  }

  petData.growthRecords.splice(index, 1);
  savePetData();
  renderGrowthTimeline();

  showNotification('记录已删除');
}

// ========== 照片合集 Tab ==========

function initPhotoFilters() {
  // 生成年份选项
  const years = [...new Set(petData.photos.map(p => new Date(p.date).getFullYear()))].sort((a, b) => b - a);
  const yearSelect = document.getElementById('yearFilter');
  yearSelect.innerHTML = '<option value="">全部年份</option>' +
    years.map(y => `<option value="${y}">${y}年</option>`).join('');

  // 监听筛选变化
  yearSelect.addEventListener('change', renderPhotos);
  document.getElementById('monthFilter').addEventListener('change', renderPhotos);
}

function renderPhotos() {
  const container = document.getElementById('photosContainer');
  const yearFilter = document.getElementById('yearFilter').value;
  const monthFilter = document.getElementById('monthFilter').value;

  let filteredPhotos = petData.photos;

  if (yearFilter) {
    filteredPhotos = filteredPhotos.filter(p => new Date(p.date).getFullYear() == yearFilter);
  }

  if (monthFilter) {
    filteredPhotos = filteredPhotos.filter(p => new Date(p.date).getMonth() + 1 == monthFilter);
  }

  if (filteredPhotos.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-images"></i>
        <p>暂无照片</p>
      </div>
    `;
    return;
  }

  container.innerHTML = filteredPhotos.map(photo => `
    <div class="photo-item">
      <div class="photo-placeholder">
        <i class="fas fa-image"></i>
        <p>照片占位</p>
      </div>
      <div class="photo-info">
        <div class="photo-date">${formatDate(photo.date)}</div>
        ${photo.caption ? `<div class="photo-caption">${photo.caption}</div>` : ''}
        <div class="photo-actions">
          <button class="like-btn ${photo.liked ? 'liked' : ''}" onclick="togglePhotoLike(${photo.id})">
            <i class="fas fa-heart"></i>
            <span>${photo.likes || 0}</span>
          </button>
          <div>
            <button class="btn btn-sm btn-outline" onclick="deletePhoto(${photo.id})">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </div>
      </div>
    </div>
  `).join('');
}

function addPhoto() {
  document.getElementById('photoDate').value = new Date().toISOString().split('T')[0];
  document.getElementById('photoCaption').value = '';
  showModal('addPhotoModal');
}

function closeAddPhotoModal() {
  hideModal('addPhotoModal');
}

function savePhoto() {
  const date = document.getElementById('photoDate').value;
  const caption = document.getElementById('photoCaption').value;

  if (!date) {
    alert('请选择拍摄日期');
    return;
  }

  petData.photos.push({
    id: Date.now(),
    date,
    caption,
    liked: false,
    likes: 0
  });

  savePetData();
  initPhotoFilters();
  renderPhotos();
  closeAddPhotoModal();

  showNotification('照片已添加');
}

function togglePhotoLike(id) {
  const photo = petData.photos.find(p => p.id === id);
  if (!photo) return;

  photo.liked = !photo.liked;
  photo.likes = photo.liked ? (photo.likes || 0) + 1 : Math.max((photo.likes || 0) - 1, 0);

  savePetData();
  renderPhotos();
}

function deletePhoto(id) {
  if (!confirm('确定要删除这张照片吗？')) return;

  const index = petData.photos.findIndex(p => p.id === id);
  if (index === -1) return;

  petData.photos.splice(index, 1);
  savePetData();
  renderPhotos();

  showNotification('照片已删除');
}

function startSlideshow() {
  alert('幻灯片功能开发中...');
}

// ========== 日常点滴 Tab ==========

function renderCalendar() {
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  document.getElementById('currentMonth').textContent = `${year}年${month + 1}月`;

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const calendar = document.getElementById('calendar');

  // 星期标题
  const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
  let html = weekdays.map(day => `<div class="calendar-header">${day}</div>`).join('');

  // 上个月的日期
  for (let i = firstDay - 1; i >= 0; i--) {
    html += `<div class="calendar-day other-month"><span class="day-number">${daysInPrevMonth - i}</span></div>`;
  }

  // 当月的日期
  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const hasDiary = petData.diaries.some(d => d.date === dateStr);
    const classes = hasDiary ? 'calendar-day has-diary' : 'calendar-day';

    html += `
      <div class="${classes}" onclick="selectDate('${dateStr}')">
        <span class="day-number">${day}</span>
      </div>
    `;
  }

  // 下个月的日期
  const totalCells = Math.ceil((firstDay + daysInMonth) / 7) * 7;
  const remainingCells = totalCells - (firstDay + daysInMonth);
  for (let day = 1; day <= remainingCells; day++) {
    html += `<div class="calendar-day other-month"><span class="day-number">${day}</span></div>`;
  }

  calendar.innerHTML = html;
}

function prevMonth() {
  currentMonth.setMonth(currentMonth.getMonth() - 1);
  renderCalendar();
}

function nextMonth() {
  currentMonth.setMonth(currentMonth.getMonth() + 1);
  renderCalendar();
}

function selectDate(dateStr) {
  const diary = petData.diaries.find(d => d.date === dateStr);
  if (diary) {
    editDiary(diary.id);
  } else {
    addDiary(dateStr);
  }
}

function renderDiaryList() {
  const container = document.getElementById('diaryList');
  const diaries = petData.diaries.sort((a, b) => new Date(b.date) - new Date(a.date));

  if (diaries.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-book"></i>
        <p>暂无日记，点击上方按钮添加</p>
      </div>
    `;
    return;
  }

  container.innerHTML = diaries.map(diary => `
    <div class="diary-item">
      <div class="diary-item-header">
        <div>
          <div class="diary-item-date">${formatDate(diary.date)}</div>
          ${diary.title ? `<div class="diary-item-title">${diary.title}</div>` : ''}
        </div>
      </div>
      <div class="diary-item-content">${diary.content}</div>
      ${diary.tags && diary.tags.length > 0 ? `
        <div class="diary-item-tags">
          ${diary.tags.map(tag => `<span class="diary-tag">${tag}</span>`).join('')}
        </div>
      ` : ''}
      <div class="diary-item-actions">
        <button class="btn btn-sm btn-outline" onclick="editDiary(${diary.id})">
          <i class="fas fa-edit"></i> 编辑
        </button>
        <button class="btn btn-sm btn-outline" onclick="deleteDiary(${diary.id})">
          <i class="fas fa-trash"></i> 删除
        </button>
      </div>
    </div>
  `).join('');
}

function addDiary(defaultDate) {
  currentEditingDiaryId = null;
  document.getElementById('diaryModalTitle').textContent = '添加日记';
  document.getElementById('diaryDate').value = defaultDate || new Date().toISOString().split('T')[0];
  document.getElementById('diaryTitle').value = '';
  document.getElementById('diaryContent').value = '';
  document.getElementById('diaryTags').value = '';
  showModal('addDiaryModal');
}

function editDiary(id) {
  const diary = petData.diaries.find(d => d.id === id);
  if (!diary) return;

  currentEditingDiaryId = id;
  document.getElementById('diaryModalTitle').textContent = '编辑日记';
  document.getElementById('diaryDate').value = diary.date;
  document.getElementById('diaryTitle').value = diary.title || '';
  document.getElementById('diaryContent').value = diary.content;
  document.getElementById('diaryTags').value = diary.tags ? diary.tags.join(',') : '';
  showModal('addDiaryModal');
}

function closeAddDiaryModal() {
  hideModal('addDiaryModal');
  currentEditingDiaryId = null;
}

function saveDiary() {
  const date = document.getElementById('diaryDate').value;
  const title = document.getElementById('diaryTitle').value;
  const content = document.getElementById('diaryContent').value;
  const tagsInput = document.getElementById('diaryTags').value;

  if (!date || !content) {
    alert('请填写日期和内容');
    return;
  }

  const tags = tagsInput ? tagsInput.split(',').map(t => t.trim()).filter(t => t) : [];

  const diary = {
    id: currentEditingDiaryId || Date.now(),
    date,
    title,
    content,
    tags
  };

  if (currentEditingDiaryId) {
    const index = petData.diaries.findIndex(d => d.id === currentEditingDiaryId);
    petData.diaries[index] = diary;
  } else {
    petData.diaries.push(diary);
  }

  savePetData();
  renderCalendar();
  renderDiaryList();
  closeAddDiaryModal();

  showNotification(currentEditingDiaryId ? '日记已更新' : '日记已添加');
}

function deleteDiary(id) {
  if (!confirm('确定要删除这篇日记吗？')) return;

  const index = petData.diaries.findIndex(d => d.id === id);
  if (index === -1) return;

  petData.diaries.splice(index, 1);
  savePetData();
  renderCalendar();
  renderDiaryList();

  showNotification('日记已删除');
}

function searchDiary() {
  const keyword = document.getElementById('diarySearch').value.toLowerCase();
  if (!keyword) {
    renderDiaryList();
    return;
  }

  const filtered = petData.diaries.filter(d =>
    d.content.toLowerCase().includes(keyword) ||
    (d.title && d.title.toLowerCase().includes(keyword)) ||
    (d.tags && d.tags.some(t => t.toLowerCase().includes(keyword)))
  );

  const container = document.getElementById('diaryList');

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-search"></i>
        <p>未找到相关日记</p>
      </div>
    `;
    return;
  }

  container.innerHTML = filtered.map(diary => `
    <div class="diary-item">
      <div class="diary-item-header">
        <div>
          <div class="diary-item-date">${formatDate(diary.date)}</div>
          ${diary.title ? `<div class="diary-item-title">${diary.title}</div>` : ''}
        </div>
      </div>
      <div class="diary-item-content">${diary.content}</div>
      ${diary.tags && diary.tags.length > 0 ? `
        <div class="diary-item-tags">
          ${diary.tags.map(tag => `<span class="diary-tag">${tag}</span>`).join('')}
        </div>
      ` : ''}
      <div class="diary-item-actions">
        <button class="btn btn-sm btn-outline" onclick="editDiary(${diary.id})">
          <i class="fas fa-edit"></i> 编辑
        </button>
        <button class="btn btn-sm btn-outline" onclick="deleteDiary(${diary.id})">
          <i class="fas fa-trash"></i> 删除
        </button>
      </div>
    </div>
  `).join('');
}

// ========== 导出/导入 ==========

function exportPetData() {
  const dataStr = JSON.stringify(petData, null, 2);
  const blob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `宠物数据_${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);

  showNotification('数据已导出');
}

function importPetData() {
  const input = document.getElementById('importFileInput');
  input.click();

  input.onchange = function(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(event) {
      try {
        const imported = JSON.parse(event.target.result);

        if (!confirm('导入数据将覆盖当前所有数据，确定继续吗？')) return;

        petData = imported;
        savePetData();

        // 重新渲染所有内容
        renderProfile();
        updateWeightChart();
        renderTags();
        renderGrowthTimeline();
        renderPhotos();
        renderCalendar();
        renderDiaryList();
        initPhotoFilters();

        showNotification('数据已导入');
      } catch (error) {
        alert('导入失败：文件格式错误');
        console.error(error);
      }
    };
    reader.readAsText(file);
  };
}

// ========== 工具函数 ==========

// 显示模态框
function showModal(modalId) {
  const backdrop = document.getElementById(modalId);
  const modal = backdrop.querySelector('.modal');
  backdrop.classList.add('active');
  modal.classList.add('active');
}

// 隐藏模态框
function hideModal(modalId) {
  const backdrop = document.getElementById(modalId);
  const modal = backdrop.querySelector('.modal');
  backdrop.classList.remove('active');
  modal.classList.remove('active');
}

function formatDate(dateStr) {
  const date = new Date(dateStr);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}年${month}月${day}日`;
}

function showNotification(message) {
  // 简单的通知实现
  const notification = document.createElement('div');
  notification.textContent = message;
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: #4caf50;
    color: white;
    padding: 1rem 1.5rem;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    z-index: 10000;
    animation: slideIn 0.3s ease;
  `;

  document.body.appendChild(notification);

  setTimeout(() => {
    notification.style.animation = 'slideOut 0.3s ease';
    setTimeout(() => {
      document.body.removeChild(notification);
    }, 300);
  }, 2000);
}

function goBack() {
  window.location.href = '../nav.html';
}

function setupEventListeners() {
  // 点击模态框背景关闭
  document.querySelectorAll('.modal-backdrop').forEach(backdrop => {
    backdrop.addEventListener('click', function(e) {
      if (e.target === this) {
        const modal = this.querySelector('.modal');
        this.classList.remove('active');
        modal.classList.remove('active');
      }
    });
  });
}

// 添加CSS动画
const style = document.createElement('style');
style.textContent = `
  @keyframes slideIn {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }

  @keyframes slideOut {
    from {
      transform: translateX(0);
      opacity: 1;
    }
    to {
      transform: translateX(100%);
      opacity: 0;
    }
  }
`;
document.head.appendChild(style);
