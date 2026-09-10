"use client";

import { useEffect, useState } from "react";

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
    listingStatus: string;
    neighbourhood: {
      name: string;
    } | null;
  };
  tenant: {
    id: string;
    name: string | null;
    email: string | null;
    phone: string | null;
    role: string;
  };
};

const statuses = [
  { value: "", label: "All" },
  { value: "PENDING", label: "Pending" },
  { value: "ACCEPTED", label: "Accepted" },
  {
    value: "RESCHEDULE_REQUESTED",
    label: "Reschedule Requested",
  },
  { value: "COMPLETED", label: "Completed" },
  { value: "DECLINED", label: "Declined" },
  { value: "CANCELLED", label: "Cancelled" },
] as const;

function formatDate(date: string) {
  return new Intl.DateTimeFormat("en-KE", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Africa/Nairobi",
  }).format(new Date(date));
}

function getStatusClasses(status: ViewingStatus) {
  switch (status) {
    case "PENDING":
      return "bg-yellow-100 text-yellow-800";

    case "ACCEPTED":
      return "bg-green-100 text-green-800";

    case "RESCHEDULE_REQUESTED":
      return "bg-blue-100 text-blue-800";

    case "COMPLETED":
      return "bg-emerald-100 text-emerald-800";

    case "DECLINED":
      return "bg-red-100 text-red-800";

    case "CANCELLED":
      return "bg-gray-100 text-gray-700";

    default:
      return "bg-gray-100 text-gray-700";
  }
}

export default function AdminViewingRequestsClient() {
  const [status, setStatus] = useState("");
  const [viewingRequests, setViewingRequests] = useState<
    ViewingRequest[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadViewingRequests(selectedStatus: string) {
    try {
      setLoading(true);
      setError("");

      const query = selectedStatus
        ? "?status=" + selectedStatus
        : "";

      const response = await fetch(
        "/api/admin/viewing-requests" + query,
        {
          cache: "no-store",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Unable to load viewing requests."
        );
      }

      setViewingRequests(data.viewingRequests ?? []);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load viewing requests."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadViewingRequests(status);
  }, [status]);

  return (
    <section className="mt-10">
      <div>
        <h2 className="text-2xl font-bold text-acacia">
          Viewing Requests
        </h2>

        <p className="mt-1 text-sm text-gray-600">
          Monitor property viewing requests across Rongai Homes.
        </p>
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        {statuses.map((item) => (
          <button
            key={item.value}
            type="button"
            onClick={() => setStatus(item.value)}
            className={
              "rounded-lg px-4 py-2 text-sm font-medium " +
              (status === item.value
                ? "bg-acacia text-white"
                : "bg-white text-gray-700")
            }
          >
            {item.label}
          </button>
        ))}
      </div>

      {loading && (
        <div className="mt-6 rounded-xl bg-white p-6">
          Loading viewing requests...
        </div>
      )}

      {error && (
        <div className="mt-6 rounded-xl bg-white p-6 text-red-600">
          {error}
        </div>
      )}

      {!loading && !error && (
        <div className="mt-6">
          <p className="mb-4 text-sm text-gray-500">
            {viewingRequests.length} request
            {viewingRequests.length === 1 ? "" : "s"}
          </p>

          {viewingRequests.length === 0 ? (
            <div className="rounded-xl bg-white p-6 text-gray-600">
              No viewing requests found in this queue.
            </div>
          ) : (
            <div className="space-y-4">
              {viewingRequests.map((viewingRequest) => (
                <article
                  key={viewingRequest.id}
                  className="rounded-xl bg-white p-5 shadow-sm"
                >
                  <div className="flex flex-col gap-5">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-acacia">
                          {viewingRequest.property.title}
                        </h3>

                        <p className="mt-1 text-sm text-gray-600">
                          {viewingRequest.property.neighbourhood
                            ?.name ?? "Location not specified"}
                        </p>
                      </div>

                      <span
                        className={
                          "w-fit rounded-full px-3 py-1 text-xs font-semibold " +
                          getStatusClasses(viewingRequest.status)
                        }
                      >
                        {viewingRequest.status.replaceAll(
                          "_",
                          " "
                        )}
                      </span>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                          Tenant
                        </p>

                        <p className="mt-1 font-medium text-gray-800">
                          {viewingRequest.tenant.name ??
                            "Name not provided"}
                        </p>

                        {viewingRequest.tenant.phone && (
                          <p className="text-sm text-gray-600">
                            {viewingRequest.tenant.phone}
                          </p>
                        )}

                        {viewingRequest.tenant.email && (
                          <p className="text-sm text-gray-600">
                            {viewingRequest.tenant.email}
                          </p>
                        )}
                      </div>

                      <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                          Requested Viewing
                        </p>

                        <p className="mt-1 font-medium text-gray-800">
                          {formatDate(
                            viewingRequest.preferredDate
                          )}
                        </p>

                        <p className="text-sm text-gray-500">
                          Kenya time
                        </p>
                      </div>
                    </div>

                    {viewingRequest.message && (
                      <div className="rounded-lg bg-gray-50 p-4">
                        <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                          Tenant Message
                        </p>

                        <p className="mt-1 text-sm text-gray-700">
                          {viewingRequest.message}
                        </p>
                      </div>
                    )}

                    <div className="border-t pt-3 text-xs text-gray-500">
                      <p>
                        Request ID: {viewingRequest.id}
                      </p>

                      <p className="mt-1">
                        Created:{" "}
                        {formatDate(viewingRequest.createdAt)}
                      </p>

                      <p className="mt-1">
                        Last updated:{" "}
                        {formatDate(viewingRequest.updatedAt)}
                      </p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
