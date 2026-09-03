import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import PropertyGallery from "./PropertyGallery";

function formatKsh(amount: number | null) {
  if (amount === null) return "Price on request";
  return `KSh ${amount.toLocaleString("en-KE")}`;
}

export default async function PropertyPage({
  params,
}: {
  params: { id: string };
}) {
  const property = await prisma.property.findUnique({
    where: { id: params.id },
    include: {
      neighbourhood: true,
      images: {
        orderBy: { sortOrder: "asc" },
      },
    },
  });

  if (!property) {
    notFound();
  }

  const price =
    property.intent === "RENT_HOME" ||
    property.intent === "RENT_COMMERCIAL"
      ? property.rentAmount
      : property.saleAmount;

  const isRent =
    property.intent === "RENT_HOME" ||
    property.intent === "RENT_COMMERCIAL";

  const whatsappMessage = `Hello Rongai Homes, I'm interested in "${property.title}". Property ID: ${property.id}. I would like to arrange a viewing and confirm availability.`;

  const whatsappUrl = `https://wa.me/254764028988?text=${encodeURIComponent(
    whatsappMessage
  )}`;

  return (
    <main className="min-h-screen bg-parchment">
      <section className="bg-acacia py-8 text-parchment">
        <div className="mx-auto max-w-6xl px-6">
          <Link
            href="/search"
            className="text-sm text-parchment/70 hover:text-parchment"
          >
            ← Back to search
          </Link>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-10">
        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <PropertyGallery
              title={property.title}
              images={property.images}
            />

            <div className="mt-8">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-acacia px-3 py-1 text-xs font-medium text-parchment">
                  Available now
                </span>

                <span className="rounded-full border border-line px-3 py-1 text-xs">
                  {property.verification}
                </span>
              </div>

              <h1 className="mt-4 font-display text-4xl italic text-acacia">
                {property.title}
              </h1>

              <p className="mt-2 text-ink/60">
                {property.neighbourhood.name}, Ongata Rongai
              </p>

              <p className="mt-6 text-3xl font-semibold text-acacia">
                {formatKsh(price)}
                {isRent && (
                  <span className="ml-1 text-base font-normal text-ink/50">
                    /month
                  </span>
                )}
              </p>

              <p className="mt-6 leading-7 text-ink/70">
                {property.description}
              </p>

              <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="rounded-xl border border-line bg-white p-4">
                  <p className="text-xs text-ink/50">Bedrooms</p>
                  <p className="mt-1 font-semibold">
                    {property.bedrooms ?? "—"}
                  </p>
                </div>

                <div className="rounded-xl border border-line bg-white p-4">
                  <p className="text-xs text-ink/50">Bathrooms</p>
                  <p className="mt-1 font-semibold">
                    {property.bathrooms ?? "—"}
                  </p>
                </div>

                <div className="rounded-xl border border-line bg-white p-4">
                  <p className="text-xs text-ink/50">Type</p>
                  <p className="mt-1 font-semibold">
                    {property.propertyType.replaceAll("_", " ")}
                  </p>
                </div>

                <div className="rounded-xl border border-line bg-white p-4">
                  <p className="text-xs text-ink/50">Status</p>
                  <p className="mt-1 font-semibold">Available</p>
                </div>
              </div>
            </div>
          </div>

          <aside className="h-fit rounded-2xl border border-line bg-white p-6 shadow-sm">
            <p className="text-sm font-semibold text-acacia">
              Interested in this property?
            </p>

            <p className="mt-2 text-sm leading-6 text-ink/60">
              Contact Rongai Homes to arrange a viewing and confirm
              availability. We will connect you with the person managing the
              property.
            </p>

            <a
              href={whatsappUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-6 block rounded-xl bg-ochre px-5 py-3 text-center text-sm font-semibold text-acacia-dark transition hover:bg-ochre-dark"
            >
              Contact Rongai Homes on WhatsApp
            </a>

            <p className="mt-4 text-center text-xs text-ink/40">
              Your enquiry goes through Rongai Homes. Always verify the
              property before making any payment.
            </p>
          </aside>
        </div>
      </section>
    </main>
  );
}
