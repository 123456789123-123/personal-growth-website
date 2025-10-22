/**
 * 兴趣详情页面逻辑
 */

let currentHobby = null;
let currentTab = 'intro';

// ========== 页面初始化 ==========
document.addEventListener('DOMContentLoaded', () => {
  initPage();
  bindEvents();
});

// ========== 初始化页面 ==========
function initPage() {
  const urlParams = new URLSearchParams(window.location.search);
  const hobbyId = urlParams.get('id');

  if (!hobbyId) {
    showToast('缺少兴趣爱好ID', 'error');
    setTimeout(() => {
      window.location.href = 'hobbies.html';
    }, 1500);
    return;
  }

  currentHobby = StorageManager.getHobbies().find(h => h.id === hobbyId);

  if (!currentHobby) {
    showToast('未找到该兴趣爱好', 'error');
    setTimeout(() => {
      window.location.href = 'hobbies.html';
    }, 1500);
    return;
  }

  // 初始化作品和里程碑数组（如果不存在）
  if (!currentHobby.works) currentHobby.works = [];
  if (!currentHobby.milestones) currentHobby.milestones = [];

  renderPage();
}

// ========== 渲染页面 ==========
function renderPage() {
  // 设置标题
  document.getElementById('hobbyTitle').textContent = currentHobby.name;

  // 渲染详细介绍Tab
  renderIntroTab();

  // 渲染作品Tab
  renderWorksTab();

  // 渲染时间轴Tab
  renderTimelineTab();
}

// ========== 渲染详细介绍Tab ==========
function renderIntroTab() {
  // 封面图片
  const coverImage = document.getElementById('coverImage');
  if (coverImage) {
    coverImage.src = currentHobby.coverImage || StorageManager.getPlaceholderImage(800, 400);
  }

  // 开始时间
  const startDateElement = document.getElementById('startDate');
  if (startDateElement) {
    startDateElement.textContent = formatDate(currentHobby.startDate);
  }

  // 持续时间
  const durationElement = document.getElementById('duration');
  if (durationElement) {
    durationElement.textContent = calculateDuration(currentHobby.startDate);
  }

  // 详细内容
  const detailContent = document.getElementById('detailContent');
  if (detailContent) {
    if (currentHobby.detailContent) {
      detailContent.innerHTML = `<p style="white-space: pre-wrap;">${currentHobby.detailContent}</p>`;
    } else {
      detailContent.innerHTML = '<p class="empty-hint">暂无详细介绍</p>';
    }
  }
}

// ========== 渲染作品Tab ==========
function renderWorksTab() {
  const worksGrid = document.getElementById('worksGrid');
  const worksEmpty = document.getElementById('worksEmpty');
  const works = currentHobby.works || [];

  if (works.length === 0) {
    worksGrid.innerHTML = '';
    worksEmpty.hidden = false;
    return;
  }

  worksEmpty.hidden = true;
  worksGrid.innerHTML = works.map(work => `
    <div class="work-card" onclick="goToWorkDetail('${work.id}')">
      <img
        src="${work.image || StorageManager.getPlaceholderImage(400, 300)}"
        alt="${work.title}"
        class="work-card__image"
      >
      <div class="work-card__content">
        <h4 class="work-card__title">${work.title}</h4>
        <div class="work-card__date">
          <i class="fas fa-calendar-alt"></i>
          ${formatDate(work.createDate)}
        </div>
      </div>
    </div>
  `).join('');
}

// ========== 渲染时间轴Tab ==========
function renderTimelineTab() {
  const timelineContainer = document.getElementById('timelineContainer');
  const timelineEmpty = document.getElementById('timelineEmpty');
  const milestones = currentHobby.milestones || [];

  if (milestones.length === 0) {
    timelineContainer.innerHTML = '';
    timelineEmpty.hidden = false;
    return;
  }

  // 按日期排序（最新的在前）
  const sortedMilestones = [...milestones].sort((a, b) => {
    return new Date(b.date) - new Date(a.date);
  });

  timelineEmpty.hidden = true;
  timelineContainer.innerHTML = sortedMilestones.map(milestone => `
    <div class="timeline-item">
      <div class="timeline-dot"></div>
      <div class="timeline-content">
        <div class="timeline-date">
          <i class="fas fa-calendar-alt"></i>
          ${formatDate(milestone.date)}
        </div>
        <h4 class="timeline-title">${milestone.title}</h4>
        ${milestone.description ? `<p class="timeline-desc">${milestone.description}</p>` : ''}
        <div class="timeline-actions">
          <button class="btn btn-outline btn-sm" onclick="editMilestone('${milestone.id}')">
            <i class="fas fa-edit"></i>
            编辑
          </button>
          <button class="btn btn-outline btn-sm" onclick="deleteMilestone('${milestone.id}')">
            <i class="fas fa-trash"></i>
            删除
          </button>
        </div>
      </div>
    </div>
  `).join('');
}

