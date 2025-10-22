/**
 * 读书笔记列表页面 - JavaScript
 */

const state = {
  currentBookId: null,
  book: null,
  notes: [],
  editingNoteId: null,
  deletingNoteId: null
};

let elements = {};

document.addEventListener('DOMContentLoaded', () => {
  cacheElements();
  loadBookData();
  bindEvents();
});

function cacheElements() {
  elements = {
    // 顶部信息
    bookTitle: document.getElementById('bookTitle'),
    bookMeta: document.getElementById('bookMeta'),

    // 书籍信息卡片
    bookCover: document.getElementById('bookCover'),
    bookNameDisplay: document.getElementById('bookNameDisplay'),
    authorDisplay: document.getElementById('authorDisplay'),
    ratingDisplay: document.getElementById('ratingDisplay'),
    statusDisplay: document.getElementById('statusDisplay'),
    dateDisplay: document.getElementById('dateDisplay'),
    notesCount: document.getElementById('notesCount'),

    // 操作按钮
    editBookBtn: document.getElementById('editBookBtn'),
    deleteBookBtn: document.getElementById('deleteBookBtn'),

    // 添加笔记
    newNoteInput: document.getElementById('newNoteInput'),
    addNoteBtn: document.getElementById('addNoteBtn'),

    // 笔记列表
    notesList: document.getElementById('notesList'),
    emptyState: document.getElementById('emptyState'),

    // 删除笔记弹窗
    deleteNoteModal: document.getElementById('deleteNoteModal'),
    closeDeleteNoteModal: document.getElementById('closeDeleteNoteModal'),
    cancelDeleteNote: document.getElementById('cancelDeleteNote'),
    confirmDeleteNote: document.getElementById('confirmDeleteNote'),

    toast: document.getElementById('toast')
  };
}

function loadBookData() {
  const urlParams = new URLSearchParams(window.location.search);
  state.currentBookId = urlParams.get('bookId');

  if (!state.currentBookId) {
    showToast('缺少书籍ID', 'error');
    setTimeout(() => window.location.href = 'books.html', 1500);
    return;
  }

  const books = StorageManager.getBooks();
  state.book = books.find(b => b.id === state.currentBookId);

  if (!state.book) {
    showToast('书籍不存在', 'error');
    setTimeout(() => window.location.href = 'books.html', 1500);
    return;
  }

  state.notes = state.book.notes || [];
  renderBookInfo();
  renderNotes();
}

function bindEvents() {
  // 编辑书籍 - 跳转到编辑页面
  elements.editBookBtn?.addEventListener('click', () => {
    window.location.href = `edit-book.html?bookId=${state.currentBookId}`;
  });

  // 删除书籍
  elements.deleteBookBtn?.addEventListener('click', deleteBook);

  // 添加笔记
  elements.addNoteBtn?.addEventListener('click', handleAddNote);

  // 支持 Ctrl+Enter 快速添加
  elements.newNoteInput?.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.key === 'Enter') {
      handleAddNote();
    }
  });

  // 删除笔记弹窗
  elements.closeDeleteNoteModal?.addEventListener('click', closeDeleteNoteModal);
  elements.cancelDeleteNote?.addEventListener('click', closeDeleteNoteModal);
  elements.deleteNoteModal?.addEventListener('click', (e) => {
    if (e.target === elements.deleteNoteModal) {
      closeDeleteNoteModal();
    }
  });
  elements.confirmDeleteNote?.addEventListener('click', confirmDeleteNote);
}

// ========== 渲染书籍信息 ==========

