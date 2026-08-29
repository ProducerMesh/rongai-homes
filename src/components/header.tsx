"use client";

import Link from "next/link";
import { signIn, signOut, useSession } from "next-auth/react";

export default function Header() {
  const { data: session, status } = useSession();

  return (
    <header className="border-b border-line bg-parchment">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link
          href="/"
          className="font-display text-2xl italic text-acacia"
        >
          Rongai Homes
        </Link>

        <nav className="hidden items-center gap-6 sm:flex">
          <Link
            href="/search"
            className="text-sm font-medium text-ink/70 hover:text-acacia"
          >
            Find a Home
          </Link>

          <Link
            href="/list-property"
            className="text-sm font-medium text-ink/70 hover:text-acacia"
          >
            List Property
          </Link>

          {status === "loading" ? (
            <span className="text-sm text-ink/40">...</span>
          ) : session?.user ? (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                {session.user.image ? (
                  <img
                    src={session.user.image}
                    alt={session.user.name ?? "Profile"}
                    className="h-8 w-8 rounded-full"
                  />
                ) : (
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-acacia text-xs font-semibold text-parchment">
                    {(session.user.name ?? "U").charAt(0).toUpperCase()}
                  </div>
                )}

                <span className="max-w-[120px] truncate text-sm font-medium text-ink">
                  {session.user.name ?? "My Account"}
                </span>
              </div>

              <button
                type="button"
                onClick={() => signOut({ callbackUrl: "/" })}
                className="rounded-lg border border-line px-3 py-2 text-xs font-medium text-ink/60 hover:border-acacia hover:text-acacia"
              >
                Sign out
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => signIn("google", { callbackUrl: "/" })}
              className="rounded-xl bg-ochre px-4 py-2 text-sm font-semibold text-acacia-dark hover:bg-ochre-dark"
            >
              Sign in
            </button>
          )}
        </nav>

        <div className="sm:hidden">
          {status === "loading" ? (
            <span className="text-sm text-ink/40">...</span>
          ) : session?.user ? (
            <button
              type="button"
              onClick={() => signOut({ callbackUrl: "/" })}
              className="rounded-lg border border-line px-3 py-2 text-xs font-medium"
            >
              Sign out
            </button>
          ) : (
            <button
              type="button"
              onClick={() => signIn("google", { callbackUrl: "/" })}
              className="rounded-xl bg-ochre px-4 py-2 text-sm font-semibold text-acacia-dark"
            >
              Sign in
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
