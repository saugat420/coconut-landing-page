"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Headphones,
  PackageCheck,
  ShieldCheck,
  Truck,
} from "lucide-react";
import { formatPrice, product } from "@/lib/product";

function Logo() {
  return (
    <div className="flex items-center gap-3">
      <div className="grid h-11 w-11 place-items-center rounded-full bg-leaf text-lg font-black text-white shadow-soft">
        C
      </div>
      <div>
        <div className="text-lg font-black leading-none text-ink">Coconut</div>
        <div className="text-xs font-semibold uppercase tracking-[0.18em] text-leaf">
          Fresh Daily
        </div>
      </div>
    </div>
  );
}

export default function HomePage() {
  const router = useRouter();
  const [quantity, setQuantity] = useState(1);
  const total = useMemo(
    () => quantity * product.offerPrice + product.deliveryFee,
    [quantity],
  );

  function goToCheckout() {
    const params = new URLSearchParams({
      product: product.name,
      quantity: String(quantity),
      total: String(total),
    });
    router.push(`/checkout?${params.toString()}`);
  }

  return (
    <main className="fresh-gradient min-h-screen">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5 sm:px-8">
        <Logo />
        <a
          href="#order"
          className="rounded-full bg-ink px-5 py-3 text-sm font-bold text-white transition hover:bg-leaf"
        >
          Buy Now
        </a>
      </header>

      <section className="mx-auto grid max-w-6xl items-center gap-10 px-5 pb-16 pt-6 sm:px-8 lg:grid-cols-[1.02fr_0.98fr] lg:pb-20">
        <div>
          <div className="mb-5 inline-flex items-center rounded-full bg-white px-4 py-2 text-sm font-bold text-leaf shadow-sm">
            Cash On Delivery available
          </div>
          <h1 className="max-w-3xl text-5xl font-black leading-[1.02] text-ink sm:text-6xl lg:text-7xl">
            Real coconut, delivered fresh.
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-ink/75">
            {product.shortDescription}
          </p>

          <div className="mt-7 flex flex-wrap items-center gap-4">
            <div>
              <div className="flex items-end gap-3">
                <span className="text-4xl font-black text-leaf">
                  {formatPrice(product.offerPrice)}
                </span>
                <span className="pb-1 text-lg font-bold text-ink/45 line-through">
                  {formatPrice(product.regularPrice)}
                </span>
              </div>
              <p className="mt-1 text-sm font-semibold text-cocoa">
                {product.bonus}
              </p>
            </div>
          </div>

          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            {[
              ["Free delivery", Truck],
              ["Easy ordering", PackageCheck],
              ["Friendly support", Headphones],
            ].map(([label, Icon]) => (
              <div
                key={label}
                className="flex items-center gap-3 rounded-lg bg-white/82 px-4 py-3 shadow-sm"
              >
                <Icon className="h-5 w-5 text-leaf" />
                <span className="text-sm font-bold text-ink">{label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="relative">
          <div className="absolute inset-x-10 bottom-5 h-12 rounded-full bg-cocoa/15 blur-2xl" />
          <Image
            src={product.image}
            alt="Real coconut"
            width={900}
            height={720}
            priority
            className="relative h-auto w-full drop-shadow-2xl"
          />
        </div>
      </section>

      <section className="bg-white py-14">
        <div className="mx-auto grid max-w-6xl gap-6 px-5 sm:px-8 md:grid-cols-2 lg:grid-cols-4">
          {product.benefits.slice(0, 4).map((benefit) => (
            <div key={benefit} className="rounded-lg border border-mint bg-white p-5">
              <Check className="mb-4 h-6 w-6 text-leaf" />
              <h2 className="text-lg font-black text-ink">{benefit}</h2>
            </div>
          ))}
        </div>
      </section>

      <section
        id="order"
        className="mx-auto grid max-w-6xl gap-8 px-5 py-16 sm:px-8 lg:grid-cols-[0.9fr_1.1fr]"
      >
        <div>
          <p className="text-sm font-black uppercase tracking-[0.18em] text-leaf">
            Limited Fresh Offer
          </p>
          <h2 className="mt-3 text-4xl font-black text-ink">
            Order today and get the opener set free.
          </h2>
          <p className="mt-4 text-lg leading-8 text-ink/70">
            {product.description} Order now and experience freshness in every sip.
          </p>
        </div>

        <div className="rounded-lg bg-white p-6 shadow-soft">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="text-sm font-bold text-ink/60">Your quantity</div>
              <div className="mt-1 text-2xl font-black text-ink">
                {quantity} piece{quantity > 1 ? "s" : ""}
              </div>
            </div>
            <div className="flex h-12 items-center overflow-hidden rounded-full border border-mint">
              <button
                type="button"
                aria-label="Decrease quantity"
                className="grid h-12 w-12 place-items-center text-ink transition hover:bg-mint"
                onClick={() => setQuantity((value) => Math.max(1, value - 1))}
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <span className="grid h-12 w-12 place-items-center font-black text-ink">
                {quantity}
              </span>
              <button
                type="button"
                aria-label="Increase quantity"
                className="grid h-12 w-12 place-items-center text-ink transition hover:bg-mint"
                onClick={() => setQuantity((value) => Math.min(99, value + 1))}
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>

          <div className="mt-6 rounded-lg bg-aqua p-5">
            <div className="flex justify-between text-sm font-bold text-ink/65">
              <span>Price per piece</span>
              <span>{formatPrice(product.offerPrice)}</span>
            </div>
            <div className="mt-3 flex justify-between text-sm font-bold text-ink/65">
              <span>Delivery</span>
              <span>Free</span>
            </div>
            <div className="mt-5 flex items-center justify-between border-t border-white/80 pt-5">
              <span className="text-lg font-black text-ink">Total</span>
              <span className="text-3xl font-black text-leaf">{formatPrice(total)}</span>
            </div>
          </div>

          <button
            type="button"
            onClick={goToCheckout}
            className="mt-6 w-full rounded-full bg-leaf px-8 py-4 text-lg font-black text-white shadow-soft transition hover:bg-ink"
          >
            Buy Now
          </button>

          <div className="mt-5 flex items-center justify-center gap-2 text-sm font-bold text-ink/65">
            <ShieldCheck className="h-5 w-5 text-leaf" />
            Pay only when your coconut arrives
          </div>
        </div>
      </section>

      <section className="bg-ink py-16 text-white">
        <div className="mx-auto max-w-6xl px-5 sm:px-8">
          <h2 className="text-3xl font-black">Customers love the freshness</h2>
          <div className="mt-8 grid gap-5 md:grid-cols-3">
            {product.testimonials.map((testimonial) => (
              <article key={testimonial.name} className="rounded-lg bg-white/10 p-6">
                <p className="leading-7 text-white/84">"{testimonial.quote}"</p>
                <h3 className="mt-5 font-black">{testimonial.name}</h3>
              </article>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
