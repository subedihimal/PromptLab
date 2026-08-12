const input = document.querySelector('#input');
const chatContainer = document.querySelector('#chatContainer');
input.addEventListener('keyup', handleEnter);
const askBTN = document.querySelector("#ask");
askBTN.addEventListener('click', handleEnter);

const loading = document.createElement('div');
loading.className = 'my-6 max-w-fit px-4 py-3 rounded-2xl animate-pulse text-orange-300';
loading.textContent = 'Thinking...';

const HISTORY_KEY = 'chat_history';
const LIMIT_KEY = 'chat_limit';
const HISTORY_TTL = 24 * 60 * 60 * 1000; // 24 hours
const MAX_HISTORY = 8;
const MAX_MESSAGES_PER_WINDOW = 20;

// ---------- History helpers ----------
function loadHistory() {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    try {
        const parsed = JSON.parse(raw);
        if (Date.now() - parsed.timestamp > HISTORY_TTL) {
            localStorage.removeItem(HISTORY_KEY);
            return [];
        }
        return parsed.messages || [];
    } catch {
        localStorage.removeItem(HISTORY_KEY);
        return [];
    }
}

function saveHistory(messages) {
    const trimmed = messages.slice(-MAX_HISTORY);
    localStorage.setItem(HISTORY_KEY, JSON.stringify({
        messages: trimmed,
        timestamp: Date.now()
    }));
}

// ---------- Rate limit helpers ----------
function getLimitState() {
    const raw = localStorage.getItem(LIMIT_KEY);
    if (!raw) return { count: 0, windowStart: Date.now() };
    try {
        const parsed = JSON.parse(raw);
        if (Date.now() - parsed.windowStart > HISTORY_TTL) {
            // window expired, reset
            return { count: 0, windowStart: Date.now() };
        }
        return parsed;
    } catch {
        return { count: 0, windowStart: Date.now() };
    }
}

function saveLimitState(state) {
    localStorage.setItem(LIMIT_KEY, JSON.stringify(state));
}

function canSendMessage() {
    const state = getLimitState();
    return state.count < MAX_MESSAGES_PER_WINDOW;
}

function recordMessageSent() {
    const state = getLimitState();
    state.count += 1;
    saveLimitState(state);
}

function getLimitResetInfo() {
    const state = getLimitState();
    const msLeft = HISTORY_TTL - (Date.now() - state.windowStart);
    const hoursLeft = Math.ceil(msLeft / (60 * 60 * 1000));
    return hoursLeft;
}

// ---------- UI helpers ----------
function appendUserMessage(text) {
    const msg = document.createElement('div');
    msg.className = 'my-6 bg-neutral-800 p-3 rounded-xl ml-auto max-w-[85%] break-words';
    msg.textContent = text;
    chatContainer?.appendChild(msg);
}

function appendAssistantMessage(text) {
    const el = document.createElement('div');
    el.className = 'max-w-fit';
    el.textContent = text;
    chatContainer?.appendChild(el);
}

function appendSystemNotice(text) {
    const el = document.createElement('div');
    el.className = 'my-6 max-w-fit px-4 py-3 rounded-2xl text-red-400';
    el.textContent = text;
    chatContainer?.appendChild(el);
}

// Restore any persisted history into the UI on page load
function restoreHistoryToUI() {
    const history = loadHistory();
    history.forEach(m => {
        if (m.role === 'user') appendUserMessage(m.content);
        else appendAssistantMessage(m.content);
    });
}
restoreHistoryToUI();

// ---------- Core logic ----------
async function generate(text) {
    if (!canSendMessage()) {
        const hoursLeft = getLimitResetInfo();
        appendSystemNotice(`You've reached the limit of ${MAX_MESSAGES_PER_WINDOW} messages. Try again in about ${hoursLeft} hour(s).`);
        return;
    }

    appendUserMessage(text);
    input.value = '';
    chatContainer.appendChild(loading);

    // build history including the new user message
    const history = loadHistory();
    history.push({ role: 'user', content: text });

    let assistantMessage;
    try {
        assistantMessage = await callServer(text, history);
    } catch (err) {
        chatContainer?.removeChild(loading);
        appendSystemNotice('Something went wrong generating the response.');
        return;
    }

    chatContainer?.removeChild(loading);
    appendAssistantMessage(assistantMessage);

    history.push({ role: 'assistant', content: assistantMessage });
    saveHistory(history);
    recordMessageSent();
}

async function callServer(inputText, history) {
    const response = await fetch('/chat', {
        method: "POST",
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ message: inputText, history }),
    });
    if (!response.ok) {
        throw new Error("Error generating the response");
    }
    const result = await response.json();
    return result.message;
}

async function handleEnter(e) {
    if (e.key === "Enter" || e.type === "click") {
        const text = input?.value.trim();
        if (!text) {
            return;
        }
        await generate(text);
    }
}
