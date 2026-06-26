/**
 * CB Test — Frontend Application (TOS-native)
 * CentralizedBackup API Test Tool
 */

// ── Config ──────────────────────────────────────────────────────
const API_BASE = '/v2/proxy/cbtest/api';
const POLL_INTERVAL = 2000;

// ── Custom Confirm / Alert (iframe-safe) ────────────────────────
function customConfirm(msg) {
  return new Promise(resolve => {
    const ov = document.createElement('div');
    ov.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:99999;display:flex;align-items:center;justify-content:center';
    const box = document.createElement('div');
    box.style.cssText = 'background:var(--card,#1e1e2f);color:var(--fg,#eee);border-radius:12px;padding:24px 28px;max-width:400px;width:90%;box-shadow:0 8px 32px rgba(0,0,0,.4);font-family:system-ui,sans-serif';
    box.innerHTML = `<p style="margin:0 0 20px;line-height:1.6">${msg}</p><div style="display:flex;gap:10px;justify-content:flex-end"><button id="_cc_no" style="padding:8px 18px;border:1px solid var(--border,#444);border-radius:8px;background:transparent;color:var(--fg,#eee);cursor:pointer">取消</button><button id="_cc_yes" style="padding:8px 18px;border:none;border-radius:8px;background:var(--accent,#6c5ce7);color:#fff;cursor:pointer">确定</button></div>`;
    ov.appendChild(box); document.body.appendChild(ov);
    box.querySelector('#_cc_yes').onclick = () => { document.body.removeChild(ov); resolve(true); };
    box.querySelector('#_cc_no').onclick = () => { document.body.removeChild(ov); resolve(false); };
  });
}
function customAlert(msg) {
  return new Promise(resolve => {
    const ov = document.createElement('div');
    ov.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:99999;display:flex;align-items:center;justify-content:center';
    const box = document.createElement('div');
    box.style.cssText = 'background:var(--card,#1e1e2f);color:var(--fg,#eee);border-radius:12px;padding:24px 28px;max-width:400px;width:90%;box-shadow:0 8px 32px rgba(0,0,0,.4);font-family:system-ui,sans-serif';
    box.innerHTML = `<p style="margin:0 0 20px;line-height:1.6">${msg}</p><div style="display:flex;justify-content:flex-end"><button id="_ca_ok" style="padding:8px 18px;border:none;border-radius:8px;background:var(--accent,#6c5ce7);color:#fff;cursor:pointer">好的</button></div>`;
    ov.appendChild(box); document.body.appendChild(ov);
    box.querySelector('#_ca_ok').onclick = () => { document.body.removeChild(ov); resolve(); };
  });
}
function promptText(label) {
  return new Promise(resolve => {
    const ov = document.createElement('div');
    ov.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:99999;display:flex;align-items:center;justify-content:center';
    const box = document.createElement('div');
    box.style.cssText = 'background:var(--card,#1e1e2f);color:var(--fg,#eee);border-radius:12px;padding:24px 28px;max-width:400px;width:90%;box-shadow:0 8px 32px rgba(0,0,0,.4);font-family:system-ui,sans-serif';
    box.innerHTML = `<p style="margin:0 0 16px;font-size:14px">${label}</p><input id="_pt_in" style="width:100%;padding:8px 10px;border:1px solid var(--border,#444);border-radius:8px;background:var(--bg,#1a1a2e);color:var(--fg,#eee);font-size:13px;margin-bottom:16px;"><div style="display:flex;gap:10px;justify-content:flex-end"><button id="_pt_no" style="padding:8px 18px;border:1px solid var(--border,#444);border-radius:8px;background:transparent;color:var(--fg,#eee);cursor:pointer">取消</button><button id="_pt_ok" style="padding:8px 18px;border:none;border-radius:8px;background:var(--accent,#6c5ce7);color:#fff;cursor:pointer">确定</button></div>`;
    ov.appendChild(box); document.body.appendChild(ov);
    const inp = box.querySelector('#_pt_in');
    inp.focus();
    box.querySelector('#_pt_ok').onclick = () => { document.body.removeChild(ov); resolve(inp.value); };
    box.querySelector('#_pt_no').onclick = () => { document.body.removeChild(ov); resolve(''); };
    inp.addEventListener('keydown', e => { if (e.key==='Enter') { document.body.removeChild(ov); resolve(inp.value); } });
  });
}

// ── State ───────────────────────────────────────────────────────
let allCases = [];
let filteredCases = [];
let currentModule = 'all';
let runResults = {};
let isRunning = false;
let pollTimer = null;
let authInfo = { logged_in: false, username: '', base_url: '' };
let pendingParamCase = null;

// ── DOM ─────────────────────────────────────────────────────────
const $tbody = document.getElementById('test-tbody');
const $statPass = document.getElementById('stat-pass');
const $statFail = document.getElementById('stat-fail');
const $statSkip = document.getElementById('stat-skip');
const $statRunning = document.getElementById('stat-running');
const $progressWrap = document.getElementById('progress-container');
const $progressFill = document.getElementById('progress-fill');
const $progressText = document.getElementById('progress-text');
const $btnRun = document.getElementById('btn-run');
const $btnStop = document.getElementById('btn-stop');
const $btnSelectAll = document.getElementById('btn-select-all');
const $btnInvert = document.getElementById('btn-invert');
const $btnExport = document.getElementById('btn-export');
const $btnClear = document.getElementById('btn-clear');
const $btnSync = document.getElementById('btn-sync');
const $btnAdd = document.getElementById('btn-add');
const $checkAll = document.getElementById('check-all');
const $detailPanel = document.getElementById('detail-panel');
const $detailOverlay = document.getElementById('detail-overlay');
const $detailTitle = document.getElementById('detail-title');
const $detailInfo = document.getElementById('detail-info');
const $detailReq = document.getElementById('detail-request');
const $detailResp = document.getElementById('detail-response');
const $detailClose = document.getElementById('detail-close');
const $emptyState = document.getElementById('empty-state');
const $tabCountAll = document.getElementById('tab-count-all');
const $authStatus = document.getElementById('auth-status');
const $authIndicator = document.getElementById('auth-indicator');
const $authLabel = document.getElementById('auth-label');
const $loginModal = document.getElementById('login-modal');
const $loginClose = document.getElementById('login-close');
const $loginUrl = document.getElementById('login-url');
const $loginUser = document.getElementById('login-user');
const $loginPass = document.getElementById('login-pass');
const $btnLogin = document.getElementById('btn-login');
const $btnLoginCancel = document.getElementById('btn-login-cancel');
const $loginHint = document.getElementById('login-hint');
const $paramModal = document.getElementById('param-modal');
const $paramClose = document.getElementById('param-close');
const $paramTitle = document.getElementById('param-title');
const $paramPathSection = document.getElementById('param-path-section');
const $paramPathFields = document.getElementById('param-path-fields');
const $paramBodySection = document.getElementById('param-body-section');
const $paramBodyInput = document.getElementById('param-body-input');
const $paramBodyError = document.getElementById('param-body-error');
const $paramExecute = document.getElementById('param-execute');
const $paramCancel = document.getElementById('param-cancel');
const $paramHint = document.getElementById('param-hint');

// ── Cookie / Session ────────────────────────────────────────────
function getCookie(n) {
  const p = encodeURIComponent(n) + '=';
  return document.cookie.split(';').map(s => s.trim()).find(s => s.startsWith(p))?.slice(p.length) || '';
}
function apiHeaders() {
  const csrf = getCookie('X-Csrf-Token'); const sess = getCookie('TMSESSNAME');
  const h = { 'Content-Type': 'application/json' };
  if (csrf) h['X-Csrf-Token'] = csrf;
  if (sess && csrf) h['Cookie'] = `TMSESSNAME=${sess}; X-Csrf-Token=${csrf};`;
  return h;
}

// ── API ─────────────────────────────────────────────────────────
async function apiGet(p) {
  try { const r = await fetch(API_BASE + p, { headers: apiHeaders(), credentials: 'same-origin' }); return await r.json(); }
  catch (e) { console.error('GET', p, e); return null; }
}
async function apiPost(p, b, m) {
  const method = m || 'POST';
  try { const r = await fetch(API_BASE + p, { method, headers: apiHeaders(), credentials: 'same-origin', body: JSON.stringify(b) }); return await r.json(); }
  catch (e) { console.error(method, p, e); return null; }
}

// ── Helpers ─────────────────────────────────────────────────────
function esc(s) { const d = document.createElement('div'); d.textContent = s; return d.innerHTML; }
function icon(s) { return s === 'passed' ? '✓' : s === 'failed' ? '✗' : s === 'skipped' ? '○' : s === 'running' ? '⟳' : ''; }
function hasParams(c) { return /\{[^}]+\}/.test(c.path) || c.method === 'POST' || c.method === 'PUT' || c.method === 'DELETE'; }
function extractPathParamNames(p) { const r = /\{([^}]+)\}/g, n = []; let m; while ((m = r.exec(p)) !== null) n.push(m[1]); return n; }

// ── Load ────────────────────────────────────────────────────────
async function loadCases() {
  const data = await apiGet('/tests');
  if (data?.data && Array.isArray(data.data)) {
    allCases = data.data;
    $tabCountAll.textContent = allCases.length;
    const mc = {};
    allCases.forEach(c => mc[c.module] = (mc[c.module] || 0) + 1);
    document.querySelectorAll('.tab[data-module]').forEach(el => {
      const m = el.dataset.module;
      if (m !== 'all' && mc[m]) {
        let cnt = el.querySelector('.tab-count');
        if (!cnt) { cnt = document.createElement('span'); cnt.className = 'tab-count'; el.appendChild(cnt); }
        cnt.textContent = mc[m];
      }
    });
  }
  filterCases();
}

function filterCases() {
  filteredCases = currentModule === 'all' ? [...allCases] : allCases.filter(c => c.module === currentModule);
  $emptyState.style.display = filteredCases.length ? 'none' : 'flex';
  renderTable();
}

// ── Render ──────────────────────────────────────────────────────
function renderTable() {
  const ids = new Set();
  document.querySelectorAll('.case-check:checked').forEach(el => ids.add(el.dataset.id));
  $tbody.innerHTML = '';
  for (const c of filteredCases) {
    const r = runResults[c.id];
    const st = r ? r.status : '';
    const tr = document.createElement('tr');
    if (st === 'passed') tr.className = 'row-passed';
    if (st === 'failed') tr.className = 'row-failed';
    const paramIcon = hasParams(c) ? ' ⚙' : '';
    tr.innerHTML = `
      <td class="col-check"><input type="checkbox" class="case-check" data-id="${c.id}" ${ids.has(c.id) ? 'checked' : ''}></td>
      <td class="col-id">${c.id}</td>
      <td class="col-method"><span class="method-badge method-${c.method}">${c.method}</span></td>
      <td class="col-path" title="${esc(c.path)}">${esc(c.path)}${paramIcon}</td>
      <td>${esc(c.title)}</td>
      <td class="col-priority"><span class="priority-badge priority-${c.priority}">${c.priority}</span></td>
      <td class="col-result result-${st}"><span class="result-icon">${icon(st)}</span></td>
      <td class="col-time">${r?.duration_ms ? r.duration_ms + 'ms' : ''}</td>
      <td class="col-actions" style="text-align:center;display:flex;gap:4px;justify-content:center"><button class="row-edit" data-id="${c.id}" style="background:var(--surface,#2a2a3e);color:var(--fg,#eee);border:1px solid var(--border,#555);border-radius:4px;padding:4px 10px;font-size:13px;cursor:pointer" title="编辑用例">✎</button>${c.remark === 'user-added' ? `<button class="row-del" data-id="${c.id}" style="background:var(--danger-bg,rgba(248,113,113,.1));color:var(--danger,#f87171);border:1px solid rgba(248,113,113,.25);border-radius:4px;padding:4px 10px;font-size:13px;cursor:pointer" title="删除用例">✕</button>` : ''}</td>
    `;
    tr.addEventListener('click', e => { if (e.target.type !== 'checkbox' && !e.target.classList.contains('row-edit')) showDetail(c.id); });
    tr.querySelector('.row-edit').addEventListener('click', e => { e.stopPropagation(); showEditor(c.id); });
    const $del = tr.querySelector('.row-del');
    if ($del) $del.addEventListener('click', e => { e.stopPropagation(); deleteCase(c.id); });
    $tbody.appendChild(tr);
  }
  updateStats();
}

function updateStats() {
  let p=0,f=0,k=0,r=0;
  for (const v of Object.values(runResults)) {
    if (v.status==='passed')  p++;
    if (v.status==='failed')  f++;
    if (v.status==='skipped') k++;
    if (v.status==='running') r++;
  }
  $statPass.innerHTML = `✓ <b>${p}</b>`;
  $statFail.innerHTML = `✗ <b>${f}</b>`;
  $statSkip.innerHTML = `○ <b>${k}</b>`;
  $statRunning.innerHTML = `⟳ <b>${r}</b>`;
}

// ── Detail ──────────────────────────────────────────────────────
function showDetail(id) {
  const c = allCases.find(x => x.id === id);
  const r = runResults[id];
  if (!c) return;
  $detailTitle.innerHTML = esc(c.id + ' — ' + c.title) + ' <button class="btn btn-ghost" id="detail-edit" style="font-size:12px;padding:2px 10px;margin-left:8px">✎ 编辑</button>';
  let extra = '';
  const ppNames = extractPathParamNames(c.path);
  const pp = c.path_params || {};
  if (ppNames.length) extra += `<dt>路径参数</dt><dd>${ppNames.map(k => `${k}: ${esc(pp[k]||'')}`).join(', ')}</dd>`;
  if (c.body && Object.keys(c.body).length) extra += `<dt>请求体</dt><dd><pre style="margin:0;white-space:pre-wrap;font-size:12px">${esc(JSON.stringify(c.body,null,2))}</pre></dd>`;
  $detailInfo.innerHTML = `<dl class="detail-grid">
    <dt>模块</dt><dd>${c.module}</dd><dt>方法</dt><dd>${c.method}</dd>
    <dt>接口</dt><dd>${esc(c.path)}</dd><dt>优先级</dt><dd>${c.priority}</dd>
    <dt>功能</dt><dd>${esc(c.feature)}</dd><dt>前置条件</dt><dd>${esc(c.preconditions)}</dd>
    <dt>步骤</dt><dd>${esc(c.steps)}</dd><dt>预期</dt><dd>${esc(c.expected)}</dd>${extra}
    ${r ? `<dt>状态</dt><dd>${r.status}</dd><dt>HTTP 状态码</dt><dd>${r.response_code||'-'}</dd>
    <dt>耗时</dt><dd>${r.duration_ms?r.duration_ms+'ms':'-'}</dd>
    ${r.error?`<dt>错误</dt><dd style="color:var(--danger)">${esc(r.error)}</dd>`:''}` : ''}</dl>`;
  $detailReq.textContent = r ? JSON.stringify({method:r.method,url:r.url||'',headers:'(forwarded from browser session)'},null,2) : '尚未执行';
  let body = '无响应';
  if (r?.response_body) { try { body = JSON.stringify(JSON.parse(r.response_body),null,2); } catch { body = r.response_body; } }
  $detailResp.textContent = body;
  $detailPanel.classList.add('open');
  document.getElementById('detail-edit').addEventListener('click', () => { closeDetail(); showEditor(c.id); });
  $detailOverlay.classList.add('open');
}

function closeDetail() { $detailPanel.classList.remove('open'); $detailOverlay.classList.remove('open'); }

