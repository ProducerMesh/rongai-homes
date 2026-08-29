"use client";

import { signIn } from "next-auth/react";
import Link from "next/link";

export default function SignInPage() {
  return (
    <main className="min-h-screen bg-parchment">
      <section className="mx-auto flex min-h-screen max-w-md items-center px-6 py-12">
        <div className="w-full rounded-2xl border border-line bg-white p-8 shadow-sm">
          <Link
            href="/"
            className="text-sm text-ink/60 hover:text-acacia"
          >
            ← Rongai Homes
          </Link>

          <div className="mt-8">
            <p className="eyebrow">Rongai Homes</p>

            <h1 className="mt-2 font-display text-3xl italic text-acacia">
              Welcome back
            </h1>

            <p className="mt-2 text-sm leading-6 text-ink/60">
              Sign in to request viewings, save properties and manage your
              property activity.
            </p>
          </div>

          <button
            onClick={() => signIn("google", { callbackUrl: "/" })}
            className="mt-8 w-full rounded-xl border border-line bg-white px-5 py-3 text-sm font-semibold text-ink transition hover:bg-parchment"
          >
            Continue with Google
          </button>

          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-line" />
            <span className="text-xs text-ink/40">OR</span>
            <div className="h-px flex-1 bg-line" />
          </div>

          <form
            onSubmit={(event) => {
              event.preventDefault();

              const form = new FormData(event.currentTarget);
              const phone = form.get("phone")?.toString();

              if (!phone) return;

              signIn("phone-otp", {
                phone,
                otp: "000000",
                callbackUrl: "/",
              });
            }}
          >
            <label className="mb-2 block text-sm font-medium text-ink">
              Phone number
            </label>

            <input
              name="phone"
              type="tel"
              placeholder="e.g. 0712 345 678"
              required
              className="w-full rounded-xl border border-line px-4 py-3 text-sm outline-none focus:border-acacia"
            />

            <p className="mt-2 text-xs leading-5 text-ink/40">
              Phone verification will use a real OTP service when enabled.
            </p>

            <button
              type="submit"
              className="mt-5 w-full rounded-xl bg-ochre px-5 py-3 text-sm font-semibold text-acacia-dark transition hover:bg-ochre-dark"
            >
              Continue with phone
            </button>
          </form>

          <p className="mt-8 text-center text-xs leading-5 text-ink/40">
            By continuing, you agree to use Rongai Homes responsibly and to
            verify property information before making any payment.
          </p>
        </div>
      </section>
    </main>
  );
}
