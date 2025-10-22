/**
 * 编辑作品页面逻辑
 */

let currentWork = null;
let currentImage = null;
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

  fillForm();
}

// ========== 填充表单数据 ==========
function fillForm() {
  document.getElementById('workTitle').value = currentWork.title || '';
  document.getElementById('createDate').value = currentWork.createDate || '';
  document.getElementById('description').value = currentWork.description || '';

  if (currentWork.image) {
    currentImage = currentWork.image;
    updateImagePreview(currentImage);
  }
}

// ========== 绑定事件 ==========
function bindEvents() {
  const form = document.getElementById('workForm');
  if (form) {
    form.addEventListener('submit', handleSubmit);
  }

  const backBtn = document.getElementById('backBtn');
  if (backBtn) {
    backBtn.addEventListener('click', () => {
      window.location.href = `work-detail.html?hobbyId=${hobbyId}&workId=${workId}`;
    });
  }

  const cancelBtn = document.getElementById('cancelBtn');
  if (cancelBtn) {
    cancelBtn.addEventListener('click', () => {
      window.location.href = `work-detail.html?hobbyId=${hobbyId}&workId=${workId}`;
    });
  }

  const selectImageBtn = document.getElementById('selectImageBtn');
  const imageInput = document.getElementById('imageInput');
  const usePlaceholderBtn = document.getElementById('usePlaceholderBtn');
  const removeImageBtn = document.getElementById('removeImageBtn');

  if (selectImageBtn && imageInput) {
    selectImageBtn.addEventListener('click', () => imageInput.click());
    imageInput.addEventListener('change', handleImageSelect);
  }

  if (usePlaceholderBtn) {
    usePlaceholderBtn.addEventListener('click', usePlaceholderImage);
  }

  if (removeImageBtn) {
    removeImageBtn.addEventListener('click', removeImage);
  }
}

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

function usePlaceholderImage() {
  currentImage = StorageManager.getPlaceholderImage(600, 400);
  updateImagePreview(currentImage);
}

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

function handleSubmit(e) {
  e.preventDefault();

  const updates = {
    title: document.getElementById('workTitle').value.trim(),
    image: currentImage || StorageManager.getPlaceholderImage(600, 400),
    createDate: document.getElementById('createDate').value,
    description: document.getElementById('description').value.trim()
  };

  if (!updates.title) {
    showToast('请输入作品名称', 'error');
    return;
  }

  if (!updates.createDate) {
    showToast('请选择创作时间', 'error');
    return;
  }

  const hobby = StorageManager.getHobbies().find(h => h.id === hobbyId);
  if (!hobby) {
    showToast('未找到对应的兴趣爱好', 'error');
    return;
  }

  const workIndex = hobby.works.findIndex(w => w.id === workId);
  if (workIndex === -1) {
    showToast('未找到该作品', 'error');
    return;
  }

  hobby.works[workIndex] = { ...hobby.works[workIndex], ...updates };

  try {
    if (StorageManager.updateHobby(hobbyId, { works: hobby.works })) {
      showToast('更新成功', 'success');
      setTimeout(() => {
        window.location.href = `work-detail.html?hobbyId=${hobbyId}&workId=${workId}`;
      }, 1000);
    } else {
      throw new Error('更新失败');
    }
  } catch (error) {
    console.error('更新失败:', error);
    showToast('更新失败，请重试', 'error');
  }
}

function showToast(message, type = 'success') {
  const toast = document.getElementById('toast');
  if (!toast) return;

  toast.textContent = message;
  toast.className = `toast ${type} show`;

  setTimeout(() => {
    toast.className = 'toast';
  }, 3000);
}