// ── Param Editor ────────────────────────────────────────────────
function showParamEditor(c) {
  pendingParamCase = c;
  $paramTitle.textContent = c.id + ' — 设置参数';
  // Path params
  const ppNames = extractPathParamNames(c.path);
  const defPP = c.path_params || {};
  if (ppNames.length) {
    $paramPathSection.style.display = 'block';
    $paramPathFields.innerHTML = '';
    ppNames.forEach(name => {
      const val = defPP[name] || '';
      $paramPathFields.innerHTML += `<div style="display:flex;align-items:center;gap:8px;margin-bottom:6px">
        <code style="min-width:100px;font-size:13px">${esc(name)}</code>
        <input type="text" class="pp-input" data-name="${esc(name)}" value="${esc(val)}"
          style="flex:1;padding:6px 8px;border:1px solid var(--border,#333);border-radius:6px;background:var(--bg,#1a1a2e);color:var(--fg,#eee);font-family:monospace;font-size:13px"></div>`;
    });
  } else { $paramPathSection.style.display = 'none'; }
  // Body
  const hasBody = c.method === 'POST' || c.method === 'PUT' || c.method === 'DELETE';
  if (hasBody) {
    $paramBodySection.style.display = 'block';
    $paramBodyInput.value = JSON.stringify(c.body || {}, null, 2);
    $paramBodyError.style.display = 'none';
  } else { $paramBodySection.style.display = 'none'; }
  $paramHint.textContent = ''; $paramHint.className = 'modal-hint';
  $paramModal.style.display = 'flex';
  setTimeout(() => { const first = $paramPathFields.querySelector('.pp-input'); if (first) first.focus(); else if (hasBody) $paramBodyInput.focus(); }, 100);
}

function hideParamEditor() { $paramModal.style.display = 'none'; pendingParamCase = null; }

async function executeWithParams() {
  const c = pendingParamCase;
  if (!c) return;
  const pathParams = {};
  $paramPathFields.querySelectorAll('.pp-input').forEach(inp => { pathParams[inp.dataset.name] = inp.value; });
  let body = undefined;
  const hasBody = c.method === 'POST' || c.method === 'PUT' || c.method === 'DELETE';
  if (hasBody) {
    const raw = $paramBodyInput.value.trim();
    if (raw) {
      try { body = JSON.parse(raw); $paramBodyError.style.display = 'none'; }
      catch (e) { $paramBodyError.textContent = 'JSON 格式错误：' + e.message; $paramBodyError.style.display = 'block'; return; }
    } else { body = {}; }
  }
  const overrides = {};
  const entry = {};
  if (Object.keys(pathParams).length) entry.path_params = pathParams;
  if (body !== undefined) entry.body = body;
  overrides[c.id] = entry;
  hideParamEditor();
  if (!authInfo.logged_in) { showLoginModal(); return; }
  $btnRun.disabled = true; $btnStop.disabled = false; isRunning = true;
  const data = await apiPost('/run', {
    ids: [c.id], module: currentModule === 'all' ? 'all' : currentModule,
    env: { csrf_token: getCookie('X-Csrf-Token'), session: getCookie('TMSESSNAME') },
    case_overrides: overrides,
  });
  const d = data?.data || data;
  if (d?.started) {
    document.getElementById('progress-bar-wrap').style.display = 'flex';
    startPolling();
  }
  else { $btnRun.disabled = false; $btnStop.disabled = true; isRunning = false; }
}

$paramClose.addEventListener('click', hideParamEditor);
$paramCancel.addEventListener('click', hideParamEditor);
$paramExecute.addEventListener('click', executeWithParams);

// ── Run ─────────────────────────────────────────────────────────
async function runSelected() {
  const checks = document.querySelectorAll('.case-check:checked');
  const ids = Array.from(checks).map(el => el.dataset.id);
  if (!ids.length) return;
  if (!authInfo.logged_in) { showLoginModal(); return; }
  // 批量执行直接用默认参数，不弹参数编辑器
  await doRun(ids, {});
}

async function doRun(ids, caseOverrides) {
  $btnRun.disabled = true; $btnStop.disabled = false; isRunning = true;
  const data = await apiPost('/run', {
    ids, module: currentModule === 'all' ? 'all' : currentModule,
    env: { csrf_token: getCookie('X-Csrf-Token'), session: getCookie('TMSESSNAME') },
    case_overrides: caseOverrides,
  });
  const d = data?.data || data;
  if (d?.started) {
    document.getElementById('progress-bar-wrap').style.display = 'flex';
    startPolling();
  }
  else {
    if ((d?.msg||'').includes('登录')) { authInfo.logged_in = false; updateAuthUI(); showLoginModal(); }
    $btnRun.disabled = false; $btnStop.disabled = true; isRunning = false;
  }
}

async function stopTests() { await apiPost('/stop',{}); $btnStop.disabled = true; isRunning = false; }

// ── Poll ────────────────────────────────────────────────────────
function startPolling() {
  if (pollTimer) clearInterval(pollTimer);
  pollTimer = setInterval(pollProgress, POLL_INTERVAL);
  pollProgress();
}

async function pollProgress() {
  const [pData, rData] = await Promise.all([apiGet('/progress'), apiGet('/results')]);
  if (pData) {
    const p = pData.data || pData; isRunning = p.running;
    if (p.running) {
      document.getElementById('progress-bar-wrap').style.display = 'flex';
      const pct = p.total > 0 ? Math.round(p.done/p.total*100) : 0;
      $progressFill.style.width = pct + '%'; $progressText.textContent = `${p.done} / ${p.total}`;
    } else {
      document.getElementById('progress-bar-wrap').style.display = 'none';
      $btnRun.disabled = false; $btnStop.disabled = true;
      clearInterval(pollTimer); pollTimer = null;
    }
  }
  if (rData) { const r = rData.data || rData; if (r.results) runResults = r.results; }
  let needRelogin = false;
  for (const v of Object.values(runResults)) {
    const rb = v.response_body || '';
    if (rb.includes('please login') || rb.includes('"code_num":117')) { needRelogin = true; break; }
  }
  if (needRelogin && !isRunning) { authInfo.logged_in = false; updateAuthUI(); showLoginModal(); }
  renderTable();
}

// ── Select ──────────────────────────────────────────────────────
function selectAll() { const ch = document.querySelectorAll('.case-check'); const on = Array.from(ch).every(c=>c.checked); ch.forEach(c=>c.checked=!on); $checkAll.checked=!on; }
function invertSelection() { document.querySelectorAll('.case-check').forEach(c=>c.checked=!c.checked); }

// ── Export / Clear ──────────────────────────────────────────────
function exportResults() {
  const blob = new Blob([JSON.stringify({cases:allCases,results:runResults},null,2)],{type:'application/json'});
  const a = document.createElement('a'); a.href=URL.createObjectURL(blob);
  a.download=`cbtest-results-${new Date().toISOString().slice(0,10)}.json`; a.click(); URL.revokeObjectURL(a.href);
}
async function clearResults() { await apiPost('/clear',{}); runResults={}; renderTable(); }

// ── Auth ────────────────────────────────────────────────────────
async function checkAuth() {
  const data = await apiGet('/auth_status');
  if (data?.data) { authInfo = data.data; updateAuthUI(); }
  if (!authInfo.logged_in) {
    const s = getCookie('TMSESSNAME'), cs = getCookie('X-Csrf-Token');
    if (s && cs) {
      const ld = await apiPost('/login',{base_url:location.origin,username:'',password:'',browser_session:s,browser_csrf:cs});
      if (ld?.code) { authInfo={logged_in:true,username:ld.data?.username||'demo',base_url:location.origin}; updateAuthUI(); loadCases(); }
    }
    // 没有自动登录成功，弹出登录框
    if (!authInfo.logged_in) {
      showLoginModal();
    }
  }
}

function updateAuthUI() {
  if (authInfo.logged_in) { $authStatus.className='auth-status logged-in'; $authLabel.textContent=authInfo.username; }
  else { $authStatus.className='auth-status logged-out'; $authLabel.textContent='未登录'; }
}

