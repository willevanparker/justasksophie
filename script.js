const shops = [
  {
    name: "Murphy's Wine Shop",
    city: "Atlanta",
    state: "GA",
    zip: "30306",
    neighborhood: "Virginia Highland",
    description: "Where rare, esoteric, and eco-conscious wines meet expert guidance, tastings, and winemaker dinners for novices and connoisseurs alike.",
    tags: ["Atlanta staple", "Large selection", "Everyday bottles"],
    website: "https://murphyswinestore.com"
  },
  {
    name: "Perrine's Wine Shop",
    city: "Atlanta",
    state: "GA",
    zip: "30318",
    neighborhood: "Westside",
    description: "A polished neighborhood wine shop known for thoughtful selections, tastings, and gift-worthy bottles.",
    tags: ["Curated", "Tastings", "Gift bottles"],
    website: "https://perrineswine.com"
  },
  {
    name: "Elemental Spirits Co.",
    city: "Atlanta",
    state: "GA",
    zip: "30306",
    neighborhood: "Poncey-Highland",
    description: "A modern bottle shop with natural wine, spirits, cocktail essentials, and a stylish neighborhood feel.",
    tags: ["Natural wine", "Cocktails", "Modern"],
    website: "https://elementalspirits.co"
  },
  {
    name: "VinoTeca",
    city: "Atlanta",
    state: "GA",
    zip: "30308",
    neighborhood: "Inman Park",
    description: "An approachable shop for discovering interesting wines, pairing ideas, and small-producer bottles.",
    tags: ["Small producers", "Approachable", "Pairings"],
    website: "https://www.shopvinoteca.com"
  }
];

const menuToggle = document.getElementById("menuToggle");
const mobileNav = document.getElementById("mobileNav");
const shopSearch = document.getElementById("shopSearch");
const shopList = document.getElementById("shopList");
const resultsMeta = document.getElementById("resultsMeta");

function renderShops(list) {
  shopList.innerHTML = "";

  if (!list.length) {
    shopList.innerHTML = `
      <article class="shop-card">
        <h3>No shops found yet.</h3>
        <p class="shop-description">
          Try searching by city, state, ZIP, or shop name.
        </p>
      </article>
    `;
    resultsMeta.textContent = "No matching shops";
    return;
  }

  resultsMeta.textContent =
    list.length === shops.length
      ? "Featured independent wine shops"
      : `${list.length} matching shop${list.length === 1 ? "" : "s"}`;

  list.forEach((shop) => {
    const card = document.createElement("article");
    card.className = "shop-card";

    card.innerHTML = `
      <h3>${shop.name}</h3>
      <p class="shop-location">
        ${shop.neighborhood} · ${shop.city}, ${shop.state} ${shop.zip}
      </p>
      <p class="shop-description">${shop.description}</p>
      <div class="shop-tags">
        ${shop.tags.map((tag) => `<span>${tag}</span>`).join("")}
      </div>
      <a class="shop-link" href="${shop.website}" target="_blank" rel="noopener">
        Visit shop →
      </a>
    `;

    shopList.appendChild(card);
  });
}

function filterShops(query) {
  const cleanQuery = query.trim().toLowerCase();

  if (!cleanQuery) {
    renderShops(shops);
    return;
  }

  const filtered = shops.filter((shop) => {
    const searchableText = [
      shop.name,
      shop.city,
      shop.state,
      shop.zip,
      shop.neighborhood,
      shop.description,
      ...shop.tags
    ]
      .join(" ")
      .toLowerCase();

    return searchableText.includes(cleanQuery);
  });

  renderShops(filtered);
}

menuToggle.addEventListener("click", () => {
  mobileNav.classList.toggle("open");
});

mobileNav.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", () => {
    mobileNav.classList.remove("open");
  });
});

shopSearch.addEventListener("input", (event) => {
  filterShops(event.target.value);
});

renderShops(shops);

// ==========================
// Chat UI
// ==========================

const openConcierge = document.getElementById("openConcierge");
const closeConcierge = document.getElementById("closeConcierge");
const chatOverlay = document.getElementById("chatOverlay");

openConcierge.addEventListener("click", () => {
  chatOverlay.classList.add("open");
});

closeConcierge.addEventListener("click", () => {
  chatOverlay.classList.remove("open");
});

chatOverlay.addEventListener("click", (event) => {
  if (event.target === chatOverlay) {
    chatOverlay.classList.remove("open");
  }
});

// ==========================
// Chat Messaging
// ==========================

const chatMessages = document.getElementById("chatMessages");
const chatInput = document.getElementById("chatInput");
const sendMessage = document.getElementById("sendMessage");

function addMessage(text, sender) {
  const message = document.createElement("div");
  message.className =
    sender === "user" ? "user-message" : "assistant-message";
  message.textContent = text;

  chatMessages.appendChild(message);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

async function sendChatMessage() {
  const message = chatInput.value.trim();

  if (!message) return;

  addMessage(message, "user");
  chatInput.value = "";

  const loading = document.createElement("div");
  loading.className = "assistant-message";
  loading.textContent = "Thinking...";
  chatMessages.appendChild(loading);
  chatMessages.scrollTop = chatMessages.scrollHeight;

  try {
    const response = await fetch("/.netlify/functions/ask-bria", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        message
      })
    });

    const data = await response.json();

    loading.remove();

    if (!response.ok) {
      addMessage(data.error || "Something went wrong.", "assistant");
      return;
    }

    addMessage(data.reply, "assistant");

  } catch (error) {
    loading.remove();

    addMessage(
      "Sorry, I couldn't connect right now. Please try again.",
      "assistant"
    );
  }
}

sendMessage.addEventListener("click", sendChatMessage);

chatInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    sendChatMessage();
  }
});
