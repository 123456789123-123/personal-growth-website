// ========== 头像与城市选择配置 ==========
const MAX_AVATAR_SIZE = 2 * 1024 * 1024; // 2MB
const MAX_AVATAR_DIMENSION = 512;
const MIN_AVATAR_DIMENSION = 128;
const DEFAULT_IMAGE_QUALITY = 0.85;
const MIN_IMAGE_QUALITY = 0.4;
const IMAGE_QUALITY_STEP = 0.05;
const CITY_DATA_URL = 'https://raw.githubusercontent.com/dr5hn/countries-states-cities-database/master/json/countries%2Bstates%2Bcities.json';
const CHINA_STATE_LABELS = {
  Anhui: '安徽',
  Beijing: '北京',
  Chongqing: '重庆',
  Fujian: '福建',
  Gansu: '甘肃',
  Guangdong: '广东',
  'Guangxi Zhuang Autonomous Region': '广西壮族自治区',
  Guizhou: '贵州',
  Hainan: '海南',
  Hebei: '河北',
  Heilongjiang: '黑龙江',
  Henan: '河南',
  'Hong Kong': '香港',
  Hubei: '湖北',
  Hunan: '湖南',
  'Inner Mongolia': '内蒙古自治区',
  Jiangsu: '江苏',
  Jiangxi: '江西',
  Jilin: '吉林',
  Keelung: '基隆',
  Liaoning: '辽宁',
  Macau: '澳门',
  'Ningxia Hui Autonomous Region': '宁夏回族自治区',
  Qinghai: '青海',
  Shaanxi: '陕西',
  Shandong: '山东',
  Shanghai: '上海',
  Shanxi: '山西',
  Sichuan: '四川',
  "Taiwan Province, People's Republic of China": '台湾',
  'Tibet Autonomous Region': '西藏自治区',
  Xinjiang: '新疆维吾尔自治区',
  Yunnan: '云南',
  Zhejiang: '浙江'
};

// ========== 页面默认数据 ==========
const AVATAR_DATA = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

const DEFAULT_USER_INFO = {
  name: '浮生月下',
  birthDate: '2003-05-07',
  city: '广州',
  signature: '明心悦耳',
  avatar: AVATAR_DATA,
  citySelection: null
};

// ========== 全局状态 ==========
let isEditMode = false;
let currentUserInfo = null;
let cityPickerInstance = null;

document.addEventListener('DOMContentLoaded', initPage);

function initPage() {
  const existingData = StorageManager.getUserInfo();

  if (!existingData || !existingData.name || !existingData.birthDate) {
    StorageManager.updateUserInfo(DEFAULT_USER_INFO);
  }

  loadUserInfo();
  loadStats();
  bindAvatarUpload();
  bindCharCount();
  bindQuickEdit();
  bindBirthDateAutoPicker();
  bindCityPicker();
}

function loadUserInfo() {
  const stored = StorageManager.getUserInfo();
  currentUserInfo = { ...DEFAULT_USER_INFO, ...(stored || {}) };

  if (!currentUserInfo.avatar) {
    currentUserInfo.avatar = DEFAULT_USER_INFO.avatar;
  }

  displayUserInfo(currentUserInfo);
}

function displayUserInfo(userInfo) {
  const avatarImg = document.getElementById('avatarImg');
  if (avatarImg) {
    avatarImg.src = userInfo.avatar || DEFAULT_USER_INFO.avatar;
  }

  const nameEl = document.getElementById('displayName');
  if (nameEl) {
    nameEl.textContent = userInfo.name || '未设置';
  }

  const birthEl = document.getElementById('displayBirthDate');
  if (birthEl) {
    birthEl.textContent = userInfo.birthDate ? formatDate(userInfo.birthDate) : '未设置';
  }

  const cityEl = document.getElementById('displayCity');
  if (cityEl) {
    cityEl.textContent = userInfo.city || '未设置';
  }

  const signatureEl = document.getElementById('displaySignature');
  if (signatureEl) {
    signatureEl.textContent = userInfo.signature || '这个人很懒，什么都没留下';
  }
}

function formatDate(dateStr) {
  if (!dateStr) return '';

  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();

  return `${year}年${month}月${day}日`;
}

