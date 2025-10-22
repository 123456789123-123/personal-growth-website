const state = {
  photos: [],
  filtered: [],
  view: 'all',
  category: 'all',
  tags: new Set(),
  chunkSize: 18,
  rendered: 0,
  editingPhotoId: null  // 当前正在编辑的照片 ID
};

let elements = {};
let observer = null;
let fullImageObserver = null;

document.addEventListener('DOMContentLoaded', () => {
  cacheElements();
  bindEvents();
  setupObserver();
  setupImageObserver();
  loadPhotos();
});

function cacheElements() {
  elements = {
    gallery: document.getElementById('galleryGrid'),
    emptyState: document.getElementById('emptyState'),
    loading: document.getElementById('loadingMore'),
    sentinel: document.getElementById('sentinel'),
    viewButtons: document.querySelectorAll('.view-btn'),
    categoryGroup: document.getElementById('categoryChips'),
    tagGroup: document.getElementById('tagChips'),
    clearCategory: document.getElementById('clearCategory'),
    clearTags: document.getElementById('clearTags'),
    uploadModal: document.getElementById('uploadModal'),
    uploadDialog: document.getElementById('uploadModal')?.querySelector('.modal'),
    openUploadModal: document.getElementById('openUploadModal'),
    closeUploadModal: document.getElementById('closeUploadModal'),
    cancelUpload: document.getElementById('cancelUpload'),
    uploadForm: document.getElementById('uploadForm'),
    categoryOptions: document.getElementById('categoryOptions'),
    // 编辑弹窗相关
    editModal: document.getElementById('editModal'),
    editDialog: document.getElementById('editModal')?.querySelector('.modal'),
    closeEditModal: document.getElementById('closeEditModal'),
    cancelEdit: document.getElementById('cancelEdit'),
    editForm: document.getElementById('editForm'),
    editCategoryOptions: document.getElementById('editCategoryOptions'),
    toast: document.getElementById('toast'),
    refreshBtn: document.getElementById('refreshAlbum'),
    totalCount: document.getElementById('totalCount'),
    likedCount: document.getElementById('likedCount'),
    lightbox: document.getElementById('lightbox'),
    lightboxImage: document.getElementById('lightboxImage'),
    lightboxTitle: document.getElementById('lightboxTitle'),
    lightboxMeta: document.getElementById('lightboxMeta'),
    lightboxDescription: document.getElementById('lightboxDescription'),
    lightboxTags: document.getElementById('lightboxTags'),
    lightboxLike: document.getElementById('lightboxLike'),
    lightboxEdit: document.getElementById('lightboxEdit'),
    closeLightbox: document.getElementById('closeLightbox')
  };
}

function bindEvents() {
  elements.viewButtons.forEach((btn) => {
    btn.addEventListener('click', () => setView(btn.dataset.view));
  });

  elements.clearCategory?.addEventListener('click', () => {
    state.category = 'all';
    updateCategoryChips();
    applyFilters();
  });

  elements.clearTags?.addEventListener('click', () => {
    state.tags.clear();
    updateTagChips();
    applyFilters();
  });

  elements.openUploadModal?.addEventListener('click', openUploadModal);
  elements.closeUploadModal?.addEventListener('click', closeUploadModal);
  elements.cancelUpload?.addEventListener('click', closeUploadModal);

  elements.uploadModal?.addEventListener('click', (event) => {
    if (event.target === elements.uploadModal) {
      closeUploadModal();
    }
  });

  elements.uploadForm?.addEventListener('submit', handleUploadSubmit);

  // 编辑弹窗事件
  elements.closeEditModal?.addEventListener('click', closeEditModal);
  elements.cancelEdit?.addEventListener('click', closeEditModal);

  elements.editModal?.addEventListener('click', (event) => {
    if (event.target === elements.editModal) {
      closeEditModal();
    }
  });

  elements.editForm?.addEventListener('submit', handleEditSubmit);

  elements.refreshBtn?.addEventListener('click', () => {
    loadPhotos(true);
  });

  elements.closeLightbox?.addEventListener('click', hideLightbox);

  elements.lightbox?.addEventListener('click', (event) => {
    if (event.target === elements.lightbox) {
      hideLightbox();
    }
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      if (elements.lightbox?.classList.contains('show')) {
        hideLightbox();
      }
      if (elements.uploadModal?.classList.contains('active')) {
        closeUploadModal();
      }
      if (elements.editModal?.classList.contains('active')) {
        closeEditModal();
      }
    }
  });

  elements.lightboxLike?.addEventListener('click', () => {
    const photoId = elements.lightboxLike?.dataset.photoId;
    if (!photoId) return;
    const photo = state.photos.find((item) => item.id === photoId);
    if (!photo) return;
    togglePhotoLike(photo);
  });

  elements.lightboxEdit?.addEventListener('click', () => {
    const photoId = elements.lightboxLike?.dataset.photoId;
    if (!photoId) return;
    const photo = state.photos.find((item) => item.id === photoId);
    if (!photo) return;
    hideLightbox();
    openEditModal(photo);
  });
}

