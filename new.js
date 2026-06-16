import { formatPrice } from "./utils.js";

export function renderCard(p) {
  const imagesArr = Array.isArray(p.images) ? p.images : (p.images||"").split(",").map(s=>s.trim()).filter(Boolean);
  const img = p.image || imagesArr[0] || "";

  const badges = [
    p.isNew  ? `<span class="badge badge-new">NEW</span>` : "",
    p.isHot  ? `<span class="badge badge-hot">HOT</span>` : "",
    p.isSale ? `<span class="badge badge-sale">特價</span>` : "",
  ].filter(Boolean).join(" ");

  const imgEl = img
    ? `<img src="${img}" class="product-card-img" loading="lazy" alt="${p.name}">`
    : `<div class="product-card-img-placeholder">🛍</div>`;

  return `
    <a href="product.html?id=${p.id}" class="product-card">
      <div style="position:relative">
        ${imgEl}
        ${badges ? `<div style="position:absolute;top:8px;left:8px;display:flex;gap:4px">${badges}</div>` : ""}
      </div>
      <div class="product-card-body">
        ${(p.mainCategory||p.category) ? `<div class="product-card-cat">${p.mainCategory||""}${p.mainCategory&&p.category?" · ":""}${p.category||""}</div>` : ""}
        <div class="product-card-name">${p.name}</div>
        <div>
          <span class="product-card-price">${formatPrice(p.price)}</span>
          ${p.isSale && p.originalPrice ? `<span class="product-card-orig">${formatPrice(p.originalPrice)}</span>` : ""}
        </div>
      </div>
    </a>`;
}
