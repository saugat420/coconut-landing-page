"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { CheckCircle2 } from "lucide-react";
import { formatPrice, product } from "@/lib/product";

function ThankYouContent() {
  const params = useSearchParams();
  const productName = params.get("product") || product.name;
  const quantity = params.get("quantity") || "1";
  const total = Number(params.get("total")) || product.offerPrice;
  const orderId = params.get("orderId");

  return (
    <main className="fresh-gradient grid min-h-screen place-items-center px-5 py-10">
      <section className="w-full max-w-xl rounded-lg bg-white p-8 text-center shadow-soft sm:p-10">
        <CheckCircle2 className="mx-auto h-16 w-16 text-leaf" />
        <h1 className="mt-5 text-4xl font-black text-ink">Thank you for your order!</h1>
        <p className="mt-4 text-lg leading-8 text-ink/70">
          Our sales representative will call you soon to confirm your order.
        </p>

        <div className="mt-8 rounded-lg bg-aqua p-5 text-left">
          {orderId ? (
            <div className="mb-4 flex justify-between gap-4 text-sm font-bold text-ink/65">
              <span>Order ID</span>
              <span className="text-right text-ink">{orderId}</span>
            </div>
          ) : null}
          <div className="mb-4 flex justify-between gap-4 text-sm font-bold text-ink/65">
            <span>Product ordered</span>
            <span className="text-right text-ink">{productName}</span>
          </div>
          <div className="mb-4 flex justify-between gap-4 text-sm font-bold text-ink/65">
            <span>Quantity</span>
            <span className="text-ink">{quantity}</span>
          </div>
          <div className="flex justify-between gap-4 border-t border-white pt-4">
            <span className="font-black text-ink">Total price</span>
            <span className="text-2xl font-black text-leaf">{formatPrice(total)}</span>
          </div>
        </div>

        <Link
          href="/"
          className="mt-8 inline-flex rounded-full bg-leaf px-8 py-4 text-lg font-black text-white shadow-soft transition hover:bg-ink"
        >
          Back to Home
        </Link>
      </section>
    </main>
  );
}

export default function ThankYouPage() {
  return (
    <Suspense fallback={<div className="p-8 text-ink">Loading...</div>}>
      <ThankYouContent />
    </Suspense>
  );
}
