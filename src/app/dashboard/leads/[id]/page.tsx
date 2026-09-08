"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useParams } from "next/navigation";

type LeadStatus =
  | "NEW"
  | "CONTACTED"
  | "ASSIGNED"
  | "VIEWING_SCHEDULED"
  | "COMPLETED"
  | "CLOSED";

type Assignee = {
  id: string;
  name: string | null;
  phone: string | null;
  role: "AGENT" | "CARETAKER";
  agentProfile: {
    agencyName: string | null;
  } | null;
};

type Lead = {
  id: string;
  channel: "WHATSAPP" | "WEBSITE" | "PHONE";
  status: LeadStatus;
  contactName: string | null;
  contactPhone: string | null;
  message: string | null;
  createdAt: string;
  updatedAt: string;
  assignedToId: string | null;
  assignedTo: Assignee | null;
  property: {
    id: string;
    title: string;
    neighbourhood: {
      name: string;
    };
  };
};

const statusOptions: { value: LeadStatus; label: string }[] = [
  { value: "NEW", label: "New" },
  { value: "CONTACTED", label: "Contacted" },
  { value: "ASSIGNED", label: "Assigned" },
  { value: "VIEWING_SCHEDULED", label: "Viewing scheduled" },
  { value: "COMPLETED", label: "Completed" },
  { value: "CLOSED", label: "Closed" },
];

function statusLabel(status: LeadStatus) {
  return (
    statusOptions.find((option) => option.value === status)?.label ?? status
  );
}

