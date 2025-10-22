/**
 * 数据存储管理模块
 * 统一管理所有数据的存取，支持导出/导入
 */

const StorageManager = {
  // ========== 存储键名常量 ==========
  KEYS: {
    TRIPS: 'app_trips',              // 旅程数据
    PHOTOS: 'app_photos',            // 照片数据
    BOOKS: 'app_books',              // 读书数据
    HOBBIES: 'app_hobbies',          // 兴趣爱好
    PETS: 'app_pets',                // 宠物数据
    USER_INFO: 'app_user_info',      // 用户信息
    SETTINGS: 'app_settings'         // 应用设置
  },

  // ========== 基础操作 ==========

  /**
   * 获取数据
   * @param {string} key - 存储键名
   * @param {*} defaultValue - 默认值
   * @returns {*} 存储的数据或默认值
   */
  getItem(key, defaultValue = null) {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : defaultValue;
    } catch (e) {
      console.error(`获取 ${key} 失败:`, e);
      return defaultValue;
    }
  },

  /**
   * 保存数据
   * @param {string} key - 存储键名
   * @param {*} value - 要保存的数据
   * @returns {boolean} 是否保存成功
   */
  setItem(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (e) {
      console.error(`保存 ${key} 失败:`, e);
      return false;
    }
  },

  /**
   * 删除数据
   * @param {string} key - 存储键名
   * @returns {boolean} 是否删除成功
   */
  removeItem(key) {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (e) {
      console.error(`删除 ${key} 失败:`, e);
      return false;
    }
  },

  // ========== 用户信息管理 ==========

  /**
   * 获取用户信息
   * @returns {Object} 用户信息对象
   */
  getUserInfo() {
    return this.getItem(this.KEYS.USER_INFO, {
      name: '我',
      birthDate: '',
      city: '',
      signature: '',
      avatar: this.getPlaceholderImage()
    });
  },

  /**
   * 更新用户信息
   * @param {Object} userInfo - 用户信息对象
   * @returns {boolean} 是否保存成功
   */
  updateUserInfo(userInfo) {
    return this.setItem(this.KEYS.USER_INFO, userInfo);
  },

  // ========== 旅程管理 ==========

  /**
   * 获取所有旅程数据
   * @returns {Array} 旅程数组
   */
  getTrips() {
    return this.getItem(this.KEYS.TRIPS, []);
  },

  /**
   * 添加旅程
   * @param {Object} trip - 旅程数据对象
   * @returns {boolean} 是否保存成功
   */
  addTrip(trip) {
    const trips = this.getTrips();
    trip.id = this.generateId();
    trip.createdAt = new Date().toISOString();
    trips.push(trip);
    return this.setItem(this.KEYS.TRIPS, trips);
  },

  /**
   * 更新旅程
   * @param {string} tripId - 旅程 ID
   * @param {Object} updates - 更新内容
   * @returns {boolean} 是否更新成功
   */
  updateTrip(tripId, updates) {
    const trips = this.getTrips();
    const index = trips.findIndex(t => t.id === tripId);
    if (index !== -1) {
      trips[index] = { ...trips[index], ...updates, updatedAt: new Date().toISOString() };
      return this.setItem(this.KEYS.TRIPS, trips);
    }
    return false;
  },

  /**
   * 删除旅程
   * @param {string} tripId - 旅程 ID
   * @returns {boolean} 是否删除成功
   */
  deleteTrip(tripId) {
    const trips = this.getTrips().filter(t => t.id !== tripId);
    return this.setItem(this.KEYS.TRIPS, trips);
  },

  /**
   * 获取单个旅程
   * @param {string} tripId - 旅程 ID
   * @returns {Object|null} 旅程对象或 null
   */
  getTrip(tripId) {
    return this.getTrips().find(t => t.id === tripId) || null;
  },

  // ========== 照片管理 ==========

  /**
   * 获取所有照片
   * @returns {Array} 照片数组
   */
  getPhotos() {
    const rawPhotos = this.getItem(this.KEYS.PHOTOS, []);
    if (!Array.isArray(rawPhotos)) {
      return [];
    }

    let normalized = false;
    const photos = rawPhotos.map((photo) => {
      if (!photo || typeof photo !== 'object') {
        normalized = true;
        return null;
      }

      const normalizedPhoto = {
        id: photo.id || this.generateId(),
        image: photo.image || this.getPlaceholderImage(600, 400),
        thumbnail: photo.thumbnail || photo.image || this.getPlaceholderImage(400, 300),
        title: photo.title || '',
        description: photo.description || '',
        tripId: photo.tripId || null,
        category: photo.category || '未分类',
        tags: Array.isArray(photo.tags)
          ? photo.tags.filter(Boolean)
          : (photo.tags ? String(photo.tags).split(',').map(tag => tag.trim()).filter(Boolean) : []),
        liked: Boolean(photo.liked),
        likes: typeof photo.likes === 'number' && photo.likes >= 0 ? photo.likes : (photo.liked ? 1 : 0),
        createdAt: photo.createdAt || new Date().toISOString(),
        updatedAt: photo.updatedAt || null,
        uploadedBy: photo.uploadedBy || 'self',
        metadata: photo.metadata || {}
      };

      if (JSON.stringify(photo) !== JSON.stringify(normalizedPhoto)) {
        normalized = true;
      }

      return normalizedPhoto;
    }).filter(Boolean);

    if (normalized) {
      this.setItem(this.KEYS.PHOTOS, photos);
    }

    return photos;
  },

  /**
   * 添加照片
   * @param {Object} photo - 照片数据对象
   * @returns {boolean} 是否保存成功
   */
  addPhoto(photo) {
    const photos = this.getPhotos();
    const now = new Date().toISOString();
    const normalizedPhoto = {
      id: this.generateId(),
      image: photo.image || this.getPlaceholderImage(600, 400),
      thumbnail: photo.thumbnail || photo.image || this.getPlaceholderImage(400, 300),
      title: photo.title || '',
      description: photo.description || '',
      tripId: photo.tripId || null,
      category: photo.category || '未分类',
      tags: Array.isArray(photo.tags)
        ? photo.tags.filter(Boolean)
        : (photo.tags ? String(photo.tags).split(',').map(tag => tag.trim()).filter(Boolean) : []),
      liked: Boolean(photo.liked),
      likes: typeof photo.likes === 'number' && photo.likes >= 0 ? photo.likes : (photo.liked ? 1 : 0),
      createdAt: now,
      updatedAt: now,
      uploadedBy: photo.uploadedBy || 'self',
      metadata: photo.metadata || {}
    };

    photos.push(normalizedPhoto);
    return this.setItem(this.KEYS.PHOTOS, photos);
  },

  /**
   * 更新照片点赞状态
   * @param {string} photoId - 照片 ID
   * @param {boolean} liked - 是否点赞
   * @returns {boolean} 是否更新成功
   */
  updatePhotoLike(photoId, liked) {
    const photos = this.getPhotos();
    const photo = photos.find(p => p.id === photoId);
    if (!photo) {
      return false;
    }

    photo.liked = liked;
    if (liked) {
      photo.likes = (photo.likes || 0) + 1;
      photo.likedAt = new Date().toISOString();
    } else {
      photo.likes = Math.max(0, (photo.likes || 0) - 1);
      photo.likedAt = null;
    }
    photo.updatedAt = new Date().toISOString();
    return this.setItem(this.KEYS.PHOTOS, photos);
  },

  /**
   * 更新照片信息
   * @param {string} photoId - 照片 ID
   * @param {Object} updates - 要更新的内容
   * @returns {boolean} 是否更新成功
   */
  updatePhoto(photoId, updates) {
    const photos = this.getPhotos();
    const index = photos.findIndex(p => p.id === photoId);

    if (index === -1) {
      return false;
    }

    const origin = photos[index];
    const merged = {
      ...origin,
      ...updates,
      tags: updates?.tags
        ? (Array.isArray(updates.tags)
          ? updates.tags.filter(Boolean)
          : String(updates.tags).split(',').map(tag => tag.trim()).filter(Boolean))
        : origin.tags,
      category: updates?.category || origin.category,
      updatedAt: new Date().toISOString()
    };

    photos[index] = merged;
    return this.setItem(this.KEYS.PHOTOS, photos);
  },

  /**
   * 获取单张照片
   * @param {string} photoId - 照片 ID
   * @returns {Object|null} 照片对象
   */
  getPhoto(photoId) {
    return this.getPhotos().find(p => p.id === photoId) || null;
  },

  /**
   * 获取所有已点赞的照片
   * @returns {Array} 照片数组
   */
  getLikedPhotos() {
    return this.getPhotos().filter(p => p.liked);
  },

  /**
   * 删除照片
   * @param {string} photoId - 照片 ID
   * @returns {boolean} 是否删除成功
   */
  deletePhoto(photoId) {
    const photos = this.getPhotos().filter(p => p.id !== photoId);
    return this.setItem(this.KEYS.PHOTOS, photos);
  },

  // ========== 读书管理 ==========

  /**
   * 获取所有书籍
   * @returns {Array} 书籍数组
   */
  getBooks() {
    return this.getItem(this.KEYS.BOOKS, []);
  },

  /**
   * 添加书籍
   * @param {Object} book - 书籍数据对象
   * @returns {boolean} 是否保存成功
   */
  addBook(book) {
    const books = this.getBooks();
    book.id = this.generateId();
    book.createdAt = new Date().toISOString();
    books.push(book);
    return this.setItem(this.KEYS.BOOKS, books);
  },

  /**
   * 更新书籍
   * @param {string} bookId - 书籍 ID
   * @param {Object} updates - 更新内容
   * @returns {boolean} 是否更新成功
   */
  updateBook(bookId, updates) {
    const books = this.getBooks();
    const index = books.findIndex(b => b.id === bookId);
    if (index !== -1) {
      books[index] = { ...books[index], ...updates, updatedAt: new Date().toISOString() };
      return this.setItem(this.KEYS.BOOKS, books);
    }
    return false;
  },

  /**
   * 删除书籍
   * @param {string} bookId - 书籍 ID
   * @returns {boolean} 是否删除成功
   */
  deleteBook(bookId) {
    const books = this.getBooks().filter(b => b.id !== bookId);
    return this.setItem(this.KEYS.BOOKS, books);
  },

  // ========== 兴趣爱好管理 ==========

  /**
   * 获取所有兴趣爱好
   * @returns {Array} 兴趣爱好数组
   */
  getHobbies() {
    return this.getItem(this.KEYS.HOBBIES, []);
  },

  /**
   * 添加兴趣爱好
   * @param {Object} hobby - 兴趣爱好对象
   * @returns {boolean} 是否保存成功
   */
  addHobby(hobby) {
    const hobbies = this.getHobbies();
    hobby.id = this.generateId();
    hobby.createdAt = new Date().toISOString();
    hobbies.push(hobby);
    return this.setItem(this.KEYS.HOBBIES, hobbies);
  },

  /**
   * 更新兴趣爱好
   * @param {string} hobbyId - 兴趣爱好 ID
   * @param {Object} updates - 更新内容
   * @returns {boolean} 是否更新成功
   */
  updateHobby(hobbyId, updates) {
    const hobbies = this.getHobbies();
    const index = hobbies.findIndex(h => h.id === hobbyId);
    if (index !== -1) {
      hobbies[index] = { ...hobbies[index], ...updates };
      return this.setItem(this.KEYS.HOBBIES, hobbies);
    }
    return false;
  },

  /**
   * 删除兴趣爱好
   * @param {string} hobbyId - 兴趣爱好 ID
   * @returns {boolean} 是否删除成功
   */
  deleteHobby(hobbyId) {
    const hobbies = this.getHobbies().filter(h => h.id !== hobbyId);
    return this.setItem(this.KEYS.HOBBIES, hobbies);
  },

  // ========== 宠物管理 ==========

  /**
   * 获取所有宠物
   * @returns {Array} 宠物数组
   */
  getPets() {
    return this.getItem(this.KEYS.PETS, []);
  },

  /**
   * 添加宠物
   * @param {Object} pet - 宠物数据对象
   * @returns {boolean} 是否保存成功
   */
  addPet(pet) {
    const pets = this.getPets();
    pet.id = this.generateId();
    pet.createdAt = new Date().toISOString();
    pets.push(pet);
    return this.setItem(this.KEYS.PETS, pets);
  },

  /**
   * 更新宠物
   * @param {string} petId - 宠物 ID
   * @param {Object} updates - 更新内容
   * @returns {boolean} 是否更新成功
   */
  updatePet(petId, updates) {
    const pets = this.getPets();
    const index = pets.findIndex(p => p.id === petId);
    if (index !== -1) {
      pets[index] = { ...pets[index], ...updates, updatedAt: new Date().toISOString() };
      return this.setItem(this.KEYS.PETS, pets);
    }
    return false;
  },

  /**
   * 删除宠物
   * @param {string} petId - 宠物 ID
   * @returns {boolean} 是否删除成功
   */
  deletePet(petId) {
    const pets = this.getPets().filter(p => p.id !== petId);
    return this.setItem(this.KEYS.PETS, pets);
  },

  // ========== 批量操作 ==========

  /**
   * 导出所有数据为 JSON 字符串
   * @returns {string} JSON 字符串
   */
  exportAllData() {
    const backup = {};
    Object.entries(this.KEYS).forEach(([key, storageKey]) => {
      backup[storageKey] = this.getItem(storageKey);
    });
    return JSON.stringify(backup, null, 2);
  },

  /**
   * 导入数据
   * @param {string} jsonStr - JSON 字符串
   * @returns {boolean} 是否导入成功
   */
  importData(jsonStr) {
    try {
      const backup = JSON.parse(jsonStr);
      Object.entries(backup).forEach(([key, value]) => {
        if (Object.values(this.KEYS).includes(key) && value) {
          this.setItem(key, value);
        }
      });
      return true;
    } catch (e) {
      console.error('导入数据失败:', e);
      return false;
    }
  },

  /**
   * 清空所有数据
   * @returns {boolean} 是否清空成功
   */
  clearAll() {
    try {
      Object.values(this.KEYS).forEach(key => {
        this.removeItem(key);
      });
      return true;
    } catch (e) {
      console.error('清空数据失败:', e);
      return false;
    }
  },

  // ========== 工具方法 ==========

  /**
   * 生成唯一 ID
   * @returns {string} 唯一 ID
   */
  generateId() {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  },

  /**
   * 获取占位图（Base64）
   * @returns {string} Base64 图片 URL
   */
  getPlaceholderImage(width = 300, height = 300) {
    // 返回一个简单的灰色占位图 Base64
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#e0e0e0';
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = '#999';
    ctx.font = '20px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Placeholder', width / 2, height / 2 - 10);
    ctx.font = '14px Arial';
    ctx.fillText(`${width}x${height}`, width / 2, height / 2 + 15);
    return canvas.toDataURL('image/png');
  },

  /**
   * 检查 localStorage 是否可用
   * @returns {boolean} 是否可用
   */
  isAvailable() {
    try {
      const test = '__storage_test__';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch (e) {
      return false;
    }
  },

  /**
   * 获取存储使用情况
   * @returns {Object} 存储信息
   */
  getStorageInfo() {
    const allData = this.exportAllData();
    const bytes = new Blob([allData]).size;
    const mb = (bytes / (1024 * 1024)).toFixed(2);
    return {
      bytes,
      mb,
      percentage: ((bytes / (5 * 1024 * 1024)) * 100).toFixed(2) + '%'
    };
  }
};

// 检查 localStorage 可用性
if (!StorageManager.isAvailable()) {
  console.warn('⚠️ localStorage 不可用，某些功能可能受限');
}
