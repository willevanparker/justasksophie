(() => {
  "use strict";

  const CHAT_ENDPOINT = "/.netlify/functions/ask-bria";

  const elements = {
    menuToggle: document.querySelector(".menu-toggle"),
    mainNav: document.querySelector(".main-nav"),

    chatLauncher: document.getElementById("chatLauncher"),
    openChatNav: document.getElementById("openChatNav"),
    openChatHero: document.getElementById("openChatHero"),
    openChatStart: document.getElementById("openChatStart"),
    chatPanel: document.getElementById("chatPanel"),
    chatPanelClose: document.getElementById("chatPanelClose"),
    chatForm: document.getElementById("chatForm"),
    chatInput: document.getElementById("chatInput"),
    chatMessages: document.getElementById("chatMessages"),

    newsletterForm: document.getElementById("newsletterForm"),
    newsletterEmail: document.getElementById("newsletterEmail"),
    newsletterStatus: document.getElementById("newsletterStatus")
  };

  const chatState = {
    isOpen: false,
    isBusy: false
  };

  const menuState = {
    isOpen: false
  };

  function openMobileMenu() {
    setMobileMenuOpen(true);
  }

  function closeMobileMenu() {
    setMobileMenuOpen(false);
  }

  function toggleMobileMenu(event) {
    event.stopPropagation();
    setMobileMenuOpen(!menuState.isOpen);
  }

  function setMobileMenuOpen(isOpen) {
    if (!elements.menuToggle || !elements.mainNav) return;

    menuState.isOpen = isOpen;

    elements.mainNav.dataset.open = String(isOpen);
    elements.menuToggle.setAttribute("aria-expanded", String(isOpen));
    elements.menuToggle.setAttribute(
      "aria-label",
      isOpen ? "Close menu" : "Open menu"
    );
  }

  function openChat() {
    closeMobileMenu();
    setChatOpen(true);
  }

  function closeChat() {
    setChatOpen(false);
  }

  function toggleChat() {
    setChatOpen(!chatState.isOpen);
  }

  function setChatOpen(isOpen) {
    if (!elements.chatPanel || !elements.chatLauncher) return;

    chatState.isOpen = isOpen;

    elements.chatPanel.dataset.open = String(isOpen);
    elements.chatPanel.setAttribute("aria-hidden", String(!isOpen));
    elements.chatLauncher.setAttribute("aria-expanded", String(isOpen));

    if (isOpen && elements.chatInput) {
      window.setTimeout(() => {
        elements.chatInput.focus();
      }, 100);
    }
  }

  function addChatMessage(text, sender, options = {}) {
    if (!elements.chatMessages) return null;

    const message = document.createElement("div");
    message.className = `chat-message ${sender}`;

    if (options.isLoading) {
      message.classList.add("is-loading");
      message.setAttribute("aria-label", "Bria is thinking");
    }

    message.textContent = text;
    elements.chatMessages.appendChild(message);
    scrollChatToBottom();

    return message;
  }

  function removeMessage(message) {
    if (message && message.parentNode) {
      message.parentNode.removeChild(message);
    }
  }

  function scrollChatToBottom() {
    if (!elements.chatMessages) return;
    elements.chatMessages.scrollTop = elements.chatMessages.scrollHeight;
  }

  function setChatBusy(isBusy) {
    if (!elements.chatForm || !elements.chatInput) return;

    chatState.isBusy = isBusy;
    elements.chatForm.dataset.busy = String(isBusy);
    elements.chatInput.disabled = isBusy;

    const submitButton = elements.chatForm.querySelector("button[type='submit']");

    if (submitButton) {
      submitButton.disabled = isBusy;
      submitButton.textContent = isBusy ? "Sending..." : "Send";
    }
  }

  async function askBria(message) {
    const response = await fetch(CHAT_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ message })
    });

    const data = await safelyParseJson(response);

    if (!response.ok) {
      throw new Error(
        data.error || "Sorry, Bria had trouble answering that. Please try again."
      );
    }

    return data.reply || "Sorry, I had trouble answering that. Try again?";
  }

  async function safelyParseJson(response) {
    try {
      return await response.json();
    } catch {
      return {};
    }
  }

  async function handleChatSubmit(event) {
    event.preventDefault();

    if (chatState.isBusy || !elements.chatInput) return;

    const userMessage = elements.chatInput.value.trim();
    if (!userMessage) return;

    addChatMessage(userMessage, "user");
    elements.chatInput.value = "";

    const thinkingMessage = addChatMessage("Thinking...", "bria", {
      isLoading: true
    });

    setChatBusy(true);

    try {
      const reply = await askBria(userMessage);
      removeMessage(thinkingMessage);
      addChatMessage(reply, "bria");
    } catch (error) {
      removeMessage(thinkingMessage);
      addChatMessage(
        error.message ||
          "Sorry, Bria had trouble connecting. Please try again in a moment.",
        "bria"
      );
    } finally {
      setChatBusy(false);
      elements.chatInput.focus();
    }
  }

  function isClickOutsideChat(event) {
    if (!elements.chatPanel || !chatState.isOpen) return false;

    const clickTarget = event.target;

    const openButtons = [
      elements.chatLauncher,
      elements.openChatNav,
      elements.openChatHero,
      elements.openChatStart
    ].filter(Boolean);

    const clickedPanel = elements.chatPanel.contains(clickTarget);
    const clickedOpenButton = openButtons.some((button) =>
      button.contains(clickTarget)
    );

    return !clickedPanel && !clickedOpenButton;
  }

  function isClickOutsideMenu(event) {
    if (!elements.mainNav || !elements.menuToggle || !menuState.isOpen) {
      return false;
    }

    const clickTarget = event.target;

    const clickedMenu = elements.mainNav.contains(clickTarget);
    const clickedToggle = elements.menuToggle.contains(clickTarget);

    return !clickedMenu && !clickedToggle;
  }

  function handleDocumentClick(event) {
    if (isClickOutsideChat(event)) {
      closeChat();
    }

    if (isClickOutsideMenu(event)) {
      closeMobileMenu();
    }
  }

  function handleDocumentKeydown(event) {
    if (event.key === "Escape") {
      if (chatState.isOpen) closeChat();
      if (menuState.isOpen) closeMobileMenu();
    }
  }

  function setNewsletterStatus(message, state = "") {
    if (!elements.newsletterStatus) return;

    elements.newsletterStatus.textContent = message;
    elements.newsletterStatus.dataset.state = state;
  }

  function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  function handleNewsletterSubmit(event) {
    event.preventDefault();

    if (!elements.newsletterEmail) return;

    const email = elements.newsletterEmail.value.trim();

    if (!email) {
      elements.newsletterEmail.setAttribute("aria-invalid", "true");
      setNewsletterStatus("Enter your email address to join.", "error");
      elements.newsletterEmail.focus();
      return;
    }

    if (!isValidEmail(email)) {
      elements.newsletterEmail.setAttribute("aria-invalid", "true");
      setNewsletterStatus("That email address doesn't look quite right.", "error");
      elements.newsletterEmail.focus();
      return;
    }

    elements.newsletterEmail.removeAttribute("aria-invalid");
    setNewsletterStatus("You're on the list for Bria's Weekly Pour. 🍷", "success");
    elements.newsletterEmail.value = "";
  }

  function handleNewsletterInput() {
    if (!elements.newsletterEmail) return;

    if (elements.newsletterEmail.getAttribute("aria-invalid") === "true") {
      elements.newsletterEmail.removeAttribute("aria-invalid");
      setNewsletterStatus("");
    }
  }

  function bindEvents() {
    elements.menuToggle?.addEventListener("click", toggleMobileMenu);

    elements.mainNav?.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", closeMobileMenu);
    });

    elements.chatLauncher?.addEventListener("click", toggleChat);
    elements.openChatNav?.addEventListener("click", openChat);
    elements.openChatHero?.addEventListener("click", openChat);
    elements.openChatStart?.addEventListener("click", openChat);
    elements.chatPanelClose?.addEventListener("click", closeChat);

    elements.chatForm?.addEventListener("submit", handleChatSubmit);

    document.addEventListener("click", handleDocumentClick);
    document.addEventListener("keydown", handleDocumentKeydown);

    elements.newsletterForm?.addEventListener("submit", handleNewsletterSubmit);
    elements.newsletterEmail?.addEventListener("input", handleNewsletterInput);
  }

  function init() {
    bindEvents();
    setMobileMenuOpen(false);
    setChatOpen(false);
  }

  init();
})();
