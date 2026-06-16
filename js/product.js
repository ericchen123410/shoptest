import { formatPrice } from "./utils.js";

const API     = "https://shoptest-chi.vercel.app/api/products";
const wrap    = document.getElementById("productWrap");
const id      = new URLSearchParams(location.search).get("id");

let products = [];
let currentImgIdx = 0;

(async () => {
  try {
    const res = await fetch(API);
    products = await res.json();
  } catch {
    wrap.innerHTML = `<div style="padding:80px 0;text-align:center;color:var(--gray-400)">載入失敗</div>`;
    return;
  }

  const idx = products.findIndex(p => p.id === id);
  if (idx < 0) { wrap.innerHTML = `<div style="padding:80px 0;text-align:center;color:var(--gray-400)">找不到商品</div>`; return; }
  const p = products[idx];

  const imagesArr = Array.isArray(p.images)
    ? p.images : (p.images||"").split(",").map(s=>s.trim()).filter(Boolean);
  if (p.image && !imagesArr.includes(p.image)) imagesArr.unshift(p.image);

  const variants = Array.isArray(p.variants) ? p.variants : (p.variants||"").split(",").map(s=>s.trim()).filter(Boolean);

  wrap.innerHTML = `
    <!-- 麵包屑 -->
    <div style="padding:12px 16px;font-size:13px;color:var(--gray-400);display:flex;gap:6px;align-items:center">
      <a href="index.html" style="color:var(--gray-400);text-decoration:none">首頁</a>
      ${p.mainCategory ? `<span>›</span><span>${p.mainCategory}</span>` : ""}
      ${p.category     ? `<span>›</span><span>${p.category}</span>` : ""}
    </div>

    <!-- 圖片 -->
    <div style="position:relative;background:var(--gray-100)">
      <img id="mainImg" src="${imagesArr[0]||p.image||''}" alt="${p.name}"
        style="width:100%;aspect-ratio:1;object-fit:cover;display:block">
      ${imagesArr.length > 1 ? `
      <button id="prevBtn" onclick="goToImg(currentImgIdx-1)"
        style="position:absolute;left:12px;top:50%;transform:translateY(-50%);width:40px;height:40px;background:rgba(255,255,255,0.9);border:none;border-radius:50%;font-size:22px;cursor:pointer;display:flex;align-items:center;justify-content:center">
        <i class="ti ti-chevron-left"></i>
      </button>
      <button id="nextBtn" onclick="goToImg(currentImgIdx+1)"
        style="position:absolute;right:12px;top:50%;transform:translateY(-50%);width:40px;height:40px;background:rgba(255,255,255,0.9);border:none;border-radius:50%;font-size:22px;cursor:pointer;display:flex;align-items:center;justify-content:center">
        <i class="ti ti-chevron-right"></i>
      </button>
      <div id="dotNav" style="position:absolute;bottom:12px;left:50%;transform:translateX(-50%);display:flex;gap:6px">
        ${imagesArr.map((_,i)=>`<div class="img-dot" style="width:${i===0?'20px':'8px'};height:8px;border-radius:4px;background:${i===0?'var(--black)':'rgba(255,255,255,0.7)'};transition:all 0.2s"></div>`).join("")}
      </div>` : ""}
    </div>

    <!-- 縮圖列 -->
    ${imagesArr.length > 1 ? `
    <div style="display:flex;gap:8px;padding:12px 16px;overflow-x:auto;background:var(--white);border-bottom:1px solid var(--gray-200)">
      ${imagesArr.map((img,i)=>`
        <img src="${img}" data-index="${i}" onclick="goToImg(${i})"
          style="width:64px;height:64px;object-fit:cover;border-radius:var(--radius-sm);border:2px solid ${i===0?'var(--black)':'var(--gray-200)'};cursor:pointer;flex-shrink:0;transition:border-color 0.2s">
      `).join("")}
    </div>` : ""}

    <!-- 商品資訊 -->
    <div style="background:var(--white);padding:16px;margin-top:8px">
      ${p.category ? `<div style="font-size:13px;color:var(--gray-400);margin-bottom:6px">${p.mainCategory||""}${p.mainCategory&&p.category?" · ":""}${p.category||""}</div>` : ""}
      ${p.idnumber ? `<div style="font-size:12px;color:var(--gray-400);margin-bottom:6px">#${p.idnumber}</div>` : ""}
      <div style="font-size:22px;font-weight:600;line-height:1.3;margin-bottom:14px">${p.name}</div>
      <div style="display:flex;align-items:baseline;gap:8px;margin-bottom:20px">
        <span style="font-size:28px;font-weight:700">${formatPrice(p.price)}</span>
        ${p.isSale && p.originalPrice ? `<span style="font-size:16px;color:var(--gray-400);text-decoration:line-through">${formatPrice(p.originalPrice)}</span>` : ""}
      </div>

      ${variants.length ? `
      <div style="margin-bottom:20px">
        <div style="font-size:14px;font-weight:500;margin-bottom:10px">規格選擇</div>
        <div style="display:flex;flex-wrap:wrap;gap:8px" id="variantBtns">
          ${variants.map(v=>`
            <button onclick="selectVariant('${v}')" data-v="${v}"
              style="padding:8px 18px;border-radius:var(--radius);border:1.5px solid var(--gray-200);background:var(--white);font-size:14px;cursor:pointer">
              ${v}
            </button>`).join("")}
        </div>
      </div>` : ""}

      <!-- 數量 -->
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px">
        <span style="font-size:15px;font-weight:500">數量</span>
        <div style="display:flex;align-items:center;border:1.5px solid var(--gray-200);border-radius:var(--radius);overflow:hidden">
          <button onclick="changeQty(-1)" style="width:48px;height:48px;background:var(--gray-50);border:none;font-size:24px;cursor:pointer;display:flex;align-items:center;justify-content:center">−</button>
          <span id="qtyDisplay" style="width:56px;height:48px;display:flex;align-items:center;justify-content:center;font-size:18px;font-weight:600;border-left:1px solid var(--gray-200);border-right:1px solid var(--gray-200)">1</span>
          <button onclick="changeQty(1)"  style="width:48px;height:48px;background:var(--gray-50);border:none;font-size:24px;cursor:pointer;display:flex;align-items:center;justify-content:center">＋</button>
        </div>
      </div>

      <button onclick="addToCart()" class="btn-primary" style="margin-bottom:12px">加入購物車</button>
      <div id="addStatus" style="text-align:center;font-size:14px;color:var(--green);min-height:20px"></div>
    </div>

    ${p.description ? `
    <div style="background:var(--white);padding:16px;margin-top:8px">
      <div style="font-size:15px;font-weight:600;margin-bottom:10px">商品說明</div>
      <div style="font-size:15px;line-height:1.8;color:var(--gray-800);white-space:pre-wrap">${p.description}</div>
    </div>` : ""}

    <!-- 上一件 / 下一件 -->
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:1px;background:var(--gray-200);margin-top:8px">
      ${idx > 0 ? `<a href="product.html?id=${products[idx-1].id}" style="background:var(--white);padding:14px 16px;text-decoration:none;color:var(--black)">
        <div style="font-size:12px;color:var(--gray-400);margin-bottom:4px">← 上一件</div>
        <div style="font-size:13px;font-weight:500;overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical">${products[idx-1].name}</div>
      </a>` : `<div></div>`}
      ${idx < products.length-1 ? `<a href="product.html?id=${products[idx+1].id}" style="background:var(--white);padding:14px 16px;text-decoration:none;color:var(--black);text-align:right">
        <div style="font-size:12px;color:var(--gray-400);margin-bottom:4px">下一件 →</div>
        <div style="font-size:13px;font-weight:500;overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical">${products[idx+1].name}</div>
      </a>` : `<div></div>`}
    </div>
  `;

  // 圖片導覽
  window.currentImgIdx = 0;
  window.goToImg = (idx) => {
    window.currentImgIdx = (idx + imagesArr.length) % imagesArr.length;
    document.getElementById("mainImg").src = imagesArr[window.currentImgIdx];
    document.querySelectorAll(".img-dot").forEach((d,i) => {
      d.style.width = i === window.currentImgIdx ? "20px" : "8px";
      d.style.background = i === window.currentImgIdx ? "var(--black)" : "rgba(255,255,255,0.7)";
    });
    document.querySelectorAll("[data-index]").forEach(img => {
      img.style.borderColor = parseInt(img.dataset.index) === window.currentImgIdx ? "var(--black)" : "var(--gray-200)";
    });
  };

  // 規格
  let selectedVariant = variants.length ? variants[0] : null;
  if (selectedVariant) selectVariant(selectedVariant);
  window.selectVariant = (v) => {
    selectedVariant = v;
    document.querySelectorAll("[data-v]").forEach(btn => {
      btn.style.borderColor = btn.dataset.v === v ? "var(--black)" : "var(--gray-200)";
      btn.style.fontWeight  = btn.dataset.v === v ? "700" : "400";
      btn.style.background  = btn.dataset.v === v ? "var(--black)" : "var(--white)";
      btn.style.color       = btn.dataset.v === v ? "var(--white)" : "var(--black)";
    });
  };

  // 數量
  let qty = 1;
  window.changeQty = (delta) => {
    qty = Math.max(1, qty + delta);
    document.getElementById("qtyDisplay").textContent = qty;
  };

  // 加入購物車
  window.addToCart = () => {
    if (variants.length && !selectedVariant) { alert("請選擇規格"); return; }
    const cart = JSON.parse(localStorage.getItem("cart") || "{}");
    const key  = selectedVariant ? `${p.id}:${selectedVariant}` : p.id;
    cart[key]  = (cart[key] || 0) + qty;
    localStorage.setItem("cart", JSON.stringify(cart));
    const st = document.getElementById("addStatus");
    st.textContent = "✅ 已加入購物車！";
    setTimeout(() => { st.textContent = ""; }, 2000);
    // 更新 badge
    const total = Object.values(cart).reduce((a,b)=>a+b,0);
    const badge = document.getElementById("cartCount");
    if (badge) { badge.textContent = total; badge.style.display = total > 0 ? "flex" : "none"; }
  };
})();
