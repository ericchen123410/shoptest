const el   = document.getElementById("cartCount");
const cart = JSON.parse(localStorage.getItem("cart") || "{}");
const total = Object.values(cart).reduce((a, b) => a + b, 0);
if (el) {
  el.textContent = total;
  el.style.display = total > 0 ? "flex" : "none";
}