function setupObserver() {
  if (!('IntersectionObserver' in window)) {
    return;
  }

  observer = new IntersectionObserver((entries) => {
    if (entries.some((entry) => entry.isIntersecting)) {
      renderNextChunk();
    }
  }, {
    rootMargin: '0px 0px 200px 0px'
  });

  if (elements.sentinel) {
    observer.observe(elements.sentinel);
  }
}

function setupImageObserver() {
  if (!('IntersectionObserver' in window)) {
    return;
  }

  fullImageObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const img = entry.target;
        const fullSrc = img.dataset.full;
        if (fullSrc && !img.dataset.upgraded) {
          img.src = fullSrc;
          img.dataset.upgraded = 'true';
        }
        fullImageObserver.unobserve(img);
      }
    });
  }, {
    rootMargin: '0px 0px 200px 0px',
    threshold: 0.25
  });
}

function loadPhotos(showToastMessage = false) {
  const photos = StorageManager.getPhotos();
  state.photos = photos.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  buildCategoryChips();
  buildTagChips();
  updateStats();
  applyFilters();

  if (showToastMessage) {
    showToast('相册已刷新', 'info');
  }
}

function updateStats() {
  const total = state.photos.length;
  const liked = state.photos.filter((photo) => photo.liked).length;
  if (elements.totalCount) {
    elements.totalCount.textContent = `${total} 张照片`;
  }
  if (elements.likedCount) {
    elements.likedCount.textContent = `${liked} 张已点赞`;
  }
}

function buildCategoryChips() {
  if (!elements.categoryGroup) return;

  const categories = new Set(['全分类', '未分类']);
  state.photos.forEach((photo) => {
    if (photo.category && photo.category !== '未分类') {
      categories.add(photo.category);
    }
  });

  const categoryItems = Array.from(categories)
    .map((category) => ({
      label: category === '全分类' ? '全部分类' : category,
      value: category === '全分类' ? 'all' : category
    }));

  if (!categoryItems.some((item) => item.value === state.category)) {
    state.category = 'all';
  }

  const fragment = document.createDocumentFragment();

  categoryItems.forEach(({ label, value }) => {
    const chip = createChip({
      label,
      value,
      selected: state.category === value,
      onClick: () => {
        state.category = value;
        updateCategoryChips();
        applyFilters();
      }
    });
    fragment.appendChild(chip);
  });

  elements.categoryGroup.innerHTML = '';
  elements.categoryGroup.appendChild(fragment);

  if (elements.categoryOptions) {
    elements.categoryOptions.innerHTML = '';
    Array.from(categories)
      .filter((value) => value !== '全分类')
      .forEach((value) => {
        const option = document.createElement('option');
        option.value = value;
        elements.categoryOptions.appendChild(option);
      });
  }
}

