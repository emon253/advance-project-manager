/**
 * Device push notifications (Web Push with VAPID), the same approach as the
 * Carbarn dashboard: the browser's own PushManager, no push library. A person
 * switches it on per device; the server then pushes every notification that
 * lands in their list.
 */
import { pushApi } from "../../../api/endpoints";

const isIos = () => /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
const isStandalone = () => window.matchMedia?.("(display-mode: standalone)").matches || navigator.standalone === true;

export const pushSupported = () => "serviceWorker" in navigator && "PushManager" in window && typeof Notification !== "undefined";
/** iPhone and iPad only deliver push to the app added to the Home Screen. */
export const pushNeedsInstall = () => isIos() && !isStandalone();

function keyBytes(base64Url) {
  const base64 = (base64Url + "=".repeat((4 - (base64Url.length % 4)) % 4)).replace(/-/g, "+").replace(/_/g, "/");
  return Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
}

const sameKey = (buffer, bytes) => {
  const a = new Uint8Array(buffer);
  return a.length === bytes.length && a.every((v, i) => v === bytes[i]);
};

async function registration() {
  // No service worker in local dev: push simply is not available there.
  return (await navigator.serviceWorker.getRegistration()) || null;
}

async function current() {
  const reg = pushSupported() ? await registration() : null;
  return reg ? reg.pushManager.getSubscription() : null;
}

const toBody = (subscription) => ({ ...subscription.toJSON(), userAgent: navigator.userAgent.slice(0, 255) });

/** "unsupported" | "install" | "blocked" | "on" | "off" for this device. */
export async function pushStatus() {
  if (!pushSupported()) return "unsupported";
  if (pushNeedsInstall()) return "install";
  if (Notification.permission === "denied") return "blocked";
  return Notification.permission === "granted" && (await current()) ? "on" : "off";
}

/** Asks permission, subscribes this device and tells the server. Throws with a message fit to show. */
export async function enablePush() {
  if (pushNeedsInstall()) throw new Error("On iPhone or iPad, add Carbarn Hub to your Home Screen first, then switch this on there.");
  const reg = pushSupported() ? await registration() : null;
  if (!reg) throw new Error("Push notifications are not available in this browser.");
  if ((await Notification.requestPermission()) !== "granted") throw new Error("Notifications are blocked for this site in your browser settings.");
  const { publicKey } = await pushApi.config();
  if (!publicKey) throw new Error("Push notifications are not switched on for Carbarn Hub yet.");
  const key = keyBytes(publicKey);
  let subscription = await reg.pushManager.getSubscription();
  // The server key changed since this device subscribed: start over.
  if (subscription?.options?.applicationServerKey && !sameKey(subscription.options.applicationServerKey, key)) {
    await subscription.unsubscribe();
    subscription = null;
  }
  subscription ||= await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: key });
  await pushApi.subscribe(toBody(subscription));
}

/** Stops push on this device and forgets it on the server. Safe to call when it was never on. */
export async function disablePush() {
  const subscription = await current();
  if (!subscription) return;
  try { await pushApi.unsubscribe(subscription.endpoint); } catch { /* the server drops a dead device on its own */ }
  await subscription.unsubscribe();
}

/** On app load: a device that is already on re-registers, so it follows whoever is signed in. */
export async function syncPush() {
  try {
    if (!pushSupported() || Notification.permission !== "granted") return;
    const subscription = await current();
    if (subscription) await pushApi.subscribe(toBody(subscription));
  } catch { /* best effort */ }
}
