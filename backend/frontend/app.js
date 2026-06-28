const apiBase = '/api/v1';
let currentUser = null;
let authToken = null;
let activeView = 'feed';

const views = {
  feed: document.getElementById('feedView'),
  write: document.getElementById('writeView'),
  categories: document.getElementById('categoriesView'),
};
const navButtons = document.querySelectorAll('.nav-link');
const authButton = document.getElementById('authButton');
const authModal = document.getElementById('authModal');
const closeAuthModal = document.getElementById('closeAuthModal');
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const modalTabs = document.querySelectorAll('.modal-tab');
const searchInput = document.getElementById('searchInput');
const searchButton = document.getElementById('searchButton');
const postsContainer = document.getElementById('postsContainer');
const categoriesList = document.getElementById('categoriesList');
const postForm = document.getElementById('postForm');
const postCategory = document.getElementById('postCategory');
const notificationsList = document.getElementById('notificationsList');
const notificationBadge = document.getElementById('notificationBadge');
const accountArea = document.getElementById('accountArea');
const analyticsStats = document.getElementById('analyticsStats');
const themeToggle = document.getElementById('themeToggle');
const editor = document.getElementById('editor');
const editorToolbar = document.getElementById('editorToolbar');
const clearEditor = document.getElementById('clearEditor');
const notificationsButton = document.getElementById('notificationsButton');

const loadState = () => {
  authToken = localStorage.getItem('blogToken');
  currentUser = JSON.parse(localStorage.getItem('blogUser')) || null;
  const savedTheme = localStorage.getItem('blogTheme');
  if (savedTheme) {
    document.documentElement.classList.toggle('dark', savedTheme === 'dark');
  }
};

const saveState = () => {
  if (authToken) {
    localStorage.setItem('blogToken', authToken);
  }
  if (currentUser) {
    localStorage.setItem('blogUser', JSON.stringify(currentUser));
  }
};

const fetchJSON = async (url, options = {}) => {
  const headers = options.headers || {};
  if (authToken) {
    headers.Authorization = `Bearer ${authToken}`;
  }
  const response = await fetch(url, { ...options, headers });
  if (!response.ok) {
    const content = await response.json().catch(() => ({}));
    throw new Error(content.message || 'Request failed');
  }
  return response.json();
};

const setView = (view) => {
  activeView = view;
  navButtons.forEach((button) => {
    button.classList.toggle('active', button.dataset.view === view);
  });
  Object.entries(views).forEach(([key, element]) => {
    element.classList.toggle('hidden', key !== view);
  });
};

const updateAuthUI = () => {
  if (currentUser) {
    authButton.textContent = 'Logout';
    accountArea.innerHTML = `
      <div class="account-card">
        <strong>${currentUser.name}</strong>
        <p>${currentUser.email}</p>
        <div class="post-meta">
          <span>${currentUser.role.toUpperCase()}</span>
          <span>Theme: ${currentUser.theme || 'light'}</span>
        </div>
        <button id="themeApply">Toggle theme</button>
      </div>`;
    document.getElementById('themeApply').addEventListener('click', () => toggleTheme());
  } else {
    authButton.textContent = 'Login';
    accountArea.innerHTML = '<p class="muted">Login or register to access your dashboard and publish posts.</p>';
  }
};

const toggleTheme = (forceMode) => {
  const isDark = forceMode ? forceMode === 'dark' : !document.documentElement.classList.contains('dark');
  document.documentElement.classList.toggle('dark', isDark);
  localStorage.setItem('blogTheme', isDark ? 'dark' : 'light');
  if (currentUser && currentUser.id) {
    fetchJSON(`${apiBase}/users/${currentUser.id}/theme`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ theme: isDark ? 'dark' : 'light' }),
    }).then((data) => {
      currentUser = data.user;
      saveState();
      updateAuthUI();
    }).catch(() => {});
  }
};

const openAuthModal = () => {
  authModal.classList.remove('hidden');
};

const closeModal = () => {
  authModal.classList.add('hidden');
};

const showLogin = () => {
  loginForm.classList.remove('hidden');
  registerForm.classList.add('hidden');
  modalTabs.forEach((tab) => {
    tab.classList.toggle('active', tab.dataset.tab === 'login');
  });
};

const showRegister = () => {
  loginForm.classList.add('hidden');
  registerForm.classList.remove('hidden');
  modalTabs.forEach((tab) => {
    tab.classList.toggle('active', tab.dataset.tab === 'register');
  });
};