function updateCategoryChips() {
  elements.categoryGroup?.querySelectorAll('.chip').forEach((chip) => {
    const value = chip.dataset.value;
    if (value === state.category) {
      chip.classList.add('active');
      chip.setAttribute('aria-selected', 'true');
    } else {
      chip.classList.remove('active');
      chip.setAttribute('aria-selected', 'false');
    }
  });
}

function buildTagChips() {
  if (!elements.tagGroup) return;

  const tagMap = new Map();
  state.photos.forEach((photo) => {
    (photo.tags || []).forEach((rawTag) => {
      const tag = rawTag?.trim();
      if (!tag) return;
      const key = normalizeTag(tag);
      if (!tagMap.has(key)) {
        tagMap.set(key, tag);
      }
    });
  });

  const entries = Array.from(tagMap.entries()).sort((a, b) => a[1].localeCompare(b[1], 'zh-Hans-CN'));

  // 移除已选但不存在的标签
  Array.from(state.tags).forEach((tagKey) => {
    if (!entries.some(([key]) => key === tagKey)) {
      state.tags.delete(tagKey);
    }
  });

  const fragment = document.createDocumentFragment();

  entries.forEach(([key, label]) => {
    const chip = createChip({
      label,
      value: key,
      selected: state.tags.has(key),
      onClick: () => {
        if (state.tags.has(key)) {
          state.tags.delete(key);
        } else {
          state.tags.add(key);
        }
        updateTagChips();
        applyFilters();
      }
    });
    fragment.appendChild(chip);
  });

  elements.tagGroup.innerHTML = '';
  elements.tagGroup.appendChild(fragment);
}

function updateTagChips() {
  elements.tagGroup?.querySelectorAll('.chip').forEach((chip) => {
    const value = chip.dataset.value;
    if (state.tags.has(value)) {
      chip.classList.add('active');
      chip.setAttribute('aria-pressed', 'true');
    } else {
      chip.classList.remove('active');
      chip.setAttribute('aria-pressed', 'false');
    }
  });
}

function setView(view) {
  if (state.view === view) return;
  state.view = view;

  elements.viewButtons.forEach((btn) => {
    const isActive = btn.dataset.view === view;
    btn.classList.toggle('active', isActive);
    btn.setAttribute('aria-selected', String(isActive));
  });

  applyFilters();
}

function applyFilters() {
  const normalizedTags = Array.from(state.tags);

  const filtered = state.photos.filter((photo) => {
    if (state.view === 'liked' && !photo.liked) {
      return false;
    }

    const category = photo.category || '未分类';
    if (state.category !== 'all') {
      if (state.category === '未分类') {
        if (category !== '未分类') return false;
      } else if (category !== state.category) {
        return false;
      }
    }

    if (normalizedTags.length) {
      const photoTags = (photo.tags || []).map(normalizeTag);
      const containsAll = normalizedTags.every((tag) => photoTags.includes(tag));
      if (!containsAll) return false;
    }

    return true;
  });

  state.filtered = filtered;
  state.rendered = 0;
  elements.gallery.innerHTML = '';

  updateCategoryChips();
  updateTagChips();

  if (!filtered.length) {
    elements.emptyState?.removeAttribute('hidden');
    elements.loading?.setAttribute('hidden', 'true');
    return;
  }

  elements.emptyState?.setAttribute('hidden', 'true');
  renderNextChunk();
}

function renderNextChunk() {
  if (state.rendered >= state.filtered.length) {
    elements.loading?.setAttribute('hidden', 'true');
    return;
  }

  elements.loading?.removeAttribute('hidden');

  const nextItems = state.filtered.slice(state.rendered, state.rendered + state.chunkSize);
  const fragment = document.createDocumentFragment();

  nextItems.forEach((photo) => {
    fragment.appendChild(createPhotoCard(photo));
  });

  elements.gallery.appendChild(fragment);
  state.rendered += nextItems.length;

  if (state.rendered >= state.filtered.length) {
    elements.loading?.setAttribute('hidden', 'true');
  }
}

