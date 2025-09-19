const state = {
  content: null,
  bookings: [],
  filter: '全部',
  selectedBookingId: null,
  statusLabels: {
    consultation: '前期策划',
    shooting: '现场拍摄',
    editing: '后期精修',
    delivery: '成片交付'
  }
};

const contentSectionLabels = {
  hero: '首页英雄区',
  metrics: '品牌指标',
  featureToggles: '功能组件',
  portfolio: '作品集合',
  services: '服务集合',
  photographers: '摄影团队',
  testimonials: '客户推荐',
  timelineStages: '流程阶段',
  faqs: '常见问题',
  contact: '联系信息',
  social: '社交链接',
  studioValues: '品牌价值'
};

const endpoints = {
  content: '/api/content',
  bookings: '/api/bookings',
  dashboard: '/api/dashboard'
};

let eventSource = null;
let liveSyncResetTimer = null;

async function fetchJSON(url, options) {
  const response = await fetch(url, options);
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || '请求失败');
  }
  return response.json();
}

function createElement(tag, className, innerHTML) {
  const el = document.createElement(tag);
  if (className) {
    el.className = className;
  }
  if (innerHTML !== undefined) {
    el.innerHTML = innerHTML;
  }
  return el;
}

function setupNavigation() {
  const toggle = document.getElementById('nav-toggle');
  const menu = document.getElementById('nav-menu');
  if (!toggle || !menu) {
    return;
  }

  const closeMenu = () => {
    menu.classList.remove('open');
    toggle.setAttribute('aria-expanded', 'false');
    document.body.classList.remove('nav-open');
  };

  toggle.addEventListener('click', () => {
    const isExpanded = toggle.getAttribute('aria-expanded') === 'true';
    const nextState = !isExpanded;
    toggle.setAttribute('aria-expanded', String(nextState));
    menu.classList.toggle('open', nextState);
    document.body.classList.toggle('nav-open', nextState);
  });

  menu.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      if (menu.classList.contains('open')) {
        closeMenu();
      }
    });
  });

  window.addEventListener('resize', () => {
    if (window.innerWidth > 960 && menu.classList.contains('open')) {
      closeMenu();
    }
  });

  window.addEventListener('orientationchange', closeMenu);
}

function renderStudioValues(values = []) {
  const grid = document.getElementById('value-grid');
  if (!grid) {
    return;
  }
  grid.innerHTML = '';
  values.forEach(item => {
    const card = createElement('div', 'value-card');
    card.innerHTML = `
      <h3>${item.title}</h3>
      <p>${item.description}</p>
    `;
    grid.appendChild(card);
  });
}

function renderPortfolio(portfolio = []) {
  const filterWrapper = document.getElementById('portfolio-filter');
  const grid = document.getElementById('portfolio-grid');
  if (!filterWrapper || !grid) {
    return;
  }

  const categories = ['全部', ...new Set(portfolio.map(item => item.category))];
  filterWrapper.innerHTML = '';
  categories.forEach(category => {
    const chip = createElement('button', 'filter-chip', category);
    if (state.filter === category) {
      chip.classList.add('active');
    }
    chip.addEventListener('click', () => {
      state.filter = category;
      renderPortfolio(portfolio);
    });
    filterWrapper.appendChild(chip);
  });

  grid.innerHTML = '';
  portfolio
    .filter(item => state.filter === '全部' || item.category === state.filter)
    .forEach(item => {
      const card = createElement('article', 'portfolio-card');
      card.innerHTML = `
        <img src="${item.cover}" alt="${item.title}" loading="lazy" />
        <div class="portfolio-info">
          <span class="portfolio-category">${item.category}</span>
          <h3>${item.title}</h3>
          <p>${item.description}</p>
          <span>${item.location}</span>
        </div>
      `;
      grid.appendChild(card);
    });
}

