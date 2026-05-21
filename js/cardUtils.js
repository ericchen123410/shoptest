import { formatPrice } from "./utils.js";

export function renderCard(p) {
  const imagesArr = Array.isArray(p.images) ? p.images : (p.images||"").split(",").map(s=>s.trim()).filter(Boolean);
  const img = p.image || imagesArr[0] || "https://via.placeholder.com/400";

  const badges = [
    p.isNew  ? `<span class="bg-blue-500 text-white text-xs px-1.5 py-0.5 rounded">NEW</span>` : "",
    p.isHot  ? `<span class="bg-orange-400 text-white text-xs px-1.5 py-0.5 rounded">🔥</span>` : "",
    p.isSale ? `<span class="bg-red-500 text-white text-xs px-1.5 py-0.5 rounded">特價</span>` : "",
  ].filter(Boolean).join("");

  return `
    <a href="product.html?id=${p.id}"
       class="block bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md active:shadow-md transition group">
      <div class="relative overflow-hidden">
        <img src="${img}" class="w-full aspect-square object-cover group-hover:scale-105 transition-transform duration-300">
        ${badges ? `<div class="absolute top-2 left-2 flex gap-1 flex-wrap">${badges}</div>` : ""}
      </div>
      <div class="p-2.5 sm:p-3 lg:p-4">
        ${(p.mainCategory || p.category) ? `
        <div class="text-xs text-gray-400 mb-1 truncate">
          ${p.mainCategory || ""}${p.mainCategory && p.category ? " · " : ""}${p.category || ""}
        </div>` : ""}
        <div class="text-xs sm:text-sm font-semibold leading-snug line-clamp-2 text-gray-800">${p.name}</div>
        <div class="mt-1.5 flex items-baseline gap-1.5 flex-wrap">
          <span class="text-red-500 font-bold text-sm sm:text-base">${formatPrice(p.price)}</span>
          ${p.isSale ? `<span class="text-xs line-through text-gray-400">${formatPrice(p.originalPrice)}</span>` : ""}
        </div>
      </div>
    </a>`;
}
