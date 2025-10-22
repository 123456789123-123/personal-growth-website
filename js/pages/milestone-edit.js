/**
 * 编辑里程碑页面逻辑
 */

let currentMilestone = null;
let hobbyId = null;
let milestoneId = null;

// ========== 页面初始化 ==========
document.addEventListener('DOMContentLoaded', () => {
  initPage();
  bindEvents();
});

// ========== 初始化页面 ==========
function initPage() {
  const urlParams = new URLSearchParams(window.location.search);
  hobbyId = urlParams.get('hobbyId');
  milestoneId = urlParams.get('milestoneId');

  if (!hobbyId || !milestoneId) {
    showToast('缺少必要参数', 'error');
    setTimeout(() => {
      window.location.href = 'hobbies.html';
    }, 1500);
    return;
  }

  const hobby = StorageManager.getHobbies().find(h => h.id === hobbyId);
  if (!hobby) {
    showToast('未找到对应的兴趣爱好', 'error');
    setTimeout(() => {
      window.location.href = 'hobbies.html';
    }, 1500);
    return;
  }

  currentMilestone = (hobby.milestones || []).find(m => m.id === milestoneId);
  if (!currentMilestone) {
    showToast('未找到该里程碑', 'error');
    setTimeout(() => {
      window.location.href = `hobby-detail.html?id=${hobbyId}`;
    }, 1500);
    return;
  }

  fillForm();
}

// ========== 填充表单数据 ==========
function fillForm() {
  document.getElementById('milestoneDate').value = currentMilestone.date || '';
  document.getElementById('milestoneTitle').value = currentMilestone.title || '';
  document.getElementById('description').value = currentMilestone.description || '';
}

// ========== 绑定事件 ==========
function bindEvents() {
  // 表单提交
  const form = document.getElementById('milestoneForm');
  if (form) {
    form.addEventListener('submit', handleSubmit);
  }

  // 返回按钮
  const backBtn = document.getElementById('backBtn');
  if (backBtn) {
    backBtn.addEventListener('click', () => {
      window.location.href = `hobby-detail.html?id=${hobbyId}`;
    });
  }

  // 取消按钮
  const cancelBtn = document.getElementById('cancelBtn');
  if (cancelBtn) {
    cancelBtn.addEventListener('click', () => {
      window.location.href = `hobby-detail.html?id=${hobbyId}`;
    });
  }
}

// ========== 处理表单提交 ==========
function handleSubmit(e) {
  e.preventDefault();

  const updates = {
    date: document.getElementById('milestoneDate').value,
    title: document.getElementById('milestoneTitle').value.trim(),
    description: document.getElementById('description').value.trim()
  };

  // 验证必填字段
  if (!updates.date) {
    showToast('请选择时间点', 'error');
    return;
  }

  if (!updates.title) {
    showToast('请输入标题', 'error');
    return;
  }

  // 获取当前兴趣爱好
  const hobby = StorageManager.getHobbies().find(h => h.id === hobbyId);
  if (!hobby) {
    showToast('未找到对应的兴趣爱好', 'error');
    return;
  }

  // 更新里程碑
  const milestoneIndex = hobby.milestones.findIndex(m => m.id === milestoneId);
  if (milestoneIndex === -1) {
    showToast('未找到该里程碑', 'error');
    return;
  }

  hobby.milestones[milestoneIndex] = { ...hobby.milestones[milestoneIndex], ...updates };

  // 保存更新
  try {
    if (StorageManager.updateHobby(hobbyId, { milestones: hobby.milestones })) {
      showToast('更新成功', 'success');
      setTimeout(() => {
        window.location.href = `hobby-detail.html?id=${hobbyId}#timeline`;
      }, 1000);
    } else {
      throw new Error('更新失败');
    }
  } catch (error) {
    console.error('更新失败:', error);
    showToast('更新失败，请重试', 'error');
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
