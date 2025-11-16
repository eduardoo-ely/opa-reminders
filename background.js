// ================================
// background.js – Opa! Reminders 
// ================================
// Service worker que gerencia eventos e notificações

const STORAGE_KEY = 'opa_events';
const RECHECK_ALARM = 'opa_recheck';

// Rastreio
function log(...a) {
  try { 
    console.log('[BG]', new Date().toLocaleTimeString(), ...a); 
  } catch(e) {}
}

// ==================== UTILITÁRIOS ====================
async function readEvents() {
  try {
    const result = await chrome.storage.local.get([STORAGE_KEY]);
    const events = Array.isArray(result[STORAGE_KEY]) ? result[STORAGE_KEY] : [];
    log(`Eventos lidos: ${events.length}`);
    return events;
  } catch (error) {
    console.error('[BG] Erro ao ler eventos:', error);
    return [];
  }
}

async function writeEvents(events) {
  try {
    await chrome.storage.local.set({ [STORAGE_KEY]: events });
    log(`Eventos salvos: ${events.length}`);
    return true;
  } catch (error) {
    console.error('[BG] Erro ao salvar eventos:', error);
    return false;
  }
}

function generateId() {
  try {
    return (crypto && crypto.randomUUID) ? crypto.randomUUID() : `${Date.now()}-${Math.floor(Math.random()*100000)}`;
  } catch(e) {
    return `${Date.now()}-${Math.floor(Math.random()*100000)}`;
  }
}

// Helper para criar/limpar alarmes com nomes previsíveis:
// pré-notice: pre_{id}
// event time: event_{id}
async function clearAlarmsForEvent(id) {
  try {
    await chrome.alarms.clear(`pre_${id}`);
    await chrome.alarms.clear(`event_${id}`);
    log(`Alarmes limpos para evento: ${id}`);
  } catch (e) {
    log('Erro ao limpar alarmes (ignorado):', e?.message);
  }
}

async function scheduleAlarmForEvent(event) {
  if (!event || !event.id || !event.time) {
    log('⚠️ Evento sem id/time, não agendando:', event?.title);
    return;
  }

  const eventTime = new Date(event.time).getTime();
  const preMin = Number.isFinite(Number(event.preNoticeMinutes)) ? Number(event.preNoticeMinutes) : 0;
  const preMs = preMin * 60 * 1000;
  const now = Date.now();

  log(`🔍 DEBUG scheduleAlarmForEvent: "${event.title}"`);
  log(`  - Evento time: ${new Date(eventTime).toLocaleString('pt-BR')}`);
  log(`  - preNoticeMinutes: ${event.preNoticeMinutes} (tipo: ${typeof event.preNoticeMinutes})`);
  log(`  - preMin calculado: ${preMin}`);
  log(`  - preMs: ${preMs}ms`);
  log(`  - Agora: ${new Date(now).toLocaleString('pt-BR')}`);

  // Limpar alarmes existentes primeiro
  await clearAlarmsForEvent(event.id);

  // Schedule pre-notice se configurado e não passou
  if (preMin > 0) {
    const notifyPreTime = eventTime - preMs;
    log(`  - Hora do pré-aviso: ${new Date(notifyPreTime).toLocaleString('pt-BR')}`);
    log(`  - Diferença para agora: ${Math.round((notifyPreTime - now) / 1000)}s`);
    
    if (notifyPreTime > now) {
      try {
        await chrome.alarms.create(`pre_${event.id}`, { when: notifyPreTime });
        log(`✅ Alarme PRE criado: "${event.title}" → ${new Date(notifyPreTime).toLocaleString('pt-BR')}`);
        
        // Verificar se o alarme foi realmente criado
        const createdAlarm = await chrome.alarms.get(`pre_${event.id}`);
        if (createdAlarm) {
          log(`✅ Alarme PRE confirmado: ${new Date(createdAlarm.scheduledTime).toLocaleString('pt-BR')}`);
        } else {
          log(`❌ ERRO: Alarme PRE não foi criado!`);
        }
      } catch (e) {
        log('❌ Erro ao criar alarme PRE:', e?.message);
      }
    } else {
      log(`⏱️ Pre-notice já passou para "${event.title}" (faltavam ${Math.round((notifyPreTime - now) / 1000)}s)`);
    }
  } else {
    log(`ℹ️ Sem pré-aviso configurado (preMin = ${preMin})`);
  }

  // Schedule event-time alarm se não passou
  if (eventTime > now) {
    try {
      await chrome.alarms.create(`event_${event.id}`, { when: eventTime });
      log(`✅ Alarme EVENTO criado: "${event.title}" → ${new Date(eventTime).toLocaleString('pt-BR')}`);
      
      // Verificar se o alarme foi realmente criado
      const createdAlarm = await chrome.alarms.get(`event_${event.id}`);
      if (createdAlarm) {
        log(`✅ Alarme EVENTO confirmado: ${new Date(createdAlarm.scheduledTime).toLocaleString('pt-BR')}`);
      } else {
        log(`❌ ERRO: Alarme EVENTO não foi criado!`);
      }
    } catch (e) {
      log('❌ Erro ao criar alarme EVENTO:', e?.message);
    }
  } else {
    log(`⏱️ Evento já passou, não agendando: "${event.title}"`);
  }
}