function renderServices(services = []) {
  const grid = document.getElementById('service-grid');
  const select = document.getElementById('serviceId');
  if (!grid || !select) {
    return;
  }
  grid.innerHTML = '';
  select.innerHTML = '<option value="">请选择服务类型</option>';

  services.forEach(service => {
    const card = createElement('article', 'service-card');
    card.innerHTML = `
      <h3>${service.name}</h3>
      <p class="service-price">${service.price}</p>
      <div class="service-features">
        ${service.features.map(feature => `<span>• ${feature}</span>`).join('')}
      </div>
      <p class="service-highlight">${service.highlight}</p>
    `;
    grid.appendChild(card);

    const option = createElement('option');
    option.value = service.id;
    option.textContent = `${service.name}（${service.price}）`;
    select.appendChild(option);
  });
}

function renderPhotographers(photographers = []) {
  const grid = document.getElementById('photographer-grid');
  if (!grid) {
    return;
  }
  grid.innerHTML = '';
  photographers.forEach(person => {
    const card = createElement('article', 'photographer-card');
    card.innerHTML = `
      <div class="photographer-avatar">
        <img src="${person.avatar}" alt="${person.name}" loading="lazy" />
      </div>
      <div class="photographer-role">${person.role}</div>
      <h3>${person.name}</h3>
      <p><strong>擅长：</strong>${person.specialty}</p>
      <p>${person.biography}</p>
    `;
    grid.appendChild(card);
  });
}

function renderTestimonials(testimonials = []) {
  const slider = document.getElementById('testimonial-slider');
  if (!slider) {
    return;
  }
  slider.innerHTML = '';
  testimonials.forEach(testimonial => {
    const card = createElement('article', 'testimonial-card');
    card.innerHTML = `
      <p class="testimonial-quote">${testimonial.quote}</p>
      <p><strong>${testimonial.client}</strong> · ${testimonial.project}</p>
    `;
    slider.appendChild(card);
  });
}

function renderTimelinePreview(stages = []) {
  const list = document.getElementById('timeline-preview');
  if (!list) {
    return;
  }
  list.innerHTML = '';
  stages.forEach(stage => {
    const item = createElement('li');
    item.innerHTML = `
      <div>
        <strong>${stage.name}</strong>
        <p>${stage.description}</p>
      </div>
    `;
    list.appendChild(item);
  });
}

function renderFaqs(faqs = []) {
  const container = document.getElementById('faq-list');
  if (!container) {
    return;
  }
  container.innerHTML = '';
  faqs.forEach(item => {
    const faqItem = createElement('div', 'faq-item');
    faqItem.innerHTML = `
      <div class="faq-question">
        <span>${item.question}</span>
        <span>＋</span>
      </div>
      <div class="faq-answer">${item.answer}</div>
    `;
    faqItem.addEventListener('click', () => {
      faqItem.classList.toggle('open');
    });
    container.appendChild(faqItem);
  });
}

function renderContact(contact = {}, social = []) {
  const addressEl = document.getElementById('contact-address');
  const hoursEl = document.getElementById('contact-hours');
  if (addressEl) {
    addressEl.textContent = contact.address || '';
  }
  if (hoursEl) {
    hoursEl.textContent = contact.hours || '';
  }

  const grid = document.getElementById('contact-grid');
  if (grid) {
    grid.innerHTML = '';
    const infoItems = [
      { label: '电话', value: contact.phone },
      { label: '邮箱', value: contact.email },
      { label: '微信', value: contact.wechat }
    ].filter(item => item.value);
    infoItems.forEach(item => {
      const card = createElement('div', 'contact-card');
      card.innerHTML = `<span>${item.label}</span><span>${item.value}</span>`;
      grid.appendChild(card);
    });
  }

  const socialList = document.getElementById('social-links');
  if (socialList) {
    socialList.innerHTML = '';
    social.forEach(item => {
      const li = createElement('li');
      li.innerHTML = `<a href="${item.url}" target="_blank" rel="noopener">${item.platform} · ${item.handle}</a>`;
      socialList.appendChild(li);
    });
  }
}

