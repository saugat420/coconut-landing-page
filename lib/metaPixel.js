export const META_PIXEL_ID = "1564598644821549";

export function trackMetaEvent(eventName, parameters = {}) {
  if (typeof window === "undefined" || typeof window.fbq !== "function") {
    return;
  }

  window.fbq("track", eventName, parameters);
}
