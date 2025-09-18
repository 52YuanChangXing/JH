const state = {
  token: localStorage.getItem('jianhao-admin-token') || '',
  content: null,
  bookings: []
};

const elements = {
  authCard: document.getElementById('auth-card'),
  adminPanels: document.getElementById('admin-panels'),
  logoutButton: document.getElementById('logout-button'),
  globalFeedback: document.getElementById('global-feedback'),
  tokenForm: document.getElementById('token-form'),
  tokenInput: document.getElementById('admin-token'),
  authFeedback: document.getElementById('auth-feedback'),
  heroForm: document.getElementById('hero-form'),
  heroFeedback: document.getElementById('hero-feedback'),
  metricsForm: document.getElementById('metrics-form'),
  metricsFeedback: document.getElementById('metrics-feedback'),
  toggleForm: document.getElementById('toggle-form'),
  toggleGrid: document.getElementById('toggle-grid'),
  toggleFeedback: document.getElementById('toggle-feedback'),
  collectionSelect: document.getElementById('collection-select'),
  collectionTextarea: document.getElementById('collection-json'),
  collectionForm: document.getElementById('collection-form'),
  collectionFeedback: document.getElementById('collection-feedback'),
  collectionItemForm: document.getElementById('collection-item-form'),
  collectionItemTextarea: document.getElementById('collection-item-json'),
  collectionItemFeedback: document.getElementById('collection-item-feedback'),
  collectionDeleteForm: document.getElementById('collection-delete-form'),
  collectionDeleteInput: document.getElementById('collection-delete-id'),
  collectionDeleteFeedback: document.getElementById('collection-delete-feedback'),
  contentForm: document.getElementById('content-form'),
  contentTextarea: document.getElementById('content-json'),
  contentFeedback: document.getElementById('content-feedback'),
  bookingList: document.getElementById('booking-list')
};

const collectionLabels = {
  studioValues: '品牌价值主张',
  portfolio: '作品案例',
  services: '服务产品',
  photographers: '摄影师团队',
  testimonials: '客户推荐',
  faqs: '常见问题',
  timelineStages: '流程阶段',
  social: '社交链接'
};

const toggleLabels = {
  hero: '首页英雄区',
  values: '品牌价值',
  portfolio: '作品展示',
  services: '服务项目',
  photographers: '摄影团队',
  testimonials: '客户推荐',
  booking: '预约表单',
  progress: '项目进度',
  faq: '常见问题',
  contact: '联系信息'
};

function showGlobalFeedback(message, type = '') {
  elements.globalFeedback.textContent = message || '';
  elements.globalFeedback.className = `global-feedback${type ? ` ${type}` : ''}`;
}

function showFeedback(el, message, type = '') {
  if (!el) return;
  el.textContent = message || '';
  el.className = `form-feedback${type ? ` ${type}` : ''}`;
}

function setToken(token) {
  state.token = token;
  if (token) {
    localStorage.setItem('jianhao-admin-token', token);
  } else {
    localStorage.removeItem('jianhao-admin-token');
  }
  updateAuthUI(Boolean(token));
}

function updateAuthUI(isAuthenticated) {
  elements.authCard.classList.toggle('is-hidden', isAuthenticated);
  elements.adminPanels.classList.toggle('is-hidden', !isAuthenticated);
  elements.logoutButton.classList.toggle('is-hidden', !isAuthenticated);
  if (!isAuthenticated) {
    showGlobalFeedback('请输入有效令牌以管理站点内容。');
  }
}

async function fetchWithAuth(url, options = {}) {
  const config = { ...options };
  config.headers = { ...(options.headers || {}) };
  config.headers['X-Admin-Token'] = state.token;
  if (config.body && !config.headers['Content-Type']) {
    config.headers['Content-Type'] = 'application/json';
  }
  const response = await fetch(url, config);
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || '后台接口请求失败');
  }
  if (response.status === 204) {
    return null;
  }
  return response.json();
}

async function fetchPublic(url) {
  const response = await fetch(url);
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || '接口请求失败');
  }
  return response.json();
}

