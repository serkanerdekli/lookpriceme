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
  
  // Products / Stock
  getProducts: (storeId: number, search?: string) => api.get(`/api/store/products?storeId=${storeId}${search ? `&search=${encodeURIComponent(search)}` : ''}`),
  getStockMovements: (productId?: number) => api.get(`/api/store/stock-movements${productId ? `?product_id=${productId}` : ''}`),
  
  // Accounts (Cari Hesaplar)
  getAccounts: (search?: string) => api.get(`/api/store/accounts${search ? `?search=${encodeURIComponent(search)}` : ''}`),
  getAccount: (id: number) => api.get(`/api/store/accounts/${id}`),
  createAccount: (data: any) => api.post("/api/store/accounts", data),
  updateAccount: (id: number, data: any) => api.put(`/api/store/accounts/${id}`, data),
  deleteAccount: (id: number) => api.delete(`/api/store/accounts/${id}`),
  addAccountTransaction: (data: any) => api.post("/api/store/account-transactions", data),

  // Quotations (Teklifler)
  getQuotations: (search?: string, status?: string) => {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (status) params.set('status', status);
    const qs = params.toString();
    return api.get(`/api/store/quotations${qs ? `?${qs}` : ''}`);
  },
  getQuotation: (id: number) => api.get(`/api/store/quotations/${id}`),
  createQuotation: (data: any) => api.post("/api/store/quotations", data),
  updateQuotation: (id: number, data: any) => api.put(`/api/store/quotations/${id}`, data),
  deleteQuotation: (id: number) => api.delete(`/api/store/quotations/${id}`),
  convertQuotation: (id: number, data: any) => api.post(`/api/store/quotations/${id}/convert`, data),

  // Cash Registers (Kasa Takibi)
  getCashRegisters: (registerType?: string, search?: string) => {
    const params = new URLSearchParams();
    if (registerType) params.set('register_type', registerType);
    if (search) params.set('search', search);
    const qs = params.toString();
    return api.get(`/api/store/cash-registers${qs ? `?${qs}` : ''}`);
  },
  getCashSummary: () => api.get("/api/store/cash-registers/summary"),

  // Branding & Store Info
  getBranding: (slug: string) => api.get(`/api/store/info?slug=${slug}`),
  
  // Admin & SuperAdmin
  getStores: () => api.get("/api/admin/stores"),
  addStore: (data: any) => api.post("/api/admin/stores", data),
  updateStore: (id: number, data: any) => api.put(`/api/admin/stores/${id}`, data),
  deleteStore: (id: number) => api.delete(`/api/admin/stores/${id}`),
  getLeads: () => api.get("/api/admin/leads"),
  updateLead: (id: number, data: any) => api.put(`/api/admin/leads/${id}`, data),
  
  // Public
  getProductBySlug: (slug: string, barcode: string) => api.get(`/api/public/scan/${slug}/${barcode}`),
};