function createPhotoCard(photo) {
  const card = document.createElement('article');
  card.className = 'photo-card';

  const thumbnail = document.createElement('div');
  thumbnail.className = 'photo-thumbnail';
  const img = document.createElement('img');
  const previewSrc = photo.thumbnail || photo.image;
  img.src = previewSrc;
  img.dataset.full = photo.image;
  img.alt = photo.title || '相册照片';
  img.loading = 'lazy';
  observeFullImage(img);
  thumbnail.appendChild(img);
  card.appendChild(thumbnail);

  const info = document.createElement('div');
  info.className = 'photo-info';

  const meta = document.createElement('div');
  meta.className = 'photo-meta';
  const categorySpan = document.createElement('span');
  categorySpan.textContent = photo.category || '未分类';
  const dateSpan = document.createElement('span');
  dateSpan.textContent = formatDate(photo.createdAt);
  meta.append(categorySpan, dateSpan);
  info.appendChild(meta);

  const title = document.createElement('h3');
  title.className = 'photo-title';
  title.textContent = photo.title || '无标题';
  info.appendChild(title);

  if (photo.description) {
    const description = document.createElement('p');
    description.className = 'photo-description';
    description.textContent = photo.description;
    info.appendChild(description);
  }

  const tagsContainer = document.createElement('div');
  tagsContainer.className = 'photo-tags';
  (photo.tags || []).forEach((tag) => {
    const tagChip = document.createElement('span');
    tagChip.className = 'photo-tag';
    tagChip.textContent = tag;
    tagsContainer.appendChild(tagChip);
  });
  info.appendChild(tagsContainer);

  const actions = document.createElement('div');
  actions.className = 'photo-actions';

  const actionLeft = document.createElement('div');
  actionLeft.className = 'action-left';
  const likeCount = document.createElement('span');
  likeCount.innerHTML = `<i class="fas fa-heart"></i> ${photo.likes || 0}`;
  actionLeft.appendChild(likeCount);

  const actionRight = document.createElement('div');
  actionRight.className = 'action-right';

  const likeBtn = document.createElement('button');
  likeBtn.className = 'icon-btn';
  likeBtn.setAttribute('aria-label', photo.liked ? '取消点赞' : '点赞');
  likeBtn.innerHTML = '<i class="fas fa-heart"></i>';
  if (photo.liked) {
    likeBtn.classList.add('liked');
  }
  likeBtn.addEventListener('click', (event) => {
    event.stopPropagation();
    togglePhotoLike(photo, likeBtn, likeCount);
  });

  const viewBtn = document.createElement('button');
  viewBtn.className = 'icon-btn';
  viewBtn.setAttribute('aria-label', '查看大图');
  viewBtn.innerHTML = '<i class="fas fa-expand"></i>';
  viewBtn.addEventListener('click', (event) => {
    event.stopPropagation();
    showLightbox(photo);
  });

  const editBtn = document.createElement('button');
  editBtn.className = 'icon-btn';
  editBtn.setAttribute('aria-label', '编辑');
  editBtn.innerHTML = '<i class="fas fa-edit"></i>';
  editBtn.addEventListener('click', (event) => {
    event.stopPropagation();
    openEditModal(photo);
  });

  const deleteBtn = document.createElement('button');
  deleteBtn.className = 'icon-btn icon-btn--danger';
  deleteBtn.setAttribute('aria-label', '删除照片');
  deleteBtn.innerHTML = '<i class="fas fa-trash"></i>';
  deleteBtn.addEventListener('click', (event) => {
    event.stopPropagation();
    deletePhotoFromAlbum(photo.id);
  });

  actionRight.append(likeBtn, viewBtn, editBtn, deleteBtn);
  actions.append(actionLeft, actionRight);
  info.appendChild(actions);

  card.appendChild(info);

  card.addEventListener('click', () => showLightbox(photo));

  return card;
}

