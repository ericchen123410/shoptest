export const formatPrice = (n) =>
  new Intl.NumberFormat("zh-TW", {
    style: "currency",
    currency: "TWD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Math.floor(Number(n || 0)));

export const getCart = () =>
  JSON.parse(localStorage.getItem("cart") || "{}");

export const saveCart = (cart) =>
  localStorage.setItem("cart", JSON.stringify(cart));

export const getTotalQty = () => {
  const cart = getCart();
  return Object.values(cart).reduce((a, b) => a + b, 0);
};