function formatDate(date: string) {
  return new Date(date).toLocaleString("en-KE", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default function LeadDetailsPage() {
  const { data: session, status: sessionStatus } = useSession();
  const params = useParams<{ id: string }>();

  const [lead, setLead] = useState<Lead | null>(null);
  const [assignees, setAssignees] = useState<Assignee[]>([]);
  const [selectedAssignee, setSelectedAssignee] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<LeadStatus>("NEW");

  const [loading, setLoading] = useState(true);
  const [assigneesLoading, setAssigneesLoading] = useState(true);
  const [savingStatus, setSavingStatus] = useState(false);
  const [savingAssignment, setSavingAssignment] = useState(false);

  const [error, setError] = useState("");
  const [assignmentMessage, setAssignmentMessage] = useState("");
  const [statusMessage, setStatusMessage] = useState("");

  useEffect(() => {
    if (sessionStatus !== "authenticated" || !params.id) {
      return;
    }

    async function loadLead() {
      setLoading(true);
      setError("");

      try {
        const response = await fetch(`/api/my-leads/${params.id}`, {
          cache: "no-store",
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Unable to load the enquiry.");
        }

        setLead(data.lead);
        setSelectedStatus(data.lead.status);
        setSelectedAssignee(data.lead.assignedToId ?? "");
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Unable to load the enquiry."
        );
      } finally {
        setLoading(false);
      }
    }

    async function loadAssignees() {
      setAssigneesLoading(true);

      try {
        const response = await fetch("/api/my-leads/assignees", {
          cache: "no-store",
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Unable to load assignees.");
        }

        setAssignees(data.assignees ?? []);
      } catch (err) {
        console.error("LEAD_ASSIGNEES_LOAD_ERROR", err);
      } finally {
        setAssigneesLoading(false);
      }
    }

    loadLead();
    loadAssignees();
  }, [sessionStatus, params.id]);

  async function updateStatus() {
    if (!lead) {
      return;
    }

    setSavingStatus(true);
    setStatusMessage("");

    try {
      const response = await fetch(`/api/my-leads/${lead.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: selectedStatus,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to update the enquiry.");
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

      setStatusMessage("Status updated.");
    } catch (err) {
      setStatusMessage(
        err instanceof Error
          ? err.message
          : "Unable to update the enquiry."
      );
    } finally {
      setSavingStatus(false);
    }
  }

  async function updateAssignment() {
    if (!lead) {
      return;
    }

    setSavingAssignment(true);
    setAssignmentMessage("");

    try {
      const response = await fetch(`/api/my-leads/${lead.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          assignedToId: selectedAssignee || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to assign the enquiry.");
      }

      setLead((current) =>
        current
          ? {
              ...current,
              assignedToId: data.lead.assignedToId,
              assignedTo: data.lead.assignedTo,
              updatedAt: data.lead.updatedAt,
            }
          : current
      );

      setAssignmentMessage(
        selectedAssignee
          ? "Enquiry assigned successfully."
          : "Assignment removed."
      );
    } catch (err) {
      setAssignmentMessage(
        err instanceof Error
          ? err.message
          : "Unable to assign the enquiry."
      );
    } finally {
      setSavingAssignment(false);
    }
  }

  if (sessionStatus === "loading" || loading) {
    return (
      <main className="min-h-screen bg-parchment px-4 py-10">
        <div className="mx-auto max-w-4xl">
          <p className="text-sm text-ink/60">Loading enquiry...</p>
        </div>
      </main>
    );
  }

  if (!session) {
    return (
      <main className="min-h-screen bg-parchment px-4 py-10">
        <div className="mx-auto max-w-4xl rounded-2xl border border-line bg-white p-8">
          <h1 className="text-2xl font-bold text-ink">
            Sign in required
          </h1>
          <p className="mt-2 text-sm text-ink/70">
            Please sign in to view this enquiry.
          </p>
        </div>
      </main>
    );
  }

  if (error || !lead) {
    return (
      <main className="min-h-screen bg-parchment px-4 py-10">
        <div className="mx-auto max-w-4xl rounded-2xl border border-line bg-white p-8">
          <h1 className="text-2xl font-bold text-ink">
            Unable to load enquiry
          </h1>
          <p className="mt-2 text-sm text-ink/70">
            {error || "The enquiry could not be found."}
          </p>

          <Link
            href="/dashboard"
            className="mt-6 inline-block rounded-xl bg-acacia px-5 py-3 text-sm font-semibold text-white"
          >
            Back to dashboard
          </Link>
        </div>
      </main>
    );
  }

  const whatsappUrl = lead.contactPhone
    ? `https://wa.me/${lead.contactPhone.replace(/\D/g, "")}`
    : null;

  return (
    <main className="min-h-screen bg-parchment px-4 py-8">
      <div className="mx-auto max-w-4xl">
        <Link
          href="/dashboard"
          className="text-sm font-semibold text-acacia hover:underline"
        >
          ← Back to dashboard
        </Link>

        <div className="mt-6 rounded-2xl border border-line bg-white p-6 shadow-sm sm:p-8">
          <div className="flex flex-col gap-4 border-b border-line pb-6 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm font-medium text-ink/60">
                Enquiry for
              </p>

              <h1 className="mt-1 text-2xl font-bold text-ink">
                {lead.property.title}
              </h1>

              <p className="mt-1 text-sm text-ink/60">
                {lead.property.neighbourhood.name}
              </p>
            </div>

            <span className="inline-flex w-fit rounded-full bg-ochre/20 px-3 py-1 text-xs font-semibold text-ink">
              {statusLabel(lead.status)}
            </span>
          </div>

          <div className="mt-6 grid gap-6 md:grid-cols-2">
            <section>
              <h2 className="text-sm font-semibold uppercase tracking-wide text-ink/50">
                Enquirer
              </h2>

              <div className="mt-3 space-y-2 text-sm text-ink">
                <p>
                  <span className="font-semibold">Name:</span>{" "}
                  {lead.contactName || "Not provided"}
                </p>

                <p>
                  <span className="font-semibold">Phone:</span>{" "}
                  {lead.contactPhone || "Not provided"}
                </p>

                <p>
                  <span className="font-semibold">Channel:</span>{" "}
                  {lead.channel}
                </p>
              </div>

              {whatsappUrl && (
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-4 inline-block rounded-xl bg-acacia px-4 py-3 text-sm font-semibold text-white transition hover:bg-acacia-light"
                >
                  Contact via WhatsApp
                </a>
              )}
            </section>

            <section>
              <h2 className="text-sm font-semibold uppercase tracking-wide text-ink/50">
                Enquiry details
              </h2>

              <div className="mt-3 space-y-2 text-sm text-ink">
                <p>
                  <span className="font-semibold">Received:</span>{" "}
                  {formatDate(lead.createdAt)}
                </p>

                <p>
                  <span className="font-semibold">Last updated:</span>{" "}
                  {formatDate(lead.updatedAt)}
                </p>

                <p>
                  <span className="font-semibold">Property:</span>{" "}
                  <Link
                    href={`/property/${lead.property.id}`}
                    className="text-acacia hover:underline"
                  >
                    View property
                  </Link>
                </p>
              </div>
            </section>
          </div>

          <section className="mt-8 border-t border-line pt-6">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-ink/50">
              Message
            </h2>

            <div className="mt-3 rounded-xl bg-parchment p-4 text-sm leading-6 text-ink">
              {lead.message || "No message was provided."}
            </div>
          </section>

          <section className="mt-8 border-t border-line pt-6">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-ink/50">
              Manage enquiry
            </h2>

            <div className="mt-4 grid gap-6 md:grid-cols-2">
              <div>
                <label
                  htmlFor="lead-status"
                  className="block text-sm font-semibold text-ink"
                >
                  Status
                </label>

                <select
                  id="lead-status"
                  value={selectedStatus}
                  onChange={(event) =>
                    setSelectedStatus(event.target.value as LeadStatus)
                  }
                  className="mt-2 w-full rounded-xl border border-line bg-white px-4 py-3 text-sm text-ink outline-none focus:border-ochre"
                >
                  {statusOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  onClick={updateStatus}
                  disabled={savingStatus}
                  className="mt-3 rounded-xl bg-ochre px-5 py-3 text-sm font-semibold text-acacia-dark transition hover:bg-ochre-dark disabled:cursor-wait disabled:opacity-70"
                >
                  {savingStatus ? "Saving status..." : "Update status"}
                </button>

                {statusMessage && (
                  <p className="mt-2 text-sm text-ink/60">
                    {statusMessage}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="lead-assignee"
                  className="block text-sm font-semibold text-ink"
                >
                  Assign to
                </label>

                <select
                  id="lead-assignee"
                  value={selectedAssignee}
                  onChange={(event) =>
                    setSelectedAssignee(event.target.value)
                  }
                  disabled={assigneesLoading}
                  className="mt-2 w-full rounded-xl border border-line bg-white px-4 py-3 text-sm text-ink outline-none focus:border-ochre disabled:opacity-60"
                >
                  <option value="">
                    {assigneesLoading
                      ? "Loading assignees..."
                      : "Unassigned"}
                  </option>

                  {assignees.map((assignee) => (
                    <option key={assignee.id} value={assignee.id}>
                      {assignee.name || "Unnamed user"} —{" "}
                      {assignee.role === "AGENT"
                        ? assignee.agentProfile?.agencyName || "Agent"
                        : "Caretaker"}
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  onClick={updateAssignment}
                  disabled={savingAssignment || assigneesLoading}
                  className="mt-3 rounded-xl bg-acacia px-5 py-3 text-sm font-semibold text-white transition hover:bg-acacia-light disabled:cursor-wait disabled:opacity-70"
                >
                  {savingAssignment
                    ? "Saving assignment..."
                    : "Update assignment"}
                </button>

                {assignmentMessage && (
                  <p className="mt-2 text-sm text-ink/60">
                    {assignmentMessage}
                  </p>
                )}
              </div>
            </div>

            <div className="mt-6 rounded-xl bg-parchment p-4">
              <p className="text-sm font-semibold text-ink">
                Current assignee
              </p>

              {lead.assignedTo ? (
                <div className="mt-2 text-sm text-ink/70">
                  <p>
                    {lead.assignedTo.name || "Unnamed user"} (
                    {lead.assignedTo.role})
                  </p>

                  {lead.assignedTo.agentProfile?.agencyName && (
                    <p>
                      Agency:{" "}
                      {lead.assignedTo.agentProfile.agencyName}
                    </p>
                  )}

                  {lead.assignedTo.phone && (
                    <p>Phone: {lead.assignedTo.phone}</p>
                  )}
                </div>
              ) : (
                <p className="mt-2 text-sm text-ink/60">
                  This enquiry is currently unassigned.
                </p>
              )}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