function showLoginModal() {
  $loginUrl.value=authInfo.base_url||location.origin; $loginUser.value=authInfo.username||'demo'; $loginPass.value='';
  $loginHint.textContent=''; $loginHint.className='modal-hint'; $loginModal.style.display='flex';
  setTimeout(()=>$loginPass.focus(),100);
}
function hideLoginModal() { $loginModal.style.display='none'; }

async function doLogin() {
  $btnLogin.disabled=true; $loginHint.textContent='登录中...'; $loginHint.className='modal-hint';
  // 优先用浏览器 session 验证登录
  const s = getCookie('TMSESSNAME'); const cs = getCookie('X-Csrf-Token');
  const data = await apiPost('/login',{
    base_url:$loginUrl.value,username:$loginUser.value,password:$loginPass.value,
    browser_session:s||'', browser_csrf:cs||''
  });
  $btnLogin.disabled=false;
  if (data?.code) {
    $loginHint.textContent='✓ 登录成功'; $loginHint.className='modal-hint success';
    authInfo={logged_in:true,username:$loginUser.value||data?.data?.username||'demo',base_url:$loginUrl.value}; updateAuthUI();
    setTimeout(hideLoginModal,800);
    loadCases();
  } else { $loginHint.textContent='✗ '+(data?.msg||'登录失败'); $loginHint.className='modal-hint error'; }
}

// ── Case Editor DOM ──────────────────────────────────────
const $editorModal = document.getElementById('editor-modal');
const $editorClose = document.getElementById('editor-close');
const $editorTitle = document.getElementById('editor-title');
const $editorId = document.getElementById('editor-id');
const $editorPath = document.getElementById('editor-path');
const $editorMethod = document.getElementById('editor-method');
const $editorTitleInput = document.getElementById('editor-title-input');
const $editorPriority = document.getElementById('editor-priority');
const $editorPpFields = document.getElementById('editor-pp-fields');
const $editorPpAdd = document.getElementById('editor-pp-add');
const $editorQpFields = document.getElementById('editor-qp-fields');
const $editorQpAdd = document.getElementById('editor-qp-add');
const $editorBody = document.getElementById('editor-body');
const $editorBodyError = document.getElementById('editor-body-error');
const $editorSave = document.getElementById('editor-save');
const $editorReset = document.getElementById('editor-reset');
const $editorDelete = document.getElementById('editor-delete');
const $editorCancel = document.getElementById('editor-cancel');
const $editorHint = document.getElementById('editor-hint');
const $editorModule = document.getElementById('editor-module');
const $editorFeature = document.getElementById('editor-feature');
const $editorExpected = document.getElementById('editor-expected');

let editorCase = null;
let editorMode = 'edit'; // 'edit' or 'add'

function _kvRow(prefix, key, val, removable) {
  return `<div class="${prefix}-row" style="display:flex;align-items:center;gap:6px;margin-bottom:4px">
    <input type="text" class="${prefix}-key" value="${esc(key)}" placeholder="参数名" style="width:35%;padding:4px 6px;border:1px solid var(--border,#333);border-radius:4px;background:var(--bg,#1a1a2e);color:var(--fg,#eee);font-size:12px;font-family:monospace">
    <input type="text" class="${prefix}-val" value="${esc(val)}" placeholder="参数值" style="flex:1;padding:4px 6px;border:1px solid var(--border,#333);border-radius:4px;background:var(--bg,#1a1a2e);color:var(--fg,#eee);font-size:12px;font-family:monospace">
    ${removable ? `<button class="btn btn-ghost ${prefix}-del" style="font-size:11px;padding:2px 8px" onclick="this.parentElement.remove()">✕</button>` : ''}
  </div>`;
}

function _collectKV(prefix) {
  const obj = {};
  document.querySelectorAll(`.${prefix}-row`).forEach(row => {
    const k = row.querySelector(`.${prefix}-key`).value.trim();
    const v = row.querySelector(`.${prefix}-val`).value.trim();
    if (k) obj[k] = v;
  });
  return obj;
}

function showEditor(cid) {
  const c = allCases.find(x => x.id === cid);
  if (!c) return;
  editorCase = c;
  editorMode = 'edit';
  $editorTitle.textContent = c.id + ' — 编辑用例';
  $editorId.value = c.id;
  $editorPath.value = c.path || '';
  $editorMethod.value = c.method || 'GET';
  $editorTitleInput.value = c.title || '';
  $editorModule.value = c.module || 'PC/Server';
  $editorPriority.value = c.priority || 'P1';
  $editorFeature.value = c.feature || '';
  $editorExpected.value = c.expected || '';

  // Path params
  const pp = c.path_params || {};
  $editorPpFields.innerHTML = '';
  const ppNames = extractPathParamNames(c.path);
  ppNames.forEach(name => {
    $editorPpFields.innerHTML += _kvRow('pp', name, pp[name] || '', false);
  });
  // Extra path params not in path
  Object.keys(pp).filter(k => !ppNames.includes(k)).forEach(k => {
    $editorPpFields.innerHTML += _kvRow('pp', k, pp[k], true);
  });

  // Query params
  const qp = c.query_params || {};
  $editorQpFields.innerHTML = '';
  Object.entries(qp).forEach(([k, v]) => {
    $editorQpFields.innerHTML += _kvRow('qp', k, v, true);
  });

  // Body
  const hasBody = c.method === 'POST' || c.method === 'PUT' || c.method === 'DELETE';
  document.getElementById('editor-body-section').style.display = hasBody ? 'block' : 'none';
  $editorBody.value = JSON.stringify(c.body || {}, null, 2);
  $editorBodyError.style.display = 'none';

  // Buttons visibility
  $editorReset.style.display = 'inline-flex';
  // Show delete only for user-added cases
  const isUserAdded = (c.remark === 'user-added');
  $editorDelete.style.display = isUserAdded ? 'inline-flex' : 'none';

  $editorHint.textContent = '';
  $editorHint.className = 'modal-hint';
  $editorModal.style.display = 'flex';
}

function showAddEditor() {
  editorCase = null;
  editorMode = 'add';
  $editorTitle.textContent = '新增用例';
  $editorId.value = '(auto)';
  $editorPath.value = '/v2/proxy/CentralizedBackup/';
  $editorMethod.value = 'GET';
  $editorTitleInput.value = '';
  $editorModule.value = currentModule === 'all' ? 'PC/Server' : currentModule;
  $editorPriority.value = 'P2';
  $editorFeature.value = '';
  $editorExpected.value = '返回200，code=true';

  $editorPpFields.innerHTML = '';
  $editorQpFields.innerHTML = '';

  const hasBody = $editorMethod.value === 'POST' || $editorMethod.value === 'PUT' || $editorMethod.value === 'DELETE'; // default based on method
  document.getElementById('editor-body-section').style.display = hasBody ? 'block' : 'none';
  $editorBody.value = '{}';
  $editorBodyError.style.display = 'none';

  // Buttons visibility
  $editorReset.style.display = 'none';
  $editorDelete.style.display = 'none';

  $editorHint.textContent = '';
  $editorHint.className = 'modal-hint';
  $editorModal.style.display = 'flex';
  setTimeout(() => $editorTitleInput.focus(), 100);
}

function hideEditor() { $editorModal.style.display = 'none'; editorCase = null; }

