export const product = {
  name: "Real coconut",
  brandName: "Coconut",
  image: "/coconut.png",
  currency: "Rs",
  regularPrice: 249,
  offerPrice: 149,
  deliveryFee: 0,
  bonus: "Free coconut opener and steel pipe included",
  description:
    "Fresh. Natural. Pure. Enjoy the taste of real coconut, handpicked and delivered fresh. Packed with natural hydration and nutrients, it is perfect for drinking, cooking, or daily health.",
  shortDescription:
    "Handpicked real coconut delivered fresh with no chemicals, no processing, and no preservatives.",
  benefits: [
    "100% natural hydration",
    "Rich in electrolytes to keep you refreshed",
    "Boosts energy instantly without chemicals",
    "Supports digestion and daily wellness",
    "Good for skin and hair nourishment",
    "Packed with vitamins, minerals, and antioxidants",
    "Perfect for drinking, cooking, or daily routines",
  ],
  testimonials: [
    {
      name: "Aarati S.",
      quote:
        "The coconut arrived fresh and tasted naturally sweet. The free opener made it very easy to use at home.",
    },
    {
      name: "Nabin K.",
      quote:
        "Great value for the price. I ordered for my family and the delivery was quick and smooth.",
    },
    {
      name: "Sita R.",
      quote:
        "I use it after workouts and for cooking. It feels fresh, clean, and much better than packaged drinks.",
    },
  ],
};

export const statusOptions = [
  "New Order",
  "Order Confirmed",
  "Order Ongoing",
  "Delivered",
  "Cancelled",
];

export function formatPrice(amount) {
  return `${product.currency} ${Number(amount || 0).toLocaleString("en-IN")}`;
}
