const STORAGE_KEY = "chatgpt_clone_sessions_v1";
const MODEL_STORAGE_KEY = "chatgpt_clone_model_v1";

const state = {
  sessions: [],
  activeSessionId: null,
  selectedModel: localStorage.getItem(MODEL_STORAGE_KEY) || "ChatGPT 4.1",
};

const elements = {
  sidebar: document.getElementById("sidebar"),
  toggleSidebar: document.getElementById("toggleSidebar"),
  newChatBtn: document.getElementById("newChatBtn"),
  historyList: document.getElementById("historyList"),
  messages: document.getElementById("messages"),
  emptyState: document.getElementById("emptyState"),
  suggestions: document.getElementById("suggestions"),
  chatForm: document.getElementById("chatForm"),
  messageInput: document.getElementById("messageInput"),
  attachButton: document.getElementById("attachButton"),
  selectedModel: document.getElementById("selectedModel"),
  modelButton: document.getElementById("modelButton"),
  modelMenu: document.getElementById("modelMenu"),
};

const uid = () => `${Date.now()}-${Math.random().toString(16).slice(2)}`;

const relativeTime = (timestamp) => {
  const diff = Date.now() - timestamp;
  const minutes = Math.round(diff / (1000 * 60));

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.round(hours / 24);
  return `${days}d ago`;
};

const saveSessions = () => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.sessions));
};

const loadSessions = () => {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    if (Array.isArray(parsed)) {
      state.sessions = parsed;
    }
  } catch {
    state.sessions = [];
  }

  if (!state.sessions.length) {
    createSession();
    return;
  }

  state.activeSessionId = state.sessions[0].id;
};

const createSession = () => {
  const session = {
    id: uid(),
    title: "New chat",
    createdAt: Date.now(),
    updatedAt: Date.now(),
    messages: [],
  };

  state.sessions.unshift(session);
  state.activeSessionId = session.id;
  saveSessions();
  render();
};

const activeSession = () => state.sessions.find((session) => session.id === state.activeSessionId);

const generateAssistantReply = (prompt) => {
  const cleanedPrompt = prompt.trim();

  const tips = [
    "Break the problem into small, testable steps.",
    "Keep your constraints visible while planning.",
    "Validate assumptions with quick experiments.",
    "Summarize key outcomes before taking action.",
  ];

  return [
    `You asked: "${cleanedPrompt}"`,
    "",
    "Here is a practical response to get you moving:",
    `1. Clarify your goal and output format for this request.`,
    `2. Draft an outline or approach before diving deep.`,
    `3. Iterate quickly and improve based on feedback.`,
    "",
    `Extra tip: ${tips[Math.floor(Math.random() * tips.length)]}`,
  ].join("\n");
};

const updateSessionTitle = (session, firstPrompt) => {
  if (session.title !== "New chat") return;
  session.title = firstPrompt.slice(0, 36) + (firstPrompt.length > 36 ? "..." : "");
};

const appendMessage = (role, content) => {
  const session = activeSession();
  if (!session) return;

  session.messages.push({ id: uid(), role, content, createdAt: Date.now() });
  session.updatedAt = Date.now();

  if (role === "user") {
    updateSessionTitle(session, content);
  }

  state.sessions.sort((a, b) => b.updatedAt - a.updatedAt);
  saveSessions();
  render();
};

const sendPrompt = (rawMessage) => {
  const message = rawMessage.trim();
  if (!message) return;

  appendMessage("user", message);
  elements.messageInput.value = "";
  resizeInput();

  setTimeout(() => {
    appendMessage("assistant", generateAssistantReply(message));
  }, 450);
};

const renderHistory = () => {
  elements.historyList.innerHTML = "";

  state.sessions.forEach((session) => {
    const button = document.createElement("button");
    button.className = `history-chat ${session.id === state.activeSessionId ? "active" : ""}`;
    button.type = "button";

    button.innerHTML = `
      <p class="history-title">${session.title}</p>
      <span class="history-time">${relativeTime(session.updatedAt)}</span>
    `;

    button.addEventListener("click", () => {
      state.activeSessionId = session.id;
      render();
    });

    elements.historyList.appendChild(button);
  });
};

const renderMessages = () => {
  const session = activeSession();
  if (!session) return;

  elements.messages.innerHTML = "";
  const hasMessages = session.messages.length > 0;

  elements.emptyState.classList.toggle("hidden", hasMessages);
  elements.messages.classList.toggle("hidden", !hasMessages);

  session.messages.forEach((message) => {
    const article = document.createElement("article");
    article.className = `message ${message.role}`;

    const avatar = document.createElement("div");
    avatar.className = "avatar";
    avatar.textContent = message.role === "user" ? "U" : "AI";

    const bubble = document.createElement("div");
    bubble.className = "bubble";
    bubble.textContent = message.content;

    article.append(avatar, bubble);
    elements.messages.appendChild(article);
  });

  elements.messages.scrollTop = elements.messages.scrollHeight;
};

const resizeInput = () => {
  elements.messageInput.style.height = "auto";
  elements.messageInput.style.height = `${Math.min(elements.messageInput.scrollHeight, 180)}px`;
};

const render = () => {
  elements.selectedModel.textContent = state.selectedModel;
  renderHistory();
  renderMessages();
};

elements.toggleSidebar.addEventListener("click", () => {
  elements.sidebar.classList.toggle("collapsed");
});

elements.newChatBtn.addEventListener("click", createSession);

elements.chatForm.addEventListener("submit", (event) => {
  event.preventDefault();
  sendPrompt(elements.messageInput.value);
});

elements.messageInput.addEventListener("input", resizeInput);

elements.messageInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault();
    sendPrompt(elements.messageInput.value);
  }
});

elements.suggestions.addEventListener("click", (event) => {
  const card = event.target.closest(".box");
  if (!card) return;
  const text = card.querySelector("p")?.textContent || "";
  sendPrompt(text);
});

elements.attachButton.addEventListener("click", () => {
  alert("Attachment support can be integrated with a backend API.");
});

elements.modelButton.addEventListener("click", () => {
  elements.modelMenu.classList.toggle("open");
});

document.addEventListener("click", (event) => {
  if (!event.target.closest(".model-picker")) {
    elements.modelMenu.classList.remove("open");
  }
});

elements.modelMenu.addEventListener("click", (event) => {
  const option = event.target.closest(".model-option");
  if (!option) return;

  state.selectedModel = option.dataset.model;
  localStorage.setItem(MODEL_STORAGE_KEY, state.selectedModel);
  elements.modelMenu.classList.remove("open");
  render();
});

loadSessions();
render();
resizeInput();
