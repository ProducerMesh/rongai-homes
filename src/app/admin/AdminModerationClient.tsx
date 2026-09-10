"use client";

import { useEffect, useState } from "react";

type Property = {
  id: string;
  title: string;
  listingStatus: string;
  verification: string;
  createdAt: string;
  neighbourhood?: {
    name: string;
  } | null;
  images: {
    id: string;
    url: string;
    sortOrder: number;
  }[];
};

const statuses = [
  "PENDING_APPROVAL",
  "ACTIVE",
  "REJECTED",
  "SUSPENDED",
] as const;

type Action =
  | "APPROVE"
  | "REJECT"
  | "SUSPEND"
  | "REINSTATE";

export default function AdminModerationClient() {
  const [status, setStatus] = useState("PENDING_APPROVAL");
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState("");

  async function loadProperties(selectedStatus: string) {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        "/api/admin/properties?status=" + selectedStatus,
        {
          cache: "no-store",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Unable to load properties."
        );
      }

      setProperties(data.properties ?? []);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load properties."
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleAction(
    property: Property,
    action: Action
  ) {
    let reason = "";

    if (action === "REJECT" || action === "SUSPEND") {
      const enteredReason = window.prompt(
        action === "REJECT"
          ? "Enter the reason for rejecting this property:"
          : "Enter the reason for suspending this property:"
      );

      if (enteredReason === null) {
        return;
      }

      reason = enteredReason.trim();

      if (!reason) {
        window.alert("A reason is required.");
        return;
      }
    }

    const confirmed = window.confirm(
      action === "APPROVE"
        ? `Approve "${property.title}"?`
        : action === "REINSTATE"
        ? `Reinstate "${property.title}"?`
        : action === "REJECT"
        ? `Reject "${property.title}"?`
        : `Suspend "${property.title}"?`
    );

    if (!confirmed) {
      return;
    }

    try {
      setActionLoading(property.id + action);
      setError("");

      const response = await fetch(
        "/api/admin/properties/" + property.id,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            action,
            reason: reason || undefined,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Unable to update property."
        );
      }

      await loadProperties(status);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to update property."
      );
    } finally {
      setActionLoading("");
    }
  }

  useEffect(() => {
    loadProperties(status);
  }, [status]);

  return (
    <section className="mt-8">
      <div className="flex flex-wrap gap-2">
        {statuses.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setStatus(item)}
            className={
              "rounded-lg px-4 py-2 text-sm font-medium " +
              (status === item
                ? "bg-acacia text-white"
                : "bg-white text-gray-700")
            }
          >
            {item.replaceAll("_", " ")}
          </button>
        ))}
      </div>

      {loading && (
        <div className="mt-6 rounded-xl bg-white p-6">
          Loading properties...
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
            {properties.length} propert
            {properties.length === 1 ? "y" : "ies"}
          </p>

          {properties.length === 0 ? (
            <div className="rounded-xl bg-white p-6 text-gray-600">
              No properties found in this queue.
            </div>
          ) : (
            <div className="space-y-4">
              {properties.map((property) => (
                <article
                  key={property.id}
                  className="rounded-xl bg-white p-5 shadow-sm"
                >
                  <div className="flex gap-4">
                    {property.images[0] && (
                      <img
                        src={property.images[0].url}
                        alt={property.title}
                        className="h-24 w-32 rounded-lg object-cover"
                      />
                    )}

                    <div className="min-w-0 flex-1">
                      <h2 className="text-lg font-semibold text-acacia">
                        {property.title}
                      </h2>

                      <p className="mt-1 text-sm text-gray-600">
                        {property.neighbourhood?.name ??
                          "Location not specified"}
                      </p>

                      <p className="mt-2 text-xs text-gray-500">
                        Status: {property.listingStatus}
                      </p>

                      <p className="text-xs text-gray-500">
                        Property ID: {property.id}
                      </p>

                      <p className="text-xs text-gray-500">
                        Verification: {property.verification}
                      </p>

                      <div className="mt-4 flex flex-wrap gap-2">
                        {property.listingStatus ===
                          "PENDING_APPROVAL" && (
                          <>
                            <button
                              type="button"
                              onClick={() =>
                                handleAction(
                                  property,
                                  "APPROVE"
                                )
                              }
                              disabled={
                                actionLoading.length > 0
                              }
                              className="rounded-lg bg-acacia px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
                            >
                              {actionLoading ===
                              property.id + "APPROVE"
                                ? "Approving..."
                                : "Approve"}
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                handleAction(
                                  property,
                                  "REJECT"
                                )
                              }
                              disabled={
                                actionLoading.length > 0
                              }
                              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
                            >
                              {actionLoading ===
                              property.id + "REJECT"
                                ? "Rejecting..."
                                : "Reject"}
                            </button>
                          </>
                        )}

                        {property.listingStatus === "ACTIVE" && (
                          <button
                            type="button"
                            onClick={() =>
                              handleAction(
                                property,
                                "SUSPEND"
                              )
                            }
                            disabled={
                              actionLoading.length > 0
                            }
                            className="rounded-lg bg-orange-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
                          >
                            {actionLoading ===
                            property.id + "SUSPEND"
                              ? "Suspending..."
                              : "Suspend"}
                          </button>
                        )}

                        {(property.listingStatus ===
                          "REJECTED" ||
                          property.listingStatus ===
                            "SUSPENDED") && (
                          <button
                            type="button"
                            onClick={() =>
                              handleAction(
                                property,
                                "REINSTATE"
                              )
                            }
                            disabled={
                              actionLoading.length > 0
                            }
                            className="rounded-lg bg-acacia px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
                          >
                            {actionLoading ===
                            property.id + "REINSTATE"
                              ? "Reinstating..."
                              : "Reinstate"}
                          </button>
                        )}
                      </div>
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