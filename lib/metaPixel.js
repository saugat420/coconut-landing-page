export const META_PIXEL_ID = "3569307719878256";

export function trackMetaEvent(eventName, parameters = {}) {
  if (typeof window === "undefined" || typeof window.fbq !== "function") {
    return;
  }

  window.fbq("track", eventName, parameters);
}
