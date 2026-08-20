const BASE_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ?? "http://localhost:5000/api/louder";

// Base URL for serving static files (images)
export const STATIC_URL =
  process.env.NEXT_PUBLIC_STATIC_URL ?? "http://localhost:5000";

export const getImageUrl = (path?: string | null): string => {
  if (!path) return "";
  if (path.startsWith("http")) return path;
  if (path.startsWith("data:")) return path; // base64 preview
  return `${STATIC_URL}${path}`;
};

const parseJsonSafe = async (response: Response) => {
  if (response.status === 204) return { success: true };
  const text = await response.text();
  if (!text || text.trim() === "") return { success: true };
  const contentType = response.headers.get("content-type") ?? "";
  if (
    contentType.includes("application/json") ||
    text.trim().startsWith("{") ||
    text.trim().startsWith("[")
  ) {
    try {
      return JSON.parse(text);
    } catch {
      return { message: "Invalid JSON response", raw: text };
    }
  }
  return { message: "Non-JSON response", raw: text };
};

export const apiFetch = async (endpoint: string, options: RequestInit = {}) => {
  const url = endpoint.startsWith("http") ? endpoint : `${BASE_URL}${endpoint}`;

  try {
    let token =
      typeof window !== "undefined" ? localStorage.getItem("token") : null;

    if (!token && typeof window !== "undefined") {
      const savedUser = localStorage.getItem("user");
      if (savedUser) token = JSON.parse(savedUser)?.token ?? null;
    }

    const isAuthRoute =
      endpoint.includes("/auth/login") || endpoint.includes("/auth/register");

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(options.headers as Record<string, string>),
    };

    if (token && !isAuthRoute) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const res = await fetch(url, { ...options, headers, credentials: "include" });
    const data = await parseJsonSafe(res);

    if (res.status === 401 && typeof window !== "undefined") {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }

    return { ok: res.ok, status: res.status, data };
  } catch (error) {
    console.error("API ERROR:", error);
    return { ok: false, status: 500, data: { message: "Internal client error" } };
  }
};

// multipart/form-data upload (for endpoints that use multer)
export const apiUpload = async (endpoint: string, formData: FormData, method: "POST" | "PUT" = "POST") => {
  const url = endpoint.startsWith("http") ? endpoint : `${BASE_URL}${endpoint}`;
  try {
    let token =
      typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token && typeof window !== "undefined") {
      const savedUser = localStorage.getItem("user");
      if (savedUser) token = JSON.parse(savedUser)?.token ?? null;
    }
    const headers: Record<string, string> = {};
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const res = await fetch(url, { method, body: formData, headers, credentials: "include" });
    const data = await parseJsonSafe(res);

    if (res.status === 401 && typeof window !== "undefined") {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
    return { ok: res.ok, status: res.status, data };
  } catch (error) {
    console.error("API UPLOAD ERROR:", error);
    return { ok: false, status: 500, data: { message: "Upload failed" } };
  }
};

// ─── Auth ────────────────────────────────────────────────────────────────────
export const authApi = {
  login: (email: string, password: string) =>
    apiFetch("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),
  register: (body: Record<string, unknown>) =>
    apiFetch("/auth/register", { method: "POST", body: JSON.stringify(body) }),
};

// ─── Users ───────────────────────────────────────────────────────────────────
export const userApi = {
  getAll: () => apiFetch("/users"),
  getById: (id: number) => apiFetch(`/users/${id}`),
  update: (id: number, body: Record<string, unknown>) =>
    apiFetch(`/users/${id}`, { method: "PUT", body: JSON.stringify(body) }),
  remove: (id: number) => apiFetch(`/users/${id}`, { method: "DELETE" }),
};

// ─── Events ──────────────────────────────────────────────────────────────────
export const eventApi = {
  getAll: () => apiFetch("/events"),
  getById: (id: number) => apiFetch(`/events/${id}`),
  create: (formData: FormData) => apiUpload("/events", formData, "POST"),
  update: (id: number, formData: FormData) => apiUpload(`/events/${id}`, formData, "PUT"),
  remove: (id: number) => apiFetch(`/events/${id}`, { method: "DELETE" }),
};

// ─── Artists ─────────────────────────────────────────────────────────────────
export const artistApi = {
  getAll: () => apiFetch("/artists"),
  getById: (id: number) => apiFetch(`/artists/${id}`),
  create: (formData: FormData) => apiUpload("/artists", formData, "POST"),
  update: (id: number, formData: FormData) => apiUpload(`/artists/${id}`, formData, "PUT"),
  remove: (id: number) => apiFetch(`/artists/${id}`, { method: "DELETE" }),
};

// ─── Tickets ─────────────────────────────────────────────────────────────────
export const ticketApi = {
  getAll: () => apiFetch("/tickets"),
  getById: (id: number) => apiFetch(`/tickets/${id}`),
  create: (body: Record<string, unknown>) =>
    apiFetch("/tickets", { method: "POST", body: JSON.stringify(body) }),
  update: (id: number, body: Record<string, unknown>) =>
    apiFetch(`/tickets/${id}`, { method: "PUT", body: JSON.stringify(body) }),
  remove: (id: number) => apiFetch(`/tickets/${id}`, { method: "DELETE" }),
};

// ─── Ticket Categories ────────────────────────────────────────────────────────
export const ticketCategoryApi = {
  getAll: () => apiFetch("/ticket-categories"),
  getById: (id: number) => apiFetch(`/ticket-categories/${id}`),
  create: (body: Record<string, unknown>) =>
    apiFetch("/ticket-categories", { method: "POST", body: JSON.stringify(body) }),
  update: (id: number, body: Record<string, unknown>) =>
    apiFetch(`/ticket-categories/${id}`, { method: "PUT", body: JSON.stringify(body) }),
  remove: (id: number) =>
    apiFetch(`/ticket-categories/${id}`, { method: "DELETE" }),
};

// ─── Orders ───────────────────────────────────────────────────────────────────
export const orderApi = {
  getAll: () => apiFetch("/orders"),
  getById: (id: number) => apiFetch(`/orders/${id}`),
  update: (id: number, body: Record<string, unknown>) =>
    apiFetch(`/orders/${id}`, { method: "PUT", body: JSON.stringify(body) }),
  remove: (id: number) => apiFetch(`/orders/${id}`, { method: "DELETE" }),
};

// ─── Payments ─────────────────────────────────────────────────────────────────
export const paymentApi = {
  getAll: () => apiFetch("/payments"),
  getById: (id: number) => apiFetch(`/payments/${id}`),
  update: (id: number, body: Record<string, unknown>) =>
    apiFetch(`/payments/${id}`, { method: "PUT", body: JSON.stringify(body) }),
};