function fillHeroForm() {
  if (!state.content) return;
  const { hero = {} } = state.content;
  elements.heroForm.tagline.value = hero.tagline || '';
  elements.heroForm.title.value = hero.title || '';
  elements.heroForm.description.value = hero.description || '';
  elements.heroForm.ctaPrimary.value = hero.ctaPrimary || '';
  elements.heroForm.ctaSecondary.value = hero.ctaSecondary || '';
}

function fillMetricsForm() {
  if (!state.content) return;
  const metrics = state.content.metrics || {};
  elements.metricsForm.projects.value = metrics.projects ?? '';
  elements.metricsForm.awards.value = metrics.awards ?? '';
  elements.metricsForm.satisfaction.value = metrics.satisfaction ?? '';
  elements.metricsForm.teamMembers.value = metrics.teamMembers ?? '';
}

function renderToggleGrid() {
  elements.toggleGrid.innerHTML = '';
  if (!state.content) return;
  const toggles = state.content.featureToggles || {};
  Object.entries(toggleLabels).forEach(([key, label]) => {
    const wrapper = document.createElement('div');
    wrapper.className = 'toggle-item';
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.id = `toggle-${key}`;
    checkbox.name = key;
    checkbox.checked = toggles[key] !== false;
    const toggleLabel = document.createElement('label');
    toggleLabel.setAttribute('for', checkbox.id);
    toggleLabel.textContent = label;
    wrapper.appendChild(toggleLabel);
    wrapper.appendChild(checkbox);
    elements.toggleGrid.appendChild(wrapper);
  });
}

function updateCollectionOptions() {
  if (!state.content) return;
  const previous = elements.collectionSelect.value;
  elements.collectionSelect.innerHTML = '';
  Object.entries(state.content)
    .filter(([, value]) => Array.isArray(value))
    .forEach(([key]) => {
      const option = document.createElement('option');
      option.value = key;
      option.textContent = collectionLabels[key] || key;
      elements.collectionSelect.appendChild(option);
    });
  if (elements.collectionSelect.options.length) {
    const target = Array.from(elements.collectionSelect.options).find(option => option.value === previous);
    elements.collectionSelect.value = target ? previous : elements.collectionSelect.options[0].value;
    updateCollectionTextarea();
  } else {
    elements.collectionTextarea.value = '';
  }
}

function updateCollectionTextarea() {
  const key = elements.collectionSelect.value;
  if (!key || !state.content) return;
  const value = state.content[key] || [];
  elements.collectionTextarea.value = JSON.stringify(value, null, 2);
}

function updateContentTextarea() {
  if (!state.content) return;
  elements.contentTextarea.value = JSON.stringify(state.content, null, 2);
}

function buildStageMap() {
  const map = new Map();
  (state.content?.timelineStages || []).forEach(stage => {
    map.set(stage.id, stage.name);
  });
  return map;
}

