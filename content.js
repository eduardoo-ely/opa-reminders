// ================================
// content.js – Opa! Reminders 
// ================================

// -------------------- UTILITÁRIOS --------------------
function formatDate(isoString) {
  if (!isoString) return '';
  const date = new Date(isoString);
  return date.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function formatRelativeTime(isoString) {
  if (!isoString) return '';
  const now = Date.now();
  const eventTime = new Date(isoString).getTime();
  const diff = eventTime - now;

  if (diff < 0) return 'Passou';

  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `Em ${days}d`;
  if (hours > 0) return `Em ${hours}h`;
  if (minutes > 0) return `Em ${minutes}min`;
  return 'Agora!';
}

function escapeHtml(text) {
  if (text === undefined || text === null) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function generateId() {
  try {
    return crypto?.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.floor(Math.random()*100000)}`;
  } catch {
    return `${Date.now()}-${Math.floor(Math.random()*100000)}`;
  }
}

function sendBg(msg) {
  return new Promise((resolve) => {
    try {
      chrome.runtime.sendMessage(msg, (resp) => {
        if (chrome.runtime.lastError) {
          resolve({ success: false, error: chrome.runtime.lastError.message });
          return;
        }
        resolve(resp);
      });
    } catch (err) {
      resolve({ success: false, error: err.message });
    }
  });
}

// -------------------- INJECT CSS (TEMA LARANJA + ROXO + PRETO) --------------------
function injectStyles() {
  if (document.getElementById('opa-styles')) return;

  const style = document.createElement('style');
  style.id = 'opa-styles';
  style.textContent = `
    /* Floating Action Button */
    .opa-fab {
      position: fixed;
      bottom: 60px;
      right: 24px;
      width: 50px;
      height: 50px;
      background: linear-gradient(135deg, #FF6F20 0%, #FF9800 100%);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 20px;
      cursor: pointer;
      box-shadow: 0 6px 20px rgba(255, 111, 32, 0.5);
      z-index: 2147483647;
      transition: all 0.3s ease;
      border: 3px solid #1a1a1a;
      user-select: none;
      pointer-events: auto !important;
    }

    .opa-fab:hover {
      transform: scale(1.15) rotate(5deg);
      box-shadow: 0 8px 30px rgba(255, 111, 32, 0.7);
      background: linear-gradient(135deg, #FF9800 0%, #FFB300 100%);
    }

    /* Modal Overlay */
    .opa-modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(26, 26, 26, 0.85);
      z-index: 2147483646;
      display: none;
      align-items: center;
      justify-content: center;
      backdrop-filter: blur(8px);
      pointer-events: auto !important;
    }

    .opa-modal-overlay.active {
      display: flex;
      animation: fadeIn 0.3s;
    }

    /* Modal Container */
    .opa-modal {
      background: #1a1a1a;
      border-radius: 20px;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.8), 0 0 0 2px rgba(255, 111, 32, 0.3);
      width: 95%;
      max-width: 500px;
      max-height: 90vh;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      animation: slideUp 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
      pointer-events: auto !important;
    }

    /* Modal Header */
    .opa-modal-header {
      background: linear-gradient(135deg, #7B1FA2 0%, #6A1B9A 100%);
      color: white;
      padding: 24px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 3px solid #FF6F20;
    }

    .opa-modal-header h2 {
      margin: 0;
      font-size: 22px;
      font-weight: 700;
      text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
    }

    .opa-close-btn {
      background: rgba(255, 111, 32, 0.3);
      border: 2px solid rgba(255, 255, 255, 0.2);
      color: white;
      width: 40px;
      height: 40px;
      border-radius: 50%;
      cursor: pointer;
      font-size: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.3s;
      font-weight: 300;
    }

    .opa-close-btn:hover {
      background: #FF6F20;
      border-color: #FF9800;
      transform: rotate(90deg) scale(1.1);
      box-shadow: 0 0 15px rgba(255, 111, 32, 0.6);
    }

    /* Modal Body */
    .opa-modal-body {
      padding: 24px;
      overflow-y: auto;
      flex: 1;
      background: #0f0f0f;
    }

    /* Tabs */
    .opa-tabs {
      display: flex;
      gap: 10px;
      margin-bottom: 20px;
    }

    .opa-tab {
      flex: 1;
      padding: 12px 18px;
      border: 2px solid #2a2a2a;
      background: #1a1a1a;
      border-radius: 12px;
      cursor: pointer;
      font-size: 14px;
      font-weight: 600;
      transition: all 0.3s;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      color: #b0b0b0;
    }

    .opa-tab:hover {
      border-color: #FF6F20;
      background: #2a2a2a;
      color: #FF9800;
      transform: translateY(-2px);
    }

    .opa-tab.active {
      background: linear-gradient(135deg, #7B1FA2 0%, #6A1B9A 100%);
      color: white;
      border-color: #FF6F20;
      box-shadow: 0 4px 15px rgba(123, 31, 162, 0.4);
    }

    .opa-badge {
      background: rgba(255, 111, 32, 0.9);
      padding: 3px 10px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 700;
      color: #fff;
      box-shadow: 0 2px 8px rgba(255, 111, 32, 0.3);
    }

    /* Type Tabs */
    .opa-type-tabs {
      display: flex;
      gap: 10px;
      margin-bottom: 20px;
      background: #1a1a1a;
      padding: 6px;
      border-radius: 14px;
      border: 2px solid #2a2a2a;
    }

    .opa-type-tab {
      flex: 1;
      padding: 12px;
      border: none;
      background: transparent;
      border-radius: 10px;
      cursor: pointer;
      font-weight: 700;
      font-size: 14px;
      transition: all 0.3s;
      color: #808080;
    }

    .opa-type-tab.active {
      background: linear-gradient(135deg, #FF6F20 0%, #FF9800 100%);
      color: #1a1a1a;
      box-shadow: 0 4px 15px rgba(255, 111, 32, 0.4);
      transform: scale(1.02);
    }

    /* Form Elements */
    .opa-form-group {
      margin-bottom: 18px;
    }

    .opa-label {
      display: block;
      margin-bottom: 8px;
      font-weight: 700;
      color: #FF9800;
      font-size: 13px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .opa-required {
      color: #FF6F20;
      margin-left: 4px;
    }

    .opa-input,
    .opa-textarea {
      width: 100%;
      padding: 14px 16px;
      border: 2px solid #2a2a2a;
      border-radius: 12px;
      font-size: 14px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      transition: all 0.3s;
      box-sizing: border-box;
      background-color: #1a1a1a !important;
      color: #ffffff !important;
    }

    .opa-input:focus,
    .opa-textarea:focus {
      outline: none;
      border-color: #FF6F20;
      box-shadow: 0 0 0 4px rgba(255, 111, 32, 0.2);
      background-color: #242424 !important;
    }

    .opa-input::placeholder,
    .opa-textarea::placeholder {
      color: #666 !important;
      opacity: 1;
    }

    .opa-textarea {
      resize: vertical;
      min-height: 90px;
    }

    /* Tasks Section */
    .opa-tasks-section {
      background: #1a1a1a;
      padding: 18px;
      border-radius: 14px;
      margin-bottom: 18px;
      border: 2px solid #2a2a2a;
    }

    .opa-tasks-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 14px;
    }

    .opa-tasks-header h3 {
      margin: 0;
      font-size: 15px;
      color: #7B1FA2;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .opa-add-task-btn {
      padding: 8px 18px;
      background: linear-gradient(135deg, #7B1FA2 0%, #6A1B9A 100%);
      color: white;
      border: none;
      border-radius: 10px;
      cursor: pointer;
      font-weight: 700;
      font-size: 13px;
      transition: all 0.3s;
      box-shadow: 0 3px 10px rgba(123, 31, 162, 0.3);
    }

    .opa-add-task-btn:hover {
      background: linear-gradient(135deg, #8E24AA 0%, #7B1FA2 100%);
      transform: translateY(-2px);
      box-shadow: 0 5px 15px rgba(123, 31, 162, 0.5);
    }

    .opa-task-input-row {
      display: flex;
      gap: 10px;
      margin-bottom: 14px;
    }

    .opa-tasks-list {
      max-height: 220px;
      overflow-y: auto;
    }

    .opa-task-item {
      background: #242424;
      padding: 12px;
      border-radius: 10px;
      margin-bottom: 10px;
      display: flex;
      align-items: center;
      gap: 12px;
      border: 2px solid #2a2a2a;
      transition: all 0.2s;
    }

    .opa-task-item:hover {
      border-color: #FF6F20;
      background: #2a2a2a;
    }

    .opa-task-checkbox {
      width: 20px;
      height: 20px;
      cursor: pointer;
      accent-color: #FF6F20;
    }

    .opa-task-text {
      flex: 1;
      font-size: 14px;
      color: #e0e0e0;
      font-weight: 500;
    }

    .opa-task-text.done {
      text-decoration: line-through;
      color: #666;
    }

    .opa-task-delete {
      background: none;
      border: none;
      color: #FF6F20;
      cursor: pointer;
      font-size: 20px;
      padding: 4px 8px;
      border-radius: 6px;
      transition: all 0.2s;
      font-weight: 700;
    }

    .opa-task-delete:hover {
      background: rgba(255, 111, 32, 0.2);
      transform: scale(1.2);
    }

    /* Submit Button */
    .opa-submit-btn {
      width: 100%;
      padding: 16px;
      background: linear-gradient(135deg, #FF6F20 0%, #FF9800 100%);
      color: #1a1a1a;
      border: none;
      border-radius: 14px;
      cursor: pointer;
      font-weight: 800;
      font-size: 16px;
      transition: all 0.3s;
      text-transform: uppercase;
      letter-spacing: 1px;
      box-shadow: 0 6px 20px rgba(255, 111, 32, 0.4);
    }

    .opa-submit-btn:hover {
      background: linear-gradient(135deg, #FF9800 0%, #FFB300 100%);
      transform: translateY(-3px);
      box-shadow: 0 8px 25px rgba(255, 111, 32, 0.6);
    }

    .opa-submit-btn:active {
      transform: translateY(-1px);
    }

    /* Event Cards */
    .opa-events-list {
      display: flex;
      flex-direction: column;
      gap: 14px;
      margin-top: 24px;
    }

    .opa-event-card {
      background: #1a1a1a;
      padding: 16px;
      border-radius: 14px;
      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
      border-left: 5px solid #7B1FA2;
      border: 2px solid #2a2a2a;
      transition: all 0.3s;
    }

    .opa-event-card:hover {
      box-shadow: 0 6px 20px rgba(123, 31, 162, 0.4);
      transform: translateY(-3px);
      border-color: #FF6F20;
    }

    .opa-event-card.past {
      opacity: 0.6;
      border-left-color: #666;
    }

    .opa-event-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 10px;
      gap: 10px;
    }

    .opa-event-title-row {
      flex: 1;
    }

    .opa-event-type-badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 8px;
      font-size: 11px;
      font-weight: 700;
      background: linear-gradient(135deg, #FF6F20 0%, #FF9800 100%);
      color: #1a1a1a;
      margin-bottom: 8px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .opa-event-title {
      font-size: 17px;
      font-weight: 700;
      color: #ffffff;
      line-height: 1.4;
      margin: 0;
    }

    .opa-event-protocol {
      font-size: 13px;
      color: #FF9800;
      margin-bottom: 8px;
      padding: 6px 0;
      border-bottom: 1px solid #2a2a2a;
      font-weight: 600;
    }

    .opa-event-time {
      padding: 6px 14px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 700;
      white-space: nowrap;
    }

    .upcoming-badge {
      background: rgba(123, 31, 162, 0.3);
      color: #a855f7;
      border: 2px solid #7B1FA2;
    }

    .past-badge {
      background: rgba(102, 102, 102, 0.3);
      color: #999;
      border: 2px solid #666;
    }

    .opa-event-date {
      font-size: 14px;
      color: #b0b0b0;
      margin-bottom: 10px;
      font-weight: 500;
    }

    .opa-event-description {
      font-size: 14px;
      color: #d0d0d0;
      margin-bottom: 14px;
      line-height: 1.6;
      padding: 12px;
      background: #242424;
      border-radius: 10px;
      border-left: 3px solid #FF6F20;
    }

    .opa-event-tasks {
      background: rgba(123, 31, 162, 0.1);
      border: 2px solid #7B1FA2;
      padding: 12px;
      border-radius: 10px;
      margin-bottom: 14px;
      font-size: 13px;
    }

    .opa-event-tasks strong {
      display: block;
      margin-bottom: 8px;
      color: #a855f7;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .opa-event-task-item {
      padding: 5px 0;
      color: #d0d0d0;
      font-size: 13px;
      font-weight: 500;
    }

    .opa-event-actions {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }

    .opa-btn-action {
      padding: 8px 16px;
      border: 2px solid #2a2a2a;
      background: #1a1a1a;
      border-radius: 10px;
      font-size: 13px;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.3s;
    }

    .opa-btn-action:hover {
      background: #242424;
      transform: translateY(-2px);
    }

    .opa-btn-link {
      color: #7B1FA2;
      border-color: #7B1FA2;
    }

    .opa-btn-link:hover {
      background: rgba(123, 31, 162, 0.2);
      box-shadow: 0 4px 15px rgba(123, 31, 162, 0.3);
    }

    .opa-btn-edit {
      color: #FF9800;
      border-color: #FF9800;
    }

    .opa-btn-edit:hover {
      background: rgba(255, 152, 0, 0.2);
      box-shadow: 0 4px 15px rgba(255, 152, 0, 0.3);
    }

    .opa-btn-delete {
      color: #FF6F20;
      border-color: #FF6F20;
    }

    .opa-btn-delete:hover {
      background: rgba(255, 111, 32, 0.2);
      box-shadow: 0 4px 15px rgba(255, 111, 32, 0.3);
    }

    /* Empty State */
    .opa-empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 50px 20px;
      text-align: center;
      color: #808080;
    }

    .opa-empty-icon {
      font-size: 64px;
      margin-bottom: 16px;
      filter: grayscale(1) opacity(0.5);
    }

    .opa-empty-state p {
      font-size: 16px;
      font-weight: 700;
      margin-bottom: 6px;
      color: #b0b0b0;
    }

    .opa-empty-state small {
      color: #666;
    }

    /* Loading State */
    .opa-loading {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 50px 20px;
      color: #808080;
    }

    .opa-spinner {
      width: 50px;
      height: 50px;
      border: 4px solid #2a2a2a;
      border-top-color: #FF6F20;
      border-right-color: #7B1FA2;
      border-radius: 50%;
      animation: opa-spin 0.8s linear infinite;
      margin-bottom: 16px;
    }

    /* Visual Notification */
    #opa-visual-notif {
      position: fixed;
      top: 70px;
      right: 70px;
      z-index: 2147483646;
      animation: opa-slide-in 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
    }

    .opa-visual-box {
      background: linear-gradient(135deg, #7B1FA2 0%, #6A1B9A 100%);
      color: white;
      padding: 20px 24px;
      border-radius: 16px;
      box-shadow: 0 10px 40px rgba(123, 31, 162, 0.5);
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      max-width: 350px;
      border: 3px solid #FF6F20;
    }

    .opa-visual-title {
      font-weight: 800;
      font-size: 18px;
      margin-bottom: 8px;
      text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
    }

    .opa-visual-message {
      font-size: 15px;
      line-height: 1.5;
      margin-bottom: 14px;
      opacity: 0.95;
    }

    .opa-visual-actions {
      display: flex;
      gap: 10px;
      justify-content: flex-end;
    }

    .opa-visual-open {
      padding: 10px 18px;
      background: #FF6F20;
      color: white;
      border-radius: 10px;
      cursor: pointer;
      font-weight: 800;
      border: none;
      font-size: 14px;
      transition: all 0.3s;
      box-shadow: 0 4px 15px rgba(255, 111, 32, 0.4);
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .opa-visual-open:hover {
      background: #FF9800;
      transform: scale(1.05) translateY(-2px);
      box-shadow: 0 6px 20px rgba(255, 152, 0, 0.6);
    }

    /* Animations */
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    @keyframes slideUp {
      from {
        opacity: 0;
        transform: translateY(40px) scale(0.95);
      }
      to {
        opacity: 1;
        transform: translateY(0) scale(1);
      }
    }

    @keyframes opa-spin {
      to { transform: rotate(360deg); }
    }

    @keyframes opa-slide-in {
      from {
        opacity: 0;
        transform: translateX(40px) scale(0.9);
      }
      to {
        opacity: 1;
        transform: translateX(0) scale(1);
      }
    }

    /* Scrollbar */
    .opa-modal-body::-webkit-scrollbar,
    .opa-tasks-list::-webkit-scrollbar {
      width: 10px;
    }

    .opa-modal-body::-webkit-scrollbar-track,
    .opa-tasks-list::-webkit-scrollbar-track {
      background: #1a1a1a;
    }

    .opa-modal-body::-webkit-scrollbar-thumb,
    .opa-tasks-list::-webkit-scrollbar-thumb {
      background: #FF6F20;
      border-radius: 10px;
      border: 2px solid #1a1a1a;
    }

    .opa-modal-body::-webkit-scrollbar-thumb:hover,
    .opa-tasks-list::-webkit-scrollbar-thumb:hover {
      background: #FF9800;
    }
  `;
  document.head.appendChild(style);
}

// -------------------- FLOATING BUTTON + PAINEL --------------------
let floatingBtn = null;
let floatingPanel = null;
let overlayElement = null;
let panelCleanup = null;

function createFloatingButton() {
  if (floatingBtn) return;

  floatingBtn = document.createElement('div');
  floatingBtn.className = 'opa-fab';
  floatingBtn.innerHTML = '💬';
  floatingBtn.title = 'Opa! Reminders';
  floatingBtn.addEventListener('click', toggleFloatingPanel);
  
  document.body.appendChild(floatingBtn);
}

function toggleFloatingPanel() {
  if (floatingPanel) {
    closeFloatingPanel();
  } else {
    createFloatingPanel();
  }
}

function closeFloatingPanel() {
  if (!overlayElement) return;

  try {
    if (typeof panelCleanup === 'function') panelCleanup();
  } catch (e) {
    console.error('Erro ao executar cleanup:', e);
  }

  if (overlayElement.parentNode) {
    overlayElement.remove();
  }

  floatingPanel = null;
  overlayElement = null;
  panelCleanup = null;
}

// -------------------- HTML DO PAINEL --------------------
function getPanelHTML() {
  return `
    <div class="opa-modal-header">
      <h2>💬 Opa! Reminders</h2>
      <button class="opa-close-btn" id="opa-close-btn">×</button>
    </div>
    <div class="opa-modal-body">
      <div class="opa-tabs">
        <button class="opa-tab active" data-tab="upcoming">
          📅 Próximos
          <span class="opa-badge" id="opa-upcoming-count">0</span>
        </button>
        <button class="opa-tab" data-tab="history">
          📜 Histórico
        </button>
      </div>

      <form id="opa-event-form">
        <div class="opa-type-tabs">
          <button type="button" class="opa-type-tab active" data-type="agendamento">
            📅 Agendamento
          </button>
          <button type="button" class="opa-type-tab" data-type="tarefa">
            ✅ Tarefa
          </button>
        </div>

        <div class="opa-form-group">
          <label class="opa-label">Título <span class="opa-required">*</span></label>
          <input type="text" id="opa-title" class="opa-input" placeholder="Nome do evento" required maxlength="100">
        </div>

        <div id="opa-datetime-group" class="opa-form-group">
          <label class="opa-label">Data e Hora <span class="opa-required">*</span></label>
          <input type="datetime-local" id="opa-datetime" class="opa-input" required>
        </div>

        <div id="opa-preminutes-group" class="opa-form-group">
          <label class="opa-label">Lembrar X minutos antes</label>
          <input type="number" id="opa-preminutes" class="opa-input" value="0" min="0" step="1" placeholder="0 = notificar na hora">
        </div>

        <div class="opa-form-group">
          <label class="opa-label">Protocolo (opcional)</label>
          <input type="text" id="opa-protocol" class="opa-input" placeholder="Ex: #12345" maxlength="50">
        </div>

        <div id="opa-meeturl-group" class="opa-form-group">
          <label class="opa-label">Link da reunião (opcional)</label>
          <input type="url" id="opa-meeturl" class="opa-input" placeholder="https://meet.google.com/...">
        </div>

        <div class="opa-form-group">
          <label class="opa-label">Descrição (opcional)</label>
          <textarea id="opa-description" class="opa-textarea" placeholder="Detalhes do evento..." rows="3" maxlength="500"></textarea>
        </div>

        <div class="opa-tasks-section">
          <div class="opa-tasks-header">
            <h3>📋 Subtarefas</h3>
            <button type="button" class="opa-add-task-btn" id="opa-add-task-btn">+ Adicionar</button>
          </div>
          <div class="opa-task-input-row" id="opa-task-input-row" style="display: none;">
            <input type="text" id="opa-task-input" class="opa-input" placeholder="Digite a tarefa e pressione Enter..." maxlength="100">
          </div>
          <div class="opa-tasks-list" id="opa-tasks-list"></div>
        </div>

        <button type="submit" class="opa-submit-btn">
          <span id="opa-submit-text">➕ Adicionar Evento</span>
        </button>
      </form>

      <div id="opa-events-list" class="opa-events-list"></div>

      <div id="opa-empty-state" class="opa-empty-state">
        <div class="opa-empty-icon">🔭</div>
        <p>Nenhum evento agendado</p>
        <small>Adicione seu primeiro evento acima</small>
      </div>

      <div id="opa-loading" class="opa-loading" style="display: none;">
        <div class="opa-spinner"></div>
        <p>Carregando...</p>
      </div>
    </div>
  `;
}

// -------------------- LÓGICA DO PAINEL --------------------
let currentTab = 'upcoming';
let editingEventId = null;
let currentType = 'agendamento';
let tasks = [];

function createFloatingPanel() {
  if (overlayElement) return;

  overlayElement = document.createElement('div');
  overlayElement.className = 'opa-modal-overlay active';

  floatingPanel = document.createElement('div');
  floatingPanel.className = 'opa-modal';
  floatingPanel.innerHTML = getPanelHTML();

  overlayElement.appendChild(floatingPanel);
  document.body.appendChild(overlayElement);

  panelCleanup = initPanelEventsAndReturnCleanup(overlayElement);

  setTimeout(async () => {
    const resp = await sendBg({ type: 'getEvents' });
    const events = resp?.success ? resp.events : [];
    if (typeof window.__opa_renderEvents === 'function') {
      window.__opa_renderEvents(events);
    }
  }, 100);
}

function initPanelEventsAndReturnCleanup(overlay) {
  if (!floatingPanel) return () => {};

  const closeBtn = floatingPanel.querySelector('#opa-close-btn');
  const eventForm = floatingPanel.querySelector('#opa-event-form');
  const titleInput = floatingPanel.querySelector('#opa-title');
  const datetimeInput = floatingPanel.querySelector('#opa-datetime');
  const preminutesInput = floatingPanel.querySelector('#opa-preminutes');
  const protocolInput = floatingPanel.querySelector('#opa-protocol');
  const meetUrlInput = floatingPanel.querySelector('#opa-meeturl');
  const descriptionInput = floatingPanel.querySelector('#opa-description');
  const submitText = floatingPanel.querySelector('#opa-submit-text');
  const datetimeGroup = floatingPanel.querySelector('#opa-datetime-group');
  const meetUrlGroup = floatingPanel.querySelector('#opa-meeturl-group');
  const taskInput = floatingPanel.querySelector('#opa-task-input');
  const tasksList = floatingPanel.querySelector('#opa-tasks-list');
  const addTaskBtn = floatingPanel.querySelector('#opa-add-task-btn');
  const taskInputRow = floatingPanel.querySelector('#opa-task-input-row');
  const tabsEls = floatingPanel.querySelectorAll('.opa-tab');
  const typeTabs = floatingPanel.querySelectorAll('.opa-type-tab');

  function renderTasks() {
    if (!tasksList) return;
    if (!tasks || tasks.length === 0) {
      tasksList.innerHTML = '';
      return;
    }

    tasksList.innerHTML = tasks.map(task => `
      <div class="opa-task-item" data-id="${task.id}">
        <input type="checkbox" class="opa-task-checkbox" ${task.done ? 'checked' : ''}>
        <span class="opa-task-text ${task.done ? 'done' : ''}">${escapeHtml(task.text)}</span>
        <button type="button" class="opa-task-delete">×</button>
      </div>
    `).join('');

    tasksList.querySelectorAll('.opa-task-item').forEach(item => {
      const taskId = item.dataset.id;
      const task = tasks.find(t => t.id === taskId);
      const cb = item.querySelector('.opa-task-checkbox');
      const del = item.querySelector('.opa-task-delete');

      cb.addEventListener('change', (e) => {
        if (task) {
          task.done = e.target.checked;
          renderTasks();
        }
      });

      del.addEventListener('click', () => {
        tasks = tasks.filter(t => t.id !== taskId);
        renderTasks();
      });
    });
  }

  function updateFormByType() {
    if (currentType === 'tarefa') {
      if (datetimeGroup) datetimeGroup.style.display = 'none';
      if (meetUrlGroup) meetUrlGroup.style.display = 'none';
      if (datetimeInput) datetimeInput.removeAttribute('required');
    } else {
      if (datetimeGroup) datetimeGroup.style.display = 'block';
      if (meetUrlGroup) meetUrlGroup.style.display = 'block';
      if (datetimeInput) datetimeInput.setAttribute('required', 'required');
    }
  }

  function clearForm() {
    try { eventForm.reset(); } catch(e){}
    editingEventId = null;
    tasks = [];
    currentType = 'agendamento';
    if (submitText) submitText.textContent = '➕ Adicionar Evento';
    if (taskInputRow) taskInputRow.style.display = 'none';
    renderTasks();
    typeTabs.forEach(t => t.classList.remove('active'));
    const agTab = floatingPanel.querySelector('[data-type="agendamento"]');
    if (agTab) agTab.classList.add('active');
    updateFormByType();
  }

  function editEvent(event) {
    editingEventId = event.id;
    currentType = event.type || 'agendamento';

    typeTabs.forEach(t => t.classList.remove('active'));
    const active = floatingPanel.querySelector(`[data-type="${currentType}"]`);
    if (active) active.classList.add('active');
    updateFormByType();

    if (titleInput) titleInput.value = event.title || '';
    if (protocolInput) protocolInput.value = event.protocol || '';
    if (meetUrlInput) meetUrlInput.value = event.meetUrl || '';
    if (descriptionInput) descriptionInput.value = event.description || '';
    if (preminutesInput) preminutesInput.value = event.preNoticeMinutes ?? 0;

    if (event.time && datetimeInput) {
      const date = new Date(event.time);
      const v = `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}T${String(date.getHours()).padStart(2,'0')}:${String(date.getMinutes()).padStart(2,'0')}`;
      datetimeInput.value = v;
    }

    tasks = event.tasks ? [...event.tasks] : [];
    renderTasks();
    if (tasks.length > 0 && taskInputRow) taskInputRow.style.display = 'flex';

    if (submitText) submitText.textContent = '💾 Salvar Alterações';
  }

  async function removeEvent(id) {
    if (!confirm('Deseja excluir este evento?')) return;
    const res = await sendBg({ type: 'deleteEvent', id });
    if (res?.success) {
      if (typeof window.__opa_renderEvents === 'function') await window.__opa_renderEvents();
    } else {
      alert('Erro ao excluir evento');
    }
  }

  function createEventCard(event) {
    if (!event?.id) return '';
    const isPast = event.time ? new Date(event.time).getTime() <= Date.now() : false;
    const relativeTime = event.time ? formatRelativeTime(event.time) : '';
    const typeIcon = event.type === 'tarefa' ? '✅' : '📅';
    const typeLabel = event.type === 'tarefa' ? 'Tarefa' : 'Agendamento';

    return `
      <div class="opa-event-card ${isPast ? 'past' : ''}" id="opa-event-${event.id}">
        <div class="opa-event-header">
          <div class="opa-event-title-row">
            <span class="opa-event-type-badge">${typeIcon} ${typeLabel}</span>
            <h3 class="opa-event-title">${escapeHtml(event.title)}</h3>
          </div>
          ${event.time ? `
            <span class="opa-event-time ${isPast ? 'past-badge' : 'upcoming-badge'}">
              ${relativeTime}
            </span>
          ` : ''}
        </div>

        ${event.protocol ? `
          <div class="opa-event-protocol">
            🏷️ ${escapeHtml(event.protocol)}
          </div>
        ` : ''}

        ${event.time ? `
          <div class="opa-event-date">
            📅 ${formatDate(event.time)}
            ${event.preNoticeMinutes > 0 ? `<br>⏰ Lembrete: ${event.preNoticeMinutes} min antes` : ''}
          </div>
        ` : ''}

        ${event.description ? `
          <div class="opa-event-description">
            ${escapeHtml(event.description)}
          </div>
        ` : ''}

        ${event.tasks && event.tasks.length > 0 ? `
          <div class="opa-event-tasks">
            <strong>📋 Subtarefas (${event.tasks.filter(t => t.done).length}/${event.tasks.length})</strong>
            ${event.tasks.slice(0, 3).map(t => `
              <div class="opa-event-task-item">
                ${t.done ? '✅' : '⬜'} ${escapeHtml(t.text)}
              </div>
            `).join('')}
            ${event.tasks.length > 3 ? `<small>+${event.tasks.length - 3} mais...</small>` : ''}
          </div>
        ` : ''}

        <div class="opa-event-actions">
          ${event.meetUrl ? `
            <button class="opa-btn-action opa-btn-link" title="Abrir link">
              🔗 Link
            </button>
          ` : ''}

          ${!isPast ? `
            <button class="opa-btn-action opa-btn-edit" title="Editar">
              ✏️ Editar
            </button>
          ` : ''}

          <button class="opa-btn-action opa-btn-delete" title="Excluir">
            🗑️ Excluir
          </button>
        </div>
      </div>
    `;
  }

  async function renderEvents(forcedEvents = null) {
    const eventsList = floatingPanel.querySelector('#opa-events-list');
    const emptyState = floatingPanel.querySelector('#opa-empty-state');
    const loading = floatingPanel.querySelector('#opa-loading');
    const upcomingCount = floatingPanel.querySelector('#opa-upcoming-count');

    if (!eventsList || !loading) return;
    loading.style.display = 'flex';
    
    try {
      const resp = forcedEvents ? { success: true, events: forcedEvents } : await sendBg({ type: 'getEvents' });
      const allEvents = resp?.success ? resp.events : [];
      const now = Date.now();
      let events;

      if (currentTab === 'upcoming') {
        events = allEvents
          .filter(e => {
            if (e.type === 'tarefa') return true;
            return e.time && new Date(e.time).getTime() > now;
          })
          .sort((a, b) => {
            if (a.type === 'tarefa' && b.type !== 'tarefa') return 1;
            if (a.type !== 'tarefa' && b.type === 'tarefa') return -1;
            if (!a.time) return 1;
            if (!b.time) return -1;
            return new Date(a.time) - new Date(b.time);
          });
      } else {
        events = allEvents
          .filter(e => e.time && new Date(e.time).getTime() <= now)
          .sort((a, b) => new Date(b.time) - new Date(a.time));
      }

      const upcomingEvents = allEvents.filter(e => {
        if (e.type === 'tarefa') return false;
        return e.time && new Date(e.time).getTime() > now;
      });
      if (upcomingCount) upcomingCount.textContent = upcomingEvents.length;

      if (!events || events.length === 0) {
        eventsList.style.display = 'none';
        emptyState.style.display = 'flex';
        eventsList.innerHTML = '';
      } else {
        eventsList.style.display = 'block';
        emptyState.style.display = 'none';
        eventsList.innerHTML = events.map(ev => createEventCard(ev)).join('');

        events.forEach(ev => {
          const card = floatingPanel.querySelector(`#opa-event-${ev.id}`);
          if (!card) return;
          const editBtn = card.querySelector('.opa-btn-edit');
          const deleteBtn = card.querySelector('.opa-btn-delete');
          const linkBtn = card.querySelector('.opa-btn-link');

          if (editBtn) editBtn.addEventListener('click', () => editEvent(ev));
          if (deleteBtn) deleteBtn.addEventListener('click', () => removeEvent(ev.id));
          if (linkBtn && ev.meetUrl) {
            linkBtn.addEventListener('click', () => window.open(ev.meetUrl, '_blank'));
          }
        });
      }
    } catch (err) {
      console.error('Erro ao renderizar:', err);
      eventsList.innerHTML = '<p class="opa-error">Erro ao carregar eventos</p>';
    } finally {
      loading.style.display = 'none';
    }
  }

  const closeHandler = () => {
    closeFloatingPanel();
  };

  if (closeBtn) closeBtn.addEventListener('click', closeHandler);
  if (overlay) overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeHandler();
  });

  const typeClickHandlers = [];
  typeTabs.forEach(tab => {
    const h = () => {
      typeTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      currentType = tab.dataset.type;
      updateFormByType();
    };
    tab.addEventListener('click', h);
    typeClickHandlers.push({ el: tab, h });
  });

  const addTaskHandler = () => {
    if (!taskInputRow) return;
    taskInputRow.style.display = taskInputRow.style.display === 'none' ? 'flex' : 'none';
    if (taskInputRow.style.display === 'flex' && taskInput) taskInput.focus();
  };
  if (addTaskBtn) addTaskBtn.addEventListener('click', addTaskHandler);

  const taskInputKeyHandler = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const text = taskInput.value.trim();
      if (!text) return;
      tasks.push({ id: generateId(), text, done: false });
      taskInput.value = '';
      renderTasks();
    }
  };
  if (taskInput) taskInput.addEventListener('keydown', taskInputKeyHandler);

  const submitHandler = async (e) => {
    e.preventDefault();
    
    const preMinValue = preminutesInput?.value || '0';
    const preMinParsed = parseInt(preMinValue, 10);
    
    const event = {
      id: editingEventId || undefined,
      type: currentType,
      title: titleInput ? titleInput.value.trim() : '',
      protocol: protocolInput ? protocolInput.value.trim() : null,
      meetUrl: meetUrlInput ? meetUrlInput.value.trim() : null,
      description: descriptionInput ? descriptionInput.value.trim() : null,
      tasks: tasks.length > 0 ? [...tasks] : []
    };

    event.preNoticeMinutes = Number.isFinite(preMinParsed) && preMinParsed >= 0 ? preMinParsed : 0;

    if (currentType === 'agendamento' && datetimeInput && datetimeInput.value) {
      event.datetime = datetimeInput.value;
      event.time = new Date(datetimeInput.value).toISOString();
    }

    const resp = await sendBg({ type: 'saveEvent', event });
    if (resp?.success) {
      alert('✅ Evento salvo com sucesso!');
      clearForm();
      await renderEvents();
    } else {
      console.error('[content] erro ao salvar', resp);
      alert('❌ Erro ao salvar evento: ' + (resp?.error || 'desconhecido'));
    }
  };
  if (eventForm) eventForm.addEventListener('submit', submitHandler);

  const tabClickHandlers = [];
  tabsEls.forEach(tab => {
    const h = async () => {
      tabsEls.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      currentTab = tab.dataset.tab;
      await renderEvents();
    };
    tab.addEventListener('click', h);
    tabClickHandlers.push({ el: tab, h });
  });

  window.__opa_renderEvents = renderEvents;

  try {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    if (datetimeInput) datetimeInput.min = now.toISOString().slice(0,16);
  } catch(e){}

  updateFormByType();
  setTimeout(() => renderEvents(), 80);

  return () => {
    try { if (closeBtn) closeBtn.removeEventListener('click', closeHandler); } catch(e){}
    try { if (overlay) overlay.removeEventListener('click', closeHandler); } catch(e){}
    typeClickHandlers.forEach(({el,h}) => { try { el.removeEventListener('click', h); } catch(e){} });
    try { if (addTaskBtn) addTaskBtn.removeEventListener('click', addTaskHandler); } catch(e){}
    try { if (taskInput) taskInput.removeEventListener('keydown', taskInputKeyHandler); } catch(e){}
    try { if (eventForm) eventForm.removeEventListener('submit', submitHandler); } catch(e){}
    tabClickHandlers.forEach(({el,h}) => { try { el.removeEventListener('click', h); } catch(e){} });
    try { delete window.__opa_renderEvents; } catch(e){}
  };
}