async function saveEditor() {
  const body = {};
  body.path = $editorPath.value.trim();
  body.method = $editorMethod.value;
  body.title = $editorTitleInput.value.trim();
  body.module = $editorModule.value;
  body.priority = $editorPriority.value;
  body.feature = $editorFeature.value.trim();
  body.expected = $editorExpected.value.trim();

  const pp = _collectKV('pp');
  if (Object.keys(pp).length) body.path_params = pp;

  const qp = _collectKV('qp');
  if (Object.keys(qp).length) body.query_params = qp;

  const hasBody = body.method === 'POST' || body.method === 'PUT' || body.method === 'DELETE';
  if (hasBody) {
    const raw = $editorBody.value.trim();
    if (raw) {
      try { body.body = JSON.parse(raw); $editorBodyError.style.display = 'none'; }
      catch (e) { $editorBodyError.textContent = 'JSON 格式错误：' + e.message; $editorBodyError.style.display = 'block'; return; }
    } else { body.body = {}; }
  }

  if (editorMode === 'add') {
    // 新增模式
    $editorSave.disabled = true;
    $editorHint.textContent = '创建中...';
    const data = await apiPost('/case_add', body);
    $editorSave.disabled = false;
    if (data?.code) {
      $editorHint.textContent = '✓ 已创建 ' + (data.data?.id || ''); $editorHint.className = 'modal-hint success';
      if (data.data) allCases.push(data.data);
      $tabCountAll.textContent = allCases.length;
      filterCases();
      setTimeout(hideEditor, 600);
    } else {
      $editorHint.textContent = '✗ ' + (data?.msg || '创建失败'); $editorHint.className = 'modal-hint error';
    }
    return;
  }

  // 编辑模式
  body.id = $editorId.value;
  $editorSave.disabled = true;
  $editorHint.textContent = '保存中...';
  const data = await apiPost('/case_update', body);
  $editorSave.disabled = false;
  if (data?.code) {
    $editorHint.textContent = '✓ 已保存'; $editorHint.className = 'modal-hint success';
    // Update local cache
    const idx = allCases.findIndex(c => c.id === body.id);
    if (idx >= 0) { Object.assign(allCases[idx], data.data); }
    filterCases();
    setTimeout(hideEditor, 600);
  } else {
    $editorHint.textContent = '✗ ' + (data?.msg || '保存失败'); $editorHint.className = 'modal-hint error';
  }
}

async function resetEditor() {
  if (editorMode === 'add') return;
  if (!editorCase) return;
  const cid = $editorId.value;
  $editorReset.disabled = true;
  $editorHint.textContent = '还原中...';
  const data = await apiPost('/case_reset', {id: cid});
  $editorReset.disabled = false;
  if (data?.code) {
    $editorHint.textContent = '✓ 已还原'; $editorHint.className = 'modal-hint success';
    const idx = allCases.findIndex(c => c.id === cid);
    if (idx >= 0 && data.data) Object.assign(allCases[idx], data.data);
    filterCases();
    setTimeout(hideEditor, 600);
  } else {
    $editorHint.textContent = '✗ ' + (data?.msg || '还原失败'); $editorHint.className = 'modal-hint error';
  }
}

async function deleteCase(cid) {
  if (!(await customConfirm(`确定删除用例 ${cid} 吗？此操作不可撤销。`))) return;
  const data = await apiPost('/case_delete', {id: cid});
  if (data?.code) {
    const idx = allCases.findIndex(c => c.id === cid);
    if (idx >= 0) allCases.splice(idx, 1);
    delete runResults[cid];
    $tabCountAll.textContent = allCases.length;
    filterCases();
  } else {
    await customAlert(data?.msg || '删除失败');
  }
}

$editorClose.addEventListener('click', hideEditor);
$editorCancel.addEventListener('click', hideEditor);
$editorSave.addEventListener('click', saveEditor);
$editorReset.addEventListener('click', resetEditor);
$editorDelete.addEventListener('click', () => { if (editorCase && editorCase.remark === 'user-added') deleteCase(editorCase.id); });
$editorPpAdd.addEventListener('click', () => { $editorPpFields.innerHTML += _kvRow('pp', '', '', true); });
$editorQpAdd.addEventListener('click', () => { $editorQpFields.innerHTML += _kvRow('qp', '', '', true); });
$btnAdd.addEventListener('click', showAddEditor);

// Method change toggles body section visibility when in add mode
$editorMethod.addEventListener('change', () => {
  const hasBody = $editorMethod.value === 'POST' || $editorMethod.value === 'PUT' || $editorMethod.value === 'DELETE';
  document.getElementById('editor-body-section').style.display = hasBody ? 'block' : 'none';
});

// ── Events ──────────────────────────────────────────────────────
$authStatus.addEventListener('click',showLoginModal);
$loginClose.addEventListener('click',hideLoginModal);
$btnLoginCancel.addEventListener('click',hideLoginModal);
$btnLogin.addEventListener('click',doLogin);
$loginPass.addEventListener('keydown',e=>{if(e.key==='Enter')doLogin();});

document.querySelectorAll('.tab[data-module]').forEach(el=>{
  el.addEventListener('click',()=>{document.querySelectorAll('#module-tabs .tab').forEach(t=>t.classList.remove('active'));el.classList.add('active');currentModule=el.dataset.module;filterCases();});
});

$btnRun.addEventListener('click',runSelected);
$btnStop.addEventListener('click',stopTests);
$btnSelectAll.addEventListener('click',selectAll);
$btnInvert.addEventListener('click',invertSelection);
$btnExport.addEventListener('click',exportResults);
$btnClear.addEventListener('click',clearResults);

async function syncSource() {
  if (!authInfo.logged_in) { showLoginModal(); return; }
  if (!(await customConfirm('将当前用例同步到源码目录 src/test_cases.json？'))) return;
  $btnSync.disabled = true;
  const data = await apiPost('/sync_source', {});
  $btnSync.disabled = false;
  if (data?.code) {
    await customAlert(`✓ 已同步 ${data.data?.count} 条用例到 ${data.data?.synced_to}`);
  } else {
    await customAlert('✗ 同步失败: ' + (data?.msg || 'unknown'));
  }
}
$btnSync.addEventListener('click', syncSource);
$detailClose.addEventListener('click',closeDetail);
$detailOverlay.addEventListener('click',closeDetail);
$checkAll.addEventListener('change',()=>{document.querySelectorAll('.case-check').forEach(c=>c.checked=$checkAll.checked);});
$tbody.addEventListener('change',e=>{if(e.target.classList.contains('case-check')){$checkAll.checked=Array.from(document.querySelectorAll('.case-check')).every(c=>c.checked);}});

// ── Scenario Flow State ─────────────────────────────────────────
let scenarioData = [];
let folderData = [];
let selectedScenario = null;
let scenarioPollTimer = null;

// ── Scenario DOM refs (new simple IDs) ─────────────────────────
const $viewScenarios = document.getElementById('view-scenarios');
const $viewCases = document.getElementById('view-cases');
const $sTree = document.getElementById('s-tree');
const $sEmpty = document.getElementById('s-empty');
const $sDetail = document.getElementById('s-detail');
const $sName = document.getElementById('s-name');
const $sDesc = document.getElementById('s-desc');
const $sSteps = document.getElementById('s-steps');
const $sProgress = document.getElementById('s-progress');
const $sProgressFill = document.getElementById('s-progress-fill');
const $sProgressText = document.getElementById('s-progress-text');
const $sBtnRun = document.getElementById('s-btn-run');
const $sBtnEdit = document.getElementById('s-btn-edit');
const $sBtnDel = document.getElementById('s-btn-del');
const $sBtnRecord = document.getElementById('s-btn-record');
const $sBtnAdd = document.getElementById('s-btn-add');
const $sBtnFolder = document.getElementById('s-btn-folder');
const $caseTabs = document.querySelectorAll('#module-tabs .tab[data-module]');

// Editor (new simple IDs)
const $seModal = document.getElementById('se-modal');
const $seClose = document.getElementById('se-close');
const $seCancel = document.getElementById('se-cancel');
const $seSave = document.getElementById('se-save');
const $seAddStep = document.getElementById('se-add-step');
const $seTitle = document.getElementById('se-title');
const $seSteps = document.getElementById('se-steps');
const $seHint = document.getElementById('se-hint');