function togglePhotoLike(photo, button, likeCountDisplay) {
  const targetLiked = !photo.liked;
  const success = StorageManager.updatePhotoLike(photo.id, targetLiked);

  if (!success) {
    showToast('操作失败，请稍后重试', 'error');
    return;
  }

  if (targetLiked) {
    photo.liked = true;
    photo.likes = (photo.likes || 0) + 1;
  } else {
    photo.liked = false;
    photo.likes = Math.max(0, (photo.likes || 0) - 1);
  }

  if (button) {
    button.classList.toggle('liked', photo.liked);
    button.setAttribute('aria-label', photo.liked ? '取消点赞' : '点赞');
  }

  if (likeCountDisplay) {
    likeCountDisplay.innerHTML = `<i class="fas fa-heart"></i> ${photo.likes || 0}`;
  }

  if (elements.lightboxLike?.dataset.photoId === photo.id) {
    elements.lightboxLike.classList.toggle('liked', photo.liked);
    elements.lightboxLike.setAttribute('aria-label', photo.liked ? '取消点赞' : '点赞');
  }

  updateStats();

  if (state.view === 'liked' && !photo.liked) {
    applyFilters();
  }
}

function deletePhotoFromAlbum(photoId) {
  if (!confirm('确认删除这张照片吗？删除后不可恢复。')) {
    return;
  }

  const success = StorageManager.deletePhoto(photoId);
  if (!success) {
    showToast('删除失败，请稍后再试', 'error');
    return;
  }

  state.photos = state.photos.filter((item) => item.id !== photoId);
  showToast('照片已删除', 'success');
  updateStats();
  buildCategoryChips();
  buildTagChips();
  applyFilters();
}

function showLightbox(photo) {
  if (!elements.lightbox) return;
  elements.lightbox.classList.add('show');
  elements.lightbox.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';

  elements.lightboxImage.src = photo.image;
  elements.lightboxImage.alt = photo.title || '相册照片';
  elements.lightboxTitle.textContent = photo.title || '无标题';
  elements.lightboxMeta.textContent = `${photo.category || '未分类'} · ${formatDate(photo.createdAt)}`;
  elements.lightboxDescription.textContent = photo.description || '这张照片还没有描述。';

  elements.lightboxTags.innerHTML = '';
  (photo.tags || []).forEach((tag) => {
    const chip = document.createElement('span');
    chip.className = 'photo-tag';
    chip.textContent = tag;
    elements.lightboxTags.appendChild(chip);
  });

  elements.lightboxLike.dataset.photoId = photo.id;
  elements.lightboxLike.classList.toggle('liked', photo.liked);
}

function hideLightbox() {
  if (!elements.lightbox) return;
  elements.lightbox.classList.remove('show');
  elements.lightbox.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
}

function observeFullImage(img) {
  if (!fullImageObserver) return;
  fullImageObserver.observe(img);
}

function openUploadModal() {
  if (!elements.uploadModal) return;
  elements.uploadModal.classList.add('active');
  elements.uploadDialog?.classList.add('active');
  elements.uploadModal.setAttribute('aria-hidden', 'false');
  elements.uploadForm?.reset();
  document.body.style.overflow = 'hidden';
}

function closeUploadModal() {
  if (!elements.uploadModal) return;
  elements.uploadModal.classList.remove('active');
  elements.uploadDialog?.classList.remove('active');
  elements.uploadModal.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
}

// ========== 编辑照片功能 ==========

function openEditModal(photo) {
  if (!elements.editModal || !photo) return;

  state.editingPhotoId = photo.id;

  // 填充表单数据
  const titleInput = document.getElementById('editPhotoTitle');
  const categoryInput = document.getElementById('editPhotoCategory');
  const tagsInput = document.getElementById('editPhotoTags');
  const descInput = document.getElementById('editPhotoDescription');

  if (titleInput) titleInput.value = photo.title || '';
  if (categoryInput) categoryInput.value = photo.category || '';
  if (tagsInput) tagsInput.value = Array.isArray(photo.tags) ? photo.tags.join(', ') : '';
  if (descInput) descInput.value = photo.description || '';

  // 更新分类选项
  updateEditCategoryOptions();

  // 显示弹窗
  elements.editModal.classList.add('active');
  elements.editDialog?.classList.add('active');
  elements.editModal.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
}