// Reagenda todos (limpa e recria)
async function scheduleAllAlarms() {
  log('🔄 === Reagendando todos os alarmes ===');
  
  try {
    // Limpar todos os alarmes exceto o recheck
    const allAlarms = await chrome.alarms.getAll();
    for (const alarm of allAlarms) {
      if (alarm.name !== RECHECK_ALARM) {
        await chrome.alarms.clear(alarm.name);
      }
    }
    log('🧹 Alarmes antigos limpos');
  } catch(e) {
    log('⚠️ Erro ao limpar alarmes (ignorado):', e?.message);
  }

  const events = await readEvents();
  const now = Date.now();
  let agendados = 0;
  let ignorados = 0;
  let passados = 0;

  for (const event of events) {
    if (event.type === 'tarefa') {
      log(`📝 Ignorando tarefa: "${event.title}"`);
      ignorados++;
      continue;
    }
    
    if (!event.time) {
      log(`⚠️ Evento sem time: "${event.title}"`);
      ignorados++;
      continue;
    }
    
    const eventTime = new Date(event.time).getTime();
    if (eventTime > now) {
      await scheduleAlarmForEvent(event);
      agendados++;
    } else {
      log(`⏱️ Evento passou: "${event.title}"`);
      passados++;
    }
  }
  
  log(`📊 === Resumo: ${agendados} agendados | ${passados} passados | ${ignorados} ignorados ===`);
}

// ==================== NOTIFICAÇÕES ====================
// Mapa para rastrear notificações e seus eventos
const notificationEventMap = new Map();

async function showNotification(event, kind = 'event') {
  if (!event) return;
  log(`🔔 Notificando (${kind}): "${event.title}"`);

  const isPreNotice = kind === 'pre';
  const preMin = event.preNoticeMinutes ?? 0;
  
  let message = event.description || 'Seu evento está chegando!';
  
  if (isPreNotice && preMin > 0) {
    message = `Começa em ${preMin} minutos! ${event.description || ''}`.trim();
  } else if (!isPreNotice) {
    message = event.description || 'Seu evento começa agora!';
  }

  const notifId = `notif_${kind}_${event.id}_${Date.now()}`;
  
  const options = {
    type: 'basic',
    iconUrl: chrome.runtime.getURL('icon.png'), // Certifique-se de ter um icon.png na raiz
    title: `🔔 ${event.title}${isPreNotice ? ' (em breve)' : ''}`,
    message: message,
    priority: 2,
    requireInteraction: true,
    buttons: event.meetUrl ? [
      { title: '🔗 Abrir Link' }
    ] : undefined
  };

  // Salvar referência do evento para uso no click handler
  notificationEventMap.set(notifId, event);

  try {
    await chrome.notifications.create(notifId, options);
    log(`✅ Notificação criada: ${notifId}`);
    
    // Limpar do mapa após 2 minutos (caso não seja clicada)
    setTimeout(() => {
      notificationEventMap.delete(notifId);
    }, 120000);
  } catch (error) {
    log('❌ Erro ao criar notificação:', error?.message);
  }

  // Enviar notificação visual para content scripts
  await sendVisualNotificationToTabs(event);
}

