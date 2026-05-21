const LOGIN_PAGE = "admin.html";

export function checkAuth() {
  const token = sessionStorage.getItem("adminToken");
  if (!token) {
    location.replace(LOGIN_PAGE);
    return false;
  }
  return true;
}

export function logout() {
  sessionStorage.removeItem("adminToken");
  location.replace(LOGIN_PAGE);
}

export function getToken() {
  return sessionStorage.getItem("adminToken");
}
