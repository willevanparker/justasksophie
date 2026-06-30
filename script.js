// ==========================
// Menu
// ==========================

const menuToggle = document.getElementById("menuToggle");
const mobileNav = document.getElementById("mobileNav");

if (menuToggle && mobileNav) {
  menuToggle.addEventListener("click", () => {
    mobileNav.classList.toggle("open");
    menuToggle.classList.toggle("open");
  });

  mobileNav.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      mobileNav.classList.remove("open");
      menuToggle.classList.remove("open");
    });
  });
}

// ==========================
// Page Elements
// ==========================

const shopSearch = document.getElementById("shopSearch");
const shopSearchDesktop = document.getElementById("shopSearchDesktop");
const shopList = document.getElementById("shopList");
const resultsMeta = document.getElementById("resultsMeta");

let shops = [];
let shopMarkers = [];
let map = null;
let mapLoaded = false;
let activeShopId = null;

const MAP_CARD_LIMIT = 4;

// ==========================
// Supabase
// ==========================

const SUPABASE_URL = "https://bkaqqauzjznummgagvyq.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_OoIiQjyfri5u5JoTDdREaw_5IdEoQeG";

const supabaseClient =
  window.supabase && shopList
    ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
    : null;

// ==========================
// Mapbox
// ==========================

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
    renderAllMarkers();
    renderVisibleShopsFromMap();
  });

  map.on("moveend", () => {
    const hasSearch = getSearchQuery();

    if (hasSearch) return;

    renderVisibleShopsFromMap();
  });
}

// ==========================
// Map Helpers
// ==========================

function getValidShops(list) {
  return list.filter(
    (shop) =>
      Number.isFinite(shop.longitude) &&
      Number.isFinite(shop.latitude)
  );
}

function getVisibleShopsInMap() {
  if (!map || !mapLoaded) return shops;

  const bounds = map.getBounds();

  return getValidShops(shops).filter((shop) =>
    bounds.contains([shop.longitude, shop.latitude])
  );
}

function renderVisibleShopsFromMap() {
  const visibleShops = getVisibleShopsInMap();

  renderShops(visibleShops, {
    mode: "map"
  });
}

function fitMapToShops(list) {
  if (!map || !mapLoaded || !list.length) return;

  const validShops = getValidShops(list);

  if (!validShops.length) return;

  if (validShops.length === 1) {
    map.flyTo({
      center: [validShops[0].longitude, validShops[0].latitude],
      zoom: 13.5,
      duration: 900,
      essential: true
    });

    return;
  }

  const bounds = new mapboxgl.LngLatBounds();

  validShops.forEach((shop) => {
    bounds.extend([shop.longitude, shop.latitude]);
  });

  map.fitBounds(bounds, {
    padding: 80,
    maxZoom: 13,
    duration: 900
  });
}

function renderAllMarkers() {
  if (!map || !mapLoaded) return;

  shopMarkers.forEach((marker) => marker.remove());
  shopMarkers = [];

  getValidShops(shops).forEach((shop) => {
    const popup = new mapboxgl.Popup({ offset: 24 }).setHTML(`
      <strong>${shop.name}</strong><br>
      ${shop.neighborhood || `${shop.city}, ${shop.state}`}
    `);

    const marker = new mapboxgl.Marker()
      .setLngLat([shop.longitude, shop.latitude])
      .setPopup(popup)
      .addTo(map);

    marker.getElement().addEventListener("click", () => {
      setActiveShop(shop.id);

      const shopIsVisibleInCards = document.querySelector(
        `.shop-card[data-shop-id="${shop.id}"]`
      );

      if (!shopIsVisibleInCards) {
        renderShops([shop], {
          mode: "selected"
        });
      }

      scrollToActiveCard();
    });

    shopMarkers.push(marker);
  });
}

function setActiveShop(shopId) {
  activeShopId = shopId;

  document.querySelectorAll(".shop-card").forEach((card) => {
    card.classList.toggle("active", card.dataset.shopId === String(shopId));
  });
}

function scrollToActiveCard() {
  const activeCard = document.querySelector(
    `[data-shop-id="${activeShopId}"]`
  );

  if (!activeCard) return;

  activeCard.scrollIntoView({
    behavior: "smooth",
    block: "center"
  });
}