async function sendVisualNotificationToTabs(event) {
  try {
    const tabs = await chrome.tabs.query({});
    
    if (!tabs || tabs.length === 0) {
      log('⚠️ Nenhuma aba encontrada');
      return;
    }

    let sent = 0;
    let failed = 0;

    for (const tab of tabs) {
      try {
        if (!tab.id || !tab.url) continue;
        
        // Ignorar páginas internas do Chrome
        if (
          tab.url.startsWith('chrome://') ||
          tab.url.startsWith('chrome-extension://') ||
          tab.url.startsWith('about:') ||
          tab.url.startsWith('edge://') ||
          tab.url.startsWith('devtools://')
        ) {
          continue;
        }

        await chrome.tabs.sendMessage(tab.id, { 
          type: 'visualNotify', 
          event 
        });
        sent++;
      } catch (err) {
        // Ignorar erros (aba sem content script, etc.)
        failed++;
      }
    }
    
    log(`📤 Notificações visuais enviadas: ${sent} sucesso | ${failed} falhas`);
  } catch (error) {
    log('❌ Erro ao enviar notificações visuais:', error?.message);
  }
}

// ==================== NOTIFICATION CLICK HANDLER ====================
chrome.notifications.onClicked.addListener((notifId) => {
  log(`👆 Notificação clicada: ${notifId}`);
  
  const event = notificationEventMap.get(notifId);
  
  if (event && event.meetUrl) {
    chrome.tabs.create({ url: event.meetUrl });
    log(`🔗 Abrindo link: ${event.meetUrl}`);
  }
  
  // Limpar notificação
  chrome.notifications.clear(notifId);
  notificationEventMap.delete(notifId);
});

chrome.notifications.onButtonClicked.addListener((notifId, buttonIndex) => {
  log(`👆 Botão da notificação clicado: ${notifId} | botão ${buttonIndex}`);
  
  const event = notificationEventMap.get(notifId);
  
  if (buttonIndex === 0 && event && event.meetUrl) {
    chrome.tabs.create({ url: event.meetUrl });
    log(`🔗 Abrindo link via botão: ${event.meetUrl}`);
  }
  
  // Limpar notificação
  chrome.notifications.clear(notifId);
  notificationEventMap.delete(notifId);
});

chrome.notifications.onClosed.addListener((notifId) => {
  // Limpar do mapa quando notificação é fechada
  notificationEventMap.delete(notifId);
});

// ==================== MENSAGENS ====================
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  log(`📨 Mensagem recebida: ${msg?.type}`);

  (async () => {
    try {
      if (msg.type === 'saveEvent') {
        const event = msg.event || {};

        // Gerar ID se não existir
        if (!event.id) {
          event.id = generateId();
        }

        // Converter datetime para ISO string
        if (event.datetime && !event.time) {
          event.time = new Date(event.datetime).toISOString();
        }

        // Timestamps
        event.updatedAt = new Date().toISOString();
        if (!event.createdAt) {
          event.createdAt = new Date().toISOString();
        }

        // Validações
        if (!event.title || event.title.trim() === '') {
          sendResponse({ success: false, error: 'Título é obrigatório' });
          return;
        }

        if (event.type === 'agendamento' && !event.time) {
          sendResponse({ success: false, error: 'Data/hora é obrigatória para agendamentos' });
          return;
        }

        const events = await readEvents();
        const index = events.findIndex(e => e.id === event.id);

        if (index === -1) {
          events.push(event);
          log(`➕ Novo evento adicionado: "${event.title}"`);
        } else {
          events[index] = event;
          log(`📝 Evento atualizado: "${event.title}"`);
        }

        const saved = await writeEvents(events);
        
        if (saved) {
          // Agendar alarmes para este evento
          if (event.type !== 'tarefa' && event.time) {
            await scheduleAlarmForEvent(event);
          }
          sendResponse({ success: true, event });
        } else {
          sendResponse({ success: false, error: 'Erro ao salvar no storage' });
        }
        return;
      }

      if (msg.type === 'getEvents') {
        const events = await readEvents();
        sendResponse({ success: true, events });
        return;
      }

      if (msg.type === 'deleteEvent') {
        if (!msg.id) {
          sendResponse({ success: false, error: 'ID do evento não fornecido' });
          return;
        }

        let events = await readEvents();
        const antes = events.length;
        events = events.filter(e => e.id !== msg.id);
        
        if (events.length === antes) {
          log(`⚠️ Evento não encontrado para deletar: ${msg.id}`);
          sendResponse({ success: false, error: 'Evento não encontrado' });
          return;
        }

        const saved = await writeEvents(events);
        await clearAlarmsForEvent(msg.id);
        
        if (saved) {
          log(`🗑️ Evento deletado: ${msg.id}`);
          sendResponse({ success: true });
        } else {
          sendResponse({ success: false, error: 'Erro ao salvar após deletar' });
        }
        return;
      }

      if (msg.type === 'showNotification') {
        if (!msg.event) {
          sendResponse({ success: false, error: 'Evento não fornecido' });
          return;
        }
        await showNotification(msg.event, msg.kind || 'event');
        sendResponse({ success: true });
        return;
      }

      // Ação desconhecida
      log(`⚠️ Ação desconhecida: ${msg.type}`);
      sendResponse({ success: false, error: 'Ação desconhecida' });
      
    } catch (error) {
      console.error('[BG] ❌ Erro no background:', error);
      sendResponse({ success: false, error: error?.message || 'Erro desconhecido' });
    }
  })();

  return true; // Mantém canal aberto para resposta async
});