function closeEditModal() {
  if (!elements.editModal) return;
  elements.editModal.classList.remove('active');
  elements.editDialog?.classList.remove('active');
  elements.editModal.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
  state.editingPhotoId = null;
  elements.editForm?.reset();
}

function updateEditCategoryOptions() {
  if (!elements.editCategoryOptions) return;

  const categories = new Set();
  state.photos.forEach((photo) => {
    if (photo.category && photo.category !== '未分类') {
      categories.add(photo.category);
    }
  });

  elements.editCategoryOptions.innerHTML = '';
  Array.from(categories).forEach((value) => {
    const option = document.createElement('option');
    option.value = value;
    elements.editCategoryOptions.appendChild(option);
  });
}

async function handleEditSubmit(event) {
  event.preventDefault();

  if (!state.editingPhotoId) {
    showToast('无法确定要编辑的照片', 'error');
    return;
  }

  const titleInput = document.getElementById('editPhotoTitle');
  const categoryInput = document.getElementById('editPhotoCategory');
  const tagsInput = document.getElementById('editPhotoTags');
  const descInput = document.getElementById('editPhotoDescription');

  const tags = parseTags(tagsInput?.value || '');
  const category = (categoryInput?.value || '').trim() || '未分类';

  const updates = {
    title: titleInput?.value?.trim() || '',
    description: descInput?.value?.trim() || '',
    category,
    tags
  };

  const success = StorageManager.updatePhoto(state.editingPhotoId, updates);

  if (!success) {
    showToast('更新失败，请稍后重试', 'error');
    return;
  }

  // 更新本地状态
  const photo = state.photos.find(p => p.id === state.editingPhotoId);
  if (photo) {
    Object.assign(photo, updates);
  }

  closeEditModal();
  showToast('照片信息已更新', 'success');

  // 重新构建筛选器并刷新显示
  buildCategoryChips();
  buildTagChips();
  applyFilters();
}

async function handleUploadSubmit(event) {
  event.preventDefault();

  const fileInput = document.getElementById('photoFile');
  const titleInput = document.getElementById('photoTitle');
  const descInput = document.getElementById('photoDescription');
  const categoryInput = document.getElementById('photoCategory');
  const tagsInput = document.getElementById('photoTags');

  if (!fileInput?.files?.length) {
    showToast('请选择要上传的图片', 'error');
    return;
  }

  const file = fileInput.files[0];

  try {
    const { image, thumbnail } = await prepareImageAssets(file);
    const tags = parseTags(tagsInput?.value || '');
    const category = (categoryInput?.value || '').trim() || '未分类';

    const photoData = {
      image,
      thumbnail,
      title: titleInput?.value?.trim() || '',
      description: descInput?.value?.trim() || '',
      category,
      tags,
      liked: false,
      likes: 0
    };

    const success = StorageManager.addPhoto(photoData);
    if (!success) {
      showToast('保存失败，可能是 localStorage 已满', 'error');
      return;
    }

    closeUploadModal();
    showToast('照片上传成功', 'success');
    loadPhotos();
  } catch (error) {
    console.error('读取文件失败', error);
    showToast('读取图片失败，请重试', 'error');
  }
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
}

async function prepareImageAssets(file) {
  const original = await readFileAsDataUrl(file);
  const mimeType = file.type || getMimeTypeFromDataUrl(original);

  const image = await optimizeImageData(original, {
    mimeType,
    maxDimension: 1400,
    keepOriginalUnder: 1_000_000,
    targetSize: 600_000,
    initialQuality: 0.90,
    minQuality: 0.75
  });

  const thumbnail = await optimizeImageData(original, {
    mimeType,
    maxDimension: 400,
    keepOriginalUnder: 150_000,
    targetSize: 90_000,
    initialQuality: 0.88,
    minQuality: 0.72
  });

  return { image, thumbnail };
}