function toggleEditMode(forceState = null) {
  const newState = typeof forceState === 'boolean' ? forceState : !isEditMode;

  if (newState === isEditMode) {
    return;
  }

  isEditMode = newState;

  const infoDisplay = document.getElementById('infoDisplay');
  const infoEdit = document.getElementById('infoEdit');
  const editBtn = document.getElementById('editBtn');

  if (!infoDisplay || !infoEdit || !editBtn) {
    return;
  }

  if (isEditMode) {
    infoDisplay.style.display = 'none';
    infoEdit.style.display = 'flex';
    editBtn.innerHTML = '<i class="fas fa-times"></i><span class="btn-text">取消</span>';
    editBtn.style.backgroundColor = 'var(--danger-color)';
    fillEditForm(currentUserInfo);
  } else {
    infoDisplay.style.display = 'flex';
    infoEdit.style.display = 'none';
    editBtn.innerHTML = '<i class="fas fa-edit"></i><span class="btn-text">编辑</span>';
    editBtn.style.backgroundColor = 'var(--primary-color)';
  }
}

function fillEditForm(userInfo) {
  const nameInput = document.getElementById('editName');
  const birthInput = document.getElementById('editBirthDate');
  const cityInput = document.getElementById('editCity');
  const signatureInput = document.getElementById('editSignature');

  if (nameInput) nameInput.value = userInfo.name || '';
  if (birthInput) birthInput.value = userInfo.birthDate || '';
  if (cityInput) cityInput.value = userInfo.city || '';
  if (signatureInput) signatureInput.value = userInfo.signature || '';

  updateCharCount();

  if (cityPickerInstance) {
    cityPickerInstance.setInitialSelection({
      city: userInfo.city,
      selection: userInfo.citySelection || null
    });
  }
}

function cancelEdit() {
  fillEditForm(currentUserInfo);
  toggleEditMode(false);
}

function saveProfile() {
  const name = document.getElementById('editName')?.value.trim();
  const birthDate = document.getElementById('editBirthDate')?.value;
  const city = document.getElementById('editCity')?.value.trim();
  const signature = document.getElementById('editSignature')?.value.trim();

  if (!name) {
    showToast('请输入昵称', 'error');
    enterEditMode('editName');
    return;
  }

  if (!birthDate) {
    showToast('请选择出生年月', 'error');
    enterEditMode('editBirthDate', { openPicker: true, selectAll: false });
    return;
  }

  if (!city) {
    showToast('请选择所在城市', 'error');
    enterEditMode('editCity', { selectAll: true });
    return;
  }

  const selectedCity = cityPickerInstance ? cityPickerInstance.getSelection() : null;

  const updatedInfo = {
    ...currentUserInfo,
    name,
    birthDate,
    city,
    signature: signature || '这个人很懒，什么都没留下',
    citySelection: selectedCity || currentUserInfo.citySelection || null
  };

  const success = StorageManager.updateUserInfo(updatedInfo);

  if (!success) {
    showToast('保存失败，请重试', 'error');
    return;
  }

  currentUserInfo = updatedInfo;
  displayUserInfo(currentUserInfo);
  toggleEditMode(false);
  showToast('保存成功!', 'success');
}

function bindAvatarUpload() {
  const avatarWrapper = document.querySelector('.avatar-wrapper');
  const avatarInput = document.getElementById('avatarInput');

  if (!avatarWrapper || !avatarInput) {
    return;
  }

  avatarWrapper.addEventListener('click', () => {
    avatarInput.click();
  });

  avatarInput.addEventListener('change', handleAvatarUpload);
}

async function handleAvatarUpload(event) {
  const input = event.target;
  const file = input.files?.[0];

  if (!file) {
    return;
  }

  if (!file.type.startsWith('image/')) {
    showToast('请选择图片文件', 'error');
    input.value = '';
    return;
  }

  try {
    const processedData = await prepareAvatarData(file);

    currentUserInfo.avatar = processedData;
    StorageManager.updateUserInfo(currentUserInfo);

    const avatarImg = document.getElementById('avatarImg');
    if (avatarImg) {
      avatarImg.src = processedData;
    }

    showToast('头像更新成功!', 'success');
  } catch (error) {
    console.error('头像上传失败:', error);
    showToast(error.message || '头像上传失败,请重试', 'error');
  } finally {
    input.value = '';
  }
}

async function prepareAvatarData(file) {
  const originalDataUrl = await readFileAsDataURL(file);
  let result = originalDataUrl;

  if (file.size > MAX_AVATAR_SIZE || calculateBase64Size(originalDataUrl) > MAX_AVATAR_SIZE) {
    result = await compressImage(originalDataUrl);
  }

  if (calculateBase64Size(result) > MAX_AVATAR_SIZE) {
    throw new Error('头像处理后仍超过 2MB,请更换更小的图片');
  }

  return result;
}

function readFileAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => resolve(event.target.result);
    reader.onerror = () => reject(new Error('无法读取文件'));
    reader.readAsDataURL(file);
  });
}