function renderDashboard(dashboard = {}) {
  const container = document.getElementById('dashboard-cards');
  if (!container) {
    return;
  }
  container.innerHTML = '';
  const entries = [
    { label: '总预约', value: dashboard.totalBookings ?? 0 },
    { label: '本月新增', value: dashboard.monthlyCount ?? 0 },
    { label: '进行中', value: dashboard.statusGroups?.editing ?? 0 },
    { label: '待拍摄', value: dashboard.statusGroups?.consultation ?? 0 }
  ];
  entries.forEach(entry => {
    const card = createElement('div', 'dashboard-card');
    card.innerHTML = `<strong>${entry.value}</strong><span>${entry.label}</span>`;
    container.appendChild(card);
  });
}

function renderKanban(content) {
  const container = document.getElementById('progress-columns');
  if (!container || !content) {
    return;
  }
  container.innerHTML = '';

  const stages = content.timelineStages || [];
  const bookingsByStatus = stages.reduce((acc, stage) => {
    acc[stage.id] = [];
    return acc;
  }, {});

  state.bookings.forEach(booking => {
    if (!bookingsByStatus[booking.status]) {
      bookingsByStatus[booking.status] = [];
    }
    bookingsByStatus[booking.status].push(booking);
  });

  stages.forEach(stage => {
    const column = createElement('div', 'kanban-column');
    column.innerHTML = `<h4>${stage.name}</h4>`;
    const cards = bookingsByStatus[stage.id] || [];
    if (!cards.length) {
      const empty = createElement('p', 'empty', '暂无项目');
      column.appendChild(empty);
    } else {
      cards
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .forEach(booking => {
          const card = createElement('div', 'kanban-card');
          card.innerHTML = `
            <strong>${booking.clientName}</strong>
            <span>${booking.serviceName}</span>
            <span>${new Date(booking.eventDate).toLocaleDateString()}</span>
          `;
          card.addEventListener('click', () => {
            state.selectedBookingId = booking.id;
            renderProgressDetail(booking, content);
          });
          column.appendChild(card);
        });
    }
    container.appendChild(column);
  });
}

function renderProgressDetail(booking, content) {
  const panel = document.getElementById('progress-detail');
  if (!panel) {
    return;
  }
  if (!booking) {
    panel.innerHTML = '<h3>进度详情</h3><p class="empty">从左侧选择一个项目，查看里程碑与备注</p>';
    return;
  }
  panel.innerHTML = '';
  const title = createElement('div');
  title.innerHTML = `
    <h3>${booking.clientName} · ${booking.serviceName}</h3>
    <p>${new Date(booking.eventDate).toLocaleDateString()} · ${booking.location || '待确认地点'}</p>
  `;
  panel.appendChild(title);

  const timeline = createElement('ul');
  booking.progress
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .forEach(item => {
      const li = createElement('li');
      const stage = content.timelineStages?.find(stage => stage.id === item.stage);
      const stageName = stage ? stage.name : state.statusLabels[item.stage] || item.stage;
      li.innerHTML = `
        <div>
          <time>${new Date(item.timestamp).toLocaleString()}</time>
          <p><strong>${stageName}</strong></p>
          <p>${item.note || '—'}</p>
        </div>
      `;
      timeline.appendChild(li);
    });
  panel.appendChild(timeline);
}

function updateHeroSnapshot() {
  const countEl = document.getElementById('hero-booking-count');
  const lastUpdateEl = document.getElementById('hero-last-update');
  if (!countEl || !lastUpdateEl || !state.content) {
    return;
  }

  countEl.textContent = String(state.bookings.length || 0);

  const allProgress = state.bookings.reduce((acc, booking) => {
    if (Array.isArray(booking.progress)) {
      return acc.concat(booking.progress);
    }
    return acc;
  }, []);

  if (!allProgress.length) {
    lastUpdateEl.textContent = '待同步';
    return;
  }

  allProgress.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  const latest = allProgress[0];
  const stage = state.content?.timelineStages?.find(item => item.id === latest.stage);
  const stageName = stage ? stage.name : state.statusLabels[latest.stage] || latest.stage;
  lastUpdateEl.textContent = `${stageName} · ${new Date(latest.timestamp).toLocaleDateString()}`;
}

