/**
 * 添加兴趣爱好页面逻辑
 */

let currentImage = null;

// ========== 页面初始化 ==========
document.addEventListener('DOMContentLoaded', () => {
  initPage();
  bindEvents();
});

// ========== 初始化页面 ==========
function initPage() {
  // 设置默认日期为今天
  const startDateInput = document.getElementById('startDate');
  if (startDateInput) {
    const today = new Date().toISOString().split('T')[0];
    startDateInput.value = today;
  }
}

// ========== 绑定事件 ==========
function bindEvents() {
  // 表单提交
  const form = document.getElementById('hobbyForm');
  if (form) {
    form.addEventListener('submit', handleSubmit);
  }

  // 取消按钮
  const cancelBtn = document.getElementById('cancelBtn');
  if (cancelBtn) {
    cancelBtn.addEventListener('click', () => {
      window.location.href = 'hobbies.html';
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

  // 检查文件类型
  if (!file.type.startsWith('image/')) {
    showToast('请选择图片文件', 'error');
    return;
  }

  // 检查文件大小（限制2MB）
  if (file.size > 2 * 1024 * 1024) {
    showToast('图片大小不能超过2MB，请选择更小的图片', 'error');
    return;
  }

  const reader = new FileReader();
  reader.onload = (event) => {
    const img = new Image();
    img.onload = () => {
      // 压缩图片
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;

      // 限制最大尺寸
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

      // 转换为base64，质量0.7
      currentImage = canvas.toDataURL('image/jpeg', 0.7);
      updateImagePreview(currentImage);

      console.log('图片处理完成，大小:', Math.round(currentImage.length / 1024), 'KB');
    };
    img.src = event.target.result;
  };
  reader.onerror = () => {
    showToast('图片读取失败', 'error');
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

  const formData = {
    name: document.getElementById('hobbyName').value.trim(),
    coverImage: currentImage || StorageManager.getPlaceholderImage(600, 400),
    shortDesc: document.getElementById('shortDesc').value.trim(),
    startDate: document.getElementById('startDate').value,
    detailContent: document.getElementById('detailContent').value.trim(),
    works: [],
    milestones: []
  };

  // 验证必填字段
  if (!formData.name) {
    showToast('请输入兴趣名称', 'error');
    return;
  }

  if (!formData.startDate) {
    showToast('请选择开始时间', 'error');
    return;
  }

  // 保存到 localStorage
  try {
    // 检查数据大小
    const dataSize = JSON.stringify(formData).length;
    console.log('数据大小:', Math.round(dataSize / 1024), 'KB');

    if (dataSize > 1024 * 1024) { // 超过1MB
      showToast('数据过大，请使用更小的图片或减少文字内容', 'error');
      return;
    }

    if (StorageManager.addHobby(formData)) {
      showToast('添加成功', 'success');
      setTimeout(() => {
        window.location.href = 'hobbies.html';
      }, 1000);
    } else {
      throw new Error('保存失败');
    }
  } catch (error) {
    console.error('保存失败:', error);

    // 检查是否是存储空间不足
    if (error.name === 'QuotaExceededError' || error.code === 22) {
      showToast('存储空间不足，请删除一些数据或使用更小的图片', 'error');
    } else {
      showToast('保存失败：' + (error.message || '未知错误'), 'error');
    }
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
