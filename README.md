# 🧩 Opa! Reminders — Extensão Chrome

**Opa! Reminders** é uma extensão para Google Chrome criada para facilitar a gestão de compromissos, tarefas e lembretes do time **Opa! Suite**.
Leve, rápida e sempre acessível no navegador, ela garante que você nunca mais perca uma reunião ou horário importante.

---

## 📌 Funcionalidades

### 📅 Agendamentos Inteligentes

* Defina título, data e hora
* Lembretes antecipados (ex: 5, 10, 15 min antes)
* Link para reunião (Meet, Teams, Zoom)
* Campo de protocolo e descrição
* Notificações automáticas

### ✅ Gestão de Tarefas

* Tarefas sem horário
* Subtarefas com checkbox
* Progresso automático (ex: 2/5 concluídas)

### 🔔 Notificações Multicamadas

* Notificação do sistema (Chrome/Windows/Mac)
* Popup visual dentro da página
* Badge de contador
* Som opcional

### 📜 Histórico Completo

* Lista de eventos passados
* Organização automática por data

### 🎨 Interface Moderna

* Tema dark inspirado na identidade visual da Opa! Suite
* Botão flutuante
* Modal responsivo e animado

---

## 🛠️ Stack Técnica

* **JavaScript ES6+** (Vanilla)
* **Chrome Extensions API**
* **Service Worker (background.js)**
* **Content Script (content.js)**
* **Chrome Storage API**
* **Manifest V3**

```
opa-reminders/
├── manifest.json
├── background.js
└── content.js
```

---

## 🚀 Instalação (Modo Desenvolvedor)

1. Baixe ou clone este repositório:

   ```bash
   git clone https://github.com/SEU-USUARIO/opa-reminders.git
   ```

2. Abra o Chrome e acesse:
   `chrome://extensions/`

3. Ative **Modo do Desenvolvedor** (canto superior direito)

4. Clique em **“Carregar sem compactação”**

5. Selecione a pasta do projeto (`opa-reminders/`)

6. Fixe na barra de extensões (ícone de quebra-cabeça)

Pronto! ✔️

---

## 📖 Como Usar

### Criar Agendamento

1. Clique no **botão flutuante** no canto da página
2. Preencha os campos
3. Salve o evento
4. Receba notificações no horário e antes dele

### Criar Tarefa

* Abra o painel
* Selecione **Tarefa**
* Adicione subtarefas
* Marque como concluídas

---

## ⚙️ Desenvolvimento

Os principais arquivos:

### background.js

* Gerencia alarmes (`chrome.alarms`)
* Calcula lembretes antecipados
* Envia notificações
* Armazena eventos

### content.js

* Injeta UI dentro das páginas
* Renderiza o modal e botão flutuante
* Mostra notificações visuais
* Troca mensagens com o Service Worker

---

## 📚 Exemplos de Código

### Agendar alarme

```js
chrome.alarms.create(`event_${event.id}`, { when: eventTime });
```

### Notificação visual

```js
function showVisualNotification(title, message) {
  const box = document.createElement('div');
  box.className = 'opa-visual-notif';
  box.innerHTML = `<strong>${title}</strong><p>${message}</p>`;
  document.body.appendChild(box);
}
```

---

## 🤝 Contribuições

Contribuições são bem-vindas!

1. Faça um Fork
2. Crie uma branch:

   ```bash
   git checkout -b feature/nova-funcionalidade
   ```
3. Commit suas alterações
4. Abra um Pull Request

---

## 📄 Licença

**Uso Interno — Opa! Suite**
Este projeto não deve ser distribuído externamente sem autorização.

---

## 👤 Autor

**Eduardo de Paula**

📧 [eduardooelly@gmail.com](mailto:eduardooelly@gmail.com)

---