// ==========================
// Supabase Data
// ==========================

async function loadShops() {
  if (!supabaseClient || !shopList) return;

  const { data, error } = await supabaseClient
    .from("shops")
    .select("*")
    .eq("is_published", true)
    .order("name", { ascending: true });

  if (error) {
    console.error("Error loading shops from Supabase:", error);

    shopList.innerHTML = `
      <article class="shop-card">
        <h3>Unable to load shops.</h3>
        <p class="shop-description">
          Please check your Supabase connection and public read policy.
        </p>
      </article>
    `;

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

  renderAllMarkers();

  if (mapLoaded) {
    renderVisibleShopsFromMap();
  } else {
    renderShops(shops, {
      mode: "all"
    });
  }
}

// ==========================
// Directory
// ==========================

function renderShops(list, options = {}) {
  if (!shopList) return;

  const { mode = "map" } = options;
  const shouldLimitCards = mode === "map" && list.length > MAP_CARD_LIMIT;
  const visibleList = shouldLimitCards ? list.slice(0, MAP_CARD_LIMIT) : list;

  shopList.innerHTML = "";

  if (!list.length) {
    shopList.innerHTML = `
      <article class="shop-card">
        <h3>No shops in this map area.</h3>
        <p class="shop-description">
          Move the map, zoom out, or search by city, state, ZIP, or shop name.
        </p>
      </article>
    `;

    if (resultsMeta) {
      resultsMeta.textContent = "No shops in this map area";
    }

    return;
  }

  if (resultsMeta) {
    if (mode === "search") {
      resultsMeta.textContent = `${list.length} matching shop${
        list.length === 1 ? "" : "s"
      }`;
    } else if (mode === "selected") {
      resultsMeta.textContent = "Selected shop";
    } else {
      resultsMeta.textContent = `${visibleList.length} of ${list.length} shop${
        list.length === 1 ? "" : "s"
      } in this map area`;
    }
  }

  visibleList.forEach((shop) => {
    const location = shop.neighborhood
      ? `${shop.neighborhood} · ${shop.city}, ${shop.state} ${shop.zip}`
      : `${shop.city}, ${shop.state} ${shop.zip}`;

    const card = document.createElement("article");
    card.className = "shop-card";
    card.dataset.shopId = shop.id;

    if (String(shop.id) === String(activeShopId)) {
      card.classList.add("active");
    }

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
      setActiveShop(shop.id);

      if (!map) return;

      map.flyTo({
        center: [shop.longitude, shop.latitude],
        zoom: 14,
        duration: 1200,
        essential: true
      });
    });

    const shopLink = card.querySelector(".shop-link");

    if (shopLink) {
      shopLink.addEventListener("click", (event) => {
        event.stopPropagation();
      });
    }

    shopList.appendChild(card);
  });

  if (shouldLimitCards) {
    const note = document.createElement("article");
    note.className = "shop-card shop-card-note";
    note.innerHTML = `
      <h3>${list.length - MAP_CARD_LIMIT} more nearby</h3>
      <p class="shop-description">
        Move the map, zoom in, or search by city, ZIP, state, or shop name to narrow the list.
      </p>
    `;
    shopList.appendChild(note);
  }
}

const stateNames = {
  AL: "Alabama", AK: "Alaska", AZ: "Arizona", AR: "Arkansas",
  CA: "California", CO: "Colorado", CT: "Connecticut",
  DE: "Delaware", FL: "Florida", GA: "Georgia",
  HI: "Hawaii", ID: "Idaho", IL: "Illinois", IN: "Indiana",
  IA: "Iowa", KS: "Kansas", KY: "Kentucky", LA: "Louisiana",
  ME: "Maine", MD: "Maryland", MA: "Massachusetts",
  MI: "Michigan", MN: "Minnesota", MS: "Mississippi",
  MO: "Missouri", MT: "Montana", NE: "Nebraska",
  NV: "Nevada", NH: "New Hampshire", NJ: "New Jersey",
  NM: "New Mexico", NY: "New York", NC: "North Carolina",
  ND: "North Dakota", OH: "Ohio", OK: "Oklahoma",
  OR: "Oregon", PA: "Pennsylvania", RI: "Rhode Island",
  SC: "South Carolina", SD: "South Dakota", TN: "Tennessee",
  TX: "Texas", UT: "Utah", VT: "Vermont", VA: "Virginia",
  WA: "Washington", WV: "West Virginia", WI: "Wisconsin",
  WY: "Wyoming"
};