// ── View Switching ─────────────────────────────────────────────
const $viewTabs = document.querySelectorAll('#tab-group .tab[data-view]');
$viewTabs.forEach(tab => {
  tab.addEventListener('click', async () => {
    $viewTabs.forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    const view = tab.dataset.view;
    if (view === 'scenarios') {
      $viewCases.style.display = 'none';
      $viewScenarios.style.display = 'block';
      document.getElementById('module-tabs').style.display = 'none';
      document.getElementById('cases-toolbar').style.display = 'none';
      document.getElementById('progress-container').style.display = 'none';
      if (scenarioPollTimer) { clearTimeout(scenarioPollTimer); scenarioPollTimer = null; }
      await loadScenarioData();
      renderScTree();
    } else {
      $viewScenarios.style.display = 'none';
      $viewCases.style.display = 'block';
      document.getElementById('module-tabs').style.display = 'flex';
      document.getElementById('cases-toolbar').style.display = 'flex';
      document.getElementById('progress-container').style.display = 'flex';

    }
  });
});

// ── Scenario Data ───────────────────────────────────────────────
async function loadScenarioData() {
  try {
    const [sd, fd] = await Promise.all([apiGet('/scenarios'), apiGet('/scenario_folders')]);
    scenarioData = Array.isArray(sd && sd.data) ? sd.data : [];
    folderData = Array.isArray(fd && fd.data) ? fd.data : [];
  } catch(e) { scenarioData = []; folderData = []; }
}

async function saveFolder(name) {
  const r = await apiPost('/scenario_folders', {name});
  if (r && r.code) { await loadScenarioData(); renderScTree(); }
}

async function deleteFolder(fid) {
  const r = await apiPost('/scenario_folders/' + fid, {}, 'DELETE');
  if (r && r.code) { await loadScenarioData(); renderScTree(); }
  else if (r && r.msg) await customAlert(r.msg);
}

// ── Tree ────────────────────────────────────────────────────────

function renderScTree() {
  const groups = {};
  for (const s of scenarioData) {
    const fid = s.folder || '__none__';
    (groups[fid] = groups[fid] || []).push(s);
  }
  const uncat = groups['__none__'] || []; delete groups['__none__'];
  let h = '';
  for (const f of folderData) {
    const items = groups[f.id] || [];
    h += `<div class="scenario-folder"><div class="scenario-folder-head"><span class="folder-icon">📁</span><span>${esc(f.name)}</span><span class="folder-count">${items.length}</span><button class="folder-del" data-fid="${f.id}">×</button></div>`;
    for (const s of items) h += scItem(s);
    h += '</div>';
    delete groups[f.id];
  }
  if (uncat.length) {
    h += `<div class="scenario-folder"><div class="scenario-folder-head"><span class="folder-icon">📂</span><span>未分类</span><span class="folder-count">${uncat.length}</span></div>`;
    for (const s of uncat) h += scItem(s);
    h += '</div>';
  }
  for (const [fid, items] of Object.entries(groups)) {
    h += `<div class="scenario-folder"><div class="scenario-folder-head"><span class="folder-icon">📂</span><span>${esc(fid)}</span><span class="folder-count">${items.length}</span></div>`;
    for (const s of items) h += scItem(s);
    h += '</div>';
  }
  if (!h) h = '<p class="text-muted" style="padding:20px">暂无场景流</p>';
  $sTree.innerHTML = h;
  $sTree.querySelectorAll('.scenario-item').forEach(el => el.addEventListener('click', () => selScenario(el.dataset.sid)));
  $sTree.querySelectorAll('.folder-del').forEach(el => el.addEventListener('click', e => { e.stopPropagation(); deleteFolder(el.dataset.fid); }));
}

function scItem(s) {
  const icon = s.last_result === 'passed' ? '✅' : s.status === 'failed' ? '❌' : '⏳';
  return `<div class="scenario-item${selectedScenario && selectedScenario.id===s.id?' active':''}" data-sid="${s.id}">${icon} ${esc(s.name)}</div>`;
}

function selScenario(sid) {
  selectedScenario = scenarioData.find(s => s.id === sid);
  renderScTree();
  if (!selectedScenario) return;
  $sEmpty.style.display = 'none';
  $sDetail.style.display = 'block';
  $sName.textContent = selectedScenario.name;
  $sDesc.textContent = selectedScenario.description || '';
  const steps = (selectedScenario.steps || []).sort((a, b) => (a.order||0) - (b.order||0));
  let sh = '';
  for (const st of steps) {
    const cs = allCases.find(c => c.id === st.case_id);
    const m = cs ? cs.method : '?';
    const mc = {'GET':'tag-get','POST':'tag-post','PUT':'tag-put','DELETE':'tag-del'}[m] || '';
    sh += `<div class="scenario-step"><span class="step-order">${st.order}</span><span class="step-tag ${mc}">${m}</span><span class="step-id">${st.case_id}</span><span class="step-title">${esc(st.title||'')}</span><span class="step-path">${esc(cs?cs.path:st.case_id)}</span>`;
    if (st.extract && Object.keys(st.extract).length) sh += `<span class="step-extract">📤 ${Object.keys(st.extract).join(',')}</span>`;
    sh += '</div>';
  }
  $sSteps.innerHTML = sh || '<p class="text-muted">无步骤</p>';
  loadScenarioRuns(selectedScenario.id);
  // bind clear button
  const cBtn = document.getElementById('s-history-clear');
  if (cBtn) {
    const newBtn = cBtn.cloneNode(true);
    cBtn.parentNode.replaceChild(newBtn, cBtn);
    newBtn.addEventListener('click', async () => {
      if (!selectedScenario) return;
      if (!confirm('清空该场景的所有执行记录？')) return;
      await apiPost('/scenario_runs/clear?scenario_id=' + encodeURIComponent(selectedScenario.id), {}, 'POST');
      loadScenarioRuns(selectedScenario.id);
    });
  }
}

// ── Editor ──────────────────────────────────────────────────────
function showScenarioEditor(sid) {
  const isNew = !sid;
  $seTitle.textContent = isNew ? '新建场景' : '编辑场景';
  document.getElementById('se-id').value = sid || '';
  document.getElementById('se-name').value = '';
  document.getElementById('se-desc').value = '';
  $seSteps.innerHTML = '';
  $seHint.textContent = '';
  const sel = document.getElementById('se-folder');
  sel.innerHTML = '<option value="">未分类</option>';
  for (const f of folderData) sel.innerHTML += `<option value="${f.id}">${esc(f.name)}</option>`;
  if (!isNew && selectedScenario) {
    document.getElementById('se-name').value = selectedScenario.name || '';
    document.getElementById('se-desc').value = selectedScenario.description || '';
    sel.value = selectedScenario.folder || '';
    for (const st of (selectedScenario.steps || []).sort((a,b)=>(a.order||0)-(b.order||0))) addStepRow(st);
  }
  $seModal.style.display = 'flex';
}

function hideScenarioEditor() { $seModal.style.display = 'none'; }

