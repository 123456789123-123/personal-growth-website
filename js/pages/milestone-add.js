/**
 * 添加里程碑页面逻辑
 */

let hobbyId = null;

// ========== 页面初始化 ==========
document.addEventListener('DOMContentLoaded', () => {
  initPage();
  bindEvents();
});

// ========== 初始化页面 ==========
function initPage() {
  const urlParams = new URLSearchParams(window.location.search);
  hobbyId = urlParams.get('hobbyId');

  if (!hobbyId) {
    showToast('缺少兴趣爱好ID', 'error');
    setTimeout(() => {
      window.location.href = 'hobbies.html';
    }, 1500);
    return;
  }

  // 设置默认日期为今天
  const dateInput = document.getElementById('milestoneDate');
  if (dateInput) {
    const today = new Date().toISOString().split('T')[0];
    dateInput.value = today;
  }
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

  const milestoneData = {
    id: StorageManager.generateId(),
    date: document.getElementById('milestoneDate').value,
    title: document.getElementById('milestoneTitle').value.trim(),
    description: document.getElementById('description').value.trim()
  };

  // 验证必填字段
  if (!milestoneData.date) {
    showToast('请选择时间点', 'error');
    return;
  }

  if (!milestoneData.title) {
    showToast('请输入标题', 'error');
    return;
  }

  // 获取当前兴趣爱好
  const hobby = StorageManager.getHobbies().find(h => h.id === hobbyId);
  if (!hobby) {
    showToast('未找到对应的兴趣爱好', 'error');
    return;
  }

  // 添加里程碑
  if (!hobby.milestones) hobby.milestones = [];
  hobby.milestones.push(milestoneData);

  // 保存更新
  try {
    if (StorageManager.updateHobby(hobbyId, { milestones: hobby.milestones })) {
      showToast('添加成功', 'success');
      setTimeout(() => {
        window.location.href = `hobby-detail.html?id=${hobbyId}#timeline`;
      }, 1000);
    } else {
      throw new Error('保存失败');
    }
  } catch (error) {
    console.error('保存失败:', error);
    showToast('保存失败，请重试', 'error');
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
