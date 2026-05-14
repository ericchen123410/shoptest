import { formatPrice } from "./utils.js";

const API_URL = "https://shoptest-project-azure.vercel.app/api/products";
const el = document.getElementById("list");

async function init() {
  el.innerHTML = "Loading...";

  const res = await fetch(API_URL);
  let data = await res.json();

  data.sort((a, b) =>
    new Date(b.update || b.createdTime) -
    new Date(a.update || a.createdTime)
  );

  render(data);
}

function render(data) {
  el.innerHTML = data.map(p => {
    const img = p.image || p.images?.[0] || "https://via.placeholder.com/400";

    return `
      <a href="product.html?id=${p.id}" class="block border p-2 hover:shadow">
        <img src="${img}" class="w-full aspect-square object-cover">

        <div class="mt-2 font-bold">${p.name}</div>

        ${p.isSale
          ? `<div class="text-red-500">
               ${formatPrice(p.price)}
               <span class="line-through text-gray-400 text-sm">${formatPrice(p.originalPrice)}</span>
             </div>`
          : `<div class="text-red-500">${formatPrice(p.price)}</div>`
        }
      </a>
    `;
  }).join("");
}

init();
