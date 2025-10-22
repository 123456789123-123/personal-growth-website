/**
 * 首页脚本
 */

/**
 * 进入网站
 */
function enterWebsite() {
  // 添加点击动画
  const btn = event.target.closest('.enter-btn');
  btn.style.transform = 'scale(0.95)';

  // 延迟导航到导航页面
  setTimeout(() => {
    window.location.href = 'nav.html';
  }, 300);
}

// 页面加载完成后的初始化
document.addEventListener('DOMContentLoaded', () => {
  // 检查 localStorage 可用性
  if (!StorageManager.isAvailable()) {
    console.warn('⚠️ localStorage 不可用，部分功能将受限');
  }

  // 初始化用户数据（如果不存在）
  if (!StorageManager.getItem(StorageManager.KEYS.USER_INFO)) {
    const defaultUser = {
      name: '我',
      birthDate: '',
      city: '',
      signature: '记录生活，见证成长',
      avatar: StorageManager.getPlaceholderImage()
    };
    StorageManager.updateUserInfo(defaultUser);
  }

  console.log('✨ 欢迎来到个人成长网站');
});

// 支持回车键进入
document.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    const enterBtn = document.querySelector('.enter-btn');
    if (enterBtn && !enterBtn.disabled) {
      enterBtn.click();
    }
  }
});
