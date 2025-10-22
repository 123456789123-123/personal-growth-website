/**
 * 旅程详情页脚本
 * 处理旅程详情展示、照片瀑布流、编辑、删除等功能
 */

let currentTripId = null;
let currentTrip = null;
let isEditMode = false;

// ========== 初始化 ==========
document.addEventListener('DOMContentLoaded', () => {
  // 从 URL 获取旅程 ID
  const urlParams = new URLSearchParams(window.location.search);
  currentTripId = urlParams.get('id');

  if (!currentTripId) {
    alert('❌ 缺少旅程ID参数，即将返回旅程列表');
    setTimeout(() => {
      window.location.href = 'trip.html';
    }, 1000);
    return;
  }

  // 获取旅程数据
  currentTrip = StorageManager.getTrip(currentTripId);

  if (!currentTrip) {
    alert('❌ 旅程不存在或已被删除，即将返回旅程列表');
    setTimeout(() => {
      window.location.href = 'trip.html';
    }, 1000);
    return;
  }

  // 初始化页面
  renderTripInfo();
  renderPhotos();

  console.log('✨ 旅程详情页加载完成');
});

// ========== 渲染旅程信息 ==========
function renderTripInfo() {
  const { province, startDate, endDate, description, companions, rating } = currentTrip;

  // 格式化日期
  const start = new Date(startDate).toLocaleDateString('zh-CN');
  const end = new Date(endDate).toLocaleDateString('zh-CN');
  const dateRange = `${start} 至 ${end}`;

  // 格式化评分
  const stars = '★'.repeat(rating || 3) + '☆'.repeat(5 - (rating || 3));

  // 更新 DOM
  document.getElementById('provinceTitle').textContent = province;
  document.getElementById('dateRange').textContent = dateRange;
  document.getElementById('companionsText').textContent = companions || '—';
  document.getElementById('ratingText').textContent = `${stars} (${rating || 3}/5)`;
  document.getElementById('descriptionText').textContent = description || '暂无描述';

  // 初始化编辑表单
  document.getElementById('editProvince').value = province;
  document.getElementById('editStartDate').value = startDate;
  document.getElementById('editEndDate').value = endDate;
  document.getElementById('editCompanions').value = companions || '';
  document.getElementById('editDescription').value = description || '';
  document.getElementById('editRating').value = rating || 3;
  updateEditRatingDisplay();
}

// ========== 切换编辑模式 ==========
function toggleEditMode() {
  isEditMode = !isEditMode;

  const viewMode = document.getElementById('viewMode');
  const editMode = document.getElementById('editMode');
  const editBtn = document.getElementById('editBtn');

  if (isEditMode) {
    viewMode.style.display = 'none';
    editMode.style.display = 'block';
    editBtn.classList.add('active');
  } else {
    viewMode.style.display = 'block';
    editMode.style.display = 'none';
    editBtn.classList.remove('active');
  }
}

// ========== 编辑评分显示更新 ==========
function updateEditRatingDisplay() {
  const rating = parseInt(document.getElementById('editRating')?.value || '3');
  const stars = '★'.repeat(rating) + '☆'.repeat(5 - rating);
  document.getElementById('editRatingDisplay').textContent = `${stars} (${rating}/5)`;
}

document.getElementById('editRating')?.addEventListener('input', updateEditRatingDisplay);

// ========== 保存编辑 ==========
function saveEdit() {
  const form = document.getElementById('editForm');

  if (!form.checkValidity()) {
    alert('请填写所有必填项');
    return;
  }

  const startDate = document.getElementById('editStartDate').value;
  const endDate = document.getElementById('editEndDate').value;
  const companions = document.getElementById('editCompanions').value;
  const description = document.getElementById('editDescription').value;
  const rating = parseInt(document.getElementById('editRating').value);

  // 验证日期逻辑
  if (new Date(endDate) < new Date(startDate)) {
    alert('结束日期不能早于开始日期');
    return;
  }

  // 更新数据
  if (StorageManager.updateTrip(currentTripId, {
    startDate,
    endDate,
    companions,
    description,
    rating
  })) {
    console.log('✓ 旅程已更新');
    alert('✓ 更新成功！');

    // 重新获取数据并刷新页面
    currentTrip = StorageManager.getTrip(currentTripId);
    renderTripInfo();
    toggleEditMode();
  } else {
    alert('✗ 更新失败，请重试');
  }
}

