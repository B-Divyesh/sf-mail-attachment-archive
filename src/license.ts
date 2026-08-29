import type { LicenseState } from "./types";

const slug = "mail-attachment-archive";
const key = `sb_license:${slug}`;
const verdictKey = `${key}:verdict`;
export const checkoutUrl = `https://api.sociobot.in/api/v1/products/${slug}/checkout`;

export function checkoutUrlForReturn(returnUrl: string): string {
  return `${checkoutUrl}?return_url=${encodeURIComponent(returnUrl)}`;
}

export function captureLicense(): void {
  const url = new URL(location.href);
  const token = url.searchParams.get("license");
  if (!token) return;
  localStorage.setItem(key, token);
  url.searchParams.delete("license");
  history.replaceState({}, "", url);
}

export function storedLicense(): LicenseState {
  const token = localStorage.getItem(key);
  try {
    const cached = JSON.parse(localStorage.getItem(verdictKey) || "null") as LicenseState | null;
    return cached?.token === token ? cached : { token, valid: false, checkedAt: 0 };
  } catch {
    return { token, valid: false, checkedAt: 0 };
  }
}

export async function verifyLicense(force = false): Promise<LicenseState> {
  const state = storedLicense();
  if (!state.token) return state;
  if (!force && state.checkedAt > Date.now() - 86_400_000) return state;
  try {
    const response = await fetch(`https://api.sociobot.in/api/v1/products/${slug}/verify?license=${encodeURIComponent(state.token)}`);
    const result = (await response.json()) as { valid: boolean; reason?: string };
    const next = { token: state.token, valid: result.valid, checkedAt: Date.now() };
    localStorage.setItem(verdictKey, JSON.stringify(next));
    return next;
  } catch {
    return state;
  }
}

export async function saveLicense(token: string): Promise<LicenseState> {
  localStorage.setItem(key, token.trim());
  localStorage.removeItem(verdictKey);
  return verifyLicense(true);
}
