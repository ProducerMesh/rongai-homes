"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

type Property = {
  id: string;
  title: string;
  intent: string;
  propertyType: string;
  rentAmount: number | null;
  saleAmount: number | null;
  listingStatus: string;
  availability: string;
  verification: string;
  createdAt: string;
  neighbourhood: {
    name: string;
  };
  images: {
    url: string;
  }[];
};

export default function DashboardPage() {
  const { data: session, status } = useSession();

  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (status !== "authenticated") {
      return;
    }

    async function loadListings() {
      try {
        const response = await fetch("/api/my-listings");
        const data = await response.json();

        if (!response.ok) {
          setError(data.error || "Unable to load your listings.");
          return;
        }

        setProperties(data.properties || []);
      } catch {
        setError("Unable to load your listings.");
      } finally {
        setLoading(false);
      }
    }

    loadListings();
  }, [status]);

  if (status === "loading") {
    return (
      <main className="min-h-screen bg-parchment">
        <div className="mx-auto max-w-5xl px-6 py-20 text-center">
          <p className="text-sm text-ink/50">Checking your account...</p>
        </div>
      </main>
    );
  }

  if (!session?.user) {
    return (
      <main className="min-h-screen bg-parchment">
        <section className="bg-acacia py-12 text-parchment">
          <div className="mx-auto max-w-5xl px-6">
            <Link
              href="/"
              className="text-sm text-parchment/70 hover:text-parchment"
            >
              ← Rongai Homes
            </Link>

            <h1 className="mt-6 font-display text-4xl italic">
              My listings
            </h1>
          </div>
        </section>

        <section className="mx-auto max-w-md px-6 py-16 text-center">
          <div className="rounded-2xl border border-line bg-white p-8 shadow-sm">
            <h2 className="font-display text-2xl text-acacia">
              Sign in to continue
            </h2>

            <p className="mt-3 text-sm leading-6 text-ink/60">
              Sign in to manage properties listed under your account.
            </p>

            <Link
              href="/auth/sign-in?callbackUrl=/dashboard"
              className="mt-6 block rounded-xl bg-ochre px-6 py-3 text-sm font-semibold text-acacia-dark hover:bg-ochre-dark"
            >
              Sign in
            </Link>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-parchment">
      <section className="bg-acacia py-12 text-parchment">
        <div className="mx-auto max-w-5xl px-6">
          <Link
            href="/"
            className="text-sm text-parchment/70 hover:text-parchment"
          >
            ← Rongai Homes
          </Link>

          <div className="mt-6 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
            <div>
              <p className="eyebrow text-parchment/60">Landlord dashboard</p>

              <h1 className="mt-2 font-display text-4xl italic sm:text-5xl">
                My listings
              </h1>

              <p className="mt-3 max-w-xl text-parchment/75">
                Manage your properties and keep their availability up to date.
              </p>
            </div>

            <Link
              href="/list-property"
              className="rounded-xl bg-ochre px-5 py-3 text-center text-sm font-semibold text-acacia-dark hover:bg-ochre-dark"
            >
              + List another property
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-6 py-10">
        {loading && (
          <div className="rounded-2xl border border-line bg-white p-8 text-center">
            <p className="text-sm text-ink/50">Loading your listings...</p>
          </div>
        )}

        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-5">
            <p className="text-sm font-medium text-red-700">{error}</p>
          </div>
        )}

        {!loading && !error && properties.length === 0 && (
          <div className="rounded-2xl border border-line bg-white p-10 text-center shadow-sm">
            <h2 className="font-display text-2xl text-acacia">
              No listings yet
            </h2>

            <p className="mt-3 text-sm leading-6 text-ink/60">
              You haven't listed a property yet.
            </p>

            <Link
              href="/list-property"
              className="mt-6 inline-block rounded-xl bg-ochre px-6 py-3 text-sm font-semibold text-acacia-dark"
            >
              List your first property
            </Link>
          </div>
        )}

        <div className="space-y-5">
          {properties.map((property) => (
            <article
              key={property.id}
              className="overflow-hidden rounded-2xl border border-line bg-white shadow-sm"
            >
              <div className="p-6">
                <div className="flex flex-col justify-between gap-5 sm:flex-row">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-ink/40">
                      {property.neighbourhood.name}
                    </p>

                    <h2 className="mt-2 font-display text-2xl text-acacia">
                      {property.title}
                    </h2>

                    <p className="mt-2 text-sm text-ink/60">
                      {property.propertyType.replaceAll("_", " ")}
                    </p>
                  </div>

                  <div className="text-left sm:text-right">
                    <span className="inline-flex rounded-full bg-ochre/15 px-3 py-1 text-xs font-semibold text-acacia">
                      {property.listingStatus.replaceAll("_", " ")}
                    </span>

                    <p className="mt-2 text-xs text-ink/45">
                      {property.availability.replaceAll("_", " ")}
                    </p>
                  </div>
                </div>

                <div className="mt-6 grid gap-4 border-t border-line pt-5 sm:grid-cols-3">
                  <div>
                    <p className="text-xs text-ink/40">Rent</p>
                    <p className="mt-1 text-sm font-semibold text-ink">
                      {property.rentAmount
                        ? `KSh ${property.rentAmount.toLocaleString()} / month`
                        : "—"}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-ink/40">Sale price</p>
                    <p className="mt-1 text-sm font-semibold text-ink">
                      {property.saleAmount
                        ? `KSh ${property.saleAmount.toLocaleString()}`
                        : "—"}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-ink/40">Verification</p>
                    <p className="mt-1 text-sm font-semibold text-ink">
                      {property.verification}
                    </p>
                  </div>
                </div>
              </div>
                <div className="mt-6 flex flex-col gap-3 border-t border-line pt-5 sm:flex-row">
                  <Link
                    href={`/property/${property.id}`}
                    className="flex-1 rounded-xl border border-line px-4 py-3 text-center text-sm font-semibold text-acacia transition hover:border-acacia/40 hover:bg-parchment"
                  >
                    View listing
                  </Link>

                  <Link
                    href={`/dashboard/listings/${property.id}`}
                    className="flex-1 rounded-xl bg-ochre px-4 py-3 text-center text-sm font-semibold text-acacia-dark transition hover:bg-ochre-dark"
                  >
                    Manage listing
                  </Link>
                </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