function showVisualNotification(title, message, meetUrl) {
  const existing = document.getElementById('opa-visual-notif');
  if (existing) existing.remove();

  const notif = document.createElement('div');
  notif.id = 'opa-visual-notif';
  notif.innerHTML = `
    <div class="opa-visual-box">
      <div class="opa-visual-title">🔔 ${escapeHtml(title)}</div>
      <div class="opa-visual-message">${escapeHtml(message)}</div>
      <div class="opa-visual-actions">
        ${meetUrl ? `<button class="opa-visual-open" id="opa-visual-open">Abrir Reunião 🔗</button>` : ''}
      </div>
    </div>
  `;
  document.body.appendChild(notif);

  const openBtn = document.getElementById('opa-visual-open');
  if (openBtn && meetUrl) {
    openBtn.addEventListener('click', () => window.open(meetUrl, '_blank'));
  }

  const box = notif.querySelector('.opa-visual-box');
  if (box && box.animate) {
    box.animate(
      [
        { transform: 'scale(1) rotate(0deg)' },
        { transform: 'scale(1.05) rotate(-2deg)' },
        { transform: 'scale(1.05) rotate(2deg)' },
        { transform: 'scale(1.05) rotate(-2deg)' },
        { transform: 'scale(1.05) rotate(2deg)' },
        { transform: 'scale(1) rotate(0deg)' }
      ],
      {
        duration: 500,
        iterations: 2
      }
    );
  }

  try {
    if (navigator.vibrate) navigator.vibrate([200,100,200,100,200]);
  } catch(e){}

  setTimeout(() => {
    const el = document.getElementById('opa-visual-notif');
    if (el) el.remove();
  }, 10000);
}

