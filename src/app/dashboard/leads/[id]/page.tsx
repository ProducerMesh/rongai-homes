"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

type LeadStatus =
  | "NEW"
  | "CONTACTED"
  | "ASSIGNED"
  | "VIEWING_SCHEDULED"
  | "COMPLETED"
  | "CLOSED";

type Lead = {
  id: string;
  propertyId: string;
  channel: string;
  status: LeadStatus;
  contactName: string | null;
  contactPhone: string | null;
  message: string | null;
  createdAt: string;
  updatedAt: string;
  property: {
    id: string;
    title: string;
    neighbourhood: {
      name: string;
    };
  };
};

const leadStatuses: { value: LeadStatus; label: string }[] = [
  { value: "NEW", label: "New" },
  { value: "CONTACTED", label: "Contacted" },
  { value: "ASSIGNED", label: "Assigned" },
  { value: "VIEWING_SCHEDULED", label: "Viewing scheduled" },
  { value: "COMPLETED", label: "Completed" },
  { value: "CLOSED", label: "Closed" },
];

function formatDate(date: string) {
  return new Date(date).toLocaleString("en-KE", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function statusClasses(status: string) {
  switch (status) {
    case "NEW":
      return "bg-pulse-soft text-acacia";
    case "CONTACTED":
      return "bg-ochre/15 text-acacia";
    case "ASSIGNED":
      return "bg-acacia/10 text-acacia";
    case "VIEWING_SCHEDULED":
      return "bg-clay/10 text-clay";
    case "COMPLETED":
      return "bg-pulse/15 text-acacia";
    case "CLOSED":
      return "bg-ink/10 text-ink/60";
    default:
      return "bg-ink/10 text-ink/60";
  }
}

export default function LeadDetailsPage({
  params,
}: {
  params: { id: string };
}) {
  const { data: session, status } = useSession();

  const [lead, setLead] = useState<Lead | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updating, setUpdating] = useState(false);
  const [updateMessage, setUpdateMessage] = useState("");

  useEffect(() => {
    if (status !== "authenticated") {
      return;
    }

    async function loadLead() {
      try {
        const response = await fetch(`/api/my-leads/${params.id}`);
        const data = await response.json();

        if (!response.ok) {
          setError(data.error || "Unable to load the enquiry.");
          return;
        }

        setLead(data.lead);
      } catch {
        setError("Unable to load the enquiry.");
      } finally {
        setLoading(false);
      }
    }

    loadLead();
  }, [params.id, status]);

  async function updateLeadStatus(newStatus: LeadStatus) {
    if (!lead) return;

    setUpdating(true);
    setUpdateMessage("");

    try {
      const response = await fetch(`/api/my-leads/${lead.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: newStatus,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setUpdateMessage(data.error || "Unable to update status.");
        return;
      }

      setLead((current) =>
        current
          ? {
              ...current,
              status: data.lead.status,
              updatedAt: data.lead.updatedAt,
            }
          : current
      );

      setUpdateMessage("Status updated.");

      window.setTimeout(() => {
        setUpdateMessage("");
      }, 2500);
    } catch {
      setUpdateMessage("Unable to update status.");
    } finally {
      setUpdating(false);
    }
  }

  if (status === "loading" || loading) {
    return (
      <main className="min-h-screen bg-parchment">
        <div className="mx-auto max-w-4xl px-6 py-20 text-center">
          <p className="text-sm text-ink/50">Loading enquiry...</p>
        </div>
      </main>
    );
  }

  if (!session?.user) {
    return (
      <main className="min-h-screen bg-parchment">
        <section className="bg-acacia py-12 text-parchment">
          <div className="mx-auto max-w-4xl px-6">
            <Link
              href="/"
              className="text-sm text-parchment/70 hover:text-parchment"
            >
              ← Rongai Homes
            </Link>
            <h1 className="mt-6 font-display text-4xl italic">
              Lead details
            </h1>
          </div>
        </section>

        <section className="mx-auto max-w-md px-6 py-16 text-center">
          <div className="rounded-2xl border border-line bg-white p-8 shadow-sm">
            <h2 className="font-display text-2xl text-acacia">
              Sign in to continue
            </h2>
            <p className="mt-3 text-sm leading-6 text-ink/60">
              Sign in to view enquiries connected to your properties.
            </p>
            <Link
              href={`/auth/sign-in?callbackUrl=/dashboard/leads/${params.id}`}
              className="mt-6 block rounded-xl bg-ochre px-6 py-3 text-sm font-semibold text-acacia-dark hover:bg-ochre-dark"
            >
              Sign in
            </Link>
          </div>
        </section>
      </main>
    );
  }

  if (error || !lead) {
    return (
      <main className="min-h-screen bg-parchment">
        <section className="bg-acacia py-12 text-parchment">
          <div className="mx-auto max-w-4xl px-6">
            <Link
              href="/dashboard"
              className="text-sm text-parchment/70 hover:text-parchment"
            >
              ← Back to dashboard
            </Link>
            <h1 className="mt-6 font-display text-4xl italic">
              Lead details
            </h1>
          </div>
        </section>

        <section className="mx-auto max-w-md px-6 py-16">
          <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center">
            <h2 className="font-display text-2xl text-red-800">
              Enquiry unavailable
            </h2>
            <p className="mt-3 text-sm leading-6 text-red-700">
              {error || "The enquiry could not be found."}
            </p>
            <Link
              href="/dashboard"
              className="mt-6 inline-block rounded-xl bg-acacia px-6 py-3 text-sm font-semibold text-parchment"
            >
              Back to dashboard
            </Link>
          </div>
        </section>
      </main>
    );
  }

  const whatsappUrl = lead.contactPhone
    ? `https://wa.me/${lead.contactPhone.replace(/\D/g, "")}`
    : null;

  return (
    <main className="min-h-screen bg-parchment">
      <section className="bg-acacia py-10 text-parchment">
        <div className="mx-auto max-w-4xl px-6">
          <Link
            href="/dashboard"
            className="text-sm text-parchment/70 hover:text-parchment"
          >
            ← Back to dashboard
          </Link>

          <p className="mt-6 eyebrow text-parchment/60">Lead management</p>

          <h1 className="mt-2 font-display text-4xl italic sm:text-5xl">
            Enquiry details
          </h1>

          <p className="mt-3 text-parchment/70">
            {lead.property.neighbourhood.name} · {lead.property.title}
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-6 py-10">
        <div className="space-y-6">
          <article className="rounded-2xl border border-line bg-white p-6 shadow-sm">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-ink/40">
                  Property
                </p>

                <h2 className="mt-2 font-display text-3xl text-acacia">
                  {lead.property.title}
                </h2>

                <p className="mt-2 text-sm text-ink/60">
                  {lead.property.neighbourhood.name}, Ongata Rongai
                </p>
              </div>

              <span
                className={`inline-flex w-fit rounded-full px-3 py-1 text-xs font-semibold ${statusClasses(
                  lead.status
                )}`}
              >
                {lead.status.replaceAll("_", " ")}
              </span>
            </div>

            <div className="mt-6 flex flex-col gap-3 border-t border-line pt-5 sm:flex-row">
              <Link
                href={`/property/${lead.property.id}`}
                className="flex-1 rounded-xl border border-line px-4 py-3 text-center text-sm font-semibold text-acacia transition hover:border-acacia/40 hover:bg-parchment"
              >
                View property
              </Link>
            </div>
          </article>

          <article className="rounded-2xl border border-line bg-white p-6 shadow-sm">
            <p className="eyebrow text-ink/40">Enquirer</p>

            <h2 className="mt-2 font-display text-3xl text-acacia">
              {lead.contactName || "WhatsApp visitor"}
            </h2>

            <div className="mt-6 grid gap-5 border-t border-line pt-5 sm:grid-cols-2">
              <div>
                <p className="text-xs text-ink/40">Phone</p>
                <p className="mt-1 text-sm font-semibold text-ink">
                  {lead.contactPhone || "Not provided"}
                </p>
              </div>

              <div>
                <p className="text-xs text-ink/40">Channel</p>
                <p className="mt-1 text-sm font-semibold text-ink">
                  {lead.channel}
                </p>
              </div>
            </div>

            {whatsappUrl && (
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-6 block rounded-xl bg-ochre px-5 py-3 text-center text-sm font-semibold text-acacia-dark transition hover:bg-ochre-dark"
              >
                Contact via WhatsApp
              </a>
            )}
          </article>

          <article className="rounded-2xl border border-line bg-white p-6 shadow-sm">
            <p className="eyebrow text-ink/40">Enquiry</p>

            <div className="mt-5 rounded-xl bg-parchment p-5">
              <p className="text-xs font-medium uppercase tracking-wide text-ink/40">
                Message
              </p>

              <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-ink/70">
                {lead.message || "No message was provided."}
              </p>
            </div>

            <div className="mt-6 grid gap-5 border-t border-line pt-5 sm:grid-cols-2">
              <div>
                <p className="text-xs text-ink/40">Received</p>
                <p className="mt-1 text-sm font-semibold text-ink">
                  {formatDate(lead.createdAt)}
                </p>
              </div>

              <div>
                <p className="text-xs text-ink/40">Last updated</p>
                <p className="mt-1 text-sm font-semibold text-ink">
                  {formatDate(lead.updatedAt)}
                </p>
              </div>
            </div>
          </article>

          <article className="rounded-2xl border border-line bg-white p-6 shadow-sm">
            <p className="eyebrow text-ink/40">Follow-up</p>

            <label
              htmlFor="lead-status"
              className="mt-3 block text-sm font-semibold text-acacia"
            >
              Enquiry status
            </label>

            <select
              id="lead-status"
              value={lead.status}
              disabled={updating}
              onChange={(event) =>
                updateLeadStatus(event.target.value as LeadStatus)
              }
              className="mt-3 w-full rounded-xl border border-line bg-white px-4 py-3 text-sm font-semibold text-ink outline-none transition focus:border-acacia focus:ring-2 focus:ring-acacia/10 disabled:cursor-wait disabled:opacity-60"
            >
              {leadStatuses.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            {updating && (
              <p className="mt-2 text-xs text-ink/45">
                Saving status...
              </p>
            )}

            {updateMessage && (
              <p
                className={`mt-2 text-xs font-medium ${
                  updateMessage === "Status updated."
                    ? "text-acacia"
                    : "text-red-600"
                }`}
              >
                {updateMessage}
              </p>
            )}
          </article>
        </div>
      </section>
    </main>
  );
}
