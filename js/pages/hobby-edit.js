/**
 * 编辑兴趣爱好页面逻辑
 */

let currentHobby = null;
let currentImage = null;

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

  // 填充表单数据
  fillForm();
}

// ========== 填充表单数据 ==========
function fillForm() {
  document.getElementById('hobbyName').value = currentHobby.name || '';
  document.getElementById('shortDesc').value = currentHobby.shortDesc || '';
  document.getElementById('startDate').value = currentHobby.startDate || '';
  document.getElementById('detailContent').value = currentHobby.detailContent || '';

  // 显示封面图片
  if (currentHobby.coverImage) {
    currentImage = currentHobby.coverImage;
    updateImagePreview(currentImage);
  }
}

// ========== 绑定事件 ==========
function bindEvents() {
  // 表单提交
  const form = document.getElementById('hobbyForm');
  if (form) {
    form.addEventListener('submit', handleSubmit);
  }

  // 返回按钮
  const backBtn = document.getElementById('backBtn');
  if (backBtn) {
    backBtn.addEventListener('click', () => {
      window.location.href = `hobby-detail.html?id=${currentHobby.id}`;
    });
  }

  // 取消按钮
  const cancelBtn = document.getElementById('cancelBtn');
  if (cancelBtn) {
    cancelBtn.addEventListener('click', () => {
      window.location.href = `hobby-detail.html?id=${currentHobby.id}`;
    });
  }

  // 图片上传相关
  const selectImageBtn = document.getElementById('selectImageBtn');
  const imageInput = document.getElementById('imageInput');
  const usePlaceholderBtn = document.getElementById('usePlaceholderBtn');
  const removeImageBtn = document.getElementById('removeImageBtn');

  if (selectImageBtn && imageInput) {
    selectImageBtn.addEventListener('click', () => {
      imageInput.click();
    });

    imageInput.addEventListener('change', handleImageSelect);
  }

  if (usePlaceholderBtn) {
    usePlaceholderBtn.addEventListener('click', usePlaceholderImage);
  }

  if (removeImageBtn) {
    removeImageBtn.addEventListener('click', removeImage);
  }
}

// ========== 处理图片选择 ==========
function handleImageSelect(e) {
  const file = e.target.files[0];
  if (!file) return;

  if (!file.type.startsWith('image/')) {
    showToast('请选择图片文件', 'error');
    return;
  }

  if (file.size > 2 * 1024 * 1024) {
    showToast('图片大小不能超过2MB，请选择更小的图片', 'error');
    return;
  }

  const reader = new FileReader();
  reader.onload = (event) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;

      const maxSize = 800;
      if (width > maxSize || height > maxSize) {
        if (width > height) {
          height = (height / width) * maxSize;
          width = maxSize;
        } else {
          width = (width / height) * maxSize;
          height = maxSize;
        }
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);

      currentImage = canvas.toDataURL('image/jpeg', 0.7);
      updateImagePreview(currentImage);
    };
    img.src = event.target.result;
  };
  reader.readAsDataURL(file);
}

// ========== 使用占位图 ==========
function usePlaceholderImage() {
  currentImage = StorageManager.getPlaceholderImage(600, 400);
  updateImagePreview(currentImage);
}

// ========== 更新图片预览 ==========
function updateImagePreview(imageSrc) {
  const previewImg = document.getElementById('previewImg');
  const placeholder = document.getElementById('uploadPlaceholder');
  const removeBtn = document.getElementById('removeImageBtn');

  if (previewImg && placeholder) {
    previewImg.src = imageSrc;
    previewImg.hidden = false;
    placeholder.hidden = true;

    if (removeBtn) {
      removeBtn.hidden = false;
    }
  }
}

// ========== 移除图片 ==========
function removeImage() {
  currentImage = null;

  const previewImg = document.getElementById('previewImg');
  const placeholder = document.getElementById('uploadPlaceholder');
  const removeBtn = document.getElementById('removeImageBtn');
  const imageInput = document.getElementById('imageInput');

  if (previewImg && placeholder) {
    previewImg.src = '';
    previewImg.hidden = true;
    placeholder.hidden = false;

    if (removeBtn) {
      removeBtn.hidden = true;
    }

    if (imageInput) {
      imageInput.value = '';
    }
  }
}

// ========== 处理表单提交 ==========
function handleSubmit(e) {
  e.preventDefault();

  const updates = {
    name: document.getElementById('hobbyName').value.trim(),
    coverImage: currentImage || StorageManager.getPlaceholderImage(600, 400),
    shortDesc: document.getElementById('shortDesc').value.trim(),
    startDate: document.getElementById('startDate').value,
    detailContent: document.getElementById('detailContent').value.trim()
  };

  // 验证必填字段
  if (!updates.name) {
    showToast('请输入兴趣名称', 'error');
    return;
  }

  if (!updates.startDate) {
    showToast('请选择开始时间', 'error');
    return;
  }

  // 更新数据
  try {
    if (StorageManager.updateHobby(currentHobby.id, updates)) {
      showToast('更新成功', 'success');
      setTimeout(() => {
        window.location.href = `hobby-detail.html?id=${currentHobby.id}`;
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
