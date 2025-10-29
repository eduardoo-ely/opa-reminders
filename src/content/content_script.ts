import { v4 as uuidv4 } from 'uuid';

// função para criar botão ao lado de um chat
function createReminderButton(protocol: string, container: HTMLElement, pageUrl: string) {
    const btn = document.createElement('button');
    btn.textContent = '🔔 Lembrar';
    btn.style.marginLeft = '8px';
    btn.style.cursor = 'pointer';
    btn.addEventListener('click', () => openQuickCreate(protocol, pageUrl));
    container.appendChild(btn);
}

function openQuickCreate(protocol: string, pageUrl: string) {
    const title = `Reunião - ${protocol}`;
    // cria um lembrete com 10 minutos à frente como exemplo
    const dt = new Date();
    dt.setMinutes(dt.getMinutes() + 10);

    const reminder = {
        id: uuidv4(),
        protocol,
        title,
        notes: '',
        datetime: dt.toISOString(),
        meetLink: findMeetLinkInPage() ?? undefined,
        createdAt: new Date().toISOString(),
        pageUrl
    };

    // salva via chrome.storage direto e pede ao background agendar (popup/background também podem fazê-lo)
    chrome.storage.local.get(['opa_reminders_v1'], (res) => {
        const arr = res['opa_reminders_v1'] ?? [];
        arr.push(reminder);
        chrome.storage.local.set({ 'opa_reminders_v1': arr }, () => {
            // mensagem ao background para criar alarm
            chrome.runtime.sendMessage({ type: 'schedule', reminder }, () => {
                alert('Lembrete criado: ' + title);
            });
        });
    });
}

function findMeetLinkInPage(): string | null {
    // procura links com "meet.google.com" na página
    const links = Array.from(document.querySelectorAll('a')) as HTMLAnchorElement[];
    const meet = links.find(a => a.href.includes('meet.google.com'));
    return meet ? meet.href : null;
}

// Detecta os elementos de chat — EXEMPLO genérico.
// Trocar '.chat-item' e '.protocol' pelos selectors reais do Opa! Suite.
function scanAndInsertButtons() {
    const items = document.querySelectorAll('.chat-item');
    items.forEach(item => {
        if ((item as HTMLElement).dataset?.reminderAdded) return;
        const protocolEl = item.querySelector('.protocol');
        if (!protocolEl) return;
        const protocol = protocolEl.textContent?.trim() ?? 'sem-protocolo';
        // inserir botão no header do chat
        const header = item.querySelector('.chat-header') as HTMLElement | null;
        if (header) {
            createReminderButton(protocol, header, window.location.href);
            (item as HTMLElement).dataset.reminderAdded = '1';
        }
    });
}

// Observador para novos chats dinâmicos
const observer = new MutationObserver((mutations) => {
    scanAndInsertButtons();
});

observer.observe(document.body, { childList: true, subtree: true });

// run initially
scanAndInsertButtons();
