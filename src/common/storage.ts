import { Reminder } from './types';

const KEY = 'opa_reminders_v1';

export async function getAllReminders(): Promise<Reminder[]> {
    return new Promise(resolve => {
        chrome.storage.local.get([KEY], (res) => {
            resolve(res[KEY] ?? []);
        });
    });
}

export async function saveReminders(reminders: Reminder[]): Promise<void> {
    return new Promise(resolve => {
        chrome.storage.local.set({ [KEY]: reminders }, () => resolve());
    });
}

export async function addReminder(r: Reminder): Promise<void> {
    const all = await getAllReminders();
    all.push(r);
    await saveReminders(all);
}

export async function removeReminder(id: string): Promise<void> {
    const all = (await getAllReminders()).filter(x => x.id !== id);
    await saveReminders(all);
}
