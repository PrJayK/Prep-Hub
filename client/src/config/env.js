const raw = import.meta.env.VITE_BACKEND_URL ?? "";
export const BACKEND_URL = typeof raw === "string" ? raw.replace(/\/$/, "") : "";