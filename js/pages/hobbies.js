/**
 * 兴趣爱好列表页面逻辑
 */

// ========== 页面初始化 ==========
document.addEventListener('DOMContentLoaded', () => {
  initPage();
  bindEvents();
});

// ========== 初始化页面 ==========
function initPage() {
  renderHobbies();
  updateStats();
}

// ========== 渲染兴趣爱好列表 ==========
function renderHobbies() {
  const hobbies = StorageManager.getHobbies();
  const grid = document.getElementById('hobbiesGrid');
  const emptyState = document.getElementById('emptyState');

  if (!hobbies || hobbies.length === 0) {
    grid.innerHTML = '';
    emptyState.hidden = false;
    return;
  }

  emptyState.hidden = true;
  grid.innerHTML = hobbies.map(hobby => createHobbyCard(hobby)).join('');
}

// ========== 创建兴趣爱好卡片 ==========
function createHobbyCard(hobby) {
  const duration = calculateDuration(hobby.startDate);
  const shortDesc = hobby.shortDesc || '暂无描述';

  return `
    <div class="hobby-card" data-id="${hobby.id}" onclick="goToDetail('${hobby.id}')">
      <img
        src="${hobby.coverImage || StorageManager.getPlaceholderImage(400, 300)}"
        alt="${hobby.name}"
        class="hobby-card__image"
      >
      <div class="hobby-card__content">
        <h3 class="hobby-card__title">${hobby.name}</h3>
        <p class="hobby-card__desc">${shortDesc}</p>
        <div class="hobby-card__footer">
          <i class="fas fa-calendar-alt"></i>
          <span>${duration}</span>
        </div>
      </div>
    </div>
  `;
}

// ========== 计算持续时间 ==========
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

// ========== 跳转到详情页 ==========
function goToDetail(hobbyId) {
  window.location.href = `hobby-detail.html?id=${hobbyId}`;
}

// ========== 更新统计信息 ==========
function updateStats() {
  const hobbies = StorageManager.getHobbies();
  const totalElement = document.getElementById('totalHobbies');

  if (totalElement) {
    totalElement.textContent = hobbies.length;
  }
}

// ========== 绑定事件 ==========
function bindEvents() {
  // 添加兴趣爱好
  const addBtn = document.getElementById('addHobbyBtn');
  if (addBtn) {
    addBtn.addEventListener('click', () => {
      window.location.href = 'hobby-add.html';
    });
  }

  // 导出数据
  const exportBtn = document.getElementById('exportHobbiesBtn');
  if (exportBtn) {
    exportBtn.addEventListener('click', exportHobbies);
  }

  // 导入数据
  const importBtn = document.getElementById('importHobbiesBtn');
  const importFileInput = document.getElementById('importFileInput');

  if (importBtn && importFileInput) {
    importBtn.addEventListener('click', () => {
      importFileInput.click();
    });

    importFileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        importHobbies(file);
      }
    });
  }
}

// ========== 导出兴趣爱好数据 ==========
function exportHobbies() {
  const hobbies = StorageManager.getHobbies();

  if (hobbies.length === 0) {
    showToast('没有可导出的数据', 'error');
    return;
  }

  const dataStr = JSON.stringify(hobbies, null, 2);
  const blob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = `hobbies_${new Date().getTime()}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  showToast('导出成功', 'success');
}

// ========== 导入兴趣爱好数据 ==========
function importHobbies(file) {
  const reader = new FileReader();

  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target.result);

      if (!Array.isArray(data)) {
        throw new Error('数据格式不正确');
      }

      // 确认是否覆盖现有数据
      const currentHobbies = StorageManager.getHobbies();
      if (currentHobbies.length > 0) {
        const confirm = window.confirm('导入将覆盖现有数据，是否继续？');
        if (!confirm) return;
      }

      // 保存数据
      if (StorageManager.setItem(StorageManager.KEYS.HOBBIES, data)) {
        showToast('导入成功', 'success');
        renderHobbies();
        updateStats();
      } else {
        throw new Error('保存失败');
      }
    } catch (error) {
      console.error('导入失败:', error);
      showToast('导入失败：' + error.message, 'error');
    }
  };

  reader.readAsText(file);
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