function getMimeTypeFromDataUrl(dataUrl) {
  const match = /^data:(.*?);/i.exec(dataUrl);
  return match ? match[1] : 'image/jpeg';
}

function getBase64Size(dataUrl) {
  if (!dataUrl) return 0;
  const base64 = dataUrl.includes(',') ? dataUrl.split(',')[1] : dataUrl;
  return Math.ceil((base64.length * 3) / 4);
}

async function optimizeImageData(dataUrl, options = {}) {
  const {
    mimeType = 'image/jpeg',
    maxDimension = 1600,
    targetSize = 900_000,
    keepOriginalUnder = 1_000_000,
    initialQuality = 0.92,
    minQuality = 0.78,
    qualityStep = 0.05
  } = options;

  const sourceSize = getBase64Size(dataUrl);
  if (sourceSize <= keepOriginalUnder) {
    return dataUrl;
  }

  const preferredMime = mimeType.includes('png') ? 'image/png' : 'image/jpeg';
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      let { width, height } = getScaledSize(img.width, img.height, maxDimension);
      let quality = initialQuality;
      let output;
      let outputSize;
      let currentWidth = width;
      let currentHeight = height;

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      const render = () => {
        canvas.width = currentWidth;
        canvas.height = currentHeight;
        if (preferredMime === 'image/jpeg') {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, currentWidth, currentHeight);
        } else {
          ctx.clearRect(0, 0, currentWidth, currentHeight);
        }
        ctx.drawImage(img, 0, 0, currentWidth, currentHeight);
        output = canvas.toDataURL(preferredMime, quality);
        outputSize = getBase64Size(output);
      };

      render();

      let safetyCounter = 0;
      while (targetSize && outputSize > targetSize && safetyCounter < 12) {
        safetyCounter += 1;
        if (preferredMime === 'image/jpeg' && quality > minQuality) {
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

function parseTags(text) {
  if (!text) return [];
  return text
    .split(/[,，]/)
    .map((tag) => tag.trim())
    .filter(Boolean);
}

function createChip({ label, value, selected = false, onClick }) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'chip';
  button.textContent = label;
  button.dataset.value = value;
  button.classList.toggle('active', selected);
  button.setAttribute('aria-pressed', String(selected));
  button.addEventListener('click', onClick);
  return button;
}

function normalizeTag(tag) {
  return String(tag || '')
    .trim()
    .toLowerCase();
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  try {
    return new Date(dateStr).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  } catch (error) {
    return dateStr;
  }
}

function showToast(message, type = 'info') {
  if (!elements.toast) return;
  elements.toast.textContent = message;
  elements.toast.className = `toast ${type}`;
  requestAnimationFrame(() => {
    elements.toast.classList.add('show');
  });
  setTimeout(() => {
    elements.toast.classList.remove('show');
  }, 2800);
}

// ========== 调试函数 ==========
/**
 * 打印所有照片的大小信息（用于调试）
 */
function debugPhotosSize() {
  const photos = StorageManager.getPhotos();
  console.log(`总共 ${photos.length} 张照片`);
  photos.forEach((photo, index) => {
    const thumbSize = getBase64Size(photo.thumbnail);
    const imageSize = getBase64Size(photo.image);
    console.log(`[${index + 1}] ${photo.title || '无标题'}`);
    console.log(`  缩略图: ${(thumbSize / 1024).toFixed(2)}KB`);
    console.log(`  主图: ${(imageSize / 1024).toFixed(2)}KB`);
  });
}

/**
 * 清除旧照片数据并重新加载（仅用于开发调试）
 */
function clearPhotosDebug() {
  if (confirm('确定要清除所有照片吗？')) {
    StorageManager.removeItem(StorageManager.KEYS.PHOTOS);
    showToast('照片已清除，页面即将重新加载', 'info');
    setTimeout(() => {
      location.reload();
    }, 1500);
  }
}

// 将调试函数暴露到全局作用域，方便在控制台调用
window.debugPhotosSize = debugPhotosSize;
window.clearPhotosDebug = clearPhotosDebug;