// ==================== ALARMES ====================
chrome.alarms.onAlarm.addListener(async (alarm) => {
  log(`⏰ Alarme disparado: ${alarm?.name}`);
  
  if (!alarm || !alarm.name) {
    log('⚠️ Alarme sem nome');
    return;
  }

  // Alarme de verificação periódica
  if (alarm.name === RECHECK_ALARM) {
    log('🔄 Executando verificação periódica');
    await scheduleAllAlarms();
    return;
  }

  // Alarme de pré-aviso
  if (alarm.name.startsWith('pre_')) {
    const id = alarm.name.replace('pre_', '');
    const events = await readEvents();
    const event = events.find(e => e.id === id);
    
    if (event) {
      await showNotification(event, 'pre');
    } else {
      log(`⚠️ Evento não encontrado para pré-aviso: ${id}`);
    }
    return;
  }

  // Alarme do evento principal
  if (alarm.name.startsWith('event_')) {
    const id = alarm.name.replace('event_', '');
    const events = await readEvents();
    const event = events.find(e => e.id === id);
    
    if (event) {
      await showNotification(event, 'event');
      
      // Opcional: abrir link automaticamente
      // if (event.meetUrl) {
      //   chrome.tabs.create({ url: event.meetUrl });
      // }
    } else {
      log(`⚠️ Evento não encontrado: ${id}`);
    }
    return;
  }

  log(`⚠️ Alarme desconhecido: ${alarm.name}`);
});

// ==================== INICIALIZAÇÃO ====================
chrome.runtime.onInstalled.addListener(async (details) => {
  log(`🎉 === Opa! Reminders ${details.reason} ===`);
  
  if (details.reason === 'install') {
    log('✨ Primeira instalação');
  } else if (details.reason === 'update') {
    log(`🔄 Atualizado de ${details.previousVersion}`);
  }
  
  // Criar alarme de verificação periódica (apenas se não existir)
  const existing = await chrome.alarms.get(RECHECK_ALARM);
  if (!existing) {
    await chrome.alarms.create(RECHECK_ALARM, { periodInMinutes: 60 });
    log('⏰ Alarme de verificação periódica criado');
  }
  
  await scheduleAllAlarms();
});

chrome.runtime.onStartup.addListener(async () => {
  log('🚀 === Opa! Reminders iniciado ===');
  
  // Garantir que o alarme periódico existe
  const existing = await chrome.alarms.get(RECHECK_ALARM);
  if (!existing) {
    await chrome.alarms.create(RECHECK_ALARM, { periodInMinutes: 60 });
    log('⏰ Alarme de verificação periódica criado (startup)');
  }
  
  await scheduleAllAlarms();
});

// Log de inicialização
log('🎯 === Background script carregado ===');

// Debug: listar todos os alarmes ativos a cada 5 minutos
if (typeof setInterval !== 'undefined') {
  setInterval(async () => {
    try {
      const alarms = await chrome.alarms.getAll();
      log(`📋 Alarmes ativos: ${alarms.length}`);
      alarms.forEach(a => {
        const when = a.scheduledTime ? new Date(a.scheduledTime).toLocaleString('pt-BR') : 'N/A';
        log(`  - ${a.name}: ${when}`);
      });
    } catch(e) {
      log('Erro ao listar alarmes:', e?.message);
    }
  }, 5 * 60 * 1000); // 5 minutos
}