function compressImage(dataUrl) {
  return new Promise((resolve, reject) => {
    const image = new Image();

    image.onload = () => {
      const initialSize = getScaledDimensions(image.width, image.height);
      let targetDimension = Math.max(initialSize.width, initialSize.height);
      let quality = DEFAULT_IMAGE_QUALITY;

      const renderDataUrl = () => {
        const { width, height } = getScaledDimensions(image.width, image.height, targetDimension);
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(image, 0, 0, width, height);
        return canvas.toDataURL('image/jpeg', quality);
      };

      let compressedDataUrl = renderDataUrl();

      while (
        calculateBase64Size(compressedDataUrl) > MAX_AVATAR_SIZE &&
        (quality > MIN_IMAGE_QUALITY || targetDimension > MIN_AVATAR_DIMENSION)
      ) {
        if (quality > MIN_IMAGE_QUALITY) {
          quality = Math.max(MIN_IMAGE_QUALITY, quality - IMAGE_QUALITY_STEP);
        } else {
          targetDimension = Math.max(MIN_AVATAR_DIMENSION, Math.round(targetDimension * 0.9));
        }
        compressedDataUrl = renderDataUrl();
      }

      resolve(compressedDataUrl);
    };

    image.onerror = () => reject(new Error('无法加载图片'));
    image.src = dataUrl;
  });
}

function getScaledDimensions(width, height, maxDimension = MAX_AVATAR_DIMENSION) {
  const maxSide = Math.max(width, height);

  if (maxSide <= maxDimension) {
    return {
      width: Math.max(1, Math.round(width)),
      height: Math.max(1, Math.round(height))
    };
  }

  const ratio = maxDimension / maxSide;

  return {
    width: Math.max(1, Math.round(width * ratio)),
    height: Math.max(1, Math.round(height * ratio))
  };
}

function calculateBase64Size(dataUrl) {
  if (!dataUrl) return 0;

  const parts = dataUrl.split(',');
  if (parts.length < 2) return 0;

  const base64 = parts[1];
  return Math.ceil((base64.length * 3) / 4);
}

function bindQuickEdit() {
  const configs = [
    { displayId: 'displayName', inputId: 'editName', selectAll: true },
    { displayId: 'displayBirthDate', inputId: 'editBirthDate', selectAll: false, openPicker: true },
    { displayId: 'displayCity', inputId: 'editCity', selectAll: true },
    { displayId: 'displaySignature', inputId: 'editSignature', selectAll: false }
  ];

  configs.forEach(({ displayId, inputId, selectAll = true, openPicker = false }) => {
    const trigger = document.getElementById(displayId);
    if (!trigger) return;

    const item = trigger.closest('.info-item');
    if (item) {
      item.classList.add('quick-editable');
    }

    trigger.addEventListener('click', () => {
      enterEditMode(inputId, { selectAll, openPicker });
    });
  });
}

function enterEditMode(targetInputId, options = {}) {
  toggleEditMode(true);

  requestAnimationFrame(() => {
    const input = document.getElementById(targetInputId);
    if (!input) return;

    if (typeof input.focus === 'function') {
      input.focus({ preventScroll: true });
    }

    if (options.selectAll !== false && typeof input.select === 'function') {
      try {
        input.select();
      } catch (err) {
        // 某些输入类型不支持 select
      }
    }

    if (options.selectAll === false && input.tagName === 'TEXTAREA' && typeof input.setSelectionRange === 'function') {
      const length = input.value.length;
      input.setSelectionRange(length, length);
    }

    if (options.openPicker && typeof input.showPicker === 'function') {
      try {
        input.showPicker();
      } catch (err) {
        // 某些浏览器不支持 showPicker，无需特殊处理
      }
    }
  });
}

function bindCharCount() {
  const textarea = document.getElementById('editSignature');
  const counter = document.getElementById('signatureCount');

  if (!textarea || !counter) {
    return;
  }

  textarea.addEventListener('input', updateCharCount);
  updateCharCount();
}

function updateCharCount() {
  const textarea = document.getElementById('editSignature');
  const counter = document.getElementById('signatureCount');

  if (!textarea || !counter) {
    return;
  }

  const length = textarea.value.length;
  counter.textContent = length;

  if (length > 100) {
    counter.style.color = 'var(--danger-color)';
  } else {
    counter.style.color = 'var(--text-tertiary)';
  }
}

function bindBirthDateAutoPicker() {
  const birthInput = document.getElementById('editBirthDate');
  if (!birthInput) {
    return;
  }

  const openPicker = () => {
    if (typeof birthInput.showPicker === 'function') {
      try {
        birthInput.showPicker();
      } catch (err) {
        // 忽略浏览器不支持 showPicker 的情况
      }
    }
  };

  birthInput.addEventListener('focus', openPicker);
  birthInput.addEventListener('click', openPicker);
}

