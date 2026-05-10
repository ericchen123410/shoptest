import { formatPrice } from "./utils.js";

const API_URL = "/api/products";
const el = document.getElementById("list");

async function init() {
  el.innerHTML = "Loading...";

  try {
    const res = await fetch(API_URL);
    let data = await res.json();

    data = data.filter(p => p.isHot);

    data.sort(
      (a, b) =>
        new Date(b.update || b.createdTime) -
        new Date(a.update || a.createdTime)
    );

    render(data);

  } catch (err) {
    console.error(err);
    el.innerHTML = "<div class='text-red-500'>載入失敗</div>";
  }
}

function render(data) {
  if (!data.length) {
    el.innerHTML = "<div>目前沒有特價商品</div>";
    return;
  }

  el.innerHTML = data.map(p => {
    const img =
