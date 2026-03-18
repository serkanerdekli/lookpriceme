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
  getProducts: () => api.get("/api/products"),
  addProduct: (data: any) => api.post("/api/products", data),
  updateProduct: (id: number, data: any) => api.put(`/api/products/${id}`, data),
  deleteProduct: (id: number) => api.delete(`/api/products/${id}`),
  deleteAllProducts: () => api.delete("/api/products"),
  importProducts: (formData: FormData) => api.upload("/api/import", formData),
  
  getAnalytics: () => api.get("/api/analytics"),
  getBranding: () => api.get("/api/branding"),
  updateBranding: (data: any) => api.put("/api/branding", data),
  
  getQuotations: (search = "", status = "all") => api.get(`/api/quotations?search=${search}&status=${status}`),
  addQuotation: (data: any) => api.post("/api/quotations", data),
  approveQuotation: (id: number) => api.post(`/api/quotations/${id}/approve`, {}),
  deleteQuotation: (id: number) => api.delete(`/api/quotations/${id}`),
  updateQuotation: (id: number, data: any) => api.put(`/api/quotations/${id}`, data),

  getCompanies: (includeZero = false) => api.get(`/api/companies?includeZero=${includeZero}`),
  addCompany: (data: any) => api.post("/api/companies", data),
  updateCompany: (id: number, data: any) => api.put(`/api/companies/${id}`, data),

  getSales: (status = "all", start = "", end = "") => api.get(`/api/sales?status=${status}&start=${start}&end=${end}`),
  
  getUsers: () => api.get("/api/users"),
  addUser: (data: any) => api.post("/api/users", data),
  deleteUser: (id: number) => api.delete(`/api/users/${id}`),

  getLeads: () => api.get("/api/leads"),
  updateLead: (id: number, data: any) => api.put(`/api/leads/${id}`, data),
  getStores: () => api.get("/api/stores"),
  addStore: (data: any) => api.post("/api/stores", data),
  updateStore: (id: number, data: any) => api.put(`/api/stores/${id}`, data),
  deleteStore: (id: number, password: any) => api.post(`/api/stores/${id}/delete`, { password }),

  uploadFile: (formData: FormData) => api.upload("/api/upload", formData),
  
  login: (data: any) => api.post("/api/login", data),
  register: (data: any) => api.post("/api/register", data),
  forgotPassword: (email: string) => api.post("/api/forgot-password", { email }),
  resetPassword: (token: string, password: any) => api.post(`/api/reset-password/${token}`, { password }),
  
  getProductBySlug: (slug: string, barcode: string) => api.get(`/api/scan/${slug}/${barcode}`),
};
