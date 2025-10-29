import { getAllReminders, removeReminder } from '../common/storage';

function render() {
    getAllReminders().then(reminders => {
        const list = document.getElementById('list')!;
        list.innerHTML = '';
        if (reminders.length === 0) {
            list.textContent = 'Nenhum lembrete';
            return;
        }
        reminders.forEach(r => {
            const el = document.createElement('div');
            el.className = 'rem-item';
            el.innerHTML = `
        <strong>${r.title ?? r.protocol}</strong>
        <div>${new Date(r.datetime).toLocaleString()}</div>
        <div>
          <button data-id="${r.id}" class="open">Abrir</button>
          <button data-id="${r.id}" class="del">Remover</button>
          <a href="${createGoogleCalendarLink(r)}" target="_blank">Adicionar ao Google Calendar</a>
        </div>
      `;
            list.appendChild(el);
        });

        list.querySelectorAll('button.del').forEach(b => {
            b.addEventListener('click', (ev:any) => {
                const id = ev.target.dataset.id;
                removeReminder(id).then(() => render());
            });
        });

        list.querySelectorAll('button.open').forEach(b => {
            b.addEventListener('click', (ev:any) => {
                const id = ev.target.dataset.id;
                getAllReminders().then(rems => {
                    const r = rems.find(x => x.id === id);
                    if (r && r.pageUrl) {
                        chrome.tabs.create({ url: r.pageUrl });
                    } else {
                        alert('Sem URL disponível.');
                    }
                });
            });
        });
    });
}

function createGoogleCalendarLink(r:any) {
    // quick add via eventos? Aqui geramos a URL de criação com params (start/end approximado + text + details)
    const start = new Date(r.datetime);
    const end = new Date(start.getTime() + 30*60000); // +30min
    const fmt = (d: Date) => d.toISOString().replace(/[-:]|\.\d{3}/g, '');
    const url = new URL('https://calendar.google.com/calendar/r/eventedit');
    url.searchParams.set('text', r.title ?? r.protocol);
    url.searchParams.set('details', r.notes ?? '');
    url.searchParams.set('dates', `${fmt(start)}/${fmt(end)}`);
    if (r.meetLink) url.searchParams.set('add', r.meetLink);
    return url.toString();
}

document.getElementById('create-sample')!.addEventListener('click', () => {
    const id = 'test-' + Date.now();
    const rem = {
        id,
        protocol: 'PROTO-123',
        title: 'Teste reunião',
        notes: 'Teste via popup',
        datetime: new Date(new Date().getTime() + 5*60000).toISOString(),
        createdAt: new Date().toISOString(),
        pageUrl: window.location.href
    };
    chrome.storage.local.get(['opa_reminders_v1'], (res) => {
        const arr = res['opa_reminders_v1'] ?? [];
        arr.push(rem);
        chrome.storage.local.set({ 'opa_reminders_v1': arr }, () => {
            chrome.runtime.sendMessage({ type: 'schedule', reminder: rem }, () => {
                render();
            });
        });
    });
});

render();