function bindCityPicker() {
  const cityInput = document.getElementById('editCity');
  if (!cityInput) {
    return;
  }

  cityPickerInstance = new CityPicker(cityInput, {
    dataUrl: CITY_DATA_URL,
    onSelect(location) {
      cityInput.value = location.label;
      const initialValue = location.label;
      if (location.labelPromise && typeof location.labelPromise.then === 'function') {
        location.labelPromise.then((text) => {
          if (!text) return;
          if (cityInput.value === initialValue || cityInput.value === location.englishLabel) {
            cityInput.value = text;
          }
        });
      }
    }
  });

  cityPickerInstance.setInitialSelection({
    city: currentUserInfo.city,
    selection: currentUserInfo.citySelection || null
  });
}

function loadStats() {
  const trips = StorageManager.getTrips();
  const photos = StorageManager.getPhotos();
  const books = StorageManager.getBooks();
  const hobbies = StorageManager.getHobbies();

  const tripCount = document.getElementById('tripCount');
  if (tripCount) tripCount.textContent = trips.length;

  const photoCount = document.getElementById('photoCount');
  if (photoCount) photoCount.textContent = photos.length;

  const bookCount = document.getElementById('bookCount');
  if (bookCount) bookCount.textContent = books.length;

  const hobbyCount = document.getElementById('hobbyCount');
  if (hobbyCount) hobbyCount.textContent = hobbies.length;
}

function showToast(message, type = 'success') {
  const toast = document.getElementById('toast');
  if (!toast) return;

  toast.textContent = message;
  toast.className = `toast ${type}`;

  setTimeout(() => {
    toast.classList.add('show');
  }, 10);

  setTimeout(() => {
    toast.classList.remove('show');
  }, 3000);
}

class CityPicker {
  constructor(input, options = {}) {
    this.input = input;
    this.options = options;
    this.dataUrl = options.dataUrl;
    this.countries = [];
    this.isOpen = false;
    this.loading = false;
    this.loadingPromise = null;
    this.searchQuery = '';
    this.searchResults = [];
    this.activeCountryIndex = -1;
    this.activeStateIndex = -1;
    this.selection = null;
    this.pendingSelection = null;
    this.userQuery = '';
    this.effectiveQuery = '';
    this.translationCache = new Map();
    this.translationInFlight = new Map();

    this.handleDocumentClick = this.handleDocumentClick.bind(this);
    this.handleEscape = this.handleEscape.bind(this);
    this.handleRelayout = this.handleRelayout.bind(this);

    this.overlay = this.createOverlay();
    this.overlayMessage = this.overlay.querySelector('.city-picker-message');
    this.searchInput = this.overlay.querySelector('.city-picker-search');
    this.countryListEl = this.overlay.querySelector('[data-role="country-list"]');
    this.stateListEl = this.overlay.querySelector('[data-role="state-list"]');
    this.cityListEl = this.overlay.querySelector('[data-role="city-list"]');

    this.input.setAttribute('autocomplete', 'off');

    this.input.addEventListener('focus', () => this.open());
    this.input.addEventListener('click', () => this.open());
    this.input.addEventListener('input', (event) => {
      const value = event.target.value;
      if (!this.isOpen) {
        this.open();
      }
      this.searchInput.value = value;
      this.applySearch(value);
    });

    this.searchInput.addEventListener('input', () => {
      const value = this.searchInput.value;
      this.input.value = value;
      this.applySearch(value);
    });
  }

  createOverlay() {
    const overlay = document.createElement('div');
    overlay.className = 'city-picker-overlay';
    overlay.innerHTML = `
      <div class="city-picker-panel">
        <div class="city-picker-header">
          <input type="text" class="city-picker-search" placeholder="搜索城市、国家或省份..." />
        </div>
        <div class="city-picker-body">
          <div class="city-picker-column">
            <div class="city-picker-title">国家</div>
            <div class="city-picker-list" data-role="country-list"></div>
          </div>
          <div class="city-picker-column">
            <div class="city-picker-title">省 / 州</div>
            <div class="city-picker-list" data-role="state-list"></div>
          </div>
          <div class="city-picker-column">
            <div class="city-picker-title">城市</div>
            <div class="city-picker-list" data-role="city-list"></div>
          </div>
        </div>
        <div class="city-picker-message">正在加载全球城市数据...</div>
      </div>
    `;
    overlay.addEventListener('click', (event) => event.stopPropagation());
    document.body.appendChild(overlay);
    return overlay;
  }

