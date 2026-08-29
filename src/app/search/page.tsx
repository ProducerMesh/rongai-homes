import Link from "next/link";
import { prisma } from "@/lib/prisma";

type SearchParams = {
  intent?: string;
  area?: string;
  type?: string;
  min?: string;
  max?: string;
  bedrooms?: string;
};

const INTENTS = [
  { key: "rent", label: "Rent" },
  { key: "buy", label: "Buy" },
  { key: "land", label: "Land" },
  { key: "commercial", label: "Commercial" },
];

const INTENT_MAP: Record<string, string[]> = {
  rent: ["RENT_HOME", "RENT_COMMERCIAL"],
  buy: ["BUY_HOME", "BUY_LAND", "BUY_COMMERCIAL"],
  land: ["BUY_LAND"],
  commercial: ["RENT_COMMERCIAL", "BUY_COMMERCIAL"],
};

const PROPERTY_TYPES = [
  ["BEDSITTER", "Bedsitter"],
  ["STUDIO", "Studio"],
  ["ONE_BEDROOM", "1 Bedroom"],
  ["TWO_BEDROOM", "2 Bedroom"],
  ["THREE_BEDROOM", "3 Bedroom"],
  ["FOUR_PLUS_BEDROOM", "4+ Bedroom"],
  ["MAISONETTE", "Maisonette"],
  ["TOWNHOUSE", "Townhouse"],
  ["APARTMENT", "Apartment"],
  ["STANDALONE_HOUSE", "Standalone House"],
  ["LAND", "Land"],
  ["SHOP", "Shop"],
  ["OFFICE", "Office"],
  ["WAREHOUSE", "Warehouse"],
  ["STALL", "Stall"],
  ["COMMERCIAL_PLOT", "Commercial Plot"],
];

function formatKsh(amount: number | null) {
  if (amount === null) return "Price on request";
  return `KSh ${amount.toLocaleString("en-KE")}`;
}

