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
  
  // Eğer sunucudan hata mesajı gelmişse veya HTTP durumu sorunluysa bunu bir Javascript Hatasına dönüştürüyoruz
  if (!res.ok || data.error) {
    throw new Error(data.error || "Sunucuyla iletişimde bir sorun oluştu.");
  }
  return data;
}

// --- API Helper ---
export const api = {
  get: (url: string) => fetchWrapper(url),
  post: (url: string, body: any) => fetchWrapper(url, { method: "POST", body: JSON.stringify(body) }),
  put: (url: string, body: any) => fetchWrapper(url, { method: "PUT", body: JSON.stringify(body) }),
  delete: (url: string) => fetchWrapper(url, { method: "DELETE" }),
  upload: (url: string, formData: FormData) => {
    // FormData gönderirken fetch'te Content-Type'ı silmeliyiz ki boundary leri tarayıcı otomatik ayarlasın
    const token = getToken();
    const headers = new Headers();
    if (token) headers.set("Authorization", `Bearer ${token}`);
    
    return fetch(url, {
      method: "POST",
      headers,
      body: formData,
    }).then(async res => {
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || "Yükleme hatası");
      return data;
    });
  },

  // Store Methods
  getProducts: () => api.get("/api/store/products"),
  addProduct: (data: any) => api.post("/api/store/products", data),
  updateProduct: (id: number, data: any) => api.put(`/api/store/products/${id}`, data),
  deleteProduct: (id: number) => api.delete(`/api/store/products/${id}`),
  deleteAllProducts: () => api.delete("/api/store/products/all"),
  importProducts: (formData: FormData) => api.upload("/api/store/import", formData),
  
  getAnalytics: () => api.get("/api/store/analytics"),
  getBranding: () => api.get("/api/store/info"),
  updateBranding: (data: any) => api.post("/api/store/branding", data),
  
  getQuotations: (search = "", status = "all") => api.get(`/api/store/quotations?search=${search}&status=${status}`),
  addQuotation: (data: any) => api.post("/api/store/quotations", data),
  approveQuotation: (id: number) => api.post(`/api/store/quotations/${id}/approve`, {}),
  deleteQuotation: (id: number) => api.delete(`/api/store/quotations/${id}`),
  updateQuotation: (id: number, data: any) => api.put(`/api/store/quotations/${id}`, data),

  getCompanies: (includeZero = false) => api.get(`/api/store/companies?includeZero=${includeZero}`),
  addCompany: (data: any) => api.post("/api/store/companies", data),
  updateCompany: (id: number, data: any) => api.put(`/api/store/companies/${id}`, data),

  getSales: (status = "all", start = "", end = "") => api.get(`/api/store/sales?status=${status}&startDate=${start}&endDate=${end}`),
  
  getUsers: () => api.get("/api/store/users"),
  addUser: (data: any) => api.post("/api/store/users", data),
  deleteUser: (id: number) => api.delete(`/api/store/users/${id}`),

  getLeads: () => api.get("/api/admin/leads"),
  updateLead: (id: number, data: any) => api.put(`/api/admin/leads/${id}`, data),
  getStores: () => api.get("/api/admin/stores"),
  addStore: (data: any) => api.post("/api/admin/stores", data),
  updateStore: (id: number, data: any) => api.put(`/api/admin/stores/${id}`, data),
  deleteStore: (id: number, password: any) => api.post(`/api/admin/stores/${id}/delete`, { password }),

  uploadFile: (formData: FormData) => api.upload("/api/store/import", formData),
  
  login: (data: any) => api.post("/api/auth/login", data),
  register: (data: any) => api.post("/api/public/register-request", data),
  forgotPassword: (email: string) => api.post("/api/auth/forgot-password", { email }),
  resetPassword: (token: string, password: any) => api.post(`/api/auth/reset-password`, { token, newPassword: password }),
  
  getProductBySlug: (slug: string, barcode: string) => api.get(`/api/public/scan/${slug}/${barcode}`),
  
  // Payment
  initializePayment: (planName: string) => api.post("/api/payment/checkout-form/initialize", { planName }),

  // Sales Management
  completeSale: (id: number, data: any) => api.post(`/api/store/sales/${id}/complete`, data),
  cancelSale: (id: number) => api.post(`/api/store/sales/${id}/cancel`, {}),
};