function renderBookInfo() {
  // 顶部标题
  elements.bookTitle.textContent = state.book.bookName;
  elements.bookMeta.textContent = `${state.book.author || '未知作者'} · ${'⭐'.repeat(state.book.rating || 4)}`;

  // 封面
  const img = elements.bookCover.querySelector('img');
  if (img && state.book.cover) {
    img.src = state.book.cover;
    img.alt = state.book.bookName;
  }

  // 详细信息
  elements.bookNameDisplay.textContent = state.book.bookName;
  elements.authorDisplay.textContent = state.book.author || '未知作者';
  elements.ratingDisplay.textContent = '⭐'.repeat(state.book.rating || 4);
  elements.statusDisplay.textContent = state.book.readingStatus || '在读';

  // 日期
  let dateText = '';
  if (state.book.startDate) {
    dateText = state.book.finishDate
      ? `${formatDate(state.book.startDate)} - ${formatDate(state.book.finishDate)}`
      : `开始于 ${formatDate(state.book.startDate)}`;
  } else {
    dateText = '未设置阅读日期';
  }
  elements.dateDisplay.textContent = dateText;

  // 笔记数量
  elements.notesCount.textContent = `${state.notes.length} 条笔记`;
}

// ========== 添加笔记 ==========

function handleAddNote() {
  const content = elements.newNoteInput.value.trim();

  if (!content) {
    showToast('请输入笔记内容', 'error');
    return;
  }

  const newNote = {
    id: StorageManager.generateId(),
    content: content,
    createTime: new Date().toISOString()
  };

  state.notes.unshift(newNote); // 新笔记放在最前面
  state.book.notes = state.notes;

  if (StorageManager.updateBook(state.currentBookId, state.book)) {
    elements.newNoteInput.value = ''; // 清空输入框
    showToast('笔记添加成功');
    renderNotes();
    renderBookInfo(); // 更新笔记数量
  } else {
    showToast('添加失败，请重试', 'error');
    state.notes.shift(); // 回滚
  }
}

// ========== 渲染笔记列表 ==========

function renderNotes() {
  if (state.notes.length === 0) {
    elements.notesList.style.display = 'none';
    elements.emptyState.hidden = false;
    return;
  }

  elements.notesList.style.display = 'flex';
  elements.emptyState.hidden = true;

  elements.notesList.innerHTML = state.notes
    .map(note => createNoteItem(note))
    .join('');

  bindNoteEvents();
}

function createNoteItem(note) {
  const isEditing = state.editingNoteId === note.id;
  const formattedTime = formatDateTime(note.createTime);
  const previewContent = note.content.length > 150
    ? note.content.substring(0, 150) + '...'
    : note.content;

  if (isEditing) {
    return `
      <div class="note-item note-item--editing" data-note-id="${note.id}">
        <div class="note-item__header">
          <div class="note-item__time">
            <i class="fas fa-clock"></i>
            ${formattedTime}
            <span style="color: #f5576c; margin-left: 0.5rem;">(时间不可修改)</span>
          </div>
        </div>
        <div class="note-item__edit-form">
          <textarea id="editNoteContent-${note.id}">${escapeHtml(note.content)}</textarea>
          <div class="note-item__edit-actions">
            <button class="btn btn-outline" data-action="cancel-edit">取消</button>
            <button class="btn btn-primary" data-action="save-edit">
              <i class="fas fa-save"></i>
              <span>保存</span>
            </button>
          </div>
        </div>
      </div>
    `;
  }

  return `
    <div class="note-item" data-note-id="${note.id}">
      <div class="note-item__header">
        <div class="note-item__time">
          <i class="fas fa-clock"></i>
          ${formattedTime}
        </div>
        <div class="note-item__actions">
          <button class="note-item__action-btn note-item__action-btn--edit" data-action="edit" title="编辑">
            <i class="fas fa-edit"></i>
          </button>
          <button class="note-item__action-btn note-item__action-btn--delete" data-action="delete" title="删除">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      </div>
      <div class="note-item__content">${escapeHtml(previewContent)}</div>
      ${note.content.length > 150 ? '<div class="note-item__read-more">查看完整内容 <i class="fas fa-chevron-right"></i></div>' : ''}
    </div>
  `;
}

function bindNoteEvents() {
  document.querySelectorAll('.note-item').forEach(item => {
    const noteId = item.dataset.noteId;
    const editBtn = item.querySelector('[data-action="edit"]');
    const deleteBtn = item.querySelector('[data-action="delete"]');
    const saveBtn = item.querySelector('[data-action="save-edit"]');
    const cancelBtn = item.querySelector('[data-action="cancel-edit"]');

    // 点击卡片查看详情（如果不是编辑模式）
    if (!item.classList.contains('note-item--editing')) {
      item.addEventListener('click', (e) => {
        // 如果点击的是按钮，不触发
        if (e.target.closest('[data-action]')) return;
        window.location.href = `note-detail.html?bookId=${state.currentBookId}&noteId=${noteId}`;
      });
    }

    // 编辑按钮
    editBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      enterEditMode(noteId);
    });

    // 删除按钮
    deleteBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      openDeleteNoteModal(noteId);
    });

    // 保存编辑
    saveBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      saveNoteEdit(noteId);
    });

    // 取消编辑
    cancelBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      cancelEdit();
    });
  });
}

// ========== 编辑笔记 ==========

function enterEditMode(noteId) {
  // 如果已经有正在编辑的笔记，先取消
  if (state.editingNoteId && state.editingNoteId !== noteId) {
    cancelEdit();
  }

  state.editingNoteId = noteId;
  renderNotes();

  // 聚焦到编辑框
  const textarea = document.getElementById(`editNoteContent-${noteId}`);
  if (textarea) {
    textarea.focus();
    textarea.setSelectionRange(textarea.value.length, textarea.value.length);
  }
}

function saveNoteEdit(noteId) {
  const textarea = document.getElementById(`editNoteContent-${noteId}`);
  const newContent = textarea.value.trim();

  if (!newContent) {
    showToast('笔记内容不能为空', 'error');
    return;
  }

  const note = state.notes.find(n => n.id === noteId);
  if (!note) return;

  const oldContent = note.content;
  note.content = newContent;
  // 时间不修改，保持原有的 createTime

  state.book.notes = state.notes;

  if (StorageManager.updateBook(state.currentBookId, state.book)) {
    showToast('笔记已更新');
    state.editingNoteId = null;
    renderNotes();
  } else {
    showToast('更新失败，请重试', 'error');
    note.content = oldContent; // 回滚
  }
}

function cancelEdit() {
  state.editingNoteId = null;
  renderNotes();
}

// ========== 删除笔记 ==========

function openDeleteNoteModal(noteId) {
  state.deletingNoteId = noteId;
  elements.deleteNoteModal.setAttribute('aria-hidden', 'false');
}

function closeDeleteNoteModal() {
  elements.deleteNoteModal.setAttribute('aria-hidden', 'true');
  state.deletingNoteId = null;
}

function confirmDeleteNote() {
  if (!state.deletingNoteId) return;

  const index = state.notes.findIndex(n => n.id === state.deletingNoteId);
  if (index === -1) return;

  state.notes.splice(index, 1);
  state.book.notes = state.notes;

  if (StorageManager.updateBook(state.currentBookId, state.book)) {
    showToast('笔记已删除');
    renderNotes();
    renderBookInfo(); // 更新笔记数量
    closeDeleteNoteModal();
  } else {
    showToast('删除失败，请重试', 'error');
  }
}

// ========== 删除书籍 ==========

function deleteBook() {
  if (!confirm(`确定要删除《${state.book.bookName}》及其所有笔记吗？此操作无法撤销。`)) {
    return;
  }

  if (StorageManager.deleteBook(state.currentBookId)) {
    showToast('书籍已删除');
    setTimeout(() => window.location.href = 'books.html', 1000);
  } else {
    showToast('删除失败，请重试', 'error');
  }
}

// ========== 工具函数 ==========

function formatDate(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return `${date.getFullYear()}.${(date.getMonth() + 1).toString().padStart(2, '0')}.${date.getDate().toString().padStart(2, '0')}`;
}

function formatDateTime(dateTimeStr) {
  if (!dateTimeStr) return '';
  const date = new Date(dateTimeStr);
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}`;
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
