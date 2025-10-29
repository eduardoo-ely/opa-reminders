export type Reminder = {
    id: string;
    protocol: string;
    title?: string;
    notes?: string;
    datetime: string; // ISO
    meetLink?: string;
    createdAt: string;
    pageUrl?: string; // url do atendimento para abrir
};