function addStepRow(data) {
  const idx = $seSteps.children.length + 1;
  const opts = allCases.map(c => `<option value="${c.id}"${(data||{}).case_id===c.id?' selected':''}>${c.id} ${esc(c.title||'')}</option>`).join('');
  const row = document.createElement('div');
  row.className = 'se-step-row';
  row.innerHTML = `<span class="se-step-num">#${idx}</span><select class="se-step-case">${opts}</select><input class="se-step-title" value="${esc(data&&data.title?data.title:'')}" placeholder="标题"><input class="se-step-extract" value="${esc(data&&data.extract?Object.entries(data.extract).map(([k,v])=>k+'='+v).join(','):'')}" placeholder="var=$.path"><button class="se-step-pp-btn" title="路径参数覆盖">📍</button><button class="se-step-body-btn" title="编辑请求体">📝</button><button class="se-step-del">×</button><div class="se-step-expected" style="display:flex;gap:4px;align-items:center;margin-top:3px;font-size:11px;"><span>预期:</span><input class="se-step-expect-status" value="${esc(data&&data.expected&&data.expected.status_code!=null?data.expected.status_code:'')}" placeholder="200" style="width:40px;font-size:11px;" title="预期状态码"><input class="se-step-expect-contains" value="${esc(data&&data.expected&&data.expected.body_contains?data.expected.body_contains:'')}" placeholder="body包含" style="width:80px;font-size:11px;" title="响应body包含此字符串"><input class="se-step-expect-keys" value="${esc(data&&data.expected&&data.expected.schema_keys?data.expected.schema_keys.join(','):'')}" placeholder="$.data.id" style="width:80px;font-size:11px;" title="JSON schema key路径，逗号分隔"><span class="se-step-snapshot ${data&&data.expected&&data.expected.snapshot&&data.expected.snapshot.body?'has-snapshot':''}" title="${data&&data.expected&&data.expected.snapshot&&data.expected.snapshot.body?'已录制快照':'未录制'}">📸</span></div>`;
  row.dataset.bodyOverride = (data && data.overrides && data.overrides.body) ? JSON.stringify(data.overrides.body) : '';
  if (row.dataset.bodyOverride) row.querySelector('.se-step-body-btn').classList.add('has-override');
  row.dataset.ppOverride = (data && data.overrides && data.overrides.path_params) ? JSON.stringify(data.overrides.path_params) : '';
  if (row.dataset.ppOverride) row.querySelector('.se-step-pp-btn').classList.add('has-override');
  row.querySelector('.se-step-pp-btn').addEventListener('click', () => openStepPPEditor(row));
  row.querySelector('.se-step-body-btn').addEventListener('click', () => openStepBodyEditor(row));
  row.querySelector('.se-step-del').addEventListener('click', () => { row.remove(); renumSteps(); });
  $seSteps.appendChild(row);
  row.querySelector('.se-step-case').addEventListener('change', function() {
    const cs = allCases.find(c => c.id === this.value);
    if (cs && !row.querySelector('.se-step-title').value) row.querySelector('.se-step-title').value = cs.title || '';
  });
}

function renumSteps() { $seSteps.querySelectorAll('.se-step-num').forEach((el, i) => el.textContent = '#' + (i + 1)); }

async function saveScenario() {
  const sid = document.getElementById('se-id').value;
  const name = document.getElementById('se-name').value.trim();
  if (!name) { $seHint.textContent = '请输入名称'; return; }
  const data = { name, description: document.getElementById('se-desc').value.trim(), folder: document.getElementById('se-folder').value, steps: [] };
  for (const row of $seSteps.querySelectorAll('.se-step-row')) {
    const cid = row.querySelector('.se-step-case').value;
    const t = row.querySelector('.se-step-title').value.trim();
    const ex = {};
    const exStr = row.querySelector('.se-step-extract').value.trim();
    if (exStr) exStr.split(',').forEach(p => { const [k,v] = p.split('=').map(s=>s.trim()); if (k&&v) ex[k]=v; });
    const overrides = {};
    const ppStr = row.dataset.ppOverride || '';
    if (ppStr) {
      try { overrides.path_params = JSON.parse(ppStr); } catch(e) { overrides.path_params = JSON.parse('{}'); }
    }
    const bodyStr = row.dataset.bodyOverride || '';
    if (bodyStr) {
      try { overrides.body = JSON.parse(bodyStr); } catch(e) { overrides.body = JSON.parse('{}'); }
    }
    if (cid) {
      const expected = {};
      const expStatus = row.querySelector('.se-step-expect-status');
      const expContains = row.querySelector('.se-step-expect-contains');
      const expKeys = row.querySelector('.se-step-expect-keys');
      if (expStatus && expStatus.value.trim()) expected.status_code = parseInt(expStatus.value.trim()) || 200;
      if (expContains && expContains.value.trim()) expected.body_contains = expContains.value.trim();
      if (expKeys && expKeys.value.trim()) expected.schema_keys = expKeys.value.trim().split(',').map(s=>s.trim()).filter(Boolean);
      // snapshot 从 data 恢复
      if (data && data.expected && data.expected.snapshot) expected.snapshot = data.expected.snapshot;
      data.steps.push({ order: data.steps.length + 1, case_id: cid, title: t || cid, extract: ex, overrides, expected });
    }
  }
  if (!data.steps.length) { $seHint.textContent = '请添加步骤'; return; }
  console.log('saveScenario', sid, JSON.stringify(data));
  const r = await apiPost(sid ? '/scenarios/' + sid : '/scenarios', data, sid ? 'PUT' : 'POST');
  console.log('saveScenario response', r);
  if (r && r.code) { hideScenarioEditor(); await loadScenarioData(); renderScTree(); if (r.data && r.data.id) selScenario(r.data.id); }
  else $seHint.textContent = '失败: ' + ((r&&r.msg)||'unknown');
}

// ── Step Body Override Editor ───────────────────────────────────
let _stepBodyRow = null;
const $stepBodyModal = document.getElementById('step-body-modal');
const $stepBodyTitle = document.getElementById('step-body-title');
const $stepBodyHint = document.getElementById('step-body-hint');
const $stepBodyInput = document.getElementById('step-body-input');
const $stepBodyError = document.getElementById('step-body-error');

function openStepBodyEditor(row) {
  _stepBodyRow = row;
  const cid = row.querySelector('.se-step-case').value;
  const cs = allCases.find(c => c.id === cid);
  const origBody = cs ? (cs.body || {}) : {};
  const curOverride = row.dataset.bodyOverride || '';
  $stepBodyTitle.textContent = (cs ? cs.id + ' — ' + (cs.title || '') : cid) + ' 请求体覆盖';
  $stepBodyHint.innerHTML = '原始请求体: <code style="font-size:11px">' + esc(JSON.stringify(origBody)) + '</code><br>修改仅保存在此场景步骤中，不影响接口用例。';
  $stepBodyInput.value = curOverride ? JSON.stringify(JSON.parse(curOverride), null, 2) : '';
  $stepBodyError.style.display = 'none';
  $stepBodyModal.style.display = 'flex';
  setTimeout(() => $stepBodyInput.focus(), 100);
}

function saveStepBodyOverride() {
  const raw = $stepBodyInput.value.trim();
  if (!raw) {
    _stepBodyRow.dataset.bodyOverride = '';
    _stepBodyRow.querySelector('.se-step-body-btn').classList.remove('has-override');
    $stepBodyModal.style.display = 'none';
    return;
  }
  try {
    JSON.parse(raw);
    $stepBodyError.style.display = 'none';
    _stepBodyRow.dataset.bodyOverride = raw;
    _stepBodyRow.querySelector('.se-step-body-btn').classList.add('has-override');
    $stepBodyModal.style.display = 'none';
  } catch(e) {
    $stepBodyError.textContent = 'JSON 格式错误: ' + e.message;
    $stepBodyError.style.display = 'block';
  }
}

function hideStepBodyEditor() { $stepBodyModal.style.display = 'none'; }

document.getElementById('step-body-save').addEventListener('click', () => {
  if (_stepPPRow) { saveStepPPOverride(); } else { saveStepBodyOverride(); }
});
document.getElementById('step-body-cancel').addEventListener('click', () => { _stepPPRow = null; hideStepBodyEditor(); });
document.getElementById('step-body-close').addEventListener('click', hideStepBodyEditor);

// ── Step Path Params Override Editor ─────────────────────────────
let _stepPPRow = null;