const renderPosts = (posts) => {
  if (!posts.length) {
    postsContainer.innerHTML = '<div class="post-card"><p class="muted">No posts found. Publish the first story!</p></div>';
    return;
  }

  postsContainer.innerHTML = posts
    .map((post) => {
      const tags = (post.tags || []).map((tag) => `<span class="tag-pill">#${tag}</span>`).join('');
      return `
        <article class="post-card">
          <div class="post-meta">
            <span>${post.category?.name || 'Uncategorized'}</span>
            <span>by ${post.author?.name || 'Unknown'}</span>
            <span>${new Date(post.createdAt).toLocaleDateString()}</span>
          </div>
          <h3>${post.title}</h3>
          <p class="muted">${post.content.replace(/<[^>]+>/g, '').slice(0, 180)}${post.content.length > 180 ? '…' : ''}</p>
          <div class="post-tags">${tags}</div>
          <div class="post-actions">
            <button data-action="like" data-id="${post._id}">❤️ ${post.likes?.length || 0}</button>
            <button data-action="comment" data-id="${post._id}">💬 ${post.comments?.length || 0}</button>
            <button data-action="bookmark" data-id="${post._id}">🔖</button>
          </div>
          <div class="post-comment-form hidden" id="commentForm-${post._id}">
            <textarea rows="3" placeholder="Write a comment..."></textarea>
            <button class="button button-primary" data-action="submitComment" data-id="${post._id}">Submit</button>
          </div>
        </article>`;
    })
    .join('');
};

const loadPosts = async (query = {}) => {
  try {
    const params = new URLSearchParams(query).toString();
    const url = `${apiBase}/posts${params ? `?${params}` : ''}`;
    const data = await fetchJSON(url);
    renderPosts(data.posts || []);
  } catch (error) {
    postsContainer.innerHTML = `<div class="post-card"><p class="muted">${error.message}</p></div>`;
  }
};

const loadCategories = async () => {
  try {
    const data = await fetchJSON(`${apiBase}/categories`);
    const categories = data.categories || [];
    categoriesList.innerHTML = categories
      .map(
        (category) => `
      <div class="category-card">
        <h4>${category.name}</h4>
        <p class="muted">${category.slug}</p>
        <button data-action="category" data-id="${category._id}">Browse</button>
      </div>`
      )
      .join('');

    postCategory.innerHTML = `<option value="">Select category</option>${categories
      .map((category) => `<option value="${category._id}">${category.name}</option>`)
      .join('')}`;
  } catch (error) {
    categoriesList.innerHTML = `<p class="muted">${error.message}</p>`;
  }
};

const loadNotifications = async () => {
  if (!currentUser) return;
  try {
    const data = await fetchJSON(`${apiBase}/notifications`);
    const notifications = data.notifications || [];
    notificationBadge.textContent = notifications.filter((item) => !item.read).length;
    notificationBadge.classList.toggle('hidden', notifications.length === 0);
    notificationsList.innerHTML = notifications
      .slice(0, 4)
      .map(
        (notification) => `
          <div class="notification-card">
            <strong>${notification.message}</strong>
            <p class="muted">${new Date(notification.createdAt).toLocaleString()}</p>
          </div>`
      )
      .join('') || '<p class="muted">No notifications yet.</p>';
  } catch (error) {
    notificationsList.innerHTML = `<p class="muted">${error.message}</p>`;
  }
};

const loadAnalytics = async () => {
  if (!currentUser || currentUser.role !== 'admin') {
    analyticsStats.innerHTML = '<p class="muted">Analytics available for admins after login.</p>';
    return;
  }
  try {
    const data = await fetchJSON(`${apiBase}/admin/analytics`);
    const analytics = data.analytics || {};
    analyticsStats.innerHTML = Object.entries(analytics)
      .map(
        ([key, value]) => `
        <div class="analytics-card">
          <h4>${key.replace(/([A-Z])/g, ' $1')}</h4>
          <p>${Array.isArray(value) ? value.length : value}</p>
        </div>`
      )
      .join('');
  } catch (error) {
    analyticsStats.innerHTML = `<p class="muted">${error.message}</p>`;
  }
};

const handleAuthSubmit = async (formType) => {
  try {
    const url = `${apiBase}/auth/${formType}`;
    const values = formType === 'login'
      ? {
          email: document.getElementById('loginEmail').value,
          password: document.getElementById('loginPassword').value,
        }
      : {
          name: document.getElementById('registerName').value,
          email: document.getElementById('registerEmail').value,
          password: document.getElementById('registerPassword').value,
        };

    const data = await fetchJSON(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(values),
    });

    authToken = data.token;
    currentUser = data.user;
    saveState();
    updateAuthUI();
    closeModal();
    await loadNotifications();
    await loadAnalytics();
    await loadPosts();
  } catch (error) {
    alert(error.message);
  }
};

