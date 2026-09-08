"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

type RequestViewingButtonProps = {
  propertyId: string;
};

export default function RequestViewingButton({
  propertyId,
}: RequestViewingButtonProps) {
  const router = useRouter();
  const { data: session, status: sessionStatus } = useSession();

  const [isOpen, setIsOpen] = useState(false);
  const [preferredDate, setPreferredDate] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [feedbackType, setFeedbackType] = useState<"success" | "error">(
    "success"
  );

  useEffect(() => {
    if (sessionStatus === "authenticated" && session?.user?.role !== "TENANT") {
      setIsOpen(false);
    }
  }, [session, sessionStatus]);

  function handleOpen() {
    if (sessionStatus === "loading") {
      return;
    }

    if (!session) {
      router.push(
        `/auth/sign-in?callbackUrl=${encodeURIComponent(
          `/property/${propertyId}`
        )}`
      );
      return;
    }

    if (session.user.role !== "TENANT") {
      setFeedbackType("error");
      setFeedback("Only property seekers can request a viewing.");
      return;
    }

    setFeedback("");
    setIsOpen(true);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!preferredDate) {
      setFeedbackType("error");
      setFeedback("Please choose your preferred viewing date and time.");
      return;
    }

    setSubmitting(true);
    setFeedback("");

    try {
      const response = await fetch("/api/viewing-requests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          propertyId,
          preferredDate: new Date(preferredDate).toISOString(),
          message: message.trim() || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Unable to submit your viewing request."
        );
      }

      setFeedbackType("success");
      setFeedback("Your viewing request has been submitted successfully.");
      setPreferredDate("");
      setMessage("");
    } catch (error) {
      setFeedbackType("error");
      setFeedback(
        error instanceof Error
          ? error.message
          : "Unable to submit your viewing request."
      );
    } finally {
      setSubmitting(false);
    }
  }

  const minimumDateTime = new Date(Date.now() + 60 * 60 * 1000)
    .toISOString()
    .slice(0, 16);

  return (
    <div className="mt-4">
      <button
        type="button"
        onClick={handleOpen}
        disabled={sessionStatus === "loading"}
        className="block w-full rounded-xl border border-acacia bg-white px-5 py-3 text-center text-sm font-semibold text-acacia transition hover:bg-parchment disabled:cursor-wait disabled:opacity-70"
      >
        {sessionStatus === "loading"
          ? "Checking sign-in..."
          : "Request a viewing"}
      </button>

      {feedback && !isOpen && (
        <div
          className={`mt-3 rounded-xl p-3 text-sm ${
            feedbackType === "success"
              ? "bg-acacia/10 text-acacia"
              : "bg-red-50 text-red-700"
          }`}
        >
          {feedback}
        </div>
      )}

      {isOpen && (
        <div className="mt-4 rounded-2xl border border-line bg-parchment p-5">
          <div>
            <h3 className="text-base font-semibold text-ink">
              Request a viewing
            </h3>
            <p className="mt-1 text-sm leading-5 text-ink/60">
              Choose a preferred date and time. Rongai Homes will coordinate
              with the property manager.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="mt-5">
            <label
              htmlFor="preferred-viewing-date"
              className="block text-sm font-semibold text-ink"
            >
              Preferred date and time
            </label>

            <input
              id="preferred-viewing-date"
              type="datetime-local"
              value={preferredDate}
              min={minimumDateTime}
              onChange={(event) => setPreferredDate(event.target.value)}
              required
              className="mt-2 w-full rounded-xl border border-line bg-white px-4 py-3 text-sm text-ink outline-none focus:border-acacia"
            />

            <label
              htmlFor="viewing-message"
              className="mt-4 block text-sm font-semibold text-ink"
            >
              Message <span className="font-normal text-ink/40">(optional)</span>
            </label>

            <textarea
              id="viewing-message"
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              maxLength={1000}
              rows={4}
              placeholder="Anything you would like us to know?"
              className="mt-2 w-full resize-none rounded-xl border border-line bg-white px-4 py-3 text-sm text-ink outline-none focus:border-acacia"
            />

            <div className="mt-4 flex gap-3">
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 rounded-xl bg-ochre px-4 py-3 text-sm font-semibold text-acacia-dark transition hover:bg-ochre-dark disabled:cursor-wait disabled:opacity-70"
              >
                {submitting ? "Submitting..." : "Submit request"}
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  setFeedback("");
                }}
                disabled={submitting}
                className="rounded-xl border border-line bg-white px-4 py-3 text-sm font-semibold text-ink transition hover:bg-parchment disabled:opacity-70"
              >
                Cancel
              </button>
            </div>

            {feedback && (
              <div
                className={`mt-3 rounded-xl p-3 text-sm ${
                  feedbackType === "success"
                    ? "bg-acacia/10 text-acacia"
                    : "bg-red-50 text-red-700"
                }`}
              >
                {feedback}
              </div>
            )}
          </form>
        </div>
      )}
    </div>
  );
}