async function loadBookings({ preserveSelection = false } = {}) {
  const previousSelection = state.selectedBookingId;
  state.bookings = await fetchJSON(endpoints.bookings);
  if (preserveSelection && previousSelection) {
    const exists = state.bookings.some(item => item.id === previousSelection);
    state.selectedBookingId = exists ? previousSelection : state.bookings[0]?.id || null;
  } else {
    state.selectedBookingId = state.bookings[0]?.id || null;
  }
  rerenderBookingsViews();
}

async function refreshDashboard() {
  const dashboard = await fetchJSON(endpoints.dashboard);
  renderDashboard(dashboard);
}

async function handleBookingSubmit(event) {
  event.preventDefault();
  const form = event.target;
  const feedback = document.getElementById('form-feedback');
  feedback.textContent = '正在提交预约...';
  feedback.className = 'form-feedback';

  const formData = new FormData(form);
  const payload = Object.fromEntries(formData.entries());

  try {
    const created = await fetchJSON(endpoints.bookings, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
    feedback.textContent = '预约提交成功，我们将在 24 小时内与您联系！';
    feedback.classList.add('success');
    form.reset();
    state.selectedBookingId = created.id;
    await loadBookings({ preserveSelection: true });
    await refreshDashboard();
  } catch (error) {
    feedback.textContent = '预约提交失败，请稍后重试或通过电话联系。';
    feedback.classList.add('error');
    console.error(error);
  }
}

function updateLiveSyncIndicator(status, detail, autoReset = false) {
  const indicator = document.getElementById('live-sync-indicator');
  if (!indicator) {
    return;
  }
  indicator.classList.remove('offline', 'syncing');
  if (status === 'offline') {
    indicator.classList.add('offline');
  } else if (status === 'syncing') {
    indicator.classList.add('syncing');
  }
  if (detail) {
    indicator.textContent = `后台实时联动 · ${detail}`;
  }
  if (liveSyncResetTimer) {
    clearTimeout(liveSyncResetTimer);
    liveSyncResetTimer = null;
  }
  if (autoReset) {
    liveSyncResetTimer = setTimeout(() => {
      updateLiveSyncIndicator('online', '已连接');
    }, 2200);
  }
}

function parseEventData(event) {
  if (!event || !event.data) {
    return {};
  }
  try {
    return JSON.parse(event.data);
  } catch (error) {
    return {};
  }
}

async function refreshContent() {
  try {
    const content = await fetchJSON(endpoints.content);
    state.content = content;
    renderContentSections(content);
    rerenderBookingsViews();
  } catch (error) {
    console.error('刷新站点内容失败', error);
  }
}

function initEventStream() {
  if (!window.EventSource) {
    updateLiveSyncIndicator('offline', '浏览器暂不支持实时更新');
    return;
  }
  if (eventSource) {
    eventSource.close();
  }
  eventSource = new EventSource('/api/events');
  eventSource.addEventListener('open', () => {
    updateLiveSyncIndicator('online', '已连接');
  });
  eventSource.addEventListener('error', () => {
    updateLiveSyncIndicator('offline', '连接中断，正在自动重试…');
  });
  eventSource.addEventListener('connected', () => {
    updateLiveSyncIndicator('online', '已连接');
  });
  eventSource.addEventListener('contentUpdated', event => {
    const data = parseEventData(event);
    const label = data.section ? contentSectionLabels[data.section] || data.section : '站点内容';
    updateLiveSyncIndicator('syncing', `${label} 已更新`, true);
    refreshContent();
    refreshDashboard().catch(err => console.error('刷新仪表盘失败', err));
  });
  const handleBookingUpdate = (data, message) => {
    const stage = data.stage;
    let stageLabel = message;
    if (stage && state.content) {
      const foundStage = state.content.timelineStages?.find(item => item.id === stage);
      if (foundStage) {
        stageLabel = `${foundStage.name} 已同步`;
      }
    }
    updateLiveSyncIndicator('syncing', stageLabel, true);
    loadBookings({ preserveSelection: true }).catch(err => console.error('刷新预约失败', err));
    refreshDashboard().catch(err => console.error('刷新仪表盘失败', err));
  };
  eventSource.addEventListener('bookingCreated', event => {
    const data = parseEventData(event);
    const label = data && data.id ? '收到新的预约' : '预约列表更新';
    if (data && data.id) {
      state.selectedBookingId = data.id;
    }
    handleBookingUpdate(data, label);
  });
  eventSource.addEventListener('bookingProgressed', event => {
    const data = parseEventData(event);
    handleBookingUpdate(data, '项目进度更新');
  });
}

function applyHeroContent(hero = {}) {
  document.getElementById('hero-tagline').textContent = hero.tagline || '';
  document.getElementById('hero-title').textContent = hero.title || '';
  document.getElementById('hero-description').textContent = hero.description || '';
  document.getElementById('hero-cta-primary').textContent = hero.ctaPrimary || '立即预约';
  document.getElementById('hero-cta-secondary').textContent = hero.ctaSecondary || '浏览作品集';
}

function applyMetrics(metrics = {}) {
  document.querySelector('[data-metric="projects"]').textContent = metrics.projects ? `${metrics.projects}+` : '—';
  document.querySelector('[data-metric="awards"]').textContent = metrics.awards ?? '—';
  document.querySelector('[data-metric="satisfaction"]').textContent = metrics.satisfaction ? `${metrics.satisfaction}%` : '—';
  document.querySelector('[data-metric="teamMembers"]').textContent = metrics.teamMembers ?? '—';
}

function applyFeatureToggles(toggles = {}) {
  const sectionMap = {
    hero: document.getElementById('hero'),
    values: document.getElementById('values'),
    portfolio: document.getElementById('portfolio'),
    services: document.getElementById('services'),
    photographers: document.getElementById('photographers'),
    testimonials: document.getElementById('testimonials'),
    booking: document.getElementById('booking'),
    progress: document.getElementById('progress'),
    faq: document.getElementById('faq'),
    contact: document.getElementById('contact')
  };

  Object.entries(sectionMap).forEach(([key, element]) => {
    if (!element) {
      return;
    }
    const enabled = toggles[key] !== false;
    element.classList.toggle('is-hidden', !enabled);
  });

  document.querySelectorAll('[data-section-target]').forEach(link => {
    const target = link.getAttribute('data-section-target');
    const enabled = toggles[target] !== false;
    link.classList.toggle('is-hidden', !enabled);
  });
}

function renderContentSections(content) {
  if (!content) {
    return;
  }
  applyFeatureToggles(content.featureToggles);
  applyHeroContent(content.hero);
  applyMetrics(content.metrics);
  renderStudioValues(content.studioValues);
  renderPortfolio(content.portfolio);
  renderServices(content.services);
  renderPhotographers(content.photographers);
  renderTestimonials(content.testimonials);
  renderTimelinePreview(content.timelineStages);
  renderFaqs(content.faqs);
  renderContact(content.contact, content.social);
}

function rerenderBookingsViews() {
  if (!state.content) {
    return;
  }
  renderKanban(state.content);
  const currentSelection = state.bookings.find(item => item.id === state.selectedBookingId) || null;
  const activeBooking = currentSelection || state.bookings[0] || null;
  state.selectedBookingId = activeBooking ? activeBooking.id : null;
  renderProgressDetail(activeBooking, state.content);
  updateHeroSnapshot();
}

async function init() {
  const yearEl = document.getElementById('current-year');
  if (yearEl) {
    yearEl.textContent = new Date().getFullYear();
  }
  setupNavigation();
  const bookingForm = document.getElementById('booking-form');
  if (bookingForm) {
    bookingForm.addEventListener('submit', handleBookingSubmit);
  }
  updateLiveSyncIndicator('syncing', '建立连接中…');

  try {
    const content = await fetchJSON(endpoints.content);
    state.content = content;
    renderContentSections(content);
    await Promise.all([loadBookings(), refreshDashboard()]);
    initEventStream();
  } catch (error) {
    console.error('初始化失败', error);
    updateLiveSyncIndicator('offline', '服务器连接失败');
    const app = document.getElementById('app');
    if (app) {
      app.innerHTML = '<p style="padding:40px;text-align:center;color:#ff6b6b;">服务器连接失败，请稍后重试。</p>';
    }
  }
}

init();