function renderBookings() {
  elements.bookingList.innerHTML = '';
  if (!state.bookings.length) {
    const empty = document.createElement('p');
    empty.className = 'form-hint';
    empty.textContent = '暂时没有预约，客户提交后将自动显示。';
    elements.bookingList.appendChild(empty);
    return;
  }

  const stageMap = buildStageMap();
  state.bookings
    .slice()
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .forEach(booking => {
      const card = document.createElement('div');
      card.className = 'booking-card';
      const header = document.createElement('div');
      const title = document.createElement('h4');
      title.textContent = `${booking.clientName} · ${booking.serviceName}`;
      header.appendChild(title);

      const meta = document.createElement('div');
      meta.className = 'booking-meta';
      meta.innerHTML = `
        <span>拍摄日期：${new Date(booking.eventDate).toLocaleDateString()}</span>
        <span>当前阶段：${stageMap.get(booking.status) || booking.status}</span>
        <span>提交时间：${new Date(booking.createdAt).toLocaleString()}</span>
      `;
      header.appendChild(meta);

      const contact = document.createElement('div');
      contact.className = 'booking-meta';
      contact.innerHTML = `
        <span>邮箱：${booking.email}</span>
        ${booking.phone ? `<span>电话：${booking.phone}</span>` : ''}
        ${booking.location ? `<span>地点：${booking.location}</span>` : ''}
      `;
      header.appendChild(contact);

      card.appendChild(header);

      const history = document.createElement('ul');
      history.className = 'booking-progress-list';
      booking.progress
        .slice()
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        .forEach(item => {
          const li = document.createElement('li');
          const stageName = stageMap.get(item.stage) || item.stage;
          li.textContent = `${new Date(item.timestamp).toLocaleString()} · ${stageName}${item.note ? ` ｜ ${item.note}` : ''}`;
          history.appendChild(li);
        });
      card.appendChild(history);

      const form = document.createElement('form');
      form.className = 'booking-progress-form';
      form.dataset.bookingId = booking.id;

      const stageField = document.createElement('div');
      const stageLabel = document.createElement('label');
      stageLabel.textContent = '更新阶段';
      stageLabel.setAttribute('for', `stage-${booking.id}`);
      const stageSelect = document.createElement('select');
      stageSelect.id = `stage-${booking.id}`;
      stageSelect.name = 'stage';
      (state.content?.timelineStages || []).forEach(stage => {
        const option = document.createElement('option');
        option.value = stage.id;
        option.textContent = stage.name;
        if (stage.id === booking.status) {
          option.selected = true;
        }
        stageSelect.appendChild(option);
      });
      stageField.appendChild(stageLabel);
      stageField.appendChild(stageSelect);

      const noteField = document.createElement('div');
      const noteLabel = document.createElement('label');
      noteLabel.textContent = '备注';
      noteLabel.setAttribute('for', `note-${booking.id}`);
      const noteInput = document.createElement('input');
      noteInput.id = `note-${booking.id}`;
      noteInput.name = 'note';
      noteInput.placeholder = '可选：给客户的同步信息';
      noteField.appendChild(noteLabel);
      noteField.appendChild(noteInput);

      const submitWrapper = document.createElement('div');
      const submitButton = document.createElement('button');
      submitButton.type = 'submit';
      submitButton.className = 'primary';
      submitButton.textContent = '同步进度';
      submitWrapper.appendChild(submitButton);

      form.appendChild(stageField);
      form.appendChild(noteField);
      form.appendChild(submitWrapper);

      const feedback = document.createElement('p');
      feedback.className = 'form-feedback';
      feedback.dataset.feedbackFor = booking.id;

      card.appendChild(form);
      card.appendChild(feedback);

      elements.bookingList.appendChild(card);
    });
}

function refreshEditors() {
  fillHeroForm();
  fillMetricsForm();
  renderToggleGrid();
  updateCollectionOptions();
  updateContentTextarea();
  renderBookings();
}

async function loadInitialData() {
  if (!state.token) {
    updateAuthUI(false);
    return;
  }
  try {
    showGlobalFeedback('正在同步站点内容与预约数据…');
    const [content, bookings] = await Promise.all([
      fetchWithAuth('/api/admin/content'),
      fetchPublic('/api/bookings')
    ]);
    state.content = content;
    state.bookings = bookings;
    updateAuthUI(true);
    refreshEditors();
    showGlobalFeedback('已加载最新内容，可开始编辑。', 'success');
  } catch (error) {
    console.error(error);
    showGlobalFeedback(error.message || '后台登录失效，请重新输入令牌。', 'error');
    setToken('');
  }
}

async function reloadContent() {
  try {
    const content = await fetchWithAuth('/api/admin/content');
    state.content = content;
    refreshEditors();
  } catch (error) {
    showGlobalFeedback(error.message || '重新加载内容失败。', 'error');
  }
}

async function reloadBookings() {
  try {
    state.bookings = await fetchPublic('/api/bookings');
    renderBookings();
  } catch (error) {
    showGlobalFeedback(error.message || '刷新预约数据失败。', 'error');
  }
}

