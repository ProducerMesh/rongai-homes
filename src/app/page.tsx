import Link from "next/link";

import { prisma } from "@/lib/prisma";

const NEIGHBOURHOODS = [
  "Rongai Town",
  "Kandisi",
  "Rimpa",
  "Nkoroi",
  "Tuala",
  "Gataka",
  "Maasai Lodge",
];

const INTENTS = [
  { key: "rent", label: "Rent" },
  { key: "buy", label: "Buy" },
  { key: "land", label: "Land" },
  { key: "commercial", label: "Commercial" },
];

const STEPS = [
  { n: "Search", d: "Tell us the area, house type and budget." },
  { n: "Verify", d: "See real-time availability, not stale listings." },
  { n: "Connect", d: "Contact Rongai Homes on WhatsApp and we will connect you with the person managing the property." },
  { n: "Move in", d: "Confirm the unit and settle in." },
];

function formatKsh(amount: number) {
  return `KSh ${amount.toLocaleString("en-KE")}`;
}

export default async function HomePage() {
  const availableCount = await prisma.property.count({
    where: {
      listingStatus: "ACTIVE",
      availability: "AVAILABLE_NOW",
    },
  });

  const liveProperties = await prisma.property.findMany({
    where: {
      listingStatus: "ACTIVE",
      availability: "AVAILABLE_NOW",
    },
    include: {
      neighbourhood: true,
      images: {
        orderBy: {
          sortOrder: "asc",
        },
        take: 1,
      },
    },
    orderBy: [
      {
        verification: "desc",
      },
      {
        lastVerifiedAt: "desc",
      },
    ],
    take: 3,
  });

  const neighbourhoods = await Promise.all(
    NEIGHBOURHOODS.map(async (name) => {
      const neighbourhood = await prisma.neighbourhood.findUnique({
        where: { name },
      });

      const count = neighbourhood
        ? await prisma.property.count({
            where: {
              neighbourhoodId: neighbourhood.id,
              listingStatus: "ACTIVE",
              availability: "AVAILABLE_NOW",
            },
          })
        : 0;

      return { name, count };
    })
  );

  return (
    <main>
      {/* ---------- HERO ---------- */}

      <section className="relative overflow-hidden bg-acacia text-parchment">
        <svg
          aria-hidden
          className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.08]"
          viewBox="0 0 400 400"
          preserveAspectRatio="xMidYMid slice"
        >
          {Array.from({ length: 9 }).map((_, row) =>
            Array.from({ length: 9 }).map((_, col) => (
              <rect
                key={`${row}-${col}`}
                x={row * 45}
                y={col * 45}
                width={40}
                height={40}
                fill="none"
                stroke="currentColor"
                strokeWidth={0.5}
              />
            ))
          )}
        </svg>

        <div className="relative mx-auto max-w-5xl px-6 py-20 sm:py-28">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-parchment/25 px-3 py-1">
            <span className="badge-pulse" />

            <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-parchment/80">
              {availableCount} properties verified available right now
            </span>
          </div>

          <h1 className="max-w-3xl font-display text-4xl italic leading-[1.08] sm:text-6xl">
            Find your next home without walking around.
          </h1>

          <p className="mt-5 max-w-xl text-lg text-parchment/80">
            Discover verified, currently vacant houses, apartments, land and
            commercial spaces in Ongata Rongai — updated in real time.
          </p>

          {/* ---------- SEARCH ---------- */}

          <div className="mt-10 rounded-2xl bg-parchment p-2 text-ink shadow-xl sm:p-3">
            <div className="flex flex-wrap gap-2 border-b border-line px-2 pb-2 sm:px-3">
              {INTENTS.map((intent, i) => (
                <Link
                  key={intent.key}
                  href={`/search?intent=${intent.key}`}
                  className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
                    i === 0
                      ? "bg-acacia text-parchment"
                      : "text-acacia/70 hover:bg-acacia/10"
                  }`}
                >
                  {intent.label}
                </Link>
              ))}
            </div>

            <form
              method="GET"
              action="/search"
              className="flex flex-col gap-2 p-2 sm:flex-row sm:p-3"
            >
              <input
                type="text"
                name="q"
                placeholder="Where do you want to live? e.g. Kandisi"
                className="w-full flex-1 rounded-xl border border-line bg-white px-4 py-3 text-sm outline-none placeholder:text-ink/40"
              />

              <input type="hidden" name="intent" value="rent" />

              <button
                type="submit"
                className="rounded-xl bg-ochre px-6 py-3 text-sm font-semibold text-acacia-dark transition hover:bg-ochre-dark"
              >
                Search
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* ---------- POPULAR AREAS ---------- */}

      <section className="mx-auto max-w-5xl px-6 py-16">
        <p className="eyebrow">Popular areas</p>

        <h2 className="mt-2 font-display text-2xl text-acacia">
          Browse Ongata Rongai by neighbourhood
        </h2>

        <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {neighbourhoods.map((n) => (
            <Link
              key={n.name}
              href={`/search?area=${encodeURIComponent(n.name)}`}
              className="group rounded-xl border border-line bg-white p-4 transition hover:border-acacia/40 hover:shadow-sm"
            >
              <p className="font-medium text-ink">{n.name}</p>

              <p className="mt-1 font-mono text-xs text-ink/50">
                {n.count} vacant now
              </p>
            </Link>
          ))}
        </div>
      </section>

      {/* ---------- AVAILABLE NOW ---------- */}

      <section className="bg-white py-16">
        <div className="mx-auto max-w-5xl px-6">
          <div className="flex items-baseline justify-between">
            <div>
              <p className="eyebrow">Live listings</p>

              <h2 className="mt-2 font-display text-2xl text-acacia">
                Available now
              </h2>
            </div>

            <Link
              href="/search"
              className="text-sm font-medium text-acacia underline underline-offset-4"
            >
              View all
            </Link>
          </div>

          {liveProperties.length === 0 ? (
            <div className="mt-8 rounded-xl border border-line p-8 text-center">
              <p className="text-sm text-ink/60">
                No properties are available right now.
              </p>
            </div>
          ) : (
            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              {liveProperties.map((property) => {
                const isRent =
                  property.intent === "RENT_HOME" ||
                  property.intent === "RENT_COMMERCIAL";

                const price = isRent
                  ? property.rentAmount
                  : property.saleAmount;

                return (
                  <Link
                    key={property.id}
                    href={`/property/${property.id}`}
                    className="block overflow-hidden rounded-xl border border-line bg-white transition hover:-translate-y-1 hover:shadow-md"
                  >
                    <div className="aspect-[4/3] bg-acacia/10">
                      {property.images[0] ? (
                        <img
                          src={property.images[0].url}
                          alt={property.title}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-sm text-ink/40">
                          No photo yet
                        </div>
                      )}
                    </div>

                    <div className="p-5">
                      <div className="flex items-center gap-2">
                        <span className="badge-pulse" />

                        <span className="font-mono text-[11px] uppercase tracking-wide text-pulse">
                          Available now
                        </span>
                      </div>

                      <h3 className="mt-3 font-display text-lg text-ink">
                        {property.title}
                      </h3>

                      <p className="text-sm text-ink/60">
                        {property.neighbourhood.name}, Ongata Rongai
                      </p>

                      <p className="mt-3 font-mono text-lg text-acacia">
                        {price !== null
                          ? formatKsh(price)
                          : "Price on request"}

                        {isRent && (
                          <span className="text-xs text-ink/50">
                            /month
                          </span>
                        )}
                      </p>

                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {property.bedrooms !== null && (
                          <span className="rounded-full bg-parchment px-2.5 py-0.5 text-xs text-acacia/80">
                            {property.bedrooms} bedroom
                            {property.bedrooms === 1 ? "" : "s"}
                          </span>
                        )}

                        {property.bathrooms !== null && (
                          <span className="rounded-full bg-parchment px-2.5 py-0.5 text-xs text-acacia/80">
                            {property.bathrooms} bathroom
                            {property.bathrooms === 1 ? "" : "s"}
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* ---------- HOW IT WORKS ---------- */}

      <section className="mx-auto max-w-5xl px-6 py-16">
        <p className="eyebrow">How it works</p>

        <h2 className="mt-2 font-display text-2xl text-acacia">
          From search to move-in
        </h2>

        <ol className="mt-8 grid gap-6 sm:grid-cols-4">
          {STEPS.map((s, i) => (
            <li key={s.n} className="border-l-2 border-ochre pl-4">
              <span className="font-mono text-xs text-ink/40">
                {String(i + 1).padStart(2, "0")}
              </span>

              <p className="mt-1 font-display text-lg text-ink">{s.n}</p>

              <p className="mt-1 text-sm text-ink/60">{s.d}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* ---------- LIST YOUR PROPERTY CTA ---------- */}

      <section className="bg-acacia-dark py-16 text-parchment">
        <div className="mx-auto flex max-w-5xl flex-col items-start justify-between gap-6 px-6 sm:flex-row sm:items-center">
          <div>
            <h2 className="font-display text-2xl italic">
              Have a vacant unit in Ongata Rongai?
            </h2>

            <p className="mt-2 max-w-md text-parchment/70">
              List it free. Confirm availability with one tap and reach
              tenants who are searching right now.
            </p>
          </div>

          <Link
            href="/list-property"
            className="whitespace-nowrap rounded-xl bg-ochre px-6 py-3 text-sm font-semibold text-acacia-dark transition hover:bg-ochre-dark"
          >
            List your property
          </Link>
        </div>
      </section>
    </main>
  );
}