// ========== 绑定事件 ==========
function bindEvents() {
  // Tab 切换
  const tabBtns = document.querySelectorAll('.tab-btn');
  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      switchTab(btn.dataset.tab);
    });
  });

  // 编辑按钮
  const editBtn = document.getElementById('editBtn');
  if (editBtn) {
    editBtn.addEventListener('click', () => {
      window.location.href = `hobby-edit.html?id=${currentHobby.id}`;
    });
  }

  // 删除按钮
  const deleteBtn = document.getElementById('deleteBtn');
  if (deleteBtn) {
    deleteBtn.addEventListener('click', showDeleteModal);
  }

  // 删除确认模态框
  const deleteModal = document.getElementById('deleteModal');
  const closeDeleteModal = document.getElementById('closeDeleteModal');
  const cancelDelete = document.getElementById('cancelDelete');
  const confirmDelete = document.getElementById('confirmDelete');

  if (closeDeleteModal) {
    closeDeleteModal.addEventListener('click', hideDeleteModal);
  }

  if (cancelDelete) {
    cancelDelete.addEventListener('click', hideDeleteModal);
  }

  if (confirmDelete) {
    confirmDelete.addEventListener('click', handleDelete);
  }

  // 点击模态框背景关闭
  if (deleteModal) {
    deleteModal.addEventListener('click', (e) => {
      if (e.target === deleteModal) {
        hideDeleteModal();
      }
    });
  }

  // 添加作品按钮
  const addWorkBtn = document.getElementById('addWorkBtn');
  if (addWorkBtn) {
    addWorkBtn.addEventListener('click', () => {
      window.location.href = `work-add.html?hobbyId=${currentHobby.id}`;
    });
  }

  // 添加里程碑按钮
  const addMilestoneBtn = document.getElementById('addMilestoneBtn');
  if (addMilestoneBtn) {
    addMilestoneBtn.addEventListener('click', () => {
      window.location.href = `milestone-add.html?hobbyId=${currentHobby.id}`;
    });
  }
}

// ========== Tab 切换 ==========
function switchTab(tabName) {
  currentTab = tabName;

  // 更新Tab按钮状态
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tab === tabName);
  });

  // 更新Tab内容显示
  document.querySelectorAll('.tab-content').forEach(content => {
    content.classList.toggle('active', content.id === `${tabName}Tab`);
  });
}

// ========== 跳转到作品详情 ==========
function goToWorkDetail(workId) {
  window.location.href = `work-detail.html?hobbyId=${currentHobby.id}&workId=${workId}`;
}

// ========== 编辑里程碑 ==========
function editMilestone(milestoneId) {
  window.location.href = `milestone-edit.html?hobbyId=${currentHobby.id}&milestoneId=${milestoneId}`;
}

// ========== 删除里程碑 ==========
function deleteMilestone(milestoneId) {
  if (!confirm('确定要删除这个里程碑吗？')) return;

  const updatedMilestones = currentHobby.milestones.filter(m => m.id !== milestoneId);

  if (StorageManager.updateHobby(currentHobby.id, { milestones: updatedMilestones })) {
    currentHobby.milestones = updatedMilestones;
    renderTimelineTab();
    showToast('删除成功', 'success');
  } else {
    showToast('删除失败', 'error');
  }
}

// ========== 显示删除模态框 ==========
function showDeleteModal() {
  console.log('showDeleteModal 被调用');
  const modal = document.getElementById('deleteModal');
  console.log('模态框元素:', modal);
  if (modal) {
    modal.classList.add('active');
    console.log('已添加 active 类');
    console.log('模态框 display:', window.getComputedStyle(modal).display);
  } else {
    console.error('找不到 deleteModal 元素！');
  }
}

// ========== 隐藏删除模态框 ==========
function hideDeleteModal() {
  const modal = document.getElementById('deleteModal');
  if (modal) {
    modal.classList.remove('active');
  }
}

// ========== 处理删除 ==========
function handleDelete() {
  if (StorageManager.deleteHobby(currentHobby.id)) {
    showToast('删除成功', 'success');
    setTimeout(() => {
      window.location.href = 'hobbies.html';
    }, 1000);
  } else {
    showToast('删除失败', 'error');
    hideDeleteModal();
  }
}

// ========== 工具函数：格式化日期 ==========
function formatDate(dateStr) {
  if (!dateStr) return '-';

  const date = new Date(dateStr);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

// ========== 工具函数：计算持续时间 ==========
function calculateDuration(startDate) {
  if (!startDate) return '未知';

  const start = new Date(startDate);
  const now = new Date();
  const years = now.getFullYear() - start.getFullYear();
  const months = now.getMonth() - start.getMonth();

  let totalMonths = years * 12 + months;

  if (totalMonths < 1) {
    return '不到1个月';
  } else if (totalMonths < 12) {
    return `${totalMonths}个月`;
  } else {
    const y = Math.floor(totalMonths / 12);
    const m = totalMonths % 12;
    return m > 0 ? `${y}年${m}个月` : `${y}年`;
  }
}

// ========== Toast 提示 ==========
function showToast(message, type = 'success') {
  const toast = document.getElementById('toast');
  if (!toast) return;

  toast.textContent = message;
  toast.className = `toast ${type} show`;

  setTimeout(() => {
    toast.className = 'toast';
  }, 3000);
}