const handlePostSubmit = async (event) => {
  event.preventDefault();
  if (!currentUser) {
    openAuthModal();
    return;
  }
  try {
    const formData = new FormData();
    formData.append('title', document.getElementById('postTitle').value);
    formData.append('category', postCategory.value);
    formData.append('tags', document.getElementById('postTags').value);
    formData.append('content', editor.innerHTML);
    const image = document.getElementById('postImage').files[0];
    if (image) formData.append('image', image);

    await fetchJSON(`${apiBase}/posts/create`, {
      method: 'POST',
      body: formData,
    });

    alert('Post published successfully');
    postForm.reset();
    editor.innerHTML = '';
    loadPosts();
  } catch (error) {
    alert(error.message);
  }
};

const handlePostAction = async (event) => {
  const button = event.target.closest('button');
  if (!button) return;
  const action = button.dataset.action;
  const postId = button.dataset.id;
  if (!action || !postId) return;

  if (!currentUser) {
    openAuthModal();
    return;
  }

  if (action === 'like') {
    try {
      await fetchJSON(`${apiBase}/posts/${postId}/likes`, { method: 'POST' });
      loadPosts();
      loadNotifications();
    } catch (error) {
      alert(error.message);
    }
    return;
  }

  if (action === 'bookmark') {
    try {
      await fetchJSON(`${apiBase}/bookmarks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ post: postId }),
      });
      alert('Post bookmarked');
    } catch (error) {
      alert(error.message);
    }
    return;
  }

  if (action === 'comment') {
    const form = document.getElementById(`commentForm-${postId}`);
    form.classList.toggle('hidden');
    return;
  }

  if (action === 'submitComment') {
    const form = document.getElementById(`commentForm-${postId}`);
    const textarea = form.querySelector('textarea');
    if (!textarea.value.trim()) {
      alert('Comment cannot be empty');
      return;
    }
    try {
      await fetchJSON(`${apiBase}/posts/${postId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body: textarea.value }),
      });
      textarea.value = '';
      loadPosts();
      loadNotifications();
    } catch (error) {
      alert(error.message);
    }
  }
};

const initEditorToolbar = () => {
  editorToolbar.addEventListener('click', (event) => {
    const button = event.target.closest('button');
    if (!button) return;
    const command = button.dataset.command;
    if (command === 'createLink') {
      const url = prompt('Enter a URL');
      if (url) document.execCommand(command, false, url);
      return;
    }
    document.execCommand(command, false, null);
  });
};

const handleCategoryClick = async (event) => {
  const button = event.target.closest('button');
  if (!button) return;
  if (button.dataset.action === 'category') {
    dataLoad({ category: button.dataset.id });
    setView('feed');
  }
};

const dataLoad = async (query = {}) => {
  await loadPosts(query);
  await loadCategories();
  if (currentUser) {
    await loadNotifications();
    await loadAnalytics();
  }
};

const clearEditorContent = () => {
  editor.innerHTML = '';
};

const setupEventListeners = () => {
  navButtons.forEach((button) => {
    button.addEventListener('click', () => setView(button.dataset.view));
  });

  document.querySelectorAll('[data-view]').forEach((button) => {
    button.addEventListener('click', () => setView(button.dataset.view));
  });

  authButton.addEventListener('click', () => {
    if (currentUser) {
      authToken = null;
      currentUser = null;
      localStorage.removeItem('blogToken');
      localStorage.removeItem('blogUser');
      updateAuthUI();
    } else {
      openAuthModal();
    }
  });

  closeAuthModal.addEventListener('click', closeModal);
  authModal.addEventListener('click', (event) => {
    if (event.target === authModal) closeModal();
  });

  modalTabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      if (tab.dataset.tab === 'login') showLogin();
      else showRegister();
    });
  });

  loginForm.addEventListener('submit', (event) => {
    event.preventDefault();
    handleAuthSubmit('login');
  });

  registerForm.addEventListener('submit', (event) => {
    event.preventDefault();
    handleAuthSubmit('register');
  });

  searchButton.addEventListener('click', () => loadPosts({ keyword: searchInput.value.trim() }));
  searchInput.addEventListener('keypress', (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      loadPosts({ keyword: searchInput.value.trim() });
    }
  });

  postForm.addEventListener('submit', handlePostSubmit);
  clearEditor.addEventListener('click', clearEditorContent);
  document.body.addEventListener('click', handlePostAction);
  categoriesList.addEventListener('click', handleCategoryClick);
  themeToggle.addEventListener('click', () => toggleTheme());
  notificationsButton.addEventListener('click', () => setView('categories'));
};

const init = async () => {
  loadState();
  updateAuthUI();
  setView(activeView);
  setupEventListeners();
  initEditorToolbar();
  await dataLoad();
};

window.addEventListener('DOMContentLoaded', init);
