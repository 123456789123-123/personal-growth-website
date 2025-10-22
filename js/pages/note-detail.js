/**
 * 笔记详情页面 - JavaScript
 */

const state = {
  bookId: null,
  noteId: null,
  book: null,
  note: null
};

let elements = {};

document.addEventListener('DOMContentLoaded', () => {
  // 获取 URL 参数
  const urlParams = new URLSearchParams(window.location.search);
  state.bookId = urlParams.get('bookId');
  state.noteId = urlParams.get('noteId');

  if (!state.bookId || !state.noteId) {
    showToast('参数错误', 'error');
    setTimeout(() => {
      window.history.back();
    }, 2000);
    return;
  }

  cacheElements();
  bindEvents();
  loadData();
});

function cacheElements() {
  elements = {
    // 顶部导航
    bookTitleNav: document.getElementById('bookTitleNav'),
    noteTimeNav: document.getElementById('noteTimeNav'),
    editNoteBtn: document.getElementById('editNoteBtn'),
    deleteNoteBtn: document.getElementById('deleteNoteBtn'),
    backBtn: document.getElementById('backBtn'),

    // 笔记内容
    noteTime: document.getElementById('noteTime'),
    noteBook: document.getElementById('noteBook'),
    noteContent: document.getElementById('noteContent'),

    // 编辑笔记弹窗
    editNoteModal: document.getElementById('editNoteModal'),
    closeEditNoteModal: document.getElementById('closeEditNoteModal'),
    cancelEditNote: document.getElementById('cancelEditNote'),
    editNoteForm: document.getElementById('editNoteForm'),
    editNoteContent: document.getElementById('editNoteContent'),

    // 删除确认弹窗
    deleteNoteModal: document.getElementById('deleteNoteModal'),
    closeDeleteNoteModal: document.getElementById('closeDeleteNoteModal'),
    cancelDeleteNote: document.getElementById('cancelDeleteNote'),
    confirmDeleteNote: document.getElementById('confirmDeleteNote'),

    toast: document.getElementById('toast')
  };
}

function bindEvents() {
  // 返回按钮
  elements.backBtn?.addEventListener('click', () => {
    window.location.href = `book-notes.html?bookId=${state.bookId}`;
  });

  // 编辑笔记
  elements.editNoteBtn?.addEventListener('click', openEditNoteModal);
  elements.closeEditNoteModal?.addEventListener('click', closeEditNoteModal);
  elements.cancelEditNote?.addEventListener('click', closeEditNoteModal);
  elements.editNoteModal?.addEventListener('click', (e) => {
    if (e.target === elements.editNoteModal) closeEditNoteModal();
  });
  elements.editNoteForm?.addEventListener('submit', handleEditNoteSubmit);

  // 删除笔记
  elements.deleteNoteBtn?.addEventListener('click', openDeleteNoteModal);
  elements.closeDeleteNoteModal?.addEventListener('click', closeDeleteNoteModal);
  elements.cancelDeleteNote?.addEventListener('click', closeDeleteNoteModal);
  elements.deleteNoteModal?.addEventListener('click', (e) => {
    if (e.target === elements.deleteNoteModal) closeDeleteNoteModal();
  });
  elements.confirmDeleteNote?.addEventListener('click', confirmDeleteNote);
}

// ========== 加载数据 ==========

function loadData() {
  const books = StorageManager.getBooks();
  state.book = books.find(b => b.id === state.bookId);

  if (!state.book) {
    showToast('书籍不存在', 'error');
    setTimeout(() => {
      window.location.href = 'books.html';
    }, 2000);
    return;
  }

  if (!state.book.notes) {
    state.book.notes = [];
  }

  state.note = state.book.notes.find(n => n.id === state.noteId);

  if (!state.note) {
    showToast('笔记不存在', 'error');
    setTimeout(() => {
      window.location.href = `book-notes.html?bookId=${state.bookId}`;
    }, 2000);
    return;
  }

  renderNote();
}

// ========== 渲染笔记 ==========

function renderNote() {
  const book = state.book;
  const note = state.note;

  // 顶部导航
  elements.bookTitleNav.textContent = book.bookName;
  elements.noteTimeNav.textContent = formatDateTime(note.createTime);

  // 笔记元信息
  elements.noteTime.innerHTML = `
    <i class="fas fa-clock"></i>
    ${formatDateTime(note.createTime)}
  `;

  elements.noteBook.innerHTML = `
    <i class="fas fa-book"></i>
    ${escapeHtml(book.bookName)}
  `;

  // 笔记内容 - 保留换行
  const formattedContent = formatNoteContent(note.content);
  elements.noteContent.innerHTML = formattedContent;
}

// ========== 编辑笔记 ==========

function openEditNoteModal() {
  elements.editNoteContent.value = state.note.content || '';
  elements.editNoteModal.setAttribute('aria-hidden', 'false');
  elements.editNoteContent.focus();
}

function closeEditNoteModal() {
  elements.editNoteModal.setAttribute('aria-hidden', 'true');
}

function handleEditNoteSubmit(e) {
  e.preventDefault();

  const content = elements.editNoteContent.value.trim();
  if (!content) {
    showToast('请输入笔记内容', 'error');
    return;
  }

  // 更新笔记
  const noteIndex = state.book.notes.findIndex(n => n.id === state.noteId);
  if (noteIndex !== -1) {
    state.book.notes[noteIndex].content = content;
    state.book.notes[noteIndex].updateTime = new Date().toISOString();
  }

  // 保存到 localStorage
  if (StorageManager.updateBook(state.bookId, state.book)) {
    showToast('笔记更新成功');
    state.note.content = content;
    renderNote();
    closeEditNoteModal();
  } else {
    showToast('更新失败，请重试', 'error');
  }
}

// ========== 删除笔记 ==========

function openDeleteNoteModal() {
  elements.deleteNoteModal.setAttribute('aria-hidden', 'false');
}

function closeDeleteNoteModal() {
  elements.deleteNoteModal.setAttribute('aria-hidden', 'true');
}

function confirmDeleteNote() {
  // 从笔记数组中删除
  state.book.notes = state.book.notes.filter(n => n.id !== state.noteId);

  if (StorageManager.updateBook(state.bookId, state.book)) {
    showToast('笔记已删除');
    setTimeout(() => {
      window.location.href = `book-notes.html?bookId=${state.bookId}`;
    }, 1000);
  } else {
    showToast('删除失败，请重试', 'error');
  }
}

// ========== 工具函数 ==========

function formatDateTime(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}`;
}

function formatNoteContent(content) {
  if (!content) return '';

  // 转义 HTML 并保留换行
  const escaped = escapeHtml(content);

  // 将换行符转换为段落
  const paragraphs = escaped.split('\n').filter(line => line.trim());

  if (paragraphs.length === 0) return '';

  return paragraphs.map(p => `<p>${p}</p>`).join('');
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function showToast(message, type = 'success') {
  elements.toast.textContent = message;
  elements.toast.className = `toast ${type}`;
  elements.toast.classList.add('show');

  setTimeout(() => {
    elements.toast.classList.remove('show');
  }, 3000);
}
