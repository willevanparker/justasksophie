const shops = [
  {
    id: "murphys-atl",
    name: "Murphy's Wine Shop",
    city: "Atlanta",
    state: "GA",
    zip: "30306",
    neighborhood: "Virginia Highland",
    latitude: 33.7789,
    longitude: -84.3516,
    description:
      "Where rare, esoteric, and eco-conscious wines meet expert guidance, tastings, and winemaker dinners for novices and connoisseurs alike.",
    tags: ["Atlanta staple", "Large selection", "Everyday bottles"],
    website: "https://murphyswinestore.com"
  },
  {
    id: "perrines-atl",
    name: "Perrine's Wine Shop",
    city: "Atlanta",
    state: "GA",
    zip: "30318",
    neighborhood: "Westside",
    latitude: 33.8025,
    longitude: -84.4151,
    description:
      "A polished neighborhood wine shop known for thoughtful selections, tastings, and gift-worthy bottles.",
    tags: ["Curated", "Tastings", "Gift bottles"],
    website: "https://perrineswine.com"
  },
  {
    id: "elemental-spirits-atl",
    name: "Elemental Spirits Co.",
    city: "Atlanta",
    state: "GA",
    zip: "30306",
    neighborhood: "Poncey-Highland",
    latitude: 33.7727,
    longitude: -84.3634,
    description:
      "A modern bottle shop with natural wine, spirits, cocktail essentials, and a stylish neighborhood feel.",
    tags: ["Natural wine", "Cocktails", "Modern"],
    website: "https://elementalspirits.co"
  },
  {
    id: "vinoteca-atl",
    name: "VinoTeca",
    city: "Atlanta",
    state: "GA",
    zip: "30308",
    neighborhood: "Inman Park",
    latitude: 33.7597,
    longitude: -84.3613,
    description:
      "An approachable shop for discovering interesting wines, pairing ideas, and small-producer bottles.",
    tags: ["Small producers", "Approachable", "Pairings"],
    website: "https://www.shopvinoteca.com"
  }
];

const menuToggle = document.getElementById("menuToggle");
const mobileNav = document.getElementById("mobileNav");
const shopSearch = document.getElementById("shopSearch");
const shopList = document.getElementById("shopList");
const resultsMeta = document.getElementById("resultsMeta");

// ==========================
// Mapbox
// ==========================

let map = null;

if (window.mapboxgl && document.getElementById("wineMap")) {
  mapboxgl.accessToken =
    "pk.eyJ1Ijoid2lsbGV2YW5wYXJrZXIiLCJhIjoiY21xd2N2MGlzMWNzejJycTE2d25ndDlidyJ9.atPhHI0hq56xVEi3snh9ig";

  map = new mapboxgl.Map({
    container: "wineMap",
    style: "mapbox://styles/mapbox/streets-v12",
    center: [-84.388, 33.749],
    zoom: 11.5
  });

  map.addControl(new mapboxgl.NavigationControl(), "top-right");

  map.on("load", () => {
    shops.forEach((shop) => {
      const popup = new mapboxgl.Popup({ offset: 24 }).setHTML(`
        <strong>${shop.name}</strong><br>
        ${shop.neighborhood}
      `);

      const marker = new mapboxgl.Marker()
        .setLngLat([shop.longitude, shop.latitude])
        .setPopup(popup)
        .addTo(map);

      marker.getElement().addEventListener("click", () => {
        document.querySelectorAll(".shop-card").forEach((card) => {
          card.classList.remove("active");
        });

        const matchingCard = document.querySelector(
          `[data-shop-id="${shop.id}"]`
        );

        if (matchingCard) {
  matchingCard.classList.add("active");

  matchingCard.scrollIntoView({
    behavior: "smooth",
    block: "center"
  });
}
      });
    });
  });
}
// ==========================
// Directory
// ==========================

function fitMapToShops(list) {
  if (!map || !list.length) return;

  const bounds = new mapboxgl.LngLatBounds();

  list.forEach((shop) => {
    bounds.extend([shop.longitude, shop.latitude]);
  });

  map.fitBounds(bounds, {
    padding: 80,
    maxZoom: 14,
    duration: 900
  });
}

function renderShops(list) {
  if (!shopList) return;

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

    if (resultsMeta) {
      resultsMeta.textContent = "No matching shops";
    }

    return;
  }

  if (resultsMeta) {
    resultsMeta.textContent =
      list.length === shops.length
        ? "Results"
        : `${list.length} matching shop${list.length === 1 ? "" : "s"}`;
  }

  list.forEach((shop) => {
const card = document.createElement("article");
card.className = "shop-card";
card.dataset.shopId = shop.id;

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
    card.addEventListener("click", () => {
  if (!map) return;

  map.flyTo({
    center: [shop.longitude, shop.latitude],
    zoom: 14,
    duration: 1200,
    essential: true
  });
  });
});

  fitMapToShops(list);
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

if (shopSearch) {
  shopSearch.addEventListener("input", (event) => {
    filterShops(event.target.value);
  });
}

renderShops(shops);

// ==========================
// Menu
// ==========================

if (menuToggle && mobileNav) {
  menuToggle.addEventListener("click", () => {
    mobileNav.classList.toggle("open");
  });

  mobileNav.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      mobileNav.classList.remove("open");
    });
  });
}

// ==========================
// Chat UI
// ==========================

const openConcierge = document.getElementById("openConcierge");
const closeConcierge = document.getElementById("closeConcierge");
const chatOverlay = document.getElementById("chatOverlay");

if (openConcierge && closeConcierge && chatOverlay) {
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
}

// ==========================
// Chat Messaging
// ==========================

const chatMessages = document.getElementById("chatMessages");
const chatInput = document.getElementById("chatInput");
const sendMessage = document.getElementById("sendMessage");

function addMessage(text, sender) {
  if (!chatMessages) return;

  const message = document.createElement("div");
  message.className = sender === "user" ? "user-message" : "assistant-message";
  message.textContent = text;

  chatMessages.appendChild(message);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

async function sendChatMessage() {
  if (!chatInput || !chatMessages) return;

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
      body: JSON.stringify({ message })
    });

    const data = await response.json();

    loading.remove();

    if (!response.ok) {
      addMessage(data.error || JSON.stringify(data), "assistant");
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

if (sendMessage) {
  sendMessage.addEventListener("click", sendChatMessage);
}

if (chatInput) {
  chatInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      sendChatMessage();
    }
  });
}
