import { Reminder } from '../common/types';
import { getAllReminders } from '../common/storage';

function scheduleAlarmForReminder(rem: Reminder) {
    const when = new Date(rem.datetime).getTime();
    chrome.alarms.create(rem.id, { when });
}

async function initAlarms() {
    const reminders = await getAllReminders();
    for (const r of reminders) {
        scheduleAlarmForReminder(r);
    }
}

chrome.alarms.onAlarm.addListener(async (alarm) => {
    const id = alarm.name;
    const reminders = await getAllReminders();
    const rem = reminders.find(r => r.id === id);
    if (!rem) return;

    // notificação
    chrome.notifications.create(rem.id, {
        type: 'basic',
        iconUrl: 'icons/icon128.png',
        title: rem.title ?? `Lembrete: ${rem.protocol}`,
        message: rem.notes ?? 'Hora do atendimento',
        contextMessage: rem.pageUrl ?? ''
    });

    // (Opcional) abrir a página do atendimento se existir
    if (rem.pageUrl) {
        chrome.tabs.create({ url: rem.pageUrl });
    }
});

chrome.runtime.sendMessage({ type: "ping" }, (res: any) => {
    console.log(res);
});

// re-sincronizar alarms quando a extensão for ativada
chrome.runtime.onStartup.addListener(initAlarms);
chrome.runtime.onInstalled.addListener(initAlarms);

// escutar mensagens do content script / popup para agendar
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg.type === 'schedule') {
        scheduleAlarmForReminder(msg.reminder as Reminder);
        sendResponse({ ok: true });
    } else if (msg.type === 'cancel') {
        chrome.alarms.clear(msg.id);
        sendResponse({ ok: true });
    }
    // permitindo async response
    return true;
});
