/**
 * 作品详情页面逻辑
 */

let currentWork = null;
let hobbyId = null;
let workId = null;

// ========== 页面初始化 ==========
document.addEventListener('DOMContentLoaded', () => {
  initPage();
  bindEvents();
});

// ========== 初始化页面 ==========
function initPage() {
  const urlParams = new URLSearchParams(window.location.search);
  hobbyId = urlParams.get('hobbyId');
  workId = urlParams.get('workId');

  if (!hobbyId || !workId) {
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

  currentWork = (hobby.works || []).find(w => w.id === workId);
  if (!currentWork) {
    showToast('未找到该作品', 'error');
    setTimeout(() => {
      window.location.href = `hobby-detail.html?id=${hobbyId}`;
    }, 1500);
    return;
  }

  renderPage();
}

// ========== 渲染页面 ==========
function renderPage() {
  // 设置标题
  document.getElementById('workTitle').textContent = currentWork.title;

  // 作品图片
  const workImage = document.getElementById('workImage');
  if (workImage) {
    workImage.src = currentWork.image || StorageManager.getPlaceholderImage(800, 600);
  }

  // 创作时间
  const createDate = document.getElementById('createDate');
  if (createDate) {
    createDate.textContent = formatDate(currentWork.createDate);
  }

  // 作品描述
  const description = document.getElementById('description');
  if (description) {
    if (currentWork.description) {
      description.innerHTML = `<p style="white-space: pre-wrap;">${currentWork.description}</p>`;
    } else {
      description.innerHTML = '<p class="empty-hint">暂无描述</p>';
    }
  }
}

// ========== 绑定事件 ==========
function bindEvents() {
  // 返回按钮
  const backBtn = document.getElementById('backBtn');
  if (backBtn) {
    backBtn.addEventListener('click', () => {
      window.location.href = `hobby-detail.html?id=${hobbyId}`;
    });
  }

  // 编辑按钮
  const editBtn = document.getElementById('editBtn');
  if (editBtn) {
    editBtn.addEventListener('click', () => {
      window.location.href = `work-edit.html?hobbyId=${hobbyId}&workId=${workId}`;
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
}

// ========== 显示删除模态框 ==========
function showDeleteModal() {
  const modal = document.getElementById('deleteModal');
  if (modal) {
    modal.classList.add('active');
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
  const hobby = StorageManager.getHobbies().find(h => h.id === hobbyId);
  if (!hobby) {
    showToast('未找到对应的兴趣爱好', 'error');
    hideDeleteModal();
    return;
  }

  const updatedWorks = hobby.works.filter(w => w.id !== workId);

  if (StorageManager.updateHobby(hobbyId, { works: updatedWorks })) {
    showToast('删除成功', 'success');
    setTimeout(() => {
      window.location.href = `hobby-detail.html?id=${hobbyId}`;
    }, 1000);
  } else {
    showToast('删除失败', 'error');
    hideDeleteModal();
  }
}

// ========== 格式化日期 ==========
function formatDate(dateStr) {
  if (!dateStr) return '-';

  const date = new Date(dateStr);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
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