// ========== 删除旅程 ==========
function deleteTrip() {
  const confirmed = confirm('确定要删除这条旅程记录吗？此操作无法撤销。');

  if (!confirmed) {
    return;
  }

  if (StorageManager.deleteTrip(currentTripId)) {
    console.log('✓ 旅程已删除');
    alert('✓ 旅程已删除');
    window.location.href = '../pages/trip.html';
  } else {
    alert('✗ 删除失败，请重试');
  }
}

// ========== 渲染照片瀑布流 ==========
function renderPhotos() {
  const waterfall = document.getElementById('photosWaterfall');
  const emptyState = document.getElementById('emptyState');
  const photoCount = document.getElementById('photoCount');

  // 获取该旅程的所有照片
  const allPhotos = StorageManager.getPhotos();
  const tripPhotos = allPhotos.filter(p => p.tripId === currentTripId);

  // 更新照片计数
  photoCount.textContent = `(${tripPhotos.length})`;

  // 清空容器
  waterfall.innerHTML = '';

  if (tripPhotos.length === 0) {
    emptyState.style.display = 'block';
    return;
  }

  emptyState.style.display = 'none';

  // 渲染照片卡片
  tripPhotos.forEach(photo => {
    const photoItem = createPhotoItem(photo);
    waterfall.appendChild(photoItem);
  });
}

// ========== 创建照片卡片 ==========
function createPhotoItem(photo) {
  const div = document.createElement('div');
  div.className = 'photo-item';

  const imageWrapper = document.createElement('div');
  imageWrapper.className = 'photo-image-wrapper';

  const img = document.createElement('img');
  img.src = photo.image;
  img.alt = photo.title || '照片';
  img.className = 'photo-image';

  const actions = document.createElement('div');
  actions.className = 'photo-actions';

  const viewBtn = document.createElement('button');
  viewBtn.className = 'photo-action-btn';
  viewBtn.innerHTML = '<i class="fas fa-expand"></i>';
  viewBtn.title = '查看';
  viewBtn.onclick = (e) => {
    e.stopPropagation();
    openLightbox(photo);
  };

  const likeBtn = document.createElement('button');
  likeBtn.className = 'photo-action-btn';
  likeBtn.innerHTML = photo.liked ? '<i class="fas fa-heart" style="color: #e74c3c;"></i>' : '<i class="fas fa-heart"></i>';
  likeBtn.title = photo.liked ? '取消点赞' : '点赞';
  likeBtn.style.color = photo.liked ? '#e74c3c' : '#999';
  likeBtn.onclick = (e) => {
    e.stopPropagation();
    togglePhotoLike(photo.id, !photo.liked, likeBtn);
  };

  const deleteBtn = document.createElement('button');
  deleteBtn.className = 'photo-action-btn';
  deleteBtn.innerHTML = '<i class="fas fa-trash"></i>';
  deleteBtn.title = '删除';
  deleteBtn.style.color = '#e74c3c';
  deleteBtn.onclick = (e) => {
    e.stopPropagation();
    deletePhoto(photo.id);
  };

  actions.appendChild(viewBtn);
  actions.appendChild(likeBtn);
  actions.appendChild(deleteBtn);

  imageWrapper.appendChild(img);
  imageWrapper.appendChild(actions);

  const info = document.createElement('div');
  info.className = 'photo-info';

  const title = document.createElement('h4');
  title.className = 'photo-title';
  title.textContent = photo.title || '无标题';

  const meta = document.createElement('p');
  meta.className = 'photo-meta';
  const uploadDate = new Date(photo.createdAt).toLocaleDateString('zh-CN');
  const likeCount = photo.liked ? `💖 ${photo.likes}` : `${photo.likes} 👍`;
  meta.textContent = `${uploadDate} · ${likeCount}`;

  info.appendChild(title);
  info.appendChild(meta);

  div.appendChild(imageWrapper);
  div.appendChild(info);

  return div;
}

