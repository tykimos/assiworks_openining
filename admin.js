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

  const settingsForm = document.getElementById('settings-form');
  const settingSeatCapacity = document.getElementById('setting-seat-capacity');
  const settingsStatus = document.getElementById('settings-status');

  // Presentations elements
  const presListView = document.getElementById('pres-list-view');
  const presEditorView = document.getElementById('pres-editor-view');
  const presListEl = document.getElementById('pres-list');
  const presAddBtn = document.getElementById('pres-add-btn');
  const presBackBtn = document.getElementById('pres-back-btn');
  const presTitleInput = document.getElementById('pres-title-input');
  const presContent = document.getElementById('pres-content');
  const presSaveBtn = document.getElementById('pres-save-btn');
  const presPresentBtn = document.getElementById('pres-present-btn');
  const presPreview = document.getElementById('pres-preview');
  const presPreviewPane = document.getElementById('pres-preview-pane');
  const presSaveStatus = document.getElementById('pres-save-status');
  const presTogglePreview = document.getElementById('pres-toggle-preview');
  const presViewer = document.getElementById('pres-viewer');
  const presViewerSlide = document.getElementById('pres-viewer-slide');
  const presViewerPrev = document.getElementById('pres-viewer-prev');
  const presViewerNext = document.getElementById('pres-viewer-next');
  const presViewerCounter = document.getElementById('pres-viewer-counter');
  const presViewerClose = document.getElementById('pres-viewer-close');

  let adminToken = sessionStorage.getItem('adminToken') || '';
  let registrations = [];
  let filteredRegistrations = [];
  let selectedIds = new Set();
  let invitations = [];
  let filteredInvitations = [];
  let selectedInvIds = new Set();
  let editingInvId = null;
  let presentations = [];
  let editingPresId = null;
  let presUnsaved = false;
  let presAutoSaveTimer = null;
  let viewerSlides = [];
  let viewerIndex = 0;
  let viewerSlideMetas = [];
  let viewerDefaultTransition = 'fade';
  let viewerDirection = 'forward';
  let viewerFragments = [];   // array of fragment DOM elements for current slide
  let viewerFragIndex = 0;    // how many fragments have been revealed so far

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
    if (presUnsaved && editingPresId !== null) {
      if (!window.confirm('저장하지 않은 변경사항이 있습니다. 이동하시겠습니까?')) return;
      presUnsaved = false;
      if (presAutoSaveTimer) { clearTimeout(presAutoSaveTimer); presAutoSaveTimer = null; }
    }
    if (editingPresId !== null && targetView !== 'presentations') {
      closePresEditor();
    }
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
    const [regResult, invResult, presResult] = await Promise.all([
      sb.from('registrations')
        .select('id,name,email,affiliation,position,note,cancelled_at,created_at')
        .order('created_at', { ascending: false })
        .limit(200),
      sb.from('invitations')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(500),
      sb.from('presentations')
        .select('*')
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: false }),
      loadSettings(),
    ]);
    if (regResult.error) throw regResult.error;
    if (invResult.error) throw invResult.error;
    registrations = regResult.data || [];
    invitations = invResult.data || [];
    presentations = (presResult.error ? [] : presResult.data) || [];
    renderDashboard();
    renderInvitations();
    renderPresList();
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
    presentations = [];
    editingPresId = null;
    presUnsaved = false;
    if (presAutoSaveTimer) { clearTimeout(presAutoSaveTimer); presAutoSaveTimer = null; }
    closePresEditor();
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
      if (!inv.email) return;
      regBtn.disabled = true;
      regBtn.textContent = '처리중...';
      try {
        const cancelToken = crypto.randomUUID();
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
        let airUserToken = '';
        for (let i = 0; i < 6; i++) airUserToken += chars[Math.floor(Math.random() * chars.length)];
        const { data: regData, error: regError } = await sb
          .from('registrations')
          .insert({
            email: inv.email,
            name: inv.name,
            affiliation: inv.affiliation || '',
            position: inv.position || '',
            cancel_token: cancelToken,
            air_user_token: airUserToken,
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
     Presentations – CRUD, markdown, preview, viewer
     ============================================================ */

  const loadPresentations = async () => {
    const { data, error } = await sb
      .from('presentations')
      .select('*')
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: false });
    if (error) throw error;
    presentations = data || [];
    renderPresList();
  };

  const renderPresList = () => {
    if (!presListEl) return;
    if (!presentations.length) {
      presListEl.innerHTML = '<p class="pres-empty">발표자료가 없습니다. 새 발표자료를 만들어보세요.</p>';
      return;
    }
    presListEl.innerHTML = presentations.map((p) => {
      const slideCount = (p.content || '').split(/^-{3,}\s*$/m).length;
      const updated = formatDateTime(p.updated_at);
      return `<div class="pres-card">
        <div class="pres-card-info">
          <strong>${escapeHtml(p.title || '제목 없음')}</strong>
          <p>${escapeHtml(updated)} · ${slideCount}장</p>
        </div>
        <div class="pres-card-actions">
          <button type="button" class="admin-btn-add pres-view-btn" data-id="${escapeHtml(p.id)}">보기</button>
          <button type="button" class="admin-btn-edit pres-edit-btn" data-id="${escapeHtml(p.id)}">편집</button>
          <button type="button" class="admin-delete pres-delete-btn" data-id="${escapeHtml(p.id)}">삭제</button>
        </div>
      </div>`;
    }).join('');
  };

  presListEl?.addEventListener('click', async (e) => {
    const viewBtn = e.target.closest('.pres-view-btn');
    if (viewBtn) {
      const p = presentations.find((item) => item.id === viewBtn.dataset.id);
      if (p) openViewerFromList(p.content || '');
      return;
    }
    const editBtn = e.target.closest('.pres-edit-btn');
    if (editBtn) {
      const p = presentations.find((item) => item.id === editBtn.dataset.id);
      if (p) openPresEditor(p);
      return;
    }
    const deleteBtn = e.target.closest('.pres-delete-btn');
    if (deleteBtn) {
      const id = deleteBtn.dataset.id;
      if (!window.confirm('이 발표자료를 삭제하시겠습니까?')) return;
      deleteBtn.disabled = true;
      try {
        const { error } = await sb.from('presentations').delete().eq('id', id);
        if (error) throw error;
        presentations = presentations.filter((item) => item.id !== id);
        renderPresList();
      } catch (err) {
        alert(err.message || '삭제에 실패했습니다.');
      } finally {
        deleteBtn.disabled = false;
      }
    }
  });

  presAddBtn?.addEventListener('click', async () => {
    try {
      const { data, error } = await sb
        .from('presentations')
        .insert({ title: '새 발표자료', content: '# 첫 번째 슬라이드\n\n내용을 입력하세요.\n\n---\n\n# 두 번째 슬라이드\n\n내용을 입력하세요.' })
        .select()
        .single();
      if (error) throw error;
      presentations.unshift(data);
      renderPresList();
      openPresEditor(data);
    } catch (err) {
      alert(err.message || '생성에 실패했습니다.');
    }
  });

  // Image store: short references in textarea, full base64 stored here
  const presImageMap = new Map();
  let presImageCounter = 0;

  const collapseImageData = (text) => {
    return text.replace(/!\[([^\]]*)\]\((data:image\/[^)]+)\)/g, (_, alt, dataUrl) => {
      const key = `paste:${presImageCounter++}`;
      presImageMap.set(key, dataUrl);
      return `![${alt}](${key})`;
    });
  };

  const expandImageRefs = (text) => {
    return text.replace(/!\[([^\]]*)\]\((paste:\d+)\)/g, (_, alt, key) => {
      const dataUrl = presImageMap.get(key);
      return dataUrl ? `![${alt}](${dataUrl})` : `![${alt}](${key})`;
    });
  };

  const openPresEditor = (pres) => {
    editingPresId = pres.id;
    presUnsaved = false;
    presImageMap.clear();
    presImageCounter = 0;
    if (presTitleInput) presTitleInput.value = pres.title || '';
    if (presContent) presContent.value = collapseImageData(pres.content || '');
    if (presSaveStatus) presSaveStatus.textContent = '';
    presListView?.setAttribute('hidden', '');
    presEditorView?.removeAttribute('hidden');
    renderPresPreview();
  };

  const closePresEditor = () => {
    if (presAutoSaveTimer) { clearTimeout(presAutoSaveTimer); presAutoSaveTimer = null; }
    editingPresId = null;
    presUnsaved = false;
    presEditorView?.setAttribute('hidden', '');
    presListView?.removeAttribute('hidden');
  };

  presBackBtn?.addEventListener('click', () => {
    if (presUnsaved) {
      if (!window.confirm('저장하지 않은 변경사항이 있습니다. 목록으로 돌아가시겠습니까?')) return;
    }
    closePresEditor();
  });

  const savePresentation = async () => {
    if (!editingPresId) return;
    const title = presTitleInput?.value?.trim() || '제목 없음';
    const content = expandImageRefs(presContent?.value || '');
    try {
      const { error } = await sb
        .from('presentations')
        .update({ title, content })
        .eq('id', editingPresId);
      if (error) throw error;
      const idx = presentations.findIndex((p) => p.id === editingPresId);
      if (idx >= 0) {
        presentations[idx].title = title;
        presentations[idx].content = content;
        presentations[idx].updated_at = new Date().toISOString();
      }
      presUnsaved = false;
      if (presSaveStatus) presSaveStatus.textContent = '저장됨';
      renderPresList();
    } catch (err) {
      if (presSaveStatus) presSaveStatus.textContent = '저장 실패';
    }
  };

  presSaveBtn?.addEventListener('click', savePresentation);

  const scheduleAutoSave = () => {
    presUnsaved = true;
    if (presSaveStatus) presSaveStatus.textContent = '수정됨 (미저장)';
    if (presAutoSaveTimer) clearTimeout(presAutoSaveTimer);
    presAutoSaveTimer = setTimeout(savePresentation, 5000);
  };

  presTitleInput?.addEventListener('input', scheduleAutoSave);
  presContent?.addEventListener('input', () => {
    scheduleAutoSave();
    renderPresPreview();
  });

  // Paste image from clipboard — store base64 in map, show short ref in textarea
  presContent?.addEventListener('paste', (e) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (const item of items) {
      if (item.type.startsWith('image/')) {
        e.preventDefault();
        const file = item.getAsFile();
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => {
          const key = `paste:${presImageCounter++}`;
          presImageMap.set(key, reader.result);
          const md = `![image](${key})`;
          const start = presContent.selectionStart;
          const end = presContent.selectionEnd;
          const text = presContent.value;
          presContent.value = text.slice(0, start) + md + text.slice(end);
          presContent.selectionStart = presContent.selectionEnd = start + md.length;
          scheduleAutoSave();
          renderPresPreview();
        };
        reader.readAsDataURL(file);
        return;
      }
    }
  });

  // Indent helpers for presentation editor (Tab / Shift+Tab / Enter)
  // Uses execCommand to preserve browser undo stack (Cmd+Z)
  presContent?.addEventListener('keydown', (e) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const start = presContent.selectionStart;
      const end = presContent.selectionEnd;
      const val = presContent.value;

      if (e.shiftKey) {
        // Shift+Tab: unindent selected lines
        const lineStart = val.lastIndexOf('\n', start - 1) + 1;
        const lineEnd = val.indexOf('\n', end);
        const blockEnd = lineEnd === -1 ? val.length : lineEnd;
        const block = val.substring(lineStart, blockEnd);
        const unindented = block.split('\n').map(l => l.startsWith('  ') ? l.slice(2) : l).join('\n');
        presContent.setSelectionRange(lineStart, blockEnd);
        document.execCommand('insertText', false, unindented);
        const diff = block.length - unindented.length;
        const firstLineRemoved = val.substring(lineStart, start).startsWith('  ') ? 2 : 0;
        presContent.selectionStart = Math.max(lineStart, start - firstLineRemoved);
        presContent.selectionEnd = end - diff;
      } else if (start !== end) {
        // Tab with selection: indent all selected lines
        const lineStart = val.lastIndexOf('\n', start - 1) + 1;
        const lineEnd = val.indexOf('\n', end);
        const blockEnd = lineEnd === -1 ? val.length : lineEnd;
        const block = val.substring(lineStart, blockEnd);
        const indented = block.split('\n').map(l => '  ' + l).join('\n');
        presContent.setSelectionRange(lineStart, blockEnd);
        document.execCommand('insertText', false, indented);
        presContent.selectionStart = start + 2;
        presContent.selectionEnd = end + (indented.length - block.length);
      } else {
        // Tab without selection: insert 2 spaces
        document.execCommand('insertText', false, '  ');
      }
      scheduleAutoSave();
      renderPresPreview();
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const start = presContent.selectionStart;
      const val = presContent.value;
      const lineStart = val.lastIndexOf('\n', start - 1) + 1;
      const currentLine = val.substring(lineStart, start);
      const indentMatch = currentLine.match(/^( *)/);
      const indent = indentMatch ? indentMatch[1] : '';
      document.execCommand('insertText', false, '\n' + indent);
      scheduleAutoSave();
      renderPresPreview();
    }
  });

  // Warn before leaving with unsaved changes
  window.addEventListener('beforeunload', (e) => {
    if (presUnsaved && editingPresId !== null) {
      e.preventDefault();
      e.returnValue = '';
    }
  });

  /* ---- Simple Markdown parser ---- */

  const safeUrl = (url) => {
    const decoded = url.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'");
    if (/^https?:\/\//i.test(decoded) || /^\//.test(decoded) || /^data:image\//i.test(decoded)) return url;
    return '';
  };

  /* ---- Extended Markdown: Metadata Parser ---- */
  const parseMetadata = (slideText) => {
    const trimmed = (slideText || '').trim();
    const match = trimmed.match(/^<!--\s*([\s\S]*?)\s*-->/);
    if (!match) return { meta: { layout: 'default' }, body: trimmed };

    const meta = { layout: 'default' };
    match[1].split(',').forEach(pair => {
      const [k, ...vParts] = pair.split(':');
      if (k && vParts.length) {
        meta[k.trim()] = vParts.join(':').trim();
      }
    });

    const body = trimmed.slice(match[0].length).trim();
    return { meta, body };
  };

  /* ---- Extended Markdown: Directive Parser (Indentation-based) ---- */
  const parseDirectives = (bodyText) => {
    const lines = (bodyText || '').split('\n');
    const tokenMap = {};
    const stack = []; // { directive, indent }
    let tokenCounter = 0;
    const result = [];
    const directiveRe = /^\[(cols-3|cols|col|left|right|center|bottom|box)(?:\s+([^\]]*))?\]$/;

    for (const line of lines) {
      // Empty / whitespace-only lines pass through
      if (!line.trim()) {
        result.push('');
        continue;
      }

      const leadingSpaces = line.match(/^( *)/)[1].length;
      const indent = Math.floor(leadingSpaces / 2);
      const stripped = line.trim();

      // Close directives whose indent >= current line's indent
      while (stack.length > 0 && stack[stack.length - 1].indent >= indent) {
        stack.pop();
        const token = `__DIR_${tokenCounter++}__`;
        tokenMap[token] = '</div>';
        result.push(token);
      }

      const m = stripped.match(directiveRe);
      if (m) {
        const directive = m[1];
        const args = (m[2] || '').trim();
        let html = '';

        if (directive === 'cols') {
          const ratioMatch = args.match(/^(\d+):(\d+)$/);
          html = ratioMatch
            ? `<div class="slide-cols" style="grid-template-columns: ${ratioMatch[1]}fr ${ratioMatch[2]}fr;">`
            : '<div class="slide-cols">';
        } else if (directive === 'cols-3') {
          html = '<div class="slide-cols-3">';
        } else if (directive === 'left' || directive === 'right' || directive === 'col') {
          const parent = stack.length ? stack[stack.length - 1].directive : null;
          if (directive === 'left') {
            html = '<div class="slide-col-left">';
          } else if (directive === 'right') {
            html = (parent === 'cols' || parent === 'cols-3')
              ? '<div class="slide-col-right">'
              : '<div class="slide-align-right">';
          } else {
            html = '<div class="slide-col">';
          }
        } else if (directive === 'center') {
          html = '<div class="slide-align-center">';
        } else if (directive === 'bottom') {
          const modifiers = args ? args.split(/\s+/) : [];
          const classes = ['slide-align-bottom'];
          modifiers.forEach(mod => { if (mod === 'right') classes.push('slide-align-right'); });
          html = `<div class="${classes.join(' ')}">`;
        } else if (directive === 'box') {
          const modifiers = args ? args.split(/\s+/).filter(Boolean) : [];
          const classes = ['slide-box', ...modifiers.map(mod => `slide-box-${mod}`)];
          html = `<div class="${classes.join(' ')}">`;
        }

        const token = `__DIR_${tokenCounter++}__`;
        tokenMap[token] = html;
        result.push(token);
        stack.push({ directive, indent });
      } else {
        // Content line — output without leading indentation
        result.push(stripped);
      }
    }

    // Close remaining stack items
    while (stack.length > 0) {
      stack.pop();
      const token = `__DIR_${tokenCounter++}__`;
      tokenMap[token] = '</div>';
      result.push(token);
    }

    return { text: result.join('\n'), tokenMap };
  };

  /* ---- Extended Markdown: Style Class Parser (Placeholder Tokens) ---- */
  const slideClassMap = {
    '.large': 'slide-text-large',
    '.small': 'slide-text-small',
    '.muted': 'slide-text-muted',
    '.accent': 'slide-text-accent',
    '.orange': 'slide-text-orange',
    '.center': 'slide-text-center',
    '.gradient': 'slide-text-gradient',
    '.glow': 'slide-text-glow',
    '.xl': 'slide-text-xl',
    '.xxl': 'slide-text-xxl',
    '.bold': 'slide-text-bold',
    '.light': 'slide-text-light',
    '.spacer': 'slide-spacer',
    '.spacer-lg': 'slide-spacer-lg',
    '.spacer-xl': 'slide-spacer-xl',
    '.spacer-sm': 'slide-spacer-sm',
    '.fade-in': 'slide-frag',
    '.fade-up': 'slide-fade-up',
    '.scale-in': 'slide-scale-in',
    '.white': 'slide-text-white',
    '.blue': 'slide-text-blue',
    '.sub': 'slide-text-sub',
  };

  const mapClasses = (rawClasses) => rawClasses.map(cls => slideClassMap[cls] || (!cls.startsWith('.') ? cls : '')).filter(Boolean);

  const parseStyleClasses = (text, tokenMap) => {
    const lines = (text || '').split('\n');
    let tokenCounter = 0;
    // Find next available STYLE counter
    while (tokenMap[`__STYLE_${tokenCounter}__`]) tokenCounter++;
    const result = [];

    const classMap = slideClassMap;
    let pendingClose = null; // close token for an open style block

    for (const line of lines) {
      let remaining = line;
      const allRawClasses = [];

      // Repeatedly match {.class} blocks at start of remaining string
      const classBlockRe = /^\{((?:\.[a-zA-Z0-9_-]+(?:\s+)?)+(?:\s+[a-zA-Z0-9_-]+)*)\}\s*/;
      let cm;
      while ((cm = remaining.match(classBlockRe))) {
        allRawClasses.push(...cm[1].trim().split(/\s+/));
        remaining = remaining.slice(cm[0].length);
      }

      // No classes on this line
      if (allRawClasses.length === 0) {
        // Close pending style block before empty lines or directive tokens
        if (pendingClose && (!line.trim() || /^__DIR_\d+__$/.test(line.trim()))) {
          result.push(pendingClose);
          pendingClose = null;
        }
        result.push(line);
        continue;
      }

      // Has classes — close any pending block first
      if (pendingClose) {
        result.push(pendingClose);
        pendingClose = null;
      }

      const rawClasses = allRawClasses;
      const textContent = remaining;

      // Map class names to CSS classes
      const cssClasses = [];
      let isSpacer = false;

      for (const cls of rawClasses) {
        if (cls === '.spacer' || cls === '.spacer-lg' || cls === '.spacer-xl' || cls === '.spacer-sm') {
          isSpacer = true;
          cssClasses.push(classMap[cls]);
        } else if (classMap[cls]) {
          cssClasses.push(classMap[cls]);
        } else if (!cls.startsWith('.')) {
          // Non-dot-prefixed modifiers like delay-200
          cssClasses.push(cls);
        }
      }

      const classStr = cssClasses.join(' ');

      if (isSpacer) {
        // Self-closing spacer div
        const token = `__STYLE_${tokenCounter++}__`;
        tokenMap[token] = `<div class="${classStr}"></div>`;
        result.push(token);
      } else if (!textContent) {
        // Style-only line: open block, wrap following content until next style/empty
        const openToken = `__STYLE_${tokenCounter++}__`;
        const closeToken = `__STYLE_${tokenCounter++}__`;
        tokenMap[openToken] = `<div class="${classStr}">`;
        tokenMap[closeToken] = '</div>';
        result.push(openToken);
        pendingClose = closeToken;
      } else {
        // Inline: wrap text content on this line only
        const openToken = `__STYLE_${tokenCounter++}__`;
        const closeToken = `__STYLE_${tokenCounter++}__`;
        tokenMap[openToken] = `<div class="${classStr}">`;
        tokenMap[closeToken] = '</div>';
        result.push(`${openToken}${textContent}${closeToken}`);
      }
    }

    // Close any remaining pending block
    if (pendingClose) {
      result.push(pendingClose);
      pendingClose = null;
    }

    return { text: result.join('\n'), tokenMap };
  };

  /* ---- Extended Markdown: Restore Placeholder Tokens ---- */
  const restorePlaceholders = (html, tokenMap) => {
    for (const [token, replacement] of Object.entries(tokenMap)) {
      html = html.split(token).join(replacement);
    }
    // Clean up <p> wrapping around block elements
    html = html.replace(/<p>\s*(<div[\s>])/g, '$1');
    html = html.replace(/(<\/div>)\s*<\/p>/g, '$1');
    // Clean up <br\/> adjacent to divs
    html = html.replace(/<br\/>\s*(<div[\s>])/g, '$1');
    html = html.replace(/(<\/div>)\s*<br\/>/g, '$1');
    return html;
  };

  const renderMarkdown = (text) => {
    let html = escapeHtml(text);

    // Code blocks (``` ... ```)
    html = html.replace(/```(\w*)\n([\s\S]*?)```/g, (_, lang, code) =>
      `<pre><code>${code}</code></pre>`
    );

    // Inline code
    html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

    // Images (only allow http/https/relative URLs)
    html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (_, alt, src) => {
      const safe = safeUrl(src);
      return safe ? `<img src="${safe}" alt="${alt}" class="slide-img" />` : alt;
    });

    // Links (only allow http/https/relative URLs)
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, label, href) => {
      const safe = safeUrl(href);
      return safe ? `<a href="${safe}" target="_blank" rel="noopener">${label}</a>` : label;
    });

    // Headers
    html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
    html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
    html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');

    // Horizontal rules (*** or ___ but NOT ---) — must run BEFORE bold/italic
    // so that standalone *** on a line isn't consumed by italic regex
    html = html.replace(/^(\*{3,}|_{3,})\s*$/gm, '<hr/>');

    // Bold & italic
    html = html.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>');
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');

    // Inline style: {.class1 .class2}(text) → <span class="..." style="...">text</span>
    html = html.replace(/\{((?:\.[a-zA-Z0-9_-]+(?:\s+)?)+(?:\s+[a-zA-Z0-9_-]+)*)\}\(([^)]+)\)/g, (_, rawCls, content) => {
      const cssClasses = mapClasses(rawCls.trim().split(/\s+/));
      return `<span class="slide-inline-styled ${cssClasses.join(' ')}">${content}</span>`;
    });

    // Unordered list items
    html = html.replace(/^[-*] (.+)$/gm, '<li>$1</li>');
    html = html.replace(/((?:<li>.*<\/li>\n?)+)/g, '<ul>$1</ul>');

    // Ordered list items
    html = html.replace(/^\d+\. (.+)$/gm, '<li>$1</li>');

    // Paragraphs: convert double newlines
    html = html.replace(/\n{2,}/g, '</p><p>');
    // Single newlines to <br>
    html = html.replace(/\n/g, '<br/>');

    // Remove stray <br/> between list items
    html = html.replace(/<\/li>\s*<br\/>\s*<li>/g, '</li><li>');

    html = `<p>${html}</p>`;
    // Clean up empty paragraphs
    html = html.replace(/<p>\s*<\/p>/g, '');
    html = html.replace(/<p>\s*(<h[123]>)/g, '$1');
    html = html.replace(/(<\/h[123]>)\s*<\/p>/g, '$1');
    html = html.replace(/<p>\s*(<ul>)/g, '$1');
    html = html.replace(/(<\/ul>)\s*<\/p>/g, '$1');
    html = html.replace(/<p>\s*(<pre>)/g, '$1');
    html = html.replace(/(<\/pre>)\s*<\/p>/g, '$1');
    html = html.replace(/<p>\s*(<hr\/>)/g, '$1');
    html = html.replace(/(<hr\/>)\s*<\/p>/g, '$1');
    html = html.replace(/<p>\s*(<img )/g, '$1');

    // Wrap consecutive slide-img tags in a flex row for side-by-side display
    html = html.replace(
      /(<img\s[^>]*class="slide-img"[^>]*\/?>)\s*(?:<br\s*\/?>)?\s*(<img\s[^>]*class="slide-img"[^>]*\/?>)/g,
      '<div class="slide-images-row">$1$2</div>'
    );

    return html;
  };

  const splitSlides = (text) => {
    return (text || '').split(/^-{3,}\s*$/m).map((s) => s.trim());
  };

  /* ---- Extended Markdown: Unified Rendering Pipeline ---- */
  const renderSlide = (slideText) => {
    const { meta, body } = parseMetadata(slideText);
    const dir = parseDirectives(body);
    const sty = parseStyleClasses(dir.text, dir.tokenMap);
    let html = renderMarkdown(sty.text);
    html = restorePlaceholders(html, sty.tokenMap);
    return { meta, html };
  };

  const renderPresPreview = () => {
    if (!presPreview) return;
    const slides = splitSlides(expandImageRefs(presContent?.value || ''));
    presPreview.innerHTML = slides.map((slide, i) => {
      const { meta, html } = renderSlide(slide);
      const layoutClass = meta.layout !== 'default' ? ` slide-layout-${meta.layout}` : '';
      const bgStyle = meta.bg ? ` style="background-color: ${escapeHtml(meta.bg)};"` : '';
      const extraClass = meta.class ? ` ${escapeHtml(meta.class)}` : '';
      return `<div class="pres-slide-card${layoutClass}${extraClass}"${bgStyle}>
        <div class="pres-slide-number">${i + 1}</div>
        <div class="pres-slide-content">${html}</div>
      </div>`;
    }).join('');
  };

  // Mobile preview toggle
  presTogglePreview?.addEventListener('click', () => {
    presPreviewPane?.classList.toggle('pres-preview-visible');
  });

  /* ---- Fullscreen Viewer ---- */

  const openViewer = () => {
    const content = expandImageRefs(presContent?.value || '');
    openViewerFromList(content);
  };

  const openViewerFromList = (content) => {
    viewerSlides = splitSlides(content);
    if (!viewerSlides.length) viewerSlides = [''];
    viewerIndex = 0;
    viewerDirection = 'forward';

    // Pre-parse metadata for all slides
    viewerSlideMetas = viewerSlides.map(s => parseMetadata(s).meta);

    // Read default-transition from first slide's metadata
    viewerDefaultTransition = viewerSlideMetas[0]?.['default-transition'] || 'fade';

    renderViewerSlide();
    presViewer?.removeAttribute('hidden');
    document.body.style.overflow = 'hidden';
    // Request browser fullscreen
    const el = presViewer || document.documentElement;
    const rfs = el.requestFullscreen || el.webkitRequestFullscreen || el.mozRequestFullScreen || el.msRequestFullscreen;
    if (rfs) rfs.call(el).catch(() => {});
  };

  const closeViewer = () => {
    presViewer?.setAttribute('hidden', '');
    document.body.style.overflow = '';
    // Exit browser fullscreen if active
    if (document.fullscreenElement || document.webkitFullscreenElement) {
      const efs = document.exitFullscreen || document.webkitExitFullscreen || document.mozCancelFullScreen || document.msExitFullscreen;
      if (efs) efs.call(document).catch(() => {});
    }
  };

  const renderViewerSlide = () => {
    if (!presViewerSlide) return;
    const { meta, html } = renderSlide(viewerSlides[viewerIndex] || '');

    // 1. Reset classes
    presViewerSlide.className = 'pres-viewer-slide';

    // 2. Apply layout class
    if (meta.layout && meta.layout !== 'default') {
      presViewerSlide.classList.add(`slide-layout-${meta.layout}`);
    }
    if (meta.class) {
      meta.class.split(/\s+/).forEach(c => presViewerSlide.classList.add(c));
    }
    presViewerSlide.style.backgroundColor = meta.bg || '';

    // 3. Set content
    presViewerSlide.innerHTML = `<div class="pres-viewer-content">${html}</div>`;

    // 3a. Find and hide all fragments for step-by-step reveal
    viewerFragments = Array.from(presViewerSlide.querySelectorAll('.slide-frag, .slide-fade-up, .slide-scale-in'));
    viewerFragIndex = 0;
    viewerFragments.forEach(el => {
      el.classList.add('frag-hidden');
    });

    // 4. Determine transition
    const transition = viewerSlideMetas?.[viewerIndex]?.transition || viewerDefaultTransition || 'fade';
    let transClass;
    if (transition === 'none') {
      transClass = 'slide-enter-none';
    } else if (transition === 'slide-left') {
      transClass = viewerDirection === 'backward' ? 'slide-enter-slide-left-reverse' : 'slide-enter-slide-left';
    } else if (transition === 'slide-up') {
      transClass = viewerDirection === 'backward' ? 'slide-enter-slide-up-reverse' : 'slide-enter-slide-up';
    } else if (transition === 'zoom') {
      transClass = 'slide-enter-zoom';
    } else {
      transClass = 'slide-enter-fade';
    }

    // 5. Force reflow then apply transition
    void presViewerSlide.offsetWidth;
    presViewerSlide.classList.add(transClass);

    if (presViewerCounter) presViewerCounter.textContent = `${viewerIndex + 1} / ${viewerSlides.length}`;
    if (presViewerPrev) presViewerPrev.style.visibility = viewerIndex > 0 ? 'visible' : 'hidden';
    if (presViewerNext) presViewerNext.style.visibility = (viewerIndex < viewerSlides.length - 1 || viewerFragments.length > 0) ? 'visible' : 'hidden';
  };

  const revealNextFragment = () => {
    if (viewerFragIndex >= viewerFragments.length) return false;
    const el = viewerFragments[viewerFragIndex];
    el.classList.remove('frag-hidden');
    void el.offsetWidth;
    viewerFragIndex++;
    return true;
  };

  const hideLastFragment = () => {
    if (viewerFragIndex <= 0) return false;
    viewerFragIndex--;
    const el = viewerFragments[viewerFragIndex];
    el.classList.add('frag-hidden');
    return true;
  };

  presPresentBtn?.addEventListener('click', openViewer);
  presViewerClose?.addEventListener('click', closeViewer);
  presViewerPrev?.addEventListener('click', () => {
    if (!hideLastFragment()) {
      if (viewerIndex > 0) { viewerDirection = 'backward'; viewerIndex--; renderViewerSlide(); }
    }
  });
  presViewerNext?.addEventListener('click', () => {
    if (!revealNextFragment()) {
      if (viewerIndex < viewerSlides.length - 1) { viewerDirection = 'forward'; viewerIndex++; renderViewerSlide(); }
    }
  });

  document.addEventListener('keydown', (e) => {
    if (!presViewer || presViewer.hidden) return;
    // Don't handle Escape ourselves in fullscreen — the browser exits fullscreen first,
    // and our fullscreenchange handler will close the viewer.
    if (e.key === 'Escape') {
      if (!document.fullscreenElement && !document.webkitFullscreenElement) {
        closeViewer();
      }
      return;
    }
    if (e.key === 'ArrowRight') {
      if (!revealNextFragment()) {
        if (viewerIndex < viewerSlides.length - 1) { viewerDirection = 'forward'; viewerIndex++; renderViewerSlide(); }
      }
    }
    if (e.key === 'ArrowLeft') {
      if (!hideLastFragment()) {
        if (viewerIndex > 0) { viewerDirection = 'backward'; viewerIndex--; renderViewerSlide(); }
      }
    }
  });

  // Close viewer when user exits fullscreen via browser controls
  document.addEventListener('fullscreenchange', () => {
    if (!document.fullscreenElement && presViewer && !presViewer.hidden) {
      presViewer.setAttribute('hidden', '');
      document.body.style.overflow = '';
    }
  });
  document.addEventListener('webkitfullscreenchange', () => {
    if (!document.webkitFullscreenElement && presViewer && !presViewer.hidden) {
      presViewer.setAttribute('hidden', '');
      document.body.style.overflow = '';
    }
  });

  /* ============================================================
     Settings – load & save
     ============================================================ */

  const loadSettings = async () => {
    try {
      const { data, error } = await sb
        .from('site_settings')
        .select('key, value');
      if (error) throw error;
      const settings = {};
      (data || []).forEach((row) => { settings[row.key] = row.value; });
      if (settingSeatCapacity && settings.seat_capacity) {
        settingSeatCapacity.value = settings.seat_capacity;
      }
    } catch (error) {
      console.warn('Settings load failed', error);
    }
  };

  settingsForm?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const value = settingSeatCapacity?.value?.trim();
    if (!value || Number(value) < 1) {
      setStatus(settingsStatus, '1 이상의 숫자를 입력해주세요.', true);
      return;
    }
    try {
      const { error } = await sb
        .from('site_settings')
        .upsert({ key: 'seat_capacity', value: String(value) }, { onConflict: 'key' });
      if (error) throw error;
      setStatus(settingsStatus, `등록 정원이 ${value}명으로 변경되었습니다.`);
    } catch (error) {
      setStatus(settingsStatus, error.message || '설정 저장에 실패했습니다.', true);
    }
  });

  /* ============================================================
     Column resizing for tables
     ============================================================ */
  const saveColWidths = (tableId, ths) => {
    const widths = ths.map((th) => th.offsetWidth);
    try { localStorage.setItem(`colWidths_${tableId}`, JSON.stringify(widths)); } catch {}
  };

  const loadColWidths = (tableId) => {
    try { return JSON.parse(localStorage.getItem(`colWidths_${tableId}`)); } catch { return null; }
  };

  const initColumnResizers = () => {
    document.querySelectorAll('.admin-table').forEach((table) => {
      if (table.dataset.resizersReady) return;
      if (table.offsetWidth === 0) return;
      const ths = Array.from(table.querySelectorAll('thead th'));
      if (ths.length === 0) return;

      const tableId = table.className.replace(/\s+/g, '_');
      const saved = loadColWidths(tableId);

      let widths;
      if (saved && saved.length === ths.length) {
        // Restore user-saved widths.
        widths = saved;
      } else {
        // First load: use HTML explicit widths or measure naturally.
        const firstRow = table.querySelector('tbody tr');
        const tds = firstRow ? Array.from(firstRow.children) : [];
        table.style.tableLayout = 'auto';
        table.style.width = 'auto';
        ths.forEach((th) => { th.style.removeProperty('width'); });

        widths = ths.map((th, i) => {
          const explicit = parseInt(th.getAttribute('style')?.match(/width:\s*(\d+)/)?.[1], 10);
          if (explicit > 0) return explicit;
          const tdW = tds[i] ? tds[i].offsetWidth : 0;
          return Math.max(th.offsetWidth, tdW);
        });
      }

      const totalW = widths.reduce((s, w) => s + w, 0);
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
          saveColWidths(tableId, ths);
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

  // Re-attach resizers after table body re-render (resizers live in thead, unaffected by tbody changes).
  const refreshResizers = (table) => {
    if (!table) return;
    // Resizers are in thead which doesn't change; just ensure they're initialized.
    if (!table.dataset.resizersReady) {
      initColumnResizers();
    }
  };

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