  async open() {
    if (this.isOpen) {
      this.positionOverlay();
      return;
    }

    this.isOpen = true;
    this.overlay.classList.add('show');
    this.positionOverlay();

    document.addEventListener('click', this.handleDocumentClick, true);
    document.addEventListener('keydown', this.handleEscape);
    window.addEventListener('resize', this.handleRelayout);
    window.addEventListener('scroll', this.handleRelayout, true);

    try {
      await this.ensureDataLoaded();
      this.applyPendingSelection();
      this.applySearch(this.input.value || '');
      this.searchInput.value = this.input.value || '';
      this.searchInput.focus({ preventScroll: true });
      this.searchInput.select();
    } catch (error) {
      console.error('城市数据加载失败:', error);
      this.setMessage(error?.message ? `加载失败：${error.message}` : '加载城市数据失败，请稍后重试');
    }
  }

  close() {
    if (!this.isOpen) {
      return;
    }

    this.isOpen = false;
    this.overlay.classList.remove('show');
    document.removeEventListener('click', this.handleDocumentClick, true);
    document.removeEventListener('keydown', this.handleEscape);
    window.removeEventListener('resize', this.handleRelayout);
    window.removeEventListener('scroll', this.handleRelayout, true);
  }

  async ensureDataLoaded() {
    if (this.countries.length || this.loadingPromise) {
      if (this.loadingPromise) {
        await this.loadingPromise;
      }
      return;
    }

    this.loading = true;
    this.overlay.dataset.loading = 'true';
    this.setMessage('正在加载全球城市数据...');

    this.loadingPromise = fetch(this.dataUrl, { cache: 'force-cache' })
      .then((response) => {
        if (!response.ok) {
          throw new Error('网络请求失败');
        }
        return response.json();
      })
      .then((raw) => {
        this.countries = raw
          .map((country) => ({
            name: country.name,
            lowerName: (country.name || '').toLowerCase(),
            iso2: country.iso2,
            iso3: country.iso3,
            states: (country.states || [])
              .map((state) => ({
                name: state.name,
                lowerName: (state.name || '').toLowerCase(),
                cities: (state.cities || [])
                  .map((city) => {
                    const cityName = typeof city === 'string' ? city : city?.name;
                    if (!cityName) return null;
                    return {
                      name: cityName,
                      lowerName: cityName.toLowerCase()
                    };
                  })
                  .filter(Boolean)
              }))
              .filter((state) => state.name && state.cities.length)
          }))
          .filter((country) => country.states.length);

        if (this.countries.length) {
          this.activeCountryIndex = 0;
          this.activeStateIndex = this.countries[0].states.length ? 0 : -1;
        }

        this.setMessage('');
        this.overlay.dataset.loading = 'false';
      })
      .catch((error) => {
        this.setMessage(error?.message ? `加载失败：${error.message}` : '加载城市数据失败');
        throw error;
      })
      .finally(() => {
        this.loading = false;
        this.loadingPromise = null;
      });

    await this.loadingPromise;
  }

  setMessage(message) {
    if (!this.overlayMessage) return;
    if (message) {
      this.overlayMessage.textContent = message;
      this.overlayMessage.style.display = 'block';
      this.overlay.dataset.loading = 'true';
    } else {
      this.overlayMessage.style.display = 'none';
      this.overlay.dataset.loading = 'false';
    }
  }

  applySearch(query) {
    const trimmed = (query || '').trim();
    this.userQuery = trimmed;

    if (!this.countries.length) {
      this.effectiveQuery = trimmed;
      this.renderColumns();
      return;
    }

    const found = this.performSearch(trimmed);

    if (!found && trimmed && this.containsChinese(trimmed)) {
      this.translateAndSearch(trimmed);
    }
  }

  performSearch(term) {
    this.effectiveQuery = term;

    if (!term || term.length < 2) {
      this.searchResults = [];
      this.renderColumns();
      return false;
    }

    const lower = term.toLowerCase();
    const results = [];

    for (let countryIndex = 0; countryIndex < this.countries.length; countryIndex += 1) {
      const country = this.countries[countryIndex];
      const countryMatch = country.lowerName.includes(lower);

      for (let stateIndex = 0; stateIndex < country.states.length; stateIndex += 1) {
        const state = country.states[stateIndex];
        const stateMatch = state.lowerName.includes(lower) || countryMatch;

        for (let cityIndex = 0; cityIndex < state.cities.length; cityIndex += 1) {
          const city = state.cities[cityIndex];
          if (city.lowerName.includes(lower) || stateMatch) {
            results.push({ countryIndex, stateIndex, cityIndex, city, state, country });
          }
          if (results.length >= 80) {
            break;
          }
        }

        if (results.length >= 80) {
          break;
        }
      }

      if (results.length >= 80) {
        break;
      }
    }

    this.searchResults = results;

    if (results.length) {
      const first = results[0];
      this.activeCountryIndex = first.countryIndex;
      this.activeStateIndex = first.stateIndex;
    }

    this.renderColumns();
    return results.length > 0;
  }

