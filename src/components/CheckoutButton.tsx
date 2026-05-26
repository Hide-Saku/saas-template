"use client";

import { startCheckout } from "@/lib/auth-client";

export default function CheckoutButton({
  primary = false,
  children,
}: {
  primary?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={() => startCheckout()}
      className={`mt-6 block w-full rounded-lg px-4 py-2.5 text-center font-medium transition ${
        primary
          ? "bg-brand text-brand-fg hover:bg-brand-hover"
          : "border border-border hover:border-brand"
      }`}
    >
      {children}
    </button>
  );
}
