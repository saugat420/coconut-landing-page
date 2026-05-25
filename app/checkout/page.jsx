"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useMemo, useState } from "react";
import { ArrowLeft, Loader2, PackageCheck } from "lucide-react";
import { formatPrice, product } from "@/lib/product";
import { trackMetaEvent } from "@/lib/metaPixel";

function Field({ label, error, children }) {
  return (
    <label className="block">
      <span className="text-sm font-black text-ink">{label}</span>
      <div className="mt-2">{children}</div>
      {error ? <p className="mt-2 text-sm font-bold text-red-600">{error}</p> : null}
    </label>
  );
}

function CheckoutContent() {
  const router = useRouter();
  const params = useSearchParams();
  const initialQuantity = Math.max(1, Number(params.get("quantity")) || 1);
  const expectedTotal = initialQuantity * product.offerPrice + product.deliveryFee;
  const initialTotal = Number(params.get("total")) || expectedTotal;
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    location: "",
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const order = useMemo(
    () => ({
      productName: product.name,
      quantity: initialQuantity,
      totalPrice: initialTotal === expectedTotal ? initialTotal : expectedTotal,
      pricePerPiece: product.offerPrice,
    }),
    [expectedTotal, initialQuantity, initialTotal],
  );

  function updateField(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setIsSubmitting(true);
    setErrors({});
    setSubmitError("");

    const response = await fetch("/api/order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, ...order }),
    });

    const result = await response.json();
    setIsSubmitting(false);

    if (!response.ok) {
      setErrors(result.errors || {});
      setSubmitError(result.message || "Could not place your order. Please try again.");
      return;
    }

    trackMetaEvent("Purchase", {
      content_name: result.order.productName,
      content_type: "product",
      contents: [{ id: result.order.productName, quantity: result.order.quantity }],
      currency: "NPR",
      order_id: result.order.orderId,
      value: result.order.totalPrice,
    });

    const thankYouParams = new URLSearchParams({
      orderId: result.order.orderId,
      product: result.order.productName,
      quantity: String(result.order.quantity),
      total: String(result.order.totalPrice),
    });
    router.push(`/thank-you?${thankYouParams.toString()}`);
  }

  return (
    <main className="min-h-screen bg-[#f7fff9]">
      <div className="mx-auto max-w-5xl px-5 py-8 sm:px-8">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-black text-leaf transition hover:text-ink"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </Link>

        <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_0.76fr]">
          <section className="rounded-lg bg-white p-6 shadow-soft sm:p-8">
            <p className="text-sm font-black uppercase tracking-[0.18em] text-leaf">
              Cash On Delivery
            </p>
            <h1 className="mt-3 text-4xl font-black text-ink">Complete your order</h1>

            <form className="mt-8 grid gap-5" onSubmit={handleSubmit}>
              <Field label="Full Name" error={errors.name}>
                <input
                  className="focus-ring w-full rounded-lg border border-mint bg-white px-4 py-3 text-ink"
                  name="name"
                  value={form.name}
                  onChange={updateField}
                  autoComplete="name"
                />
              </Field>

              <Field label="Phone Number" error={errors.phone}>
                <input
                  className="focus-ring w-full rounded-lg border border-mint bg-white px-4 py-3 text-ink"
                  name="phone"
                  value={form.phone}
                  onChange={updateField}
                  autoComplete="tel"
                />
              </Field>

              <Field label="Email Address" error={errors.email}>
                <input
                  className="focus-ring w-full rounded-lg border border-mint bg-white px-4 py-3 text-ink"
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={updateField}
                  autoComplete="email"
                />
              </Field>

              <Field label="Exact Location" error={errors.location}>
                <textarea
                  className="focus-ring min-h-28 w-full resize-y rounded-lg border border-mint bg-white px-4 py-3 text-ink"
                  name="location"
                  value={form.location}
                  onChange={updateField}
                  placeholder="Kindly share your exact location"
                />
              </Field>

              {submitError ? (
                <div className="rounded-lg bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
                  {submitError}
                </div>
              ) : null}

              <button
                type="submit"
                disabled={isSubmitting}
                className="flex w-full items-center justify-center gap-2 rounded-full bg-leaf px-8 py-4 text-lg font-black text-white shadow-soft transition hover:bg-ink disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : null}
                Order Now
              </button>
            </form>
          </section>

          <aside className="h-fit rounded-lg bg-ink p-6 text-white shadow-soft sm:p-8">
            <PackageCheck className="h-9 w-9 text-sun" />
            <h2 className="mt-4 text-2xl font-black">Order summary</h2>
            <div className="mt-6 space-y-4 text-sm font-bold text-white/78">
              <div className="flex justify-between gap-4">
                <span>Product Name</span>
                <span className="text-right text-white">{order.productName}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span>Quantity</span>
                <span className="text-white">{order.quantity}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span>Price Per Piece</span>
                <span className="text-white">{formatPrice(order.pricePerPiece)}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span>Delivery</span>
                <span className="text-white">Free</span>
              </div>
              <div className="flex items-center justify-between gap-4 border-t border-white/15 pt-5">
                <span className="text-lg text-white">Total Price</span>
                <span className="text-3xl font-black text-sun">
                  {formatPrice(order.totalPrice)}
                </span>
              </div>
            </div>
            <p className="mt-6 rounded-lg bg-white/10 p-4 text-sm font-semibold leading-6 text-white/78">
              Product, quantity, and total price are filled automatically from your
              selection.
            </p>
          </aside>
        </div>
      </div>
    </main>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div className="p-8 text-ink">Loading checkout...</div>}>
      <CheckoutContent />
    </Suspense>
  );
}