function bindEvents() {
  elements.tokenForm.addEventListener('submit', async event => {
    event.preventDefault();
    const token = elements.tokenInput.value.trim();
    if (!token) {
      showFeedback(elements.authFeedback, '请输入后台令牌', 'error');
      return;
    }
    showFeedback(elements.authFeedback, '正在验证令牌…');
    setToken(token);
    await loadInitialData();
  });

  elements.logoutButton.addEventListener('click', () => {
    setToken('');
    state.content = null;
    state.bookings = [];
    elements.tokenInput.value = '';
    refreshEditors();
  });

  elements.heroForm.addEventListener('submit', async event => {
    event.preventDefault();
    const formData = new FormData(elements.heroForm);
    const payload = Object.fromEntries(formData.entries());
    try {
      showFeedback(elements.heroFeedback, '保存中…');
      const updated = await fetchWithAuth('/api/admin/sections/hero', {
        method: 'PATCH',
        body: JSON.stringify(payload)
      });
      state.content.hero = updated;
      updateContentTextarea();
      showFeedback(elements.heroFeedback, '英雄区已更新。', 'success');
      showGlobalFeedback('首页内容更新成功，前端页面会立即同步。', 'success');
    } catch (error) {
      showFeedback(elements.heroFeedback, error.message || '保存失败', 'error');
    }
  });

  elements.metricsForm.addEventListener('submit', async event => {
    event.preventDefault();
    const formData = new FormData(elements.metricsForm);
    const payload = {};
    formData.forEach((value, key) => {
      payload[key] = value === '' ? null : Number(value);
    });
    try {
      showFeedback(elements.metricsFeedback, '保存中…');
      const updated = await fetchWithAuth('/api/admin/sections/metrics', {
        method: 'PATCH',
        body: JSON.stringify(payload)
      });
      state.content.metrics = updated;
      updateContentTextarea();
      showFeedback(elements.metricsFeedback, '品牌指标已更新。', 'success');
    } catch (error) {
      showFeedback(elements.metricsFeedback, error.message || '保存失败', 'error');
    }
  });

  elements.toggleForm.addEventListener('submit', async event => {
    event.preventDefault();
    const payload = {};
    elements.toggleGrid.querySelectorAll('input[type="checkbox"]').forEach(input => {
      payload[input.name] = input.checked;
    });
    try {
      showFeedback(elements.toggleFeedback, '更新中…');
      const toggles = await fetchWithAuth('/api/admin/feature-toggles', {
        method: 'PATCH',
        body: JSON.stringify(payload)
      });
      state.content.featureToggles = toggles;
      updateContentTextarea();
      showFeedback(elements.toggleFeedback, '功能组件开关已同步。', 'success');
      showGlobalFeedback('组件开关更新成功，访客刷新即可生效。', 'success');
    } catch (error) {
      showFeedback(elements.toggleFeedback, error.message || '更新失败', 'error');
    }
  });

  elements.collectionSelect.addEventListener('change', updateCollectionTextarea);

  elements.collectionForm.addEventListener('submit', async event => {
    event.preventDefault();
    const key = elements.collectionSelect.value;
    if (!key) return;
    try {
      const parsed = JSON.parse(elements.collectionTextarea.value || '[]');
      if (!Array.isArray(parsed)) {
        throw new Error('集合内容必须是数组');
      }
      showFeedback(elements.collectionFeedback, '保存中…');
      const updated = await fetchWithAuth(`/api/admin/collections/${key}`, {
        method: 'PUT',
        body: JSON.stringify(parsed)
      });
      state.content[key] = updated;
      updateContentTextarea();
      renderBookings();
      showFeedback(elements.collectionFeedback, '集合已保存。', 'success');
    } catch (error) {
      showFeedback(elements.collectionFeedback, error.message || '保存失败', 'error');
    }
  });

  elements.collectionItemForm.addEventListener('submit', async event => {
    event.preventDefault();
    const key = elements.collectionSelect.value;
    if (!key) return;
    try {
      const parsed = JSON.parse(elements.collectionItemTextarea.value || '{}');
      if (typeof parsed !== 'object' || Array.isArray(parsed) || !parsed) {
        throw new Error('请提供合法的对象内容');
      }
      showFeedback(elements.collectionItemFeedback, '追加中…');
      const created = await fetchWithAuth(`/api/admin/collections/${key}`, {
        method: 'POST',
        body: JSON.stringify(parsed)
      });
      state.content[key] = [...(state.content[key] || []), created];
      updateCollectionTextarea();
      updateContentTextarea();
      elements.collectionItemTextarea.value = '';
      renderBookings();
      showFeedback(elements.collectionItemFeedback, '已追加新的条目。', 'success');
    } catch (error) {
      showFeedback(elements.collectionItemFeedback, error.message || '追加失败', 'error');
    }
  });

  elements.collectionDeleteForm.addEventListener('submit', async event => {
    event.preventDefault();
    const key = elements.collectionSelect.value;
    const identifier = elements.collectionDeleteInput.value.trim();
    if (!key || !identifier) {
      showFeedback(elements.collectionDeleteFeedback, '请填写集合与要删除的 ID/索引', 'error');
      return;
    }
    try {
      showFeedback(elements.collectionDeleteFeedback, '删除中…');
      await fetchWithAuth(`/api/admin/collections/${key}/${encodeURIComponent(identifier)}`, {
        method: 'DELETE'
      });
      const targetArray = Array.isArray(state.content[key]) ? [...state.content[key]] : [];
      const index = targetArray.findIndex(item => item?.id === identifier);
      let deleteIndex = index;
      if (deleteIndex === -1) {
        const numeric = Number(identifier);
        if (!Number.isNaN(numeric)) {
          deleteIndex = numeric;
        }
      }
      if (deleteIndex >= 0 && deleteIndex < targetArray.length) {
        targetArray.splice(deleteIndex, 1);
        state.content[key] = targetArray;
        updateCollectionTextarea();
        updateContentTextarea();
        renderBookings();
      }
      elements.collectionDeleteInput.value = '';
      showFeedback(elements.collectionDeleteFeedback, '条目已删除。', 'success');
    } catch (error) {
      showFeedback(elements.collectionDeleteFeedback, error.message || '删除失败', 'error');
    }
  });

  elements.contentForm.addEventListener('submit', async event => {
    event.preventDefault();
    try {
      const parsed = JSON.parse(elements.contentTextarea.value || '{}');
      if (typeof parsed !== 'object' || Array.isArray(parsed) || !parsed) {
        throw new Error('站点内容必须是对象结构');
      }
      showFeedback(elements.contentFeedback, '覆盖中…');
      const updated = await fetchWithAuth('/api/admin/content', {
        method: 'PUT',
        body: JSON.stringify(parsed)
      });
      state.content = updated;
      refreshEditors();
      showFeedback(elements.contentFeedback, '站点内容已覆盖更新。', 'success');
      showGlobalFeedback('整站配置更新完成，如需撤回可手动恢复备份。', 'success');
    } catch (error) {
      showFeedback(elements.contentFeedback, error.message || '更新失败', 'error');
    }
  });

  elements.bookingList.addEventListener('submit', async event => {
    if (!event.target.classList.contains('booking-progress-form')) {
      return;
    }
    event.preventDefault();
    const form = event.target;
    const bookingId = form.dataset.bookingId;
    const formData = new FormData(form);
    const payload = {
      stage: formData.get('stage'),
      note: formData.get('note') || ''
    };
    const feedback = form.nextElementSibling;
    try {
      showFeedback(feedback, '同步中…');
      const updated = await fetchWithAuth(`/api/bookings/${bookingId}/progress`, {
        method: 'PATCH',
        body: JSON.stringify(payload)
      });
      const index = state.bookings.findIndex(item => item.id === bookingId);
      if (index !== -1) {
        state.bookings[index] = updated;
      }
      renderBookings();
      showFeedback(feedback, '进度已更新并同步给客户。', 'success');
      await reloadBookings();
    } catch (error) {
      showFeedback(feedback, error.message || '更新失败', 'error');
    }
  });
}

function init() {
  bindEvents();
  updateAuthUI(Boolean(state.token));
  if (state.token) {
    loadInitialData();
  }
}

init();
