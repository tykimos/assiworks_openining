/* global sb */
const ADMIN_PASSWORD = 'assiworks2020!@';

document.addEventListener('DOMContentLoaded', () => {
  /* ============================================================
     Sidebar toggle
     ============================================================ */
  const sidebarToggle = document.getElementById('sidebar-toggle');
  const dashboardEl = document.getElementById('admin-dashboard-view');
  const sidebarOpen = sessionStorage.getItem('sidebarOpen') !== 'false';
  if (sidebarOpen) dashboardEl?.classList.add('sidebar-open');

  sidebarToggle?.addEventListener('click', () => {
    const isOpen = dashboardEl?.classList.toggle('sidebar-open');
    sessionStorage.setItem('sidebarOpen', isOpen ? 'true' : 'false');
  });

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

  const invRowsEl = document.getElementById('inv-rows');
  const invSearchInput = document.getElementById('inv-search');
  const invFilterCategory = document.getElementById('inv-filter-category');
  const invFilterAttendance = document.getElementById('inv-filter-attendance');
  const invFilterRegistered = document.getElementById('inv-filter-registered');
  const invSelectAllCheckbox = document.getElementById('inv-select-all');
  const invBulkDeleteBtn = document.getElementById('inv-bulk-delete-btn');
  const invAddBtn = document.getElementById('inv-add-btn');
  const invModal = document.getElementById('inv-modal');
  const invForm = document.getElementById('inv-form');
  const invModalTitle = document.getElementById('inv-modal-title');
  const invCancelBtn = document.getElementById('inv-cancel-btn');
  const invFormStatus = document.getElementById('inv-form-status');
  const invStatTotal = document.getElementById('inv-stat-total');
  const invStatYes = document.getElementById('inv-stat-yes');
  const invStatNo = document.getElementById('inv-stat-no');
  const invStatRegistered = document.getElementById('inv-stat-registered');

  let adminToken = sessionStorage.getItem('adminToken') || '';
  let registrations = [];
  let filteredRegistrations = [];
  let selectedIds = new Set();
  let invitations = [];
  let filteredInvitations = [];
  let selectedInvIds = new Set();
  let editingInvId = null;

  // Sort state: { key, asc }
  let regSort = { key: null, asc: true };
  let invSort = { key: null, asc: true };

  const sortData = (arr, sortState) => {
    if (!sortState.key) return arr;
    const k = sortState.key;
    const dir = sortState.asc ? 1 : -1;
    return [...arr].sort((a, b) => {
      let va = a[k], vb = b[k];
      if (va == null) va = '';
      if (vb == null) vb = '';
      if (typeof va === 'string') va = va.toLowerCase();
      if (typeof vb === 'string') vb = vb.toLowerCase();
      if (va < vb) return -1 * dir;
      if (va > vb) return 1 * dir;
      return 0;
    });
  };

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
    requestAnimationFrame(() => initColumnResizers());
  };

  const getStatusText = (row) => (row.cancelled_at ? '취소됨' : '정상');

  const toLocalDateStr = (d) => {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const aggregateLast7Days = (rows) => {
    const labels = [];
    const today = new Date();
    const todayStr = toLocalDateStr(today);
    for (let i = 6; i >= 0; i -= 1) {
      const day = new Date(today);
      day.setHours(0, 0, 0, 0);
      day.setDate(day.getDate() - i);
      labels.push(toLocalDateStr(day));
    }
    const counts = labels.map(() => 0);
    rows.forEach((row) => {
      if (!row.created_at) return;
      const key = toLocalDateStr(new Date(row.created_at));
      const index = labels.indexOf(key);
      if (index >= 0) counts[index] += 1;
    });
    return labels.map((label, index) => ({
      label: label.slice(5).replace('-', '/'),
      count: counts[index],
      isToday: label === todayStr,
    }));
  };

  const renderDailyChart = () => {
    if (!chartDailyEl) return;
    const points = aggregateLast7Days(registrations);
    const max = Math.max(1, ...points.map((item) => item.count));
    chartDailyEl.innerHTML = points
      .map((item) => {
        const height = Math.round((item.count / max) * 110);
        const todayCls = item.isToday ? ' is-today' : '';
        return `<div class="mini-chart-bar${todayCls}">
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
    filteredRegistrations = sortData(filteredRegistrations, regSort);
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

  /* ============================================================
     Invitations – data, filter, render
     ============================================================ */

  const applyInvFilters = () => {
    const keyword = (invSearchInput?.value || '').trim().toLowerCase();
    const category = invFilterCategory?.value || 'all';
    const attendance = invFilterAttendance?.value || 'all';
    const registered = invFilterRegistered?.value || 'all';

    filteredInvitations = invitations.filter((row) => {
      const matchesKeyword = !keyword
        ? true
        : `${row.name || ''} ${row.email || ''} ${row.affiliation || ''} ${row.position || ''} ${row.phone || ''}`
            .toLowerCase()
            .includes(keyword);
      const matchesCategory = category === 'all' || row.category === category;
      const matchesAttendance = attendance === 'all' || row.attendance === attendance;
      const isRegistered = row.registration_id != null;
      const matchesRegistered =
        registered === 'all'
          ? true
          : registered === 'registered'
            ? isRegistered
            : !isRegistered;
      return matchesKeyword && matchesCategory && matchesAttendance && matchesRegistered;
    });
    filteredInvitations = sortData(filteredInvitations, invSort);
  };

  const syncInvSelectionUI = () => {
    const visibleIds = new Set(filteredInvitations.map((row) => String(row.id)));
    selectedInvIds = new Set([...selectedInvIds].filter((id) => visibleIds.has(id)));
    const selectedCount = selectedInvIds.size;
    const totalVisible = filteredInvitations.length;

    if (invSelectAllCheckbox) {
      invSelectAllCheckbox.checked = totalVisible > 0 && selectedCount === totalVisible;
      invSelectAllCheckbox.indeterminate = selectedCount > 0 && selectedCount < totalVisible;
      invSelectAllCheckbox.disabled = totalVisible === 0;
    }

    if (invBulkDeleteBtn) {
      invBulkDeleteBtn.disabled = selectedCount === 0;
      invBulkDeleteBtn.textContent = selectedCount > 0 ? `선택 삭제 (${selectedCount})` : '선택 삭제';
    }
  };

  const renderInvStats = () => {
    const total = invitations.length;
    const yes = invitations.filter((r) => r.attendance === 'yes').length;
    const no = invitations.filter((r) => r.attendance === 'no').length;
    const reg = invitations.filter((r) => r.registration_id).length;
    if (invStatTotal) invStatTotal.textContent = String(total);
    if (invStatYes) invStatYes.textContent = String(yes);
    if (invStatNo) invStatNo.textContent = String(no);
    if (invStatRegistered) invStatRegistered.textContent = String(reg);
  };

  const attendanceLabel = { yes: '참석', no: '불참', undecided: '미정' };

  const renderInvRows = () => {
    if (!invRowsEl) return;
    if (!filteredInvitations.length) {
      invRowsEl.innerHTML = '<tr><td colspan="15">초대 데이터가 없습니다.</td></tr>';
      syncInvSelectionUI();
      return;
    }

    invRowsEl.innerHTML = filteredInvitations
      .map((row) => {
        const rowId = String(row.id);
        const checked = selectedInvIds.has(rowId) ? 'checked' : '';
        const isRegistered = row.registration_id != null;
        const regBtnHtml = isRegistered
          ? '<span class="inv-registered-badge">등록됨</span>'
          : `<button type="button" class="admin-btn-register" data-id="${escapeHtml(rowId)}">등록</button>`;

        return `<tr>
          <td><input type="checkbox" class="inv-row-select" data-id="${escapeHtml(rowId)}" ${checked} /></td>
          <td>${escapeHtml(row.name)}</td>
          <td>${escapeHtml(row.email || '-')}</td>
          <td>${escapeHtml(row.phone || '-')}</td>
          <td>${escapeHtml(row.affiliation || '-')}</td>
          <td>${escapeHtml(row.position || '-')}</td>
          <td>${escapeHtml(row.category || '-')}</td>
          <td>${escapeHtml(formatDateTime(row.email_sent_at))}</td>
          <td>${escapeHtml(formatDateTime(row.sms_sent_at))}</td>
          <td>${escapeHtml(formatDateTime(row.sns_sent_at))}</td>
          <td>${escapeHtml(formatDateTime(row.call_at))}</td>
          <td>${escapeHtml(attendanceLabel[row.attendance] || '미정')}</td>
          <td>${isRegistered ? '등록완료' : '-'}</td>
          <td>${escapeHtml(row.memo || '-')}</td>
          <td class="inv-actions">
            ${regBtnHtml}
            <button type="button" class="admin-btn-edit" data-id="${escapeHtml(rowId)}">수정</button>
            <button type="button" class="admin-delete" data-id="${escapeHtml(rowId)}">삭제</button>
          </td>
        </tr>`;
      })
      .join('');
    syncInvSelectionUI();
  };

  const renderInvitations = () => {
    applyInvFilters();
    renderInvRows();
    renderInvStats();
  };

  const loadInvitations = async () => {
    const { data, error } = await sb
      .from('invitations')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(500);
    if (error) throw error;
    invitations = data || [];
    renderInvitations();
  };

  const loadAllData = async () => {
    const [regResult, invResult] = await Promise.all([
      sb.from('registrations')
        .select('id,name,email,affiliation,position,note,cancelled_at,created_at')
        .order('created_at', { ascending: false })
        .limit(200),
      sb.from('invitations')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(500),
    ]);
    if (regResult.error) throw regResult.error;
    if (invResult.error) throw invResult.error;
    registrations = regResult.data || [];
    invitations = invResult.data || [];
    renderDashboard();
    renderInvitations();
    setStatus(dashboardStatusEl, `등록 ${registrations.length}건 · 초대 ${invitations.length}건`);
  };

  const openInvModal = (invitation = null) => {
    editingInvId = invitation?.id || null;
    if (invModalTitle) invModalTitle.textContent = editingInvId ? '초대 수정' : '초대 추가';
    invForm?.reset();
    if (invitation && invForm) {
      invForm.name.value = invitation.name || '';
      invForm.email.value = invitation.email || '';
      invForm.phone.value = invitation.phone || '';
      invForm.affiliation.value = invitation.affiliation || '';
      invForm.position.value = invitation.position || '';
      invForm.category.value = invitation.category || '일반';
      invForm.attendance.value = invitation.attendance || 'undecided';
      invForm.memo.value = invitation.memo || '';
    }
    setStatus(invFormStatus, '');
    invModal?.removeAttribute('hidden');
  };

  const closeInvModal = () => {
    invModal?.setAttribute('hidden', '');
    editingInvId = null;
  };

  const deleteRegistrationsByIds = async (ids) => {
    const normalizedIds = Array.from(
      new Set((ids || []).map((value) => String(value).trim()).filter(Boolean)),
    );
    if (!normalizedIds.length) return;
    const { error } = await sb.from('registrations').delete().in('id', normalizedIds);
    if (error) throw error;
  };

  const loadRegistrations = async () => {
    const { data, error } = await sb
      .from('registrations')
      .select('id,name,email,affiliation,position,note,cancelled_at,created_at')
      .order('created_at', { ascending: false })
      .limit(200);
    if (error) throw error;
    registrations = data || [];
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
    if (token !== ADMIN_PASSWORD) {
      setStatus(authStatusEl, '비밀번호가 올바르지 않습니다.', true);
      return;
    }
    adminToken = token;
    sessionStorage.setItem('adminToken', token);
    showDashboard();
    switchView('analytics');
    setStatus(dashboardStatusEl, '데이터를 불러오는 중...');
    try {
      await loadAllData();
    } catch (error) {
      setStatus(dashboardStatusEl, error.message || '조회에 실패했습니다.', true);
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

  // Column sort – registrations table
  const updateSortIndicators = (table, sortState) => {
    table.querySelectorAll('th.sortable').forEach((th) => {
      th.classList.remove('sort-asc', 'sort-desc');
      if (th.dataset.sortKey === sortState.key) {
        th.classList.add(sortState.asc ? 'sort-asc' : 'sort-desc');
      }
    });
  };

  const regTable = rowsEl?.closest('table');
  regTable?.querySelector('thead')?.addEventListener('click', (e) => {
    const th = e.target.closest('th.sortable');
    if (!th) return;
    const key = th.dataset.sortKey;
    if (regSort.key === key) {
      regSort.asc = !regSort.asc;
    } else {
      regSort = { key, asc: true };
    }
    updateSortIndicators(regTable, regSort);
    applyFilters();
    renderRows();
  });

  const invTable = invRowsEl?.closest('table');
  invTable?.querySelector('thead')?.addEventListener('click', (e) => {
    const th = e.target.closest('th.sortable');
    if (!th) return;
    const key = th.dataset.sortKey;
    if (invSort.key === key) {
      invSort.asc = !invSort.asc;
    } else {
      invSort = { key, asc: true };
    }
    updateSortIndicators(invTable, invSort);
    applyInvFilters();
    renderInvRows();
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
    setStatus(dashboardStatusEl, '새로고침 중...');
    try {
      await loadAllData();
    } catch (error) {
      setStatus(dashboardStatusEl, error.message || '새로고침에 실패했습니다.', true);
    }
  });

  logoutBtn?.addEventListener('click', () => {
    adminToken = '';
    sessionStorage.removeItem('adminToken');
    registrations = [];
    filteredRegistrations = [];
    selectedIds.clear();
    invitations = [];
    filteredInvitations = [];
    selectedInvIds.clear();
    editingInvId = null;
    passwordInput.value = '';
    searchInput.value = '';
    statusFilter.value = 'all';
    if (invSearchInput) invSearchInput.value = '';
    if (invFilterCategory) invFilterCategory.value = 'all';
    if (invFilterAttendance) invFilterAttendance.value = 'all';
    if (invFilterRegistered) invFilterRegistered.value = 'all';
    renderRows();
    renderInvitations();
    showLogin();
    setStatus(authStatusEl, '로그아웃되었습니다.');
    setStatus(dashboardStatusEl, '');
  });

  /* ============================================================
     Invitations – event handlers
     ============================================================ */

  invAddBtn?.addEventListener('click', () => openInvModal());
  invCancelBtn?.addEventListener('click', closeInvModal);
  invModal?.querySelector('.admin-modal-backdrop')?.addEventListener('click', closeInvModal);

  invForm?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const formData = new FormData(invForm);
    const payload = Object.fromEntries(formData.entries());

    try {
      if (editingInvId) {
        const { error } = await sb.from('invitations').update(payload).eq('id', editingInvId);
        if (error) throw new Error(error.message);
        setStatus(dashboardStatusEl, '초대 정보가 수정되었습니다.');
      } else {
        const { error } = await sb.from('invitations').insert(payload);
        if (error) throw new Error(error.message);
        setStatus(dashboardStatusEl, '새 초대가 추가되었습니다.');
      }
      closeInvModal();
      await loadInvitations();
    } catch (error) {
      setStatus(invFormStatus, error.message || '저장에 실패했습니다.', true);
    }
  });

  invRowsEl?.addEventListener('click', async (event) => {
    const target = event.target;

    // Delete
    const deleteBtn = target.closest('.admin-delete');
    if (deleteBtn) {
      const id = deleteBtn.dataset.id;
      if (!id || !window.confirm('정말 삭제하시겠습니까?')) return;
      deleteBtn.disabled = true;
      try {
        const { error } = await sb.from('invitations').delete().eq('id', id);
        if (error) throw new Error(error.message);
        invitations = invitations.filter((item) => String(item.id) !== id);
        selectedInvIds.delete(id);
        renderInvitations();
        setStatus(dashboardStatusEl, '초대가 삭제되었습니다.');
      } catch (error) {
        setStatus(dashboardStatusEl, error.message || '삭제에 실패했습니다.', true);
      } finally {
        deleteBtn.disabled = false;
      }
      return;
    }

    // Edit
    const editBtn = target.closest('.admin-btn-edit');
    if (editBtn) {
      const id = editBtn.dataset.id;
      const inv = invitations.find((item) => String(item.id) === id);
      if (inv) openInvModal(inv);
      return;
    }

    // Register (invitation → registration)
    const regBtn = target.closest('.admin-btn-register');
    if (regBtn) {
      const id = regBtn.dataset.id;
      const inv = invitations.find((item) => String(item.id) === id);
      if (!inv) return;
      if (!inv.email) {
        window.alert('이메일이 없는 초대는 등록할 수 없습니다.');
        return;
      }
      if (!window.confirm(`${inv.name}님을 등록 처리하시겠습니까?`)) return;
      regBtn.disabled = true;
      regBtn.textContent = '처리중...';
      try {
        const cancelToken = crypto.randomUUID();
        const { data: regData, error: regError } = await sb
          .from('registrations')
          .insert({
            email: inv.email,
            name: inv.name,
            affiliation: inv.affiliation || '',
            position: inv.position || '',
            cancel_token: cancelToken,
          })
          .select('id')
          .single();
        if (regError) throw new Error(regError.message);
        const registrationId = regData.id;
        if (registrationId) {
          const { error: invError } = await sb
            .from('invitations')
            .update({ registration_id: registrationId, attendance: 'yes' })
            .eq('id', inv.id);
          if (invError) throw new Error(invError.message);
        }
        await Promise.all([loadRegistrations(), loadInvitations()]);
        setStatus(dashboardStatusEl, `${inv.name}님이 등록 처리되었습니다.`);
      } catch (error) {
        setStatus(dashboardStatusEl, error.message || '등록 처리에 실패했습니다.', true);
      } finally {
        regBtn.disabled = false;
        regBtn.textContent = '등록';
      }
      return;
    }
  });

  invRowsEl?.addEventListener('change', (event) => {
    const checkbox = event.target.closest('.inv-row-select');
    if (!checkbox) return;
    const id = checkbox.dataset.id;
    if (!id) return;
    if (checkbox.checked) {
      selectedInvIds.add(id);
    } else {
      selectedInvIds.delete(id);
    }
    syncInvSelectionUI();
  });

  const onInvFilterChanged = () => {
    applyInvFilters();
    renderInvRows();
    setStatus(dashboardStatusEl, `조건에 맞는 ${filteredInvitations.length}건을 표시 중입니다.`);
  };

  invSearchInput?.addEventListener('input', onInvFilterChanged);
  invFilterCategory?.addEventListener('change', onInvFilterChanged);
  invFilterAttendance?.addEventListener('change', onInvFilterChanged);
  invFilterRegistered?.addEventListener('change', onInvFilterChanged);

  invSelectAllCheckbox?.addEventListener('change', () => {
    if (invSelectAllCheckbox.checked) {
      selectedInvIds = new Set(filteredInvitations.map((row) => String(row.id)));
    } else {
      selectedInvIds.clear();
    }
    renderInvRows();
  });

  invBulkDeleteBtn?.addEventListener('click', async () => {
    if (!adminToken || selectedInvIds.size === 0) return;
    const ids = [...selectedInvIds];
    const confirmed = window.confirm(`선택한 ${ids.length}건을 정말 삭제하시겠습니까?`);
    if (!confirmed) return;

    invBulkDeleteBtn.disabled = true;
    try {
      const { error } = await sb.from('invitations').delete().in('id', ids);
      if (error) throw new Error(error.message);
      invitations = invitations.filter((item) => !selectedInvIds.has(String(item.id)));
      selectedInvIds.clear();
      renderInvitations();
      setStatus(dashboardStatusEl, `${ids.length}건이 삭제되었습니다.`);
    } catch (error) {
      setStatus(dashboardStatusEl, error.message || '선택 삭제에 실패했습니다.', true);
      syncInvSelectionUI();
    }
  });

  /* ============================================================
     Column resizing for tables
     ============================================================ */
  const initColumnResizers = () => {
    document.querySelectorAll('.admin-table').forEach((table) => {
      if (table.dataset.resizersReady) return;
      if (table.offsetWidth === 0) return;
      const ths = Array.from(table.querySelectorAll('thead th'));
      if (ths.length === 0) return;

      // Use inline style widths from HTML if set, otherwise measure from first data row.
      const wrapWidth = table.closest('.admin-table-wrap')?.clientWidth || table.offsetWidth;
      const firstRow = table.querySelector('tbody tr');
      const tds = firstRow ? Array.from(firstRow.children) : [];

      // Temporarily remove fixed layout to measure natural widths.
      table.style.tableLayout = 'auto';
      table.style.width = 'auto';

      const widths = ths.map((th, i) => {
        // Prefer explicit width from HTML attribute.
        const explicit = parseInt(th.style.width, 10);
        if (explicit > 0) return explicit;
        const tdW = tds[i] ? tds[i].offsetWidth : 0;
        return Math.max(th.offsetWidth, tdW);
      });
      const totalW = Math.max(widths.reduce((s, w) => s + w, 0), wrapWidth);

      // Lock to fixed layout with measured widths.
      table.style.tableLayout = 'fixed';
      table.style.width = `${totalW}px`;
      ths.forEach((th, i) => { th.style.width = `${widths[i]}px`; });
      table.dataset.resizersReady = '1';

      // Add resizers to all columns except the last one.
      ths.slice(0, -1).forEach((th) => {
        const resizer = document.createElement('div');
        resizer.className = 'col-resizer';
        th.appendChild(resizer);

        let startX, startW, startTableW;
        const onMouseMove = (e) => {
          const diff = e.clientX - startX;
          const newW = Math.max(36, startW + diff);
          th.style.width = `${newW}px`;
          table.style.width = `${startTableW + (newW - startW)}px`;
        };
        const onMouseUp = () => {
          resizer.classList.remove('is-resizing');
          document.body.style.cursor = '';
          document.body.style.userSelect = '';
          document.removeEventListener('mousemove', onMouseMove);
          document.removeEventListener('mouseup', onMouseUp);
        };
        resizer.addEventListener('mousedown', (e) => {
          e.preventDefault();
          e.stopPropagation();
          startX = e.clientX;
          startW = th.offsetWidth;
          startTableW = table.offsetWidth;
          resizer.classList.add('is-resizing');
          document.body.style.cursor = 'col-resize';
          document.body.style.userSelect = 'none';
          document.addEventListener('mousemove', onMouseMove);
          document.addEventListener('mouseup', onMouseUp);
        });
      });
    });
  };

  // Re-init resizers whenever table content changes.
  let resizeScheduled = false;
  const tableWraps = document.querySelectorAll('.admin-table-wrap');

  const resetAndInitResizers = () => {
    tableObserver.disconnect();
    document.querySelectorAll('.admin-table').forEach((table) => {
      delete table.dataset.resizersReady;
      table.style.width = '';
      table.querySelectorAll('th').forEach((th) => {
        th.style.width = '';
        th.querySelector('.col-resizer')?.remove();
      });
    });
    requestAnimationFrame(() => {
      initColumnResizers();
      tableWraps.forEach((wrap) => {
        tableObserver.observe(wrap, { childList: true, subtree: true });
      });
    });
  };

  const tableObserver = new MutationObserver(() => {
    if (resizeScheduled) return;
    resizeScheduled = true;
    requestAnimationFrame(() => {
      resizeScheduled = false;
      resetAndInitResizers();
    });
  });
  tableWraps.forEach((wrap) => {
    tableObserver.observe(wrap, { childList: true, subtree: true });
  });

  // Restore session if token exists from a previous page load.
  if (adminToken) {
    showDashboard();
    switchView('analytics');
    setStatus(dashboardStatusEl, '데이터를 불러오는 중...');
    (async () => {
      try {
        await loadAllData();
      } catch {
        adminToken = '';
        sessionStorage.removeItem('adminToken');
        showLogin();
        setStatus(authStatusEl, '세션이 만료되었습니다. 다시 로그인해주세요.', true);
      }
    })();
  } else {
    showLogin();
  }
});
