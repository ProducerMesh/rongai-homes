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

type ViewingStatus =
  | "PENDING"
  | "ACCEPTED"
  | "DECLINED"
  | "RESCHEDULE_REQUESTED"
  | "COMPLETED"
  | "CANCELLED";

type ViewingRequest = {
  id: string;
  propertyId: string;
  tenantId: string;
  preferredDate: string;
  message: string | null;
  status: ViewingStatus;
  createdAt: string;
  updatedAt: string;
  property: {
    id: string;
    title: string;
    neighbourhood: {
      name: string;
    };
  };
  tenant: {
    id: string;
    name: string | null;
    email: string | null;
    phone: string | null;
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

function viewingStatusClasses(status: ViewingStatus) {
  switch (status) {
    case "PENDING":
      return "bg-ochre/15 text-acacia";
    case "ACCEPTED":
      return "bg-acacia/10 text-acacia";
    case "DECLINED":
      return "bg-red-50 text-red-700";
    case "RESCHEDULE_REQUESTED":
      return "bg-clay/10 text-clay";
    case "COMPLETED":
      return "bg-pulse/15 text-acacia";
    case "CANCELLED":
      return "bg-ink/10 text-ink/60";
    default:
      return "bg-ink/10 text-ink/60";
  }
}

function viewingStatusLabel(status: ViewingStatus) {
  switch (status) {
    case "PENDING":
      return "Pending";
    case "ACCEPTED":
      return "Accepted";
    case "DECLINED":
      return "Declined";
    case "RESCHEDULE_REQUESTED":
      return "Reschedule requested";
    case "COMPLETED":
      return "Completed";
    case "CANCELLED":
      return "Cancelled";
    default:
      return "Unknown";
  }
}

export default function DashboardPage() {
  const { data: session, status } = useSession();

  const [properties, setProperties] = useState<Property[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [viewingRequests, setViewingRequests] = useState<ViewingRequest[]>(
    []
  );

  const [loading, setLoading] = useState(true);
  const [leadsLoading, setLeadsLoading] = useState(true);
  const [viewingsLoading, setViewingsLoading] = useState(true);

  const [error, setError] = useState("");
  const [leadsError, setLeadsError] = useState("");
  const [viewingsError, setViewingsError] = useState("");

  const [updatingLeadId, setUpdatingLeadId] = useState<string | null>(null);
  const [updatingViewingId, setUpdatingViewingId] = useState<string | null>(
    null
  );

  const [updateMessage, setUpdateMessage] = useState<Record<string, string>>(
    {}
  );

  async function updateViewingRequestStatus(
    requestId: string,
    newStatus: ViewingStatus
  ) {
    setUpdatingViewingId(requestId);
    setViewingsError("");

    try {
      const response = await fetch(
        `/api/my-viewing-requests/${requestId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            status: newStatus,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Unable to update the viewing request."
        );
      }

      setViewingRequests((currentRequests) =>
        currentRequests.map((request) =>
          request.id === requestId
            ? { ...request, status: data.request.status }
            : request
        )
      );
    } catch (error) {
      setViewingsError(
        error instanceof Error
          ? error.message
          : "Unable to update the viewing request."
      );
    } finally {
      setUpdatingViewingId(null);
    }
  }

  useEffect(() => {
    if (status !== "authenticated") {
      return;
    }

    async function loadDashboard() {
      try {
        if (session?.user?.role === "TENANT") {
          const viewingsResponse = await fetch(
            "/api/my-viewing-requests/tenant"
          );
          const viewingsData = await viewingsResponse.json();

          if (!viewingsResponse.ok) {
            setViewingsError(
              viewingsData.error || "Unable to load your viewing requests."
            );
          } else {
            setViewingRequests(viewingsData.viewingRequests || []);
          }

          return;
        }

        const [listingsResponse, leadsResponse, viewingsResponse] =
          await Promise.all([
            fetch("/api/my-listings"),
            fetch("/api/my-leads"),
            fetch("/api/my-viewing-requests"),
          ]);

        const listingsData = await listingsResponse.json();
        const leadsData = await leadsResponse.json();
        const viewingsData = await viewingsResponse.json();

        if (!listingsResponse.ok) {
          setError(listingsData.error || "Unable to load your listings.");
        } else {
          setProperties(listingsData.properties || []);
        }

        if (!leadsResponse.ok) {
          setLeadsError(leadsData.error || "Unable to load your enquiries.");
        } else {
          setLeads(leadsData.leads || []);
        }

        if (!viewingsResponse.ok) {
          setViewingsError(
            viewingsData.error || "Unable to load viewing requests."
          );
        } else {
          setViewingRequests(viewingsData.viewingRequests || []);
        }
      } catch {
        setError("Unable to load your dashboard.");
        setLeadsError("Unable to load your enquiries.");
        setViewingsError("Unable to load viewing requests.");
      } finally {
        setLoading(false);
        setLeadsLoading(false);
        setViewingsLoading(false);
      }
    }

    loadDashboard();
  }, [status]);

  async function updateLeadStatus(leadId: string, newStatus: LeadStatus) {
    setUpdatingLeadId(leadId);

    setUpdateMessage((current) => ({
      ...current,
      [leadId]: "",
    }));

    try {
      const response = await fetch(`/api/my-leads/${leadId}`, {
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
        setUpdateMessage((current) => ({
          ...current,
          [leadId]: data.error || "Unable to update status.",
        }));

        return;
      }

      setLeads((current) =>
        current.map((lead) =>
          lead.id === leadId
            ? {
                ...lead,
                status: data.lead.status,
                updatedAt: data.lead.updatedAt,
              }
            : lead
        )
      );

      setUpdateMessage((current) => ({
        ...current,
        [leadId]: "Status updated.",
      }));

      window.setTimeout(() => {
        setUpdateMessage((current) => ({
          ...current,
          [leadId]: "",
        }));
      }, 2500);
    } catch {
      setUpdateMessage((current) => ({
        ...current,
        [leadId]: "Unable to update status.",
      }));
    } finally {
      setUpdatingLeadId(null);
    }
  }

  async function cancelTenantViewingRequest(requestId: string) {
    if (!window.confirm("Cancel this viewing request?")) {
      return;
    }

    setUpdatingViewingId(requestId);
    setViewingsError("");

    try {
      const response = await fetch(
        `/api/my-viewing-requests/tenant/${requestId}`,
        {
          method: "PATCH",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setViewingsError(
          data.error || "Unable to cancel the viewing request."
        );
        return;
      }

      setViewingRequests((current) =>
        current.map((request) =>
          request.id === requestId
            ? {
                ...request,
                status: data.request.status,
                updatedAt: data.request.updatedAt,
              }
            : request
        )
      );
    } catch {
      setViewingsError("Unable to cancel the viewing request.");
    } finally {
      setUpdatingViewingId(null);
    }
  }

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

  if (session.user.role === "TENANT") {
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

            <div className="mt-6">
              <p className="eyebrow text-parchment/60">Tenant dashboard</p>

              <h1 className="mt-2 font-display text-4xl italic sm:text-5xl">
                My viewing requests
              </h1>

              <p className="mt-3 max-w-xl text-parchment/75">
                Keep track of properties you have requested to view and the
                response from the person managing each property.
              </p>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-6 py-10">
          {viewingsLoading ? (
            <div className="rounded-2xl border border-line bg-white p-8 text-center shadow-sm">
              <p className="text-sm text-ink/50">
                Loading your viewing requests...
              </p>
            </div>
          ) : viewingsError ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
              {viewingsError}
            </div>
          ) : viewingRequests.length === 0 ? (
            <div className="rounded-2xl border border-line bg-white p-8 text-center shadow-sm">
              <h2 className="font-display text-2xl text-acacia">
                No viewing requests yet
              </h2>

              <p className="mt-3 text-sm leading-6 text-ink/60">
                When you request a property viewing, it will appear here so
                you can track its status.
              </p>

              <Link
                href="/search"
                className="mt-6 inline-block rounded-xl bg-ochre px-6 py-3 text-sm font-semibold text-acacia-dark hover:bg-ochre-dark"
              >
                Find a home
              </Link>
            </div>
          ) : (
            <div className="space-y-5">
              {viewingRequests.map((request) => (
                <article
                  key={request.id}
                  className="rounded-2xl border border-line bg-white p-6 shadow-sm"
                >
                  <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-ink/40">
                        Viewing request
                      </p>

                      <h2 className="mt-2 font-display text-2xl text-acacia">
                        {request.property.title}
                      </h2>

                      <p className="mt-1 text-sm text-ink/60">
                        {request.property.neighbourhood.name}
                      </p>
                    </div>

                    <span
                      className={`inline-flex w-fit rounded-full px-3 py-1 text-xs font-semibold ${viewingStatusClasses(
                        request.status
                      )}`}
                    >
                      {viewingStatusLabel(request.status)}
                    </span>
                  </div>

                  <div className="mt-6 grid gap-4 sm:grid-cols-2">
                    <div className="rounded-xl bg-parchment p-4">
                      <p className="text-xs font-medium uppercase tracking-wide text-ink/40">
                        Preferred viewing
                      </p>

                      <p className="mt-1 text-sm font-semibold text-acacia">
                        {formatDate(request.preferredDate)}
                      </p>
                    </div>

                    <div className="rounded-xl bg-parchment p-4">
                      <p className="text-xs font-medium uppercase tracking-wide text-ink/40">
                        Request submitted
                      </p>

                      <p className="mt-1 text-sm font-semibold text-acacia">
                        {formatDate(request.createdAt)}
                      </p>
                    </div>
                  </div>

                  {request.message && (
                    <div className="mt-5">
                      <p className="text-xs font-medium uppercase tracking-wide text-ink/40">
                        Your message
                      </p>

                      <p className="mt-2 text-sm leading-6 text-ink/70">
                        {request.message}
                      </p>
                    </div>
                  )}

                  <div className="mt-6 flex flex-wrap gap-3">
                    <Link
                      href={`/property/${request.property.id}`}
                      className="inline-flex rounded-xl border border-acacia px-5 py-3 text-sm font-semibold text-acacia hover:bg-acacia hover:text-parchment"
                    >
                      View property
                    </Link>

                    {["PENDING", "ACCEPTED", "RESCHEDULE_REQUESTED"].includes(
                      request.status
                    ) && (
                      <button
                        type="button"
                        onClick={() => cancelTenantViewingRequest(request.id)}
                        disabled={updatingViewingId === request.id}
                        className="inline-flex rounded-xl border border-red-200 px-5 py-3 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {updatingViewingId === request.id
                          ? "Cancelling..."
                          : "Cancel viewing"}
                      </button>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>
    );
  }

  const newLeads = leads.filter((lead) => lead.status === "NEW").length;

  const pendingViewingRequests = viewingRequests.filter(
    (request) => request.status === "PENDING"
  ).length;

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
              <p className="eyebrow text-parchment/60">
                Landlord dashboard
              </p>

              <h1 className="mt-2 font-display text-4xl italic sm:text-5xl">
                My dashboard
              </h1>

              <p className="mt-3 max-w-xl text-parchment/75">
                Manage your properties and stay on top of enquiries from
                prospective tenants and buyers.
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
        <div className="mb-10 grid gap-4 sm:grid-cols-4">
          <div className="rounded-2xl border border-line bg-white p-6 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-wide text-ink/40">
              My properties
            </p>

            <p className="mt-2 font-display text-3xl text-acacia">
              {properties.length}
            </p>
          </div>

          <div className="rounded-2xl border border-line bg-white p-6 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-wide text-ink/40">
              Total enquiries
            </p>

            <p className="mt-2 font-display text-3xl text-acacia">
              {leads.length}
            </p>
          </div>

          <div className="rounded-2xl border border-line bg-white p-6 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-wide text-ink/40">
              New enquiries
            </p>

            <p className="mt-2 font-display text-3xl text-acacia">
              {newLeads}
            </p>
          </div>

          <div className="rounded-2xl border border-line bg-white p-6 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-wide text-ink/40">
              Pending viewings
            </p>

            <p className="mt-2 font-display text-3xl text-acacia">
              {pendingViewingRequests}
            </p>
          </div>
        </div>

        <section>
          <div className="mb-5 flex items-end justify-between gap-4">
            <div>
              <p className="eyebrow text-ink/40">Viewing management</p>

              <h2 className="mt-2 font-display text-3xl italic text-acacia">
                Viewing requests
              </h2>

              <p className="mt-2 text-sm leading-6 text-ink/60">
                Tenants who have requested to view one of your properties.
              </p>
            </div>
          </div>

          {viewingsLoading && (
            <div className="rounded-2xl border border-line bg-white p-8 text-center shadow-sm">
              <p className="text-sm text-ink/50">
                Loading viewing requests...
              </p>
            </div>
          )}

          {viewingsError && (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-5">
              <p className="text-sm font-medium text-red-700">
                {viewingsError}
              </p>
            </div>
          )}

          {!viewingsLoading &&
            !viewingsError &&
            viewingRequests.length === 0 && (
              <div className="rounded-2xl border border-line bg-white p-10 text-center shadow-sm">
                <h3 className="font-display text-2xl text-acacia">
                  No viewing requests yet
                </h3>

                <p className="mt-3 text-sm leading-6 text-ink/60">
                  When a tenant requests to view one of your properties, the
                  request will appear here.
                </p>
              </div>
            )}

          {!viewingsLoading &&
            !viewingsError &&
            viewingRequests.length > 0 && (
              <div className="space-y-5">
                {viewingRequests.map((request) => (
                  <article
                    key={request.id}
                    className="rounded-2xl border border-line bg-white p-6 shadow-sm"
                  >
                    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                      <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-ink/40">
                          {request.property.neighbourhood.name}
                        </p>

                        <h3 className="mt-2 font-display text-2xl text-acacia">
                          {request.property.title}
                        </h3>

                        <p className="mt-2 text-xs text-ink/45">
                          Requested {formatDate(request.createdAt)}
                        </p>
                      </div>

                      <span
                        className={`inline-flex w-fit rounded-full px-3 py-1 text-xs font-semibold ${viewingStatusClasses(
                          request.status
                        )}`}
                      >
                        {viewingStatusLabel(request.status)}
                      </span>
                    </div>

                    <div className="mt-5 grid gap-4 border-t border-line pt-5 sm:grid-cols-2">
                      <div>
                        <p className="text-xs text-ink/40">
                          Preferred viewing
                        </p>

                        <p className="mt-1 text-sm font-semibold text-ink">
                          {formatDate(request.preferredDate)}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-ink/40">Tenant</p>

                        <p className="mt-1 text-sm font-semibold text-ink">
                          {request.tenant.name || "Rongai Homes tenant"}
                        </p>

                        {request.tenant.phone && (
                          <p className="mt-1 text-xs text-ink/50">
                            {request.tenant.phone}
                          </p>
                        )}

                        {request.tenant.email && (
                          <p className="mt-1 text-xs text-ink/50">
                            {request.tenant.email}
                          </p>
                        )}
                      </div>
                    </div>

                    {request.message && (
                      <div className="mt-5 rounded-xl bg-parchment p-4">
                        <p className="text-xs font-medium uppercase tracking-wide text-ink/40">
                          Tenant message
                        </p>

                        <p className="mt-2 text-sm leading-6 text-ink/70">
                          {request.message}
                        </p>
                      </div>
                    )}

                    <div className="mt-5 border-t border-line pt-5">
                      <p className="mb-3 text-xs font-medium uppercase tracking-wide text-ink/40">
                        Manage request
                      </p>

                      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                        {(request.status === "PENDING" ||
                          request.status === "RESCHEDULE_REQUESTED") && (
                          <>
                            <button
                              type="button"
                              onClick={() =>
                                updateViewingRequestStatus(
                                  request.id,
                                  "ACCEPTED"
                                )
                              }
                              disabled={updatingViewingId === request.id}
                              className="flex-1 rounded-xl bg-acacia px-4 py-3 text-sm font-semibold text-white transition hover:bg-acacia-dark disabled:cursor-wait disabled:opacity-60"
                            >
                              {updatingViewingId === request.id
                                ? "Updating..."
                                : "Accept"}
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                updateViewingRequestStatus(
                                  request.id,
                                  "DECLINED"
                                )
                              }
                              disabled={updatingViewingId === request.id}
                              className="flex-1 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 transition hover:bg-red-100 disabled:cursor-wait disabled:opacity-60"
                            >
                              Decline
                            </button>
                          </>
                        )}

                        {(request.status === "PENDING" ||
                          request.status === "ACCEPTED") && (
                          <button
                            type="button"
                            onClick={() =>
                              updateViewingRequestStatus(
                                request.id,
                                "RESCHEDULE_REQUESTED"
                              )
                            }
                            disabled={updatingViewingId === request.id}
                            className="flex-1 rounded-xl border border-line bg-white px-4 py-3 text-sm font-semibold text-acacia transition hover:bg-parchment disabled:cursor-wait disabled:opacity-60"
                          >
                            Request reschedule
                          </button>
                        )}

                        {request.status === "ACCEPTED" && (
                          <button
                            type="button"
                            onClick={() =>
                              updateViewingRequestStatus(
                                request.id,
                                "COMPLETED"
                              )
                            }
                            disabled={updatingViewingId === request.id}
                            className="flex-1 rounded-xl border border-acacia/20 bg-acacia/5 px-4 py-3 text-sm font-semibold text-acacia transition hover:bg-acacia/10 disabled:cursor-wait disabled:opacity-60"
                          >
                            Mark completed
                          </button>
                        )}

                        {request.status === "ACCEPTED" && (
                          <button
                            type="button"
                            onClick={() =>
                              updateViewingRequestStatus(
                                request.id,
                                "CANCELLED"
                              )
                            }
                            disabled={updatingViewingId === request.id}
                            className="flex-1 rounded-xl border border-line bg-white px-4 py-3 text-sm font-semibold text-ink/60 transition hover:bg-parchment disabled:cursor-wait disabled:opacity-60"
                          >
                            Cancel
                          </button>
                        )}
                      </div>

                      {request.status === "DECLINED" && (
                        <p className="mt-3 text-xs text-ink/45">
                          This viewing request has been declined.
                        </p>
                      )}

                      {request.status === "COMPLETED" && (
                        <p className="mt-3 text-xs text-ink/45">
                          This viewing has been marked as completed.
                        </p>
                      )}

                      {request.status === "CANCELLED" && (
                        <p className="mt-3 text-xs text-ink/45">
                          This viewing request has been cancelled.
                        </p>
                      )}
                    </div>

                    <div className="mt-5 flex flex-col gap-3 border-t border-line pt-5 sm:flex-row">
                      <Link
                        href={`/property/${request.property.id}`}
                        className="flex-1 rounded-xl border border-line px-4 py-3 text-center text-sm font-semibold text-acacia transition hover:border-acacia/40 hover:bg-parchment"
                      >
                        View property
                      </Link>
                    </div>
                  </article>
                ))}
              </div>
            )}
        </section>

        <section className="mt-14">
          <div className="mb-5 flex items-end justify-between gap-4">
            <div>
              <p className="eyebrow text-ink/40">Lead management</p>

              <h2 className="mt-2 font-display text-3xl italic text-acacia">
                Enquiries
              </h2>

              <p className="mt-2 text-sm leading-6 text-ink/60">
                People who have contacted Rongai Homes about your properties.
              </p>
            </div>
          </div>

          {leadsLoading && (
            <div className="rounded-2xl border border-line bg-white p-8 text-center shadow-sm">
              <p className="text-sm text-ink/50">
                Loading your enquiries...
              </p>
            </div>
          )}

          {leadsError && (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-5">
              <p className="text-sm font-medium text-red-700">
                {leadsError}
              </p>
            </div>
          )}

          {!leadsLoading && !leadsError && leads.length === 0 && (
            <div className="rounded-2xl border border-line bg-white p-10 text-center shadow-sm">
              <h3 className="font-display text-2xl text-acacia">
                No enquiries yet
              </h3>

              <p className="mt-3 text-sm leading-6 text-ink/60">
                When someone contacts Rongai Homes about one of your
                properties, their enquiry will appear here.
              </p>
            </div>
          )}

          {!leadsLoading && !leadsError && leads.length > 0 && (
            <div className="space-y-5">
              {leads.map((lead) => (
                <article
                  key={lead.id}
                  className="rounded-2xl border border-line bg-white p-6 shadow-sm"
                >
                  <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-ink/40">
                        {lead.property.neighbourhood.name}
                      </p>

                      <h3 className="mt-2 font-display text-2xl text-acacia">
                        {lead.property.title}
                      </h3>

                      <p className="mt-2 text-xs text-ink/45">
                        Received {formatDate(lead.createdAt)}
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

                  <div className="mt-5 grid gap-4 border-t border-line pt-5 sm:grid-cols-2">
                    <div>
                      <p className="text-xs text-ink/40">Channel</p>

                      <p className="mt-1 text-sm font-semibold text-ink">
                        {lead.channel}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-ink/40">Enquirer</p>

                      <p className="mt-1 text-sm font-semibold text-ink">
                        {lead.contactName || "WhatsApp visitor"}
                      </p>
                    </div>
                  </div>

                  {lead.message && (
                    <div className="mt-5 rounded-xl bg-parchment p-4">
                      <p className="text-xs font-medium uppercase tracking-wide text-ink/40">
                        Enquiry message
                      </p>

                      <p className="mt-2 text-sm leading-6 text-ink/70">
                        {lead.message}
                      </p>
                    </div>
                  )}

                  <div className="mt-5 grid gap-4 border-t border-line pt-5 sm:grid-cols-2">
                    <div>
                      <label
                        htmlFor={`lead-status-${lead.id}`}
                        className="text-xs font-medium uppercase tracking-wide text-ink/40"
                      >
                        Update status
                      </label>

                      <select
                        id={`lead-status-${lead.id}`}
                        value={lead.status}
                        disabled={updatingLeadId === lead.id}
                        onChange={(event) =>
                          updateLeadStatus(
                            lead.id,
                            event.target.value as LeadStatus
                          )
                        }
                        className="mt-2 w-full rounded-xl border border-line bg-white px-4 py-3 text-sm font-semibold text-ink outline-none transition focus:border-acacia focus:ring-2 focus:ring-acacia/10 disabled:cursor-wait disabled:opacity-60"
                      >
                        {leadStatuses.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>

                      {updatingLeadId === lead.id && (
                        <p className="mt-2 text-xs text-ink/45">
                          Saving status...
                        </p>
                      )}

                      {updateMessage[lead.id] && (
                        <p
                          className={`mt-2 text-xs font-medium ${
                            updateMessage[lead.id] === "Status updated."
                              ? "text-acacia"
                              : "text-red-600"
                          }`}
                        >
                          {updateMessage[lead.id]}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="mt-5 flex flex-col gap-3 border-t border-line pt-5 sm:flex-row">
                    <Link
                      href={`/dashboard/leads/${lead.id}`}
                      className="flex-1 rounded-xl bg-ochre px-4 py-3 text-center text-sm font-semibold text-acacia-dark transition hover:bg-ochre-dark"
                    >
                      View enquiry
                    </Link>

                    <Link
                      href={`/property/${lead.property.id}`}
                      className="flex-1 rounded-xl border border-line px-4 py-3 text-center text-sm font-semibold text-acacia transition hover:border-acacia/40 hover:bg-parchment"
                    >
                      View property
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="mt-14">
          <div className="mb-5">
            <p className="eyebrow text-ink/40">Property management</p>

            <h2 className="mt-2 font-display text-3xl italic text-acacia">
              My listings
            </h2>

            <p className="mt-2 text-sm leading-6 text-ink/60">
              Manage your properties and keep their availability up to date.
            </p>
          </div>

          {loading && (
            <div className="rounded-2xl border border-line bg-white p-8 text-center">
              <p className="text-sm text-ink/50">
                Loading your listings...
              </p>
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

                <div className="mt-6 flex flex-col gap-3 border-t border-line px-6 pb-6 pt-5 sm:flex-row">
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
      </section>
    </main>
  );
}