chrome.runtime.onMessage.addListener((msg, sender, sendResp) => {
  try {
    if (msg?.type === 'visualNotify' && msg?.event) {
      const preMin = msg.event.preNoticeMinutes ?? 0;
      const eventTime = msg.event.time ? new Date(msg.event.time).getTime() : null;
      const now = Date.now();
      const minutesUntil = eventTime ? Math.round((eventTime - now) / 60000) : null;

      let displayMessage = msg.event.description || 'Sua reunião está próxima!';
      if (preMin > 0 && minutesUntil !== null && minutesUntil > 0) {
        displayMessage = `Começa em ${minutesUntil} minutos! ${msg.event.description || ''}`.trim();
      }

      showVisualNotification(
        msg.event.title || 'Lembrete Opa!',
        displayMessage,
        msg.event.meetUrl
      );

      tryShowPageNotification(
        msg.event.title || 'Lembrete Opa!',
        displayMessage,
        msg.event.meetUrl
      );
    }
  } catch (e) {
    console.error('[content] onMessage error', e);
  }
});

async function tryShowPageNotification(title, body, url) {
  try {
    if (Notification && Notification.permission === 'granted') {
      const n = new Notification(title, { body, tag: `opa-${Date.now()}` });
      if (url) n.onclick = () => window.open(url, '_blank');
      return;
    }
    if (Notification && Notification.permission !== 'denied') {
      const res = await Notification.requestPermission();
      if (res === 'granted') {
        const n = new Notification(title, { body, tag: `opa-${Date.now()}` });
        if (url) n.onclick = () => window.open(url, '_blank');
      }
    }
  } catch (e) {
    console.warn('[content] Notification API failed:', e);
  }
}

function init() {
  injectStyles();
  createFloatingButton();
  console.log('Opa! Reminders: Botão flutuante criado');
  
  window.__opa_showVisualNotification = showVisualNotification;
  window.__opa_sendBg = sendBg;
  window.__opa_openPanel = () => {
    if (!floatingPanel) {
      createFloatingPanel();
    } else {
      closeFloatingPanel();
    }
  };
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
