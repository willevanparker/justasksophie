const shops = [
  {
    name: "Murphy's Wine Shop",
    city: "Atlanta",
    state: "GA",
    zip: "30306",
    neighborhood: "Virginia Highland",
    description: "Claude responded: Where rare, esoteric, and eco-conscious wines meet expert guidance, tastings, and winemaker dinners for novices and connoisseurs alike.",
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
    website: "#"
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
