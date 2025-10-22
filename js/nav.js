/**
 * 导航页脚本
 * 处理导航、导出/导入、数据管理等功能
 */

// ========== 初始化 ==========
document.addEventListener('DOMContentLoaded', () => {
  // 更新欢迎文本
  const userInfo = StorageManager.getUserInfo();
  document.getElementById('welcomeText').textContent = `欢迎，${userInfo.name}`;

  // 更新存储使用情况
  updateStorageUsage();

  console.log('✨ 导航页加载完成');
});

// ========== 存储使用情况 ==========
function updateStorageUsage() {
  const info = StorageManager.getStorageInfo();
  const storageUsageEl = document.getElementById('storageUsage');
  storageUsageEl.textContent = `${info.mb} MB / 5 MB (${info.percentage})`;
}

// ========== 导出功能 ==========
function showExportModal() {
  const modal = document.getElementById('exportModal');
  const exportData = document.getElementById('exportData');

  try {
    const data = StorageManager.exportAllData();
    exportData.value = data;
    modal.classList.add('active');
  } catch (e) {
    console.error('导出数据失败:', e);
    alert('导出数据失败，请重试');
  }
}

function closeExportModal() {
  const modal = document.getElementById('exportModal');
  modal.classList.remove('active');
}

function downloadExportData() {
  const exportData = document.getElementById('exportData').value;
  if (!exportData) {
    alert('没有数据可导出');
    return;
  }

  try {
    const blob = new Blob([exportData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `personal-growth-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    console.log('✓ 数据导出成功');
    alert('数据导出成功！');
    closeExportModal();
  } catch (e) {
    console.error('下载失败:', e);
    alert('下载失败，请重试');
  }
}

function copyExportData() {
  const exportData = document.getElementById('exportData');
  exportData.select();

  try {
    document.execCommand('copy');
    alert('✓ 已复制到剪贴板');
  } catch (e) {
    console.error('复制失败:', e);
    alert('复制失败，请手动复制');
  }
}

// ========== 导入功能 ==========
function triggerImportFile() {
  document.getElementById('importFile').click();
}

function handleFileImport(event) {
  const file = event.target.files[0];
  if (!file) return;

  // 验证文件类型
  if (file.type !== 'application/json' && !file.name.endsWith('.json')) {
    alert('请选择 JSON 格式的备份文件');
    return;
  }

  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const jsonData = e.target.result;
      const confirmed = confirm('确认要导入数据吗？这将覆盖现有数据。\n\n建议先导出当前数据进行备份。');

      if (!confirmed) {
        return;
      }

      // 导入数据
      if (StorageManager.importData(jsonData)) {
        console.log('✓ 数据导入成功');
        alert('✓ 数据导入成功！页面将刷新以应用更改');
        // 刷新页面
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } else {
        alert('✗ 导入失败，请确保文件格式正确');
      }
    } catch (error) {
      console.error('读取文件失败:', error);
      alert('✗ 读取文件失败，请确保文件格式正确');
    }
  };

  reader.readAsText(file);

  // 重置 input，以便下次能选择同一文件
  event.target.value = '';
}

// ========== 导航功能 ==========
function goBack() {
  if (window.history.length > 1) {
    window.history.back();
  } else {
    window.location.href = 'index.html';
  }
}

// ========== 关闭模态框（背景点击） ==========
document.getElementById('exportModal')?.addEventListener('click', (e) => {
  if (e.target.id === 'exportModal') {
    closeExportModal();
  }
});

// ========== 键盘快捷键 ==========
document.addEventListener('keydown', (e) => {
  // Esc 关闭模态框
  if (e.key === 'Escape') {
    closeExportModal();
  }

  // Ctrl/Cmd + S 导出
  if ((e.ctrlKey || e.metaKey) && e.key === 's') {
    e.preventDefault();
    showExportModal();
  }
});

// ========== 定期更新存储使用情况 ==========
setInterval(updateStorageUsage, 5000);