function openStepPPEditor(row) {
  _stepPPRow = row;
  const cid = row.querySelector('.se-step-case').value;
  const cs = allCases.find(c => c.id === cid);
  const origPP = cs ? (cs.path_params || {}) : {};
  const curOverride = row.dataset.ppOverride || '';
  $stepBodyTitle.textContent = (cs ? cs.id + ' — ' + (cs.title || '') : cid) + ' 路径参数覆盖';
  $stepBodyHint.innerHTML = '原始路径参数: <code style="font-size:11px">' + esc(JSON.stringify(origPP)) + '</code><br>支持变量引用 <code>{{var_name}}</code>，例如 <code>{"device_id":"{{device_id}}","task_id":"{{task_id}}"}</code>';
  $stepBodyInput.value = curOverride ? JSON.stringify(JSON.parse(curOverride), null, 2) : (Object.keys(origPP).length ? JSON.stringify(origPP, null, 2) : '');
  $stepBodyError.style.display = 'none';
  $stepBodyModal.style.display = 'flex';
  setTimeout(() => $stepBodyInput.focus(), 100);
}

function saveStepPPOverride() {
  const raw = $stepBodyInput.value.trim();
  if (!raw) {
    _stepPPRow.dataset.ppOverride = '';
    _stepPPRow.querySelector('.se-step-pp-btn').classList.remove('has-override');
    $stepBodyModal.style.display = 'none';
    return;
  }
  try {
    JSON.parse(raw);
    $stepBodyError.style.display = 'none';
    _stepPPRow.dataset.ppOverride = raw;
    _stepPPRow.querySelector('.se-step-pp-btn').classList.add('has-override');
    $stepBodyModal.style.display = 'none';
  } catch(e) {
    $stepBodyError.textContent = 'JSON 格式错误: ' + e.message;
    $stepBodyError.style.display = 'block';
  }
}

// ── Execution ───────────────────────────────────────────────────
async function runScenario() {
  if (!selectedScenario) return;
  if (!authInfo.logged_in) { showLoginModal(); return; }
  $sBtnRun.disabled = true;
  const env = { csrf_token: getCookie('X-Csrf-Token'), session: getCookie('TMSESSNAME') };
  const r = await apiPost('/scenarios/' + selectedScenario.id + '/run', { env });
  if (!r || !r.code) { await customAlert('启动失败'); $sBtnRun.disabled = false; return; }
  $sProgress.style.display = 'flex';
  pollScenarioProgress();
}

async function pollScenarioProgress() {
  const data = await apiGet('/scenario_progress');
  if (!data) return;
  const d = data.data || data;
  if (d.steps && d.steps.length) {
    const sm = {}; d.steps.forEach(s => sm[s.order] = s);
    $sSteps.querySelectorAll('.scenario-step').forEach(el => {
      const order = parseInt(el.querySelector('.step-order').textContent);
      const sr = sm[order];
      if (sr) {
        const icon = {'passed':'✅','failed':'❌','skipped':'⏭️','running':'⟳','recorded':'📸'}[sr.status] || '⏳';
        el.classList.add('step-' + sr.status);
        let st = el.querySelector('.step-status');
        if (!st) { st = document.createElement('span'); st.className = 'step-status'; el.appendChild(st); }
        st.textContent = icon + ' ' + sr.status + ' ' + (sr.duration_ms||0) + 'ms';
      }
    });
    const done = d.steps.filter(s => s.status !== 'running').length;
    $sProgressFill.style.width = Math.round(done / d.steps.length * 100) + '%';
    $sProgressText.textContent = done + '/' + d.steps.length;
  }
  if (d.running) { scenarioPollTimer = setTimeout(pollScenarioProgress, 1500); }
  else {
    $sBtnRun.disabled = false;
    $sBtnRecord.disabled = false;
    $sBtnRecord.textContent = '📸 录制';
    scenarioPollTimer = null;
    setTimeout(async () => {
      await loadScenarioData();
      renderScTree();
      // 执行历史：保存当前选中 ID，renderScTree 后重新选，再加载历史
      const sid = selectedScenario ? selectedScenario.id : '';
      if (sid && selectedScenario) loadScenarioRuns(sid);
    }, 500);
  }
}


// ── Scenario Run History ─────────────────────────────────────────
let $sHistoryList, $sHistoryClear;
function loadScenarioRuns(sid) {
  $sHistoryList = $sHistoryList || document.getElementById('s-history-list');
  $sHistoryClear = $sHistoryClear || document.getElementById('s-history-clear');
  if (!$sHistoryList) return;
  apiGet('/scenario_runs?scenario_id=' + encodeURIComponent(sid)).then(data => {
    const runs = (data && data.data) || [];
    if (!runs.length) {
      $sHistoryList.innerHTML = '<p class="text-muted">暂无记录</p>';
      return;
    }
    $sHistoryList.innerHTML = runs.reverse().map(r => {
      const statusIcon = {passed:'✅',failed:'❌',partial:'⚠️',recorded:'📸'}[r.status]||'❓';
      const statusLabel = {passed:'通过',failed:'失败',partial:'部分通过',recorded:'已录制'}[r.status]||r.status;
      const time = r.finished_at ? r.finished_at.replace('T',' ').substring(5,16) : '';
      let stepsHtml = '';
      if (r.steps) {
        stepsHtml = r.steps.map(s => {
          const sIcon = {passed:'✅',failed:'❌',skipped:'⏭️','error':'❌',recorded:'📸'}[s.status]||'❓';
          return '<div class="rh-step"><span>'+sIcon+'</span><span class="rh-step-title">#'+s.order+' '+esc(s.title||'')+'</span><span class="rh-step-code">'+(s.response_code||'-')+'</span><span class="rh-step-time">'+(s.duration_ms||0)+'ms</span></div>';
        }).join('');
      }
      return '<div class="rh-entry"><div class="rh-entry-head"><span class="rh-status">'+statusIcon+' '+statusLabel+'</span><span class="rh-score">'+(r.passed||0)+'/'+(r.total||0)+'</span><span class="rh-time">'+time+'</span></div><div class="rh-steps">'+stepsHtml+'</div></div>';
    }).join('');
  });
}


async function deleteScenario() {
  if (!selectedScenario) return;
  if (!(await customConfirm('确定删除「' + selectedScenario.name + '」？'))) return;
  await apiPost('/scenarios/' + selectedScenario.id, {}, 'DELETE');
  selectedScenario = null;
  await loadScenarioData();
  renderScTree();
  $sDetail.style.display = 'none';
  $sEmpty.style.display = 'block';

}

// ── Events ──────────────────────────────────────────────────────
$sBtnAdd.addEventListener('click', () => showScenarioEditor(null));
$sBtnFolder.addEventListener('click', async () => { const n = await promptText('文件夹名称'); if (n && n.trim()) await saveFolder(n.trim()); });
$sBtnRun.addEventListener('click', runScenario);

$sBtnRecord.addEventListener('click', async () => {
  if (!selectedScenario || !selectedScenario.steps || !selectedScenario.steps.length) { alert('场景没有步骤'); return; }
  if (!confirm(`将执行场景「${selectedScenario.name}」的所有步骤并录制响应，是否继续？`)) return;
  $sBtnRecord.disabled = true;
  $sBtnRecord.textContent = '⏳ 录制中...';
  const env = { session: getCookie('TMSESSNAME')||environment.session||'', csrf_token: getCookie('X-Csrf-Token')||environment.csrf_token||'' };
  const r = await apiPost('/scenarios/' + selectedScenario.id + '/record', { env });
  if (r?.code) startScenarioPoll('record');
  else { $sBtnRecord.disabled = false; $sBtnRecord.textContent = '📸 录制'; alert('录制启动失败'); }
});

  $sBtnEdit.addEventListener('click', () => selectedScenario && showScenarioEditor(selectedScenario.id));
$sBtnDel.addEventListener('click', deleteScenario);
$seClose.addEventListener('click', hideScenarioEditor);
$seCancel.addEventListener('click', hideScenarioEditor);
$seSave.addEventListener('click', saveScenario);
$seAddStep.addEventListener('click', () => addStepRow(null));

// ── Init ────────────────────────────────────────────────────────
async function init() {
  await checkAuth(); await loadCases();
  const rData = await apiGet('/results');
  if (rData) { const r = rData.data||rData; if (r.results) { runResults=r.results; renderTable(); } }
}
init();