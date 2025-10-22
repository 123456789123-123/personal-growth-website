/**
 * 编辑书籍页面 - JavaScript
 */

let editingBookId = null;
let elements = {};

document.addEventListener('DOMContentLoaded', () => {
  cacheElements();
  loadBookData();
  bindEvents();
});

function cacheElements() {
  elements = {
    pageTitle: document.getElementById('pageTitle'),
    backBtn: document.getElementById('backBtn'),
    cancelBtn: document.getElementById('cancelBtn'),
    bookForm: document.getElementById('bookForm'),
    bookName: document.getElementById('bookName'),
    bookAuthor: document.getElementById('bookAuthor'),
    bookRating: document.getElementById('bookRating'),
    readingStatus: document.getElementById('readingStatus'),
    startDate: document.getElementById('startDate'),
    finishDate: document.getElementById('finishDate'),
    toast: document.getElementById('toast')
  };
}

function loadBookData() {
  // 从 URL 获取 bookId 参数
  const urlParams = new URLSearchParams(window.location.search);
  editingBookId = urlParams.get('bookId');

  if (editingBookId) {
    // 编辑模式
    elements.pageTitle.textContent = '编辑书籍';
    const books = StorageManager.getBooks();
    const book = books.find(b => b.id === editingBookId);

    if (book) {
      elements.bookName.value = book.bookName || '';
      elements.bookAuthor.value = book.author || '';
      elements.bookRating.value = book.rating || 4;
      elements.readingStatus.value = book.readingStatus || '在读';
      elements.startDate.value = book.startDate || '';
      elements.finishDate.value = book.finishDate || '';
    } else {
      showToast('书籍不存在', 'error');
      setTimeout(() => goBack(), 1500);
    }
  } else {
    // 添加模式
    elements.pageTitle.textContent = '添加书籍';
  }
}

function bindEvents() {
  elements.backBtn?.addEventListener('click', goBack);
  elements.cancelBtn?.addEventListener('click', goBack);
  elements.bookForm?.addEventListener('submit', handleSubmit);
}

function handleSubmit(e) {
  e.preventDefault();

  const bookData = {
    bookName: elements.bookName.value.trim(),
    author: elements.bookAuthor.value.trim(),
    rating: parseInt(elements.bookRating.value),
    readingStatus: elements.readingStatus.value,
    startDate: elements.startDate.value,
    finishDate: elements.finishDate.value
  };

  if (!bookData.bookName) {
    showToast('请输入书名', 'error');
    return;
  }

  if (editingBookId) {
    // 编辑模式 - 保留原有的封面和笔记
    const books = StorageManager.getBooks();
    const existingBook = books.find(b => b.id === editingBookId);

    bookData.cover = existingBook.cover;
    bookData.notes = existingBook.notes || [];

    if (StorageManager.updateBook(editingBookId, bookData)) {
      showToast('书籍更新成功');
      setTimeout(() => goBack(), 1000);
    } else {
      showToast('更新失败，请重试', 'error');
    }
  } else {
    // 添加模式
    bookData.cover = StorageManager.getPlaceholderImage(300, 400);
    bookData.notes = [];

    if (StorageManager.addBook(bookData)) {
      showToast('书籍添加成功');
      setTimeout(() => goBack(), 1000);
    } else {
      showToast('添加失败，请重试', 'error');
    }
  }
}

function goBack() {
  window.location.href = 'books.html';
}

function showToast(message, type = 'success') {
  elements.toast.textContent = message;
  elements.toast.className = `toast ${type}`;
  elements.toast.classList.add('show');

  setTimeout(() => {
    elements.toast.classList.remove('show');
  }, 3000);
}
