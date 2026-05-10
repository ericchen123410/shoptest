```js
import { formatPrice } from "./utils.js";

/*
  ⭐ 改成你的 vercel 網址
*/
const API_URL = "https://你的網址.vercel.app/api/products";

const el = document.getElementById("list");

async function init() {

  el.innerHTML = `
    <div class="col-span-4 text-center py-10">
      Loading...
    </div>
  `;

  try {

    const res = await fetch(API_URL);

    if (!res.ok) {
      throw new Error("API 載入失敗");
    }

    const data = await res.json();

    console.log("首頁商品:", data);

    render(data);

  } catch (err) {

    console.error(err);

    el.innerHTML = `
      <div class="col-span-4 text-red-500 text-center py-10">
        商品載入失敗
      </div>
    `;
  }
}

function render(data) {

  if (!Array.isArray(data) || !data.length) {

    el.innerHTML = `
      <div class="col-span-4 text-center py-10">
        沒有商品
      </div>
    `;

    return;
  }

  el.innerHTML = data.map(p => {

    const img =
      p.image ||
      p.images?.[0] ||
      "https://via.placeholder.com/400";

    return `
      <a
        href="product.html?id=${p.id}"
        class="block bg-white border rounded overflow-hidden hover:shadow"
      >

        <img
          src="${img}"
          class="w-full aspect-square object-cover"
        >

        <div class="p-3">

          <div class="font-bold line-clamp-2">
            ${p.name}
          </div>

          ${
            p.isSale
              ? `
                <div class="mt-2">

                  <span class="text-red-500 font-bold">
                    ${formatPrice(p.price)}
                  </span>

                  <span class="line-through text-gray-400 text-sm ml-1">
                    ${formatPrice(p.originalPrice)}
                  </span>

                </div>
              `
              : `
                <div class="mt-2 text-red-500 font-bold">
                  ${formatPrice(p.price)}
                </div>
              `
          }

        </div>

      </a>
    `;
  }).join("");
}

init();
```
  }

  el.innerHTML = data.map(p => {
    const img =
      p.image ||
      p.images?.[0] ||
      "https://via.placeholder.com/400";

    return `
      <a
        href="product.html?id=${p.id}"
        class="block border p-2 hover:shadow bg-white"
      >
        <img
          src="${img}"
          class="w-full aspect-square object-cover"
        >

        <div class="mt-2 font-bold">
          ${p.name}
        </div>

        ${
          p.isSale
            ? `
              <div class="text-red-500">
                ${formatPrice(p.price)}

                <span class="line-through text-gray-400 text-sm">
                  ${formatPrice(p.originalPrice)}
                </span>
              </div>
            `
            : `
              <div class="text-red-500">
                ${formatPrice(p.price)}
              </div>
            `
        }
      </a>
    `;
  }).join("");
}

init();
```
      "https://via.placeholder.com/400";

    return `
      <a href="product.html?id=${p.id}" class="block border p-2 hover:shadow bg-white">
        <img src="${img}" class="w-full aspect-square object-cover">

        <div class="mt-2 font-bold">${p.name}</div>

        ${
          p.isSale
            ? `
              <div class="text-red-500">
                ${formatPrice(p.price)}
                <span class="line-through text-gray-400 text-sm">
                  ${formatPrice(p.originalPrice)}
                </span>
              </div>
            `
            : `
              <div class="text-red-500">
                ${formatPrice(p.price)}
              </div>
            `
        }
      </a>
    `;
  }).join("");
}

init();      </a>
    `;
  }).join("");
}

init();
