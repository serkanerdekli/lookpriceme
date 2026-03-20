const getToken = () => localStorage.getItem("token");

async function fetchWrapper(url: string, options: RequestInit = {}) {
  const token = getToken();
  const headers = new Headers(options.headers || {});
  if (token) headers.set("Authorization", `Bearer ${token}`);
  if (!headers.has("Content-Type") && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  const res = await fetch(url, { ...options, headers });
  const data = await res.json();
  
  if (!res.ok || data.error) {
    throw new Error(data.error || "Sunucuyla iletişimde bir sorun oluştu.");
  }
  return data;
}

export const api = {
  get: (url: string) => fetchWrapper(url),
  post: (url: string, body: any) => fetchWrapper(url, { method: "POST", body: body instanceof FormData ? body : JSON.stringify(body) }),
  put: (url: string, body: any) => fetchWrapper(url, { method: "PUT", body: JSON.stringify(body) }),
  delete: (url: string) => fetchWrapper(url, { method: "DELETE" }),

  // Auth
  login: (data: any) => api.post("/api/auth/login", data),
  
  // Products
  getProducts: (storeId: number) => api.get(`/api/store/products?storeId=${storeId}`),
  
  // Branding & Store Info
  getBranding: (slug: string) => api.get(`/api/store/info?slug=${slug}`),
  
  // Admin (Keep for now if still needed for store management)
  getStores: () => api.get("/api/admin/stores"),
  addStore: (data: any) => api.post("/api/admin/stores", data),
  
  // Public
  getProductBySlug: (slug: string, barcode: string) => api.get(`/api/public/scan/${slug}/${barcode}`),
};