function filterShops(query) {
  const cleanQuery = query.trim().toLowerCase();

  activeShopId = null;

  if (!cleanQuery) {
    renderVisibleShopsFromMap();
    return;
  }

  const filtered = shops.filter((shop) => {
    const stateCode = (shop.state || "").toUpperCase();
    const stateName = stateNames[stateCode] || "";

    const searchableText = [
      shop.name,
      shop.city,
      shop.state,
      stateName,
      shop.zip
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return searchableText.includes(cleanQuery);
  });

  renderShops(filtered, {
    mode: "search"
  });

  fitMapToShops(filtered);
}

function getSearchQuery() {
  return [shopSearch, shopSearchDesktop]
    .map((input) => (input ? input.value.trim() : ""))
    .find(Boolean) || "";
}

function syncSearchInputs(value, sourceInput) {
  [shopSearch, shopSearchDesktop].forEach((input) => {
    if (input && input !== sourceInput) {
      input.value = value;
    }
  });
}

function handleSearchInput(event) {
  const value = event.target.value;

  syncSearchInputs(value, event.target);
  filterShops(value);
}

[shopSearch, shopSearchDesktop].forEach((input) => {
  if (input) {
    input.addEventListener("input", handleSearchInput);
  }
});

window.filterShops = (query) => {
  syncSearchInputs(query, null);
  filterShops(query);
};

if (shopSearch && shopSearch.value) {
  syncSearchInputs(shopSearch.value, shopSearch);
}

loadShops();

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
const SOPHIE_HISTORY_KEY = "sophieConversationHistory";
const SOPHIE_HISTORY_LIMIT = 12;

let conversationHistory = loadConversationHistory();

function loadConversationHistory() {
  try {
    const storedHistory = JSON.parse(
      window.localStorage.getItem(SOPHIE_HISTORY_KEY) || "[]"
    );

    if (!Array.isArray(storedHistory)) return [];

    return storedHistory
      .filter(
        (message) =>
          ["user", "assistant"].includes(message.role) &&
          typeof message.content === "string"
      )
      .slice(-SOPHIE_HISTORY_LIMIT);
  } catch (error) {
    return [];
  }
}

function saveConversationHistory() {
  try {
    window.localStorage.setItem(
      SOPHIE_HISTORY_KEY,
      JSON.stringify(conversationHistory.slice(-SOPHIE_HISTORY_LIMIT))
    );
  } catch (error) {
    // Some browsers restrict localStorage in private or embedded contexts.
  }
}

function rememberMessage(role, content) {
  conversationHistory.push({ role, content });
  conversationHistory = conversationHistory.slice(-SOPHIE_HISTORY_LIMIT);
  saveConversationHistory();
}

function addMessage(text, sender) {
  if (!chatMessages) return;

  const message = document.createElement("div");
  message.className = sender === "user" ? "user-message" : "assistant-message";
  message.textContent = text;

  chatMessages.appendChild(message);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function restoreConversationMessages() {
  conversationHistory.forEach((message) => {
    addMessage(message.content, message.role);
  });
}

async function sendChatMessage() {
  if (!chatInput || !chatMessages) return;

  const message = chatInput.value.trim();

  if (!message) return;

  addMessage(message, "user");
  rememberMessage("user", message);
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
        message,
        messages: conversationHistory
      })
    });

    const data = await response.json();

    loading.remove();

    if (!response.ok) {
      addMessage(data.error || JSON.stringify(data), "assistant");
      return;
    }

    addMessage(data.reply, "assistant");
    rememberMessage("assistant", data.reply);
  } catch (error) {
    loading.remove();

    addMessage(
      "Sorry, I couldn't connect right now. Please try again.",
      "assistant"
    );
  }
}

restoreConversationMessages();

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
