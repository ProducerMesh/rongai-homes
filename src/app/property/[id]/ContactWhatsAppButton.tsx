"use client";

import { useState } from "react";

type ContactWhatsAppButtonProps = {
  propertyId: string;
  whatsappUrl: string;
  message: string;
};

export default function ContactWhatsAppButton({
  propertyId,
  whatsappUrl,
  message,
}: ContactWhatsAppButtonProps) {
  const [isSending, setIsSending] = useState(false);

  async function handleClick() {
    setIsSending(true);

    try {
      await fetch("/api/leads", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          propertyId,
          message,
        }),
      });
    } catch (error) {
      console.error("WHATSAPP_LEAD_ERROR", error);
    } finally {
      window.open(whatsappUrl, "_blank", "noopener,noreferrer");
      setIsSending(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isSending}
      className="mt-6 block w-full rounded-xl bg-ochre px-5 py-3 text-center text-sm font-semibold text-acacia-dark transition hover:bg-ochre-dark disabled:cursor-wait disabled:opacity-70"
    >
      {isSending ? "Connecting to WhatsApp..." : "Contact Rongai Homes on WhatsApp"}
    </button>
  );
}