function getPrice(property: {
  intent: string;
  rentAmount: number | null;
  saleAmount: number | null;
}) {
  if (property.intent === "RENT_HOME" || property.intent === "RENT_COMMERCIAL") {
    return property.rentAmount;
  }

  return property.saleAmount;
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const intent = searchParams.intent || "rent";
  const area = searchParams.area || "";
  const type = searchParams.type || "";
  const min = searchParams.min || "";
  const max = searchParams.max || "";
  const bedrooms = searchParams.bedrooms || "";

  const selectedIntents = INTENT_MAP[intent] || INTENT_MAP.rent;

  const properties = await prisma.property.findMany({
    where: {
      listingStatus: "ACTIVE",
      availability: "AVAILABLE_NOW",

      intent: {
        in: selectedIntents as any,
      },

      ...(area
        ? {
            neighbourhood: {
              name: {
                equals: area,
                mode: "insensitive",
              },
            },
          }
        : {}),

      ...(type
        ? {
            propertyType: type as any,
          }
        : {}),

      ...(bedrooms
        ? {
            bedrooms: {
              gte: Number(bedrooms),
            },
          }
        : {}),
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
});

  const filteredProperties = properties.filter((property) => {
    const price = getPrice(property);

    if (min && (!price || price < Number(min))) return false;
    if (max && (!price || price > Number(max))) return false;

    return true;
  });

  return (
    <main className="min-h-screen bg-parchment">
      <section className="bg-acacia py-12 text-parchment">
        <div className="mx-auto max-w-6xl px-6">
          <Link
            href="/"
            className="text-sm text-parchment/70 hover:text-parchment"
          >
            ← Rongai Homes
          </Link>

          <h1 className="mt-6 font-display text-4xl italic">
            Find a property
          </h1>

          <p className="mt-2 max-w-xl text-parchment/70">
            Search verified properties currently available in Ongata Rongai.
          </p>

          <div className="mt-8 flex flex-wrap gap-2">
            {INTENTS.map((item) => (
              <Link
                key={item.key}
                href={`/search?intent=${item.key}`}
                className={`rounded-full px-5 py-2 text-sm font-medium transition ${
                  intent === item.key
                    ? "bg-parchment text-acacia"
                    : "border border-parchment/30 text-parchment hover:bg-parchment/10"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-10">
        <form
          method="GET"
          action="/search"
          className="rounded-2xl border border-line bg-white p-5 shadow-sm"
        >
          <input type="hidden" name="intent" value={intent} />

          <div className="grid gap-4 md:grid-cols-5">
            <div>
              <label className="mb-1 block text-xs font-medium text-ink/60">
                Area
              </label>
              <input
                name="area"
                defaultValue={area}
                placeholder="e.g. Kandisi"
                className="w-full rounded-xl border border-line px-3 py-3 text-sm outline-none focus:border-acacia"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-ink/60">
                Property type
              </label>

              <select
                name="type"
                defaultValue={type}
                className="w-full rounded-xl border border-line bg-white px-3 py-3 text-sm outline-none"
              >
                <option value="">Any type</option>

                {PROPERTY_TYPES.map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-ink/60">
                Min price
              </label>

              <input
                name="min"
                type="number"
                defaultValue={min}
                placeholder="KSh"
                className="w-full rounded-xl border border-line px-3 py-3 text-sm outline-none"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-ink/60">
                Max price
              </label>

              <input
                name="max"
                type="number"
                defaultValue={max}
                placeholder="KSh"
                className="w-full rounded-xl border border-line px-3 py-3 text-sm outline-none"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-ink/60">
                Bedrooms
              </label>

              <select
                name="bedrooms"
                defaultValue={bedrooms}
                className="w-full rounded-xl border border-line bg-white px-3 py-3 text-sm outline-none"
              >
                <option value="">Any</option>
                <option value="1">1+</option>
                <option value="2">2+</option>
                <option value="3">3+</option>
                <option value="4">4+</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            className="mt-5 rounded-xl bg-ochre px-7 py-3 text-sm font-semibold text-acacia-dark hover:bg-ochre-dark"
          >
            Search properties
          </button>
        </form>

        <div className="mt-10 flex items-end justify-between">
          <div>
            <p className="eyebrow">Verified availability</p>
            <h2 className="mt-1 font-display text-2xl text-acacia">
              {filteredProperties.length} properties available
            </h2>
          </div>
        </div>

        {filteredProperties.length === 0 ? (
          <div className="mt-8 rounded-2xl border border-line bg-white p-10 text-center">
            <h3 className="font-display text-xl text-acacia">
              No matching properties yet
            </h3>

            <p className="mt-2 text-sm text-ink/60">
              Try another area, property type or price range.
            </p>
          </div>
        ) : (
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filteredProperties.map((property) => {
              const price = getPrice(property);

              return (
                <Link
  href={`/property/${property.id}`}
  className="block overflow-hidden rounded-2xl border border-line bg-white transition hover:-translate-y-1 hover:shadow-md"
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

                      <span className="font-mono text-[10px] uppercase tracking-wide text-pulse">
                        Available now
                      </span>
                    </div>

                    <h3 className="mt-3 font-display text-xl text-ink">
                      {property.title}
                    </h3>

                    <p className="mt-1 text-sm text-ink/60">
                      {property.neighbourhood.name}, Ongata Rongai
                    </p>

                    <p className="mt-4 font-mono text-lg text-acacia">
                      {formatKsh(price)}

                      {(property.intent === "RENT_HOME" ||
                        property.intent === "RENT_COMMERCIAL") && (
                        <span className="text-xs text-ink/50">
                          {" "}
                          /month
                        </span>
                      )}
                    </p>

                    <div className="mt-4 flex flex-wrap gap-2 text-xs text-ink/60">
                      {property.bedrooms !== null && (
                        <span className="rounded-full bg-parchment px-3 py-1">
                          {property.bedrooms} bedrooms
                        </span>
                      )}

                      {property.bathrooms !== null && (
                        <span className="rounded-full bg-parchment px-3 py-1">
                          {property.bathrooms} bathrooms
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