// ========== 打开灯箱 ==========
function openLightbox(photo) {
  const lightbox = document.getElementById('photoLightbox');
  document.getElementById('lightboxImage').src = photo.image;
  document.getElementById('lightboxTitle').textContent = photo.title || '无标题';
  document.getElementById('lightboxDescription').textContent = photo.description || '';

  lightbox.style.display = 'flex';
  document.body.style.overflow = 'hidden';
}

// ========== 关闭灯箱 ==========
function closeLightbox() {
  const lightbox = document.getElementById('photoLightbox');
  lightbox.style.display = 'none';
  document.body.style.overflow = '';
}

// ========== 打开添加照片模态框 ==========
function openAddPhotoModal() {
  const modal = document.getElementById('addPhotoModal');
  modal.classList.add('active');
  document.getElementById('photoForm').reset();
}

// ========== 关闭添加照片模态框 ==========
function closeAddPhotoModal() {
  const modal = document.getElementById('addPhotoModal');
  modal.classList.remove('active');
}

// ========== 文件选择事件 ==========
document.getElementById('photoFile')?.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (file) {
    document.getElementById('fileName').textContent = file.name;
  }
});

// ========== 保存照片 ==========
function savePhoto() {
  const fileInput = document.getElementById('photoFile');
  const file = fileInput.files[0];

  if (!file) {
    alert('请选择图片');
    return;
  }

  // 验证文件类型
  if (!file.type.startsWith('image/')) {
    alert('请选择图片文件');
    return;
  }

  // 验证文件大小（限制 5MB）
  const maxSize = 5 * 1024 * 1024;
  if (file.size > maxSize) {
    alert('图片大小不能超过 5MB');
    return;
  }

  const title = document.getElementById('photoTitle').value;
  const description = document.getElementById('photoDescription').value;

  // 使用 FileReader 将图片转为 Base64
  const reader = new FileReader();
  reader.onload = async (e) => {
    const defaultCategory = currentTrip?.province ? `旅行/${currentTrip.province}` : '旅行';
    const inferredTags = [
      currentTrip?.province || '',
      currentTrip?.city || '',
      (title || '').trim()
    ].filter(Boolean);

    try {
      const { image, thumbnail } = await prepareTripImageAssets(e.target.result);

    const photoData = {
      tripId: currentTripId,
      title,
      description,
      image,
      thumbnail,
      category: defaultCategory,
      tags: inferredTags
    };

    if (StorageManager.addPhoto(photoData)) {
      console.log('✓ 照片已保存');
      alert('✓ 照片上传成功！');

      // 关闭模态框并重新渲染
      closeAddPhotoModal();
      renderPhotos();
    } else {
      alert('✗ 上传失败，localStorage 可能已满');
    }
    } catch (error) {
      console.error('压缩图片失败', error);
      alert('✘ 处理图片失败，请重试');
    }
  };

  reader.onerror = () => {
    alert('✗ 读取文件失败');
  };

  reader.readAsDataURL(file);
}

// ========== 切换照片点赞 ==========
function togglePhotoLike(photoId, liked, likeBtn) {
  if (StorageManager.updatePhotoLike(photoId, liked)) {
    console.log(`✓ 照片已${liked ? '点赞' : '取消点赞'}`);

    // 更新按钮样式
    if (liked) {
      likeBtn.style.color = '#e74c3c';
      likeBtn.innerHTML = '<i class="fas fa-heart" style="color: #e74c3c;"></i>';
      likeBtn.title = '取消点赞';
    } else {
      likeBtn.style.color = '#999';
      likeBtn.innerHTML = '<i class="fas fa-heart"></i>';
      likeBtn.title = '点赞';
    }

    // 重新渲染照片
    renderPhotos();
  }
}

