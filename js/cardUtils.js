import { formatPrice } from "./utils.js";

export function renderCard(p) {
  const img = p.image || p.images?.[0] || "https://via.placeholder.com/400";

  const badges = [
    p.isNew  ? `<span class="bg-blue-500 text-white text-xs px-1.5 py-0.5 rounded">NEW</span>` : "",
    p.isHot  ? `<span class="bg-orange-400 text-white text-xs px-1.5 py-0.5 rounded">🔥</span>` : "",
    p.isSale ? `<span class="bg-red-500 text-white text-xs px-1.5 py-0.5 rounded">特價</span>` : "",
  ].filter(Boolean).join("");

  return `
    <a href="product.html?id=${p.id}"
       class="block bg-white rounded-xl overflow-hidden shadow-sm active:shadow-md transition">
      <div class="relative">
        <img src="${img}" class="w-full aspect-square object-cover">
        ${badges ? `<div class="absolute top-2 left-2 flex gap-1">${badges}</div>` : ""}
      </div>
      <div class="p-3">
        ${p.category ? `<div class="text-xs text-gray-400 mb-1">${p.category}</div>` : ""}
        <div class="text-sm font-semibold leading-snug line-clamp-2 text-gray-800">${p.name}</div>
        <div class="mt-1.5 flex items-baseline gap-1.5">
          <span class="text-red-500 font-bold">${formatPrice(p.price)}</span>
          ${p.isSale ? `<span class="text-xs line-through text-gray-400">${formatPrice(p.originalPrice)}</span>` : ""}
        </div>
      </div>
    </a>`;
}
