const API_FALLBACK_HOST = 'https://assiworks-openining.vercel.app';

const sendAdminRequest = async ({ method, path, token, payload }) => {
  const bases = [''];
  if (!window.location.origin.startsWith(API_FALLBACK_HOST)) {
    bases.push(API_FALLBACK_HOST);
  }

  let lastError = null;
  for (const base of bases) {
    try {
      const response = await fetch(`${base}${path}`, {
        method,
        headers: {
          'content-type': 'application/json',
          'x-admin-token': token,
        },
        body: payload ? JSON.stringify(payload) : undefined,
      });
      const data = await response.json().catch(() => ({}));
      if (response.ok && data?.ok !== false) {
        return data;
      }
      lastError = new Error(data?.message || `요청 실패 (${response.status})`);
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError || new Error('요청 중 오류가 발생했습니다.');
};

document.addEventListener('DOMContentLoaded', () => {
  const authForm = document.getElementById('admin-auth-form');
  const passwordInput = document.getElementById('admin-password');
  const authStatusEl = document.getElementById('admin-status');
  const dashboardStatusEl = document.getElementById('admin-dashboard-status');
  const loginViewEl = document.getElementById('admin-login-view');
  const dashboardViewEl = document.getElementById('admin-dashboard-view');
  const rowsEl = document.getElementById('admin-rows');
  const sidebarButtons = Array.from(document.querySelectorAll('.sidebar-menu-btn'));
  const viewEls = Array.from(document.querySelectorAll('.admin-view'));
  const refreshBtn = document.getElementById('admin-refresh-btn');
  const logoutBtn = document.getElementById('admin-logout-btn');
  const searchInput = document.getElementById('admin-search');
  const statusFilter = document.getElementById('admin-filter-status');
  const selectAllCheckbox = document.getElementById('admin-select-all');
  const bulkDeleteBtn = document.getElementById('admin-bulk-delete-btn');
  const statTotal = document.getElementById('stat-total');
  const statActive = document.getElementById('stat-active');
  const statCancelled = document.getElementById('stat-cancelled');
  const statToday = document.getElementById('stat-today');
  const recentListEl = document.getElementById('admin-recent-list');
  const chartDailyEl = document.getElementById('chart-daily');
  const chartCompanyEl = document.getElementById('chart-company');
  const statusBreakdownEl = document.getElementById('status-breakdown');

  let adminToken = '';
  let registrations = [];
  let filteredRegistrations = [];
  let selectedIds = new Set();

  const setStatus = (target, message, isError = false) => {
    if (!target) return;
    target.textContent = message;
    target.classList.toggle('form-error', Boolean(isError));
  };

  const escapeHtml = (value) =>
    String(value || '')
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#39;');

  const formatDateTime = (value) => (value ? new Date(value).toLocaleString('ko-KR') : '-');

  const showDashboard = () => {
    loginViewEl?.setAttribute('hidden', '');
    dashboardViewEl?.removeAttribute('hidden');
  };

  const showLogin = () => {
    dashboardViewEl?.setAttribute('hidden', '');
    loginViewEl?.removeAttribute('hidden');
  };

  const switchView = (targetView) => {
    sidebarButtons.forEach((button) => {
      button.classList.toggle('is-active', button.dataset.viewTarget === targetView);
    });
    viewEls.forEach((viewEl) => {
      viewEl.classList.toggle('is-active', viewEl.id === `admin-view-${targetView}`);
    });
  };

  const getStatusText = (row) => (row.cancelled_at ? '취소됨' : '정상');

  const aggregateLast7Days = (rows) => {
    const labels = [];
    const today = new Date();
    for (let i = 6; i >= 0; i -= 1) {
      const day = new Date(today);
      day.setHours(0, 0, 0, 0);
      day.setDate(day.getDate() - i);
      labels.push(day.toISOString().slice(0, 10));
    }
    const counts = labels.map(() => 0);
    rows.forEach((row) => {
      if (!row.created_at) return;
      const key = new Date(row.created_at).toISOString().slice(0, 10);
      const index = labels.indexOf(key);
      if (index >= 0) counts[index] += 1;
    });
    return labels.map((label, index) => ({ label: label.slice(5).replace('-', '/'), count: counts[index] }));
  };

  const renderDailyChart = () => {
    if (!chartDailyEl) return;
    const points = aggregateLast7Days(registrations);
    const max = Math.max(1, ...points.map((item) => item.count));
    chartDailyEl.innerHTML = points
      .map((item) => {
        const height = Math.round((item.count / max) * 110);
        return `<div class="mini-chart-bar">
          <div class="mini-chart-track"><span style="height:${height}px"></span></div>
          <strong>${item.count}</strong>
          <em>${item.label}</em>
        </div>`;
      })
      .join('');
  };

  const renderCompanyChart = () => {
    if (!chartCompanyEl) return;
    const map = new Map();
    registrations.forEach((row) => {
      const key = (row.affiliation || '미입력').trim() || '미입력';
      map.set(key, (map.get(key) || 0) + 1);
    });
    const points = [...map.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
    const max = Math.max(1, ...points.map((item) => item[1]));
    chartCompanyEl.innerHTML =
      points.length > 0
        ? points
            .map(
              ([name, count]) => `<div class="line-chart-row">
            <p>${escapeHtml(name)}</p>
            <div><span style="width:${Math.round((count / max) * 100)}%"></span></div>
            <strong>${count}</strong>
          </div>`,
            )
            .join('')
        : '<p class="chart-empty">표시할 데이터가 없습니다.</p>';
  };

  const renderStatusBreakdown = () => {
    if (!statusBreakdownEl) return;
    const total = registrations.length;
    const cancelled = registrations.filter((row) => row.cancelled_at).length;
    const active = total - cancelled;
    const activeRate = total ? Math.round((active / total) * 100) : 0;
    const cancelledRate = total ? 100 - activeRate : 0;
    statusBreakdownEl.innerHTML = `
      <div class="status-row">
        <p>정상</p>
        <div class="status-row-track"><span style="width:${activeRate}%"></span></div>
        <strong>${active} (${activeRate}%)</strong>
      </div>
      <div class="status-row">
        <p>취소됨</p>
        <div class="status-row-track"><span style="width:${cancelledRate}%"></span></div>
        <strong>${cancelled} (${cancelledRate}%)</strong>
      </div>`;
  };

  const renderStats = () => {
    const total = registrations.length;
    const cancelled = registrations.filter((row) => row.cancelled_at).length;
    const active = total - cancelled;
    const todayKey = new Date().toISOString().slice(0, 10);
    const todayCount = registrations.filter(
      (row) => row.created_at && new Date(row.created_at).toISOString().slice(0, 10) === todayKey,
    ).length;

    if (statTotal) statTotal.textContent = String(total);
    if (statActive) statActive.textContent = String(active);
    if (statCancelled) statCancelled.textContent = String(cancelled);
    if (statToday) statToday.textContent = String(todayCount);
  };

  const renderRecent = () => {
    if (!recentListEl) return;
    const recent = registrations.slice(0, 5);
    if (!recent.length) {
      recentListEl.innerHTML = '<li>최근 등록 데이터가 없습니다.</li>';
      return;
    }
    recentListEl.innerHTML = recent
      .map(
        (row) => `<li>
      <div>
        <strong>${escapeHtml(row.name)}</strong>
        <p>${escapeHtml(row.email)} · ${escapeHtml(row.affiliation || '소속 미입력')} · ${escapeHtml(
          row.position || '직위 미입력',
        )}</p>
      </div>
      <span>${escapeHtml(formatDateTime(row.created_at))}</span>
    </li>`,
      )
      .join('');
  };

  const applyFilters = () => {
    const keyword = (searchInput?.value || '').trim().toLowerCase();
    const status = statusFilter?.value || 'all';
    filteredRegistrations = registrations.filter((row) => {
      const matchesKeyword = !keyword
        ? true
        : `${row.name || ''} ${row.email || ''} ${row.affiliation || ''} ${row.position || ''}`
            .toLowerCase()
            .includes(keyword);
      const matchesStatus =
        status === 'all' ? true : status === 'cancelled' ? Boolean(row.cancelled_at) : !row.cancelled_at;
      return matchesKeyword && matchesStatus;
    });
  };

  const syncSelectionUI = () => {
    const visibleIds = new Set(filteredRegistrations.map((row) => String(row.id)));
    selectedIds = new Set([...selectedIds].filter((id) => visibleIds.has(id)));
    const selectedCount = selectedIds.size;
    const totalVisible = filteredRegistrations.length;

    if (selectAllCheckbox) {
      selectAllCheckbox.checked = totalVisible > 0 && selectedCount === totalVisible;
      selectAllCheckbox.indeterminate = selectedCount > 0 && selectedCount < totalVisible;
      selectAllCheckbox.disabled = totalVisible === 0;
    }

    if (bulkDeleteBtn) {
      bulkDeleteBtn.disabled = selectedCount === 0;
      bulkDeleteBtn.textContent = selectedCount > 0 ? `선택 삭제 (${selectedCount})` : '선택 삭제';
    }
  };

  const renderRows = () => {
    if (!rowsEl) return;
    if (!filteredRegistrations.length) {
      rowsEl.innerHTML = '<tr><td colspan="10">등록 데이터가 없습니다.</td></tr>';
      syncSelectionUI();
      return;
    }

    rowsEl.innerHTML = filteredRegistrations
      .map((row) => {
        const createdAt = formatDateTime(row.created_at);
        const cancelledAt = formatDateTime(row.cancelled_at);
        const status = getStatusText(row);
        const note = row.note || '-';
        const rowId = String(row.id);
        const checked = selectedIds.has(rowId) ? 'checked' : '';
        return `<tr>
          <td>
            <input type="checkbox" class="admin-row-select" data-id="${escapeHtml(rowId)}" ${checked} />
          </td>
          <td>${escapeHtml(row.name)}</td>
          <td>${escapeHtml(row.email)}</td>
          <td>${escapeHtml(row.affiliation || '-')}</td>
          <td>${escapeHtml(row.position || '-')}</td>
          <td>${escapeHtml(note)}</td>
          <td>${escapeHtml(createdAt)}</td>
          <td>${escapeHtml(cancelledAt)}</td>
          <td>${escapeHtml(status)}</td>
          <td><button type="button" class="admin-delete" data-id="${escapeHtml(rowId)}">삭제</button></td>
        </tr>`;
      })
      .join('');
    syncSelectionUI();
  };

  const renderDashboard = () => {
    applyFilters();
    renderRows();
    renderStats();
    renderRecent();
    renderDailyChart();
    renderCompanyChart();
    renderStatusBreakdown();
  };

  const deleteRegistrationsByIds = async (ids) => {
    const normalizedIds = Array.from(
      new Set((ids || []).map((value) => String(value).trim()).filter(Boolean)),
    );
    if (!normalizedIds.length) return;

    try {
      await sendAdminRequest({
        method: 'DELETE',
        path: '/api/registrations',
        token: adminToken,
        payload: normalizedIds.length === 1 ? { id: normalizedIds[0] } : { ids: normalizedIds },
      });
      return;
    } catch (error) {
      // 구버전 API 호환: ids 배열 미지원 환경에서는 개별 삭제로 폴백.
      if (normalizedIds.length === 1) throw error;
    }

    await Promise.all(
      normalizedIds.map((id) =>
        sendAdminRequest({
          method: 'DELETE',
          path: '/api/registrations',
          token: adminToken,
          payload: { id },
        }),
      ),
    );
  };

  const loadRegistrations = async () => {
    const data = await sendAdminRequest({
      method: 'GET',
      path: '/api/registrations',
      token: adminToken,
    });
    registrations = data.registrations || [];
    renderDashboard();
    setStatus(dashboardStatusEl, `총 ${registrations.length}건을 불러왔습니다.`);
  };

  authForm?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const token = passwordInput?.value?.trim() || '';
    if (!token) {
      setStatus(authStatusEl, '관리 비밀번호를 입력해주세요.', true);
      return;
    }
    adminToken = token;
    setStatus(authStatusEl, '등록 데이터를 불러오는 중입니다...');
    try {
      await loadRegistrations();
      showDashboard();
      switchView('analytics');
      setStatus(authStatusEl, '');
    } catch (error) {
      registrations = [];
      filteredRegistrations = [];
      renderRows();
      setStatus(authStatusEl, error.message || '조회에 실패했습니다.', true);
      setStatus(dashboardStatusEl, '', false);
    }
  });

  rowsEl?.addEventListener('click', async (event) => {
    const deleteButton = event.target.closest('.admin-delete');
    if (!deleteButton) return;
    const id = deleteButton.dataset.id;
    if (!id || !adminToken) return;
    const confirmed = window.confirm('정말 삭제하시겠습니까?');
    if (!confirmed) return;

    deleteButton.disabled = true;
    try {
      await deleteRegistrationsByIds([id]);
      registrations = registrations.filter((item) => String(item.id) !== id);
      selectedIds.delete(id);
      renderDashboard();
      setStatus(dashboardStatusEl, '삭제되었습니다.');
    } catch (error) {
      setStatus(dashboardStatusEl, error.message || '삭제에 실패했습니다.', true);
    } finally {
      deleteButton.disabled = false;
    }
  });

  rowsEl?.addEventListener('change', (event) => {
    const checkbox = event.target.closest('.admin-row-select');
    if (!checkbox) return;
    const id = checkbox.dataset.id;
    if (!id) return;

    if (checkbox.checked) {
      selectedIds.add(id);
    } else {
      selectedIds.delete(id);
    }
    syncSelectionUI();
  });

  sidebarButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const target = button.dataset.viewTarget || 'overview';
      switchView(target);
    });
  });

  const onFilterChanged = () => {
    applyFilters();
    renderRows();
    setStatus(dashboardStatusEl, `조건에 맞는 ${filteredRegistrations.length}건을 표시 중입니다.`);
  };

  searchInput?.addEventListener('input', onFilterChanged);
  statusFilter?.addEventListener('change', onFilterChanged);
  selectAllCheckbox?.addEventListener('change', () => {
    if (selectAllCheckbox.checked) {
      selectedIds = new Set(filteredRegistrations.map((row) => String(row.id)));
    } else {
      selectedIds.clear();
    }
    renderRows();
  });
  bulkDeleteBtn?.addEventListener('click', async () => {
    if (!adminToken || selectedIds.size === 0) return;
    const ids = [...selectedIds];
    const confirmed = window.confirm(`선택한 ${ids.length}건을 정말 삭제하시겠습니까?`);
    if (!confirmed) return;

    bulkDeleteBtn.disabled = true;
    try {
      await deleteRegistrationsByIds(ids);
      registrations = registrations.filter((item) => !selectedIds.has(String(item.id)));
      selectedIds.clear();
      renderDashboard();
      setStatus(dashboardStatusEl, `${ids.length}건이 삭제되었습니다.`);
    } catch (error) {
      setStatus(dashboardStatusEl, error.message || '선택 삭제에 실패했습니다.', true);
      syncSelectionUI();
    }
  });

  refreshBtn?.addEventListener('click', async () => {
    if (!adminToken) return;
    setStatus(dashboardStatusEl, '데이터를 새로고침하는 중입니다...');
    try {
      await loadRegistrations();
    } catch (error) {
      setStatus(dashboardStatusEl, error.message || '새로고침에 실패했습니다.', true);
    }
  });

  logoutBtn?.addEventListener('click', () => {
    adminToken = '';
    registrations = [];
    filteredRegistrations = [];
    selectedIds.clear();
    passwordInput.value = '';
    searchInput.value = '';
    statusFilter.value = 'all';
    renderRows();
    showLogin();
    setStatus(authStatusEl, '로그아웃되었습니다.');
    setStatus(dashboardStatusEl, '');
  });

  // Always start from login view before admin authentication.
  showLogin();
});