// ========== 删除照片 ==========
function deletePhoto(photoId) {
  const confirmed = confirm('确定要删除这张照片吗？');

  if (!confirmed) {
    return;
  }

  if (StorageManager.deletePhoto(photoId)) {
    console.log('✓ 照片已删除');
    renderPhotos();
  } else {
    alert('✗ 删除失败，请重试');
  }
}

// ========== 关闭模态框（背景点击） ==========
document.getElementById('addPhotoModal')?.addEventListener('click', (e) => {
  if (e.target.id === 'addPhotoModal') {
    closeAddPhotoModal();
  }
});

async function prepareTripImageAssets(dataUrl) {
  const main = await compressImageData(dataUrl, {
    maxDimension: 1800,
    targetSize: 950_000,
    keepOriginalUnder: 1_200_000,
    initialQuality: 0.92,
    minQuality: 0.78
  });
  const thumbnail = await compressImageData(dataUrl, {
    maxDimension: 600,
    targetSize: 220_000,
    keepOriginalUnder: 250_000,
    initialQuality: 0.85,
    minQuality: 0.7
  });
  return { image: main, thumbnail };
}

function compressImageData(dataUrl, options = {}) {
  const {
    maxDimension = 1600,
    targetSize = 900_000,
    keepOriginalUnder = 1_000_000,
    initialQuality = 0.9,
    minQuality = 0.78,
    qualityStep = 0.05
  } = options;

  const originalSize = getBase64Size(dataUrl);
  if (originalSize <= keepOriginalUnder) {
    return Promise.resolve(dataUrl);
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      let { width, height } = getScaledSize(img.width, img.height, maxDimension);
      let quality = initialQuality;
      let output;
      let outputSize;
      let currentWidth = width;
      let currentHeight = height;

      const render = () => {
        canvas.width = currentWidth;
        canvas.height = currentHeight;
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, currentWidth, currentHeight);
        ctx.drawImage(img, 0, 0, currentWidth, currentHeight);
        output = canvas.toDataURL('image/jpeg', quality);
        outputSize = getBase64Size(output);
      };

      render();

      let attempts = 0;
      while (targetSize && outputSize > targetSize && attempts < 12) {
        attempts += 1;
        if (quality > minQuality) {
          quality = Math.max(minQuality, quality - qualityStep);
        } else if (currentWidth > 720 || currentHeight > 720) {
          currentWidth = Math.round(currentWidth * 0.92);
          currentHeight = Math.round(currentHeight * 0.92);
        } else {
          break;
        }
        render();
      }

      resolve(output);
    };
    img.onerror = reject;
    img.src = dataUrl;
  });
}

function getBase64Size(dataUrl) {
  if (!dataUrl) return 0;
  const base64 = dataUrl.includes(',') ? dataUrl.split(',')[1] : dataUrl;
  return Math.ceil((base64.length * 3) / 4);
}

function getScaledSize(width, height, maxDimension) {
  const maxSide = Math.max(width, height);
  if (maxSide <= maxDimension) {
    return { width, height };
  }
  const ratio = maxDimension / maxSide;
  return {
    width: Math.round(width * ratio),
    height: Math.round(height * ratio)
  };
}

// ========== 关闭灯箱（背景点击） ==========
document.getElementById('photoLightbox')?.addEventListener('click', (e) => {
  if (e.target.id === 'photoLightbox') {
    closeLightbox();
  }
});

// ========== 键盘快捷键 ==========
document.addEventListener('keydown', (e) => {
  // Esc 关闭模态框/灯箱
  if (e.key === 'Escape') {
    closeAddPhotoModal();
    closeLightbox();
  }
});

// ========== 返回 ==========
function goBack() {
  if (window.history.length > 1) {
    window.history.back();
  } else {
    window.location.href = '../pages/trip.html';
  }
}