  containsChinese(text) {
    return /[\u3400-\u9fff]/.test(text);
  }

  async translateAndSearch(original) {
    if (!original) return;

    const translated = await this.translateToEnglish(original);
    if (translated) {
      const found = this.performSearch(translated);
      if (!found) {
        this.renderColumns();
      }
    } else {
      this.renderColumns();
    }
  }

  renderColumns() {
    this.renderCountries();
    this.renderStates();
    this.renderCities();
  }

  renderCountries() {
    if (!this.countryListEl) return;

    this.countryListEl.innerHTML = '';

    if (!this.countries.length) {
      this.countryListEl.innerHTML = '<div class="city-picker-empty">正在加载...</div>';
      return;
    }

    const lower = (this.effectiveQuery || '').toLowerCase();

    const filtered = this.countries.filter((country) => {
      if (!this.effectiveQuery) return true;
      if (country.lowerName.includes(lower)) return true;
      return country.states.some((state) => {
        if (state.lowerName.includes(lower)) return true;
        return state.cities.some((city) => city.lowerName.includes(lower));
      });
    });

    filtered.forEach((country) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'city-picker-item';
      const localized = this.getLocalizedName({
        type: 'country',
        name: country.name
      });
      button.textContent = localized.text;

      if (this.countries[this.activeCountryIndex] === country) {
        button.classList.add('active');
      }

      button.addEventListener('click', () => {
        const index = this.countries.indexOf(country);
        if (index !== -1) {
          this.selectCountry(index);
        }
      });

      if (localized.promise) {
        localized.promise.then((text) => {
          if (text) {
            button.textContent = text;
          }
        });
      }

      this.countryListEl.appendChild(button);
    });

