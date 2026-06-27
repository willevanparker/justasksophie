// ==========================
// Supabase
// ==========================

const SUPABASE_URL = "https://bkaqqauzjznummgagvyq.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_OoIiQjyfri5u5JoTDdREaw_5IdEoQeG";

const supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);

let shops = [];
let shopMarkers = [];

// ==========================
// Elements
// ==========================

const menuToggle = document.getElementById("menuToggle");
const mobileNav = document.getElementById("mobileNav");
const shopSearch = document.getElementById("shopSearch");
const shopList = document.getElementById("shopList");
const resultsMeta = document.getElementById("resultsMeta");

// ==========================
// Mapbox
// ==========================

let map = null;
let mapLoaded = false;

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
    mapLoaded = true;
    addShopMarkers(shops);
  });
}

function addShopMarkers(list) {
  if (!map || !mapLoaded) return;

  shopMarkers.forEach((marker) => marker.remove());
  shopMarkers = [];

  list.forEach((shop) => {
    const popup = new mapboxgl.Popup({ offset: 24 }).setHTML(`
      <strong>${shop.name}</strong><br>
      ${shop.neighborhood || ""}
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

    shopMarkers.push(marker);
  });
}

// ==========================
// Supabase Data
// ==========================

async function loadShops() {
  const { data, error } = await supabaseClient
    .from("shops")
    .select("*")
    .eq("is_published", true)
    .order("name", { ascending: true });

  if (error) {
    console.error("Error loading shops from Supabase:", error);

    if (shopList) {
      shopList.innerHTML = `
        <article class="shop-card">
          <h3>Unable to load shops.</h3>
          <p class="shop-description">
            Please check your Supabase connection and public read policy.
          </p>
        </article>
      `;
    }

    return;
  }

  shops = data.map((shop) => ({
    id: shop.id,
    name: shop.name,
    city: shop.city,
    state: shop.state,
    zip: shop.zip,
    neighborhood: shop.neighborhood,
    latitude: Number(shop.latitude),
    longitude: Number(shop.longitude),
    description: shop.description,
    tags: shop.tags || [],
    website: shop.website,
    hero_image: shop.hero_image
  }));

  renderShops(shops);
  addShopMarkers(shops);
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
  const location = shop.neighborhood
    ? `${shop.neighborhood} · ${shop.city}, ${shop.state} ${shop.zip}`
    : `${shop.city}, ${shop.state} ${shop.zip}`;

  const card = document.createElement("article");
  card.className = "shop-card";
  card.dataset.shopId = shop.id;

  card.innerHTML = `
    <h3>${shop.name}</h3>
    <p class="shop-location">${location}</p>
    <p class="shop-description">${shop.description}</p>
    <div class="shop-tags">
      ${shop.tags.map((tag) => `<span>${tag}</span>`).join("")}
    </div>
    <a class="shop-link" href="${shop.website}" target="_blank" rel="noopener">
      Visit shop →
    </a>
  `;

    card.addEventListener("click", () => {
      document.querySelectorAll(".shop-card").forEach((card) => {
        card.classList.remove("active");
      });

      card.classList.add("active");

      if (!map) return;

      map.flyTo({
        center: [shop.longitude, shop.latitude],
        zoom: 14,
        duration: 1200,
        essential: true
      });
    });

    shopList.appendChild(card);
  });

  fitMapToShops(list);
}

function filterShops(query) {
  const cleanQuery = query.trim().toLowerCase();

  if (!cleanQuery) {
    renderShops(shops);
    addShopMarkers(shops);
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
  addShopMarkers(filtered);
}

if (shopSearch) {
  shopSearch.addEventListener("input", (event) => {
    filterShops(event.target.value);
  });
}

loadShops();

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

const menuToggle = document.getElementById("menuToggle");
const mobileNav = document.getElementById("mobileNav");

if (menuToggle && mobileNav) {
  menuToggle.addEventListener("click", () => {
    mobileNav.classList.toggle("open");
    menuToggle.classList.toggle("open");
  });
}