    if (!filtered.length) {
      this.countryListEl.innerHTML = '<div class="city-picker-empty">无匹配国家</div>';
    }
  }

  renderStates() {
    if (!this.stateListEl) return;

    this.stateListEl.innerHTML = '';
    const country = this.getActiveCountry();

    if (!country) {
      this.stateListEl.innerHTML = '<div class="city-picker-empty">请选择国家</div>';
      return;
    }

    const lower = (this.effectiveQuery || '').toLowerCase();
    const filtered = country.states.filter((state) => {
      if (!this.effectiveQuery) return true;
      if (state.lowerName.includes(lower)) return true;
      return state.cities.some((city) => city.lowerName.includes(lower));
    });

    filtered.forEach((state) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'city-picker-item';
      const localized = this.getLocalizedName({
        type: 'state',
        name: state.name,
        countryName: country.name
      });
      button.textContent = localized.text;

      if (country.states[this.activeStateIndex] === state) {
        button.classList.add('active');
      }

      button.addEventListener('click', () => {
        const index = country.states.indexOf(state);
        if (index !== -1) {
          this.selectState(index);
        }
      });

      if (localized.promise) {
        localized.promise.then((text) => {
          if (text) {
            button.textContent = text;
          }
        });
      }

      this.stateListEl.appendChild(button);
    });

    if (!filtered.length) {
      this.stateListEl.innerHTML = '<div class="city-picker-empty">无匹配省份</div>';
    }
  }

  renderCities() {
    if (!this.cityListEl) return;

    this.cityListEl.innerHTML = '';

    if (this.searchResults.length) {
      this.searchResults.forEach((result) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'city-picker-item';
        const cityLabel = this.getLocalizedName({
          type: 'city',
          name: result.city.name,
          countryName: result.country.name
        });
        const stateLabel = this.getLocalizedName({
          type: 'state',
          name: result.state.name,
          countryName: result.country.name
        });
        const countryLabel = this.getLocalizedName({
          type: 'country',
          name: result.country.name
        });

        const primarySpan = document.createElement('span');
        primarySpan.textContent = cityLabel.text;
        if (cityLabel.promise) {
          cityLabel.promise.then((text) => {
            if (text) {
              primarySpan.textContent = text;
            }
          });
        }

        const metaSpan = document.createElement('span');
        metaSpan.className = 'city-meta';
        let stateText = stateLabel.text;
        let countryText = countryLabel.text;
        metaSpan.textContent = `${stateText} · ${countryText}`;

        if (stateLabel.promise) {
          stateLabel.promise.then((text) => {
            if (text) {
              stateText = text;
              metaSpan.textContent = `${stateText} · ${countryText}`;
            }
          });
        }

        if (countryLabel.promise) {
          countryLabel.promise.then((text) => {
            if (text) {
              countryText = text;
              metaSpan.textContent = `${stateText} · ${countryText}`;
            }
          });
        }

        button.appendChild(primarySpan);
        button.appendChild(metaSpan);

        button.addEventListener('click', () => {
          this.selectCity(result.countryIndex, result.stateIndex, result.cityIndex);
        });

        this.cityListEl.appendChild(button);
      });
      return;
    }

    if ((this.effectiveQuery || '').length >= 2) {
      this.cityListEl.innerHTML = '<div class="city-picker-empty">无匹配城市</div>';
      return;
    }

    const state = this.getActiveState();
    if (!state) {
      this.cityListEl.innerHTML = '<div class="city-picker-empty">请选择省份</div>';
      return;
    }

    state.cities.forEach((city, index) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'city-picker-item';
      const cityLabel = this.getLocalizedName({
        type: 'city',
        name: city.name,
        countryName: this.getActiveCountry()?.name
      });
      button.textContent = cityLabel.text;

      const isActive =
        this.selection &&
        this.selection.city === city.name &&
        this.selection.state === state.name &&
        this.selection.country === this.getActiveCountry()?.name;

      if (isActive) {
        button.classList.add('active');
      }

      button.addEventListener('click', () => {
        this.selectCity(this.activeCountryIndex, this.activeStateIndex, index);
      });

      if (cityLabel.promise) {
        cityLabel.promise.then((text) => {
          if (text) {
            button.textContent = text;
          }
        });
      }

      this.cityListEl.appendChild(button);
    });

    if (!state.cities.length) {
      this.cityListEl.innerHTML = '<div class="city-picker-empty">该省份暂无城市数据</div>';
    }
  }

  selectCountry(index) {
    if (index === this.activeCountryIndex) {
      return;
    }

    this.activeCountryIndex = index;
    const country = this.getActiveCountry();
    this.activeStateIndex = country && country.states.length ? 0 : -1;
    this.searchResults = [];
    this.renderColumns();
  }

  selectState(index) {
    if (index === this.activeStateIndex) {
      return;
    }

    this.activeStateIndex = index;
    this.searchResults = [];
    this.renderCities();
  }

  selectCity(countryIndex, stateIndex, cityIndex) {
    const country = this.countries[countryIndex];
    const state = country?.states[stateIndex];
    const city = state?.cities[cityIndex];

    if (!country || !state || !city) {
      return;
    }

    this.activeCountryIndex = countryIndex;
    this.activeStateIndex = stateIndex;
    this.selection = {
      country: country.name,
      state: state.name,
      city: city.name
    };

    const countryLabel = this.getLocalizedName({ type: 'country', name: country.name });
    const stateLabel = this.getLocalizedName({ type: 'state', name: state.name, countryName: country.name });
    const cityLabel = this.getLocalizedName({ type: 'city', name: city.name, countryName: country.name });

    this.input.value = cityLabel.text;
    if (cityLabel.promise) {
      cityLabel.promise.then((text) => {
        if (text) {
          this.input.value = text;
        }
      });
    }

    if (typeof this.options.onSelect === 'function') {
      this.options.onSelect({
        label: cityLabel.text,
        labelPromise: cityLabel.promise || Promise.resolve(cityLabel.text),
        englishLabel: city.name,
        country: country.name,
        state: state.name,
        city: city.name,
        countryLabel,
        stateLabel,
        cityLabel
      });
    }

    this.close();
  }

  getSelection() {
    return this.selection ? { ...this.selection } : null;
  }

  getActiveCountry() {
    return this.countries[this.activeCountryIndex] || null;
  }

  getActiveState() {
    const country = this.getActiveCountry();
    return country ? country.states[this.activeStateIndex] || null : null;
  }

  handleDocumentClick(event) {
    if (event.target === this.input) {
      return;
    }

    if (!this.overlay.contains(event.target)) {
      this.close();
    }
  }

  handleEscape(event) {
    if (event.key === 'Escape') {
      this.close();
    }
  }

  handleRelayout() {
    if (!this.isOpen) return;
    this.positionOverlay();
  }

  positionOverlay() {
    const rect = this.input.getBoundingClientRect();
    const scrollX = window.scrollX || document.documentElement.scrollLeft;
    const scrollY = window.scrollY || document.documentElement.scrollTop;

    const maxWidth = Math.min(720, window.innerWidth - 32);
    const overlayWidth = maxWidth;
    this.overlay.style.width = `${overlayWidth}px`;

    const overlayHeight = this.overlay.offsetHeight;

    let top = scrollY + rect.bottom + 8;
    let left = scrollX + rect.left;

    if (top + overlayHeight > scrollY + window.innerHeight - 16) {
      top = scrollY + rect.top - overlayHeight - 8;
    }

    if (top < scrollY + 8) {
      top = scrollY + 8;
    }

    if (left + overlayWidth > scrollX + window.innerWidth - 16) {
      left = scrollX + window.innerWidth - overlayWidth - 16;
    }

    if (left < scrollX + 8) {
      left = scrollX + 8;
    }

    this.overlay.style.top = `${top}px`;
    this.overlay.style.left = `${left}px`;
  }

  setInitialSelection(info) {
    this.pendingSelection = info;
    this.applyPendingSelection();
  }

  applyPendingSelection() {
    if (!this.pendingSelection || !this.countries.length) {
      return;
    }

    const { selection, city } = this.pendingSelection;
    let target = null;

    if (selection && selection.country && selection.state && selection.city) {
      target = this.findLocation(selection.city, selection.state, selection.country);
    }

    if (!target && city) {
      target = this.findLocation(city);
    }

    if (target) {
      this.activeCountryIndex = target.countryIndex;
      this.activeStateIndex = target.stateIndex;
      this.selection = {
        country: target.country.name,
        state: target.state.name,
        city: target.city.name
      };
    }

    this.pendingSelection = null;
    this.renderColumns();
  }

  findLocation(cityName, stateName = null, countryName = null) {
    const lowerCity = (cityName || '').toLowerCase();
    const lowerState = stateName ? stateName.toLowerCase() : null;
    const lowerCountry = countryName ? countryName.toLowerCase() : null;

    for (let countryIndex = 0; countryIndex < this.countries.length; countryIndex += 1) {
      const country = this.countries[countryIndex];
      if (lowerCountry && !country.lowerName.includes(lowerCountry)) {
        continue;
      }

      for (let stateIndex = 0; stateIndex < country.states.length; stateIndex += 1) {
        const state = country.states[stateIndex];
        if (lowerState && !state.lowerName.includes(lowerState)) {
          continue;
        }

        for (let cityIndex = 0; cityIndex < state.cities.length; cityIndex += 1) {
          const city = state.cities[cityIndex];
          if (city.lowerName === lowerCity || city.name === cityName) {
            return { countryIndex, stateIndex, cityIndex, country, state, city };
          }
        }
      }
    }

    return null;
  }

  getLocalizedName({ type, name, countryName }) {
    const english = name || '';
    const isChina = (countryName || english).toLowerCase() === 'china';
    const result = { text: english, promise: null };

    if (!english) {
      result.text = '';
      return result;
    }

    if (type === 'country') {
      if (english.toLowerCase() === 'china') {
        result.text = '中国';
        return result;
      }

      result.promise = this.translateToChinese(english).then((translated) => {
        if (translated && translated.toLowerCase() !== english.toLowerCase()) {
          return `${translated} (${english})`;
        }
        return english;
      });
      return result;
    }

    if (isChina) {
      if (type === 'state') {
        const mapped = CHINA_STATE_LABELS[english];
        if (mapped) {
          result.text = mapped;
          return result;
        }
      }

      result.promise = this.translateToChinese(english).then((translated) => {
        if (translated) {
          return translated;
        }
        return english;
      });
      return result;
    }

    result.promise = this.translateToChinese(english).then((translated) => {
      if (translated && translated.toLowerCase() !== english.toLowerCase()) {
        return `${translated} (${english})`;
      }
      return english;
    });

    return result;
  }

  translate(text, from, to) {
    const key = `${from}|${to}|${text}`;
    if (this.translationCache.has(key)) {
      return Promise.resolve(this.translationCache.get(key));
    }

    if (this.translationInFlight.has(key)) {
      return this.translationInFlight.get(key);
    }

    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${from}|${to}`;
    const promise = fetch(url)
      .then((response) => {
        if (!response.ok) {
          throw new Error('翻译服务请求失败');
        }
        return response.json();
      })
      .then((data) => {
        const translation = data?.responseData?.translatedText;
        const normalized = typeof translation === 'string' ? translation.trim() : '';
        this.translationCache.set(key, normalized);
        return normalized;
      })
      .catch((error) => {
        console.warn('翻译失败:', error);
        this.translationCache.set(key, '');
        return '';
      })
      .finally(() => {
        this.translationInFlight.delete(key);
      });

    this.translationInFlight.set(key, promise);
    return promise;
  }

  translateToEnglish(text) {
    if (!text) return Promise.resolve('');
    return this.translate(text, 'zh-CN', 'en');
  }

  translateToChinese(text) {
    if (!text) return Promise.resolve('');
    return this.translate(text, 'en', 'zh-CN');
  }
}

// ========== 导出供 HTML 调用 ==========
window.toggleEditMode = toggleEditMode;
window.cancelEdit = cancelEdit;
window.saveProfile = saveProfile;
