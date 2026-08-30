"use client";

import Link from "next/link";
import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import { useSession } from "next-auth/react";

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

const INTENTS = [
["RENT_HOME", "Rent"],
["BUY_HOME", "Sell home"],
["BUY_LAND", "Sell land"],
["RENT_COMMERCIAL", "Rent commercial"],
["BUY_COMMERCIAL", "Sell commercial"],
];

const NEIGHBOURHOODS = [
"Rongai Town",
"Kandisi",
"Rimpa",
"Nkoroi",
"Tuala",
"Gataka",
"Maasai Lodge",
];

const MAX_IMAGES = 10;
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

export default function ListPropertyPage() {
const { data: session, status } = useSession();

const [message, setMessage] = useState("");
const [error, setError] = useState("");
const [submitting, setSubmitting] = useState(false);
const [selectedImages, setSelectedImages] = useState<File[]>([]);
const [previewUrls, setPreviewUrls] = useState<string[]>([]);

function handleImageChange(event: ChangeEvent<HTMLInputElement>) {
const files = Array.from(event.target.files || []);

setError("");

if (files.length > MAX_IMAGES) {
  setError(`You can select a maximum of ${MAX_IMAGES} images.`);
  event.target.value = "";
  setSelectedImages([]);
  return;
}

for (const file of files) {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    setError("Only JPG, PNG, and WebP images are allowed.");
    event.target.value = "";
    setSelectedImages([]);
    return;
  }

  if (file.size > MAX_IMAGE_SIZE) {
    setError(
      `Each image must be 5MB or smaller. "${file.name}" is too large.`
    );
    event.target.value = "";
    setSelectedImages([]);
    return;
  }
}

setSelectedImages(files);

}

function removeSelectedImage(indexToRemove: number) {
setSelectedImages((currentImages) =>
currentImages.filter((_, index) => index !== indexToRemove)
);
setError("");
}

useEffect(() => {
const urls = selectedImages.map((file) => URL.createObjectURL(file));

setPreviewUrls(urls);

return () => {
  urls.forEach((url) => URL.revokeObjectURL(url));
};

}, [selectedImages]);

async function handleSubmit(event: FormEvent<HTMLFormElement>) {
event.preventDefault();

setMessage("");
setError("");
setSubmitting(true);

const form = event.currentTarget;
const formData = new FormData(form);

const payload = {
  intent: formData.get("intent"),
  title: formData.get("title"),
  propertyType: formData.get("propertyType"),
  neighbourhood: formData.get("neighbourhood"),
  description: formData.get("description"),
  rentAmount: formData.get("rentAmount") || undefined,
  saleAmount: formData.get("saleAmount") || undefined,
  depositAmount: formData.get("depositAmount") || undefined,
  bedrooms: formData.get("bedrooms") || undefined,
  bathrooms: formData.get("bathrooms") || undefined,
};

try {
  const response = await fetch("/api/properties", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json();

  if (!response.ok) {
    setError(data.error || "Unable to submit property.");
    return;
  }

  if (selectedImages.length > 0) {
    const imageFormData = new FormData();

    imageFormData.append("propertyId", data.propertyId);

    selectedImages.forEach((file) => {
      imageFormData.append("files", file);
    });

    const imageResponse = await fetch("/api/property-images", {
      method: "POST",
      body: imageFormData,
    });

    const imageData = await imageResponse.json();

    if (!imageResponse.ok) {
      setError(
        imageData.error ||
          "Property was submitted, but the images could not be uploaded."
      );
      return;
    }
  }

  setMessage(
    "Your property has been submitted successfully and is now awaiting review."
  );

  form.reset();
  setSelectedImages([]);
} catch {
  setError("Unable to submit the property. Please try again.");
} finally {
  setSubmitting(false);
}

}

if (status === "loading") {
return ( <main className="min-h-screen bg-parchment"> <div className="mx-auto max-w-4xl px-6 py-20 text-center"> <p className="text-sm text-ink/50">Checking your account...</p> </div> </main>
);
}

if (!session?.user) {
return ( <main className="min-h-screen bg-parchment"> <section className="bg-acacia py-12 text-parchment"> <div className="mx-auto max-w-4xl px-6"> <Link
           href="/"
           className="text-sm text-parchment/70 hover:text-parchment"
         >
← Rongai Homes </Link>

        <h1 className="mt-6 font-display text-4xl italic">
          List your property
        </h1>

        <p className="mt-3 max-w-xl text-parchment/75">
          You need to sign in before submitting a property.
        </p>
      </div>
    </section>

    <section className="mx-auto max-w-md px-6 py-16 text-center">
      <div className="rounded-2xl border border-line bg-white p-8 shadow-sm">
        <h2 className="font-display text-2xl text-acacia">
          Sign in to continue
        </h2>

        <p className="mt-3 text-sm leading-6 text-ink/60">
          Sign in with your Google account to submit a property to Rongai
          Homes.
        </p>

        <Link
          href="/auth/sign-in?callbackUrl=/list-property"
          className="mt-6 block rounded-xl bg-ochre px-6 py-3 text-sm font-semibold text-acacia-dark hover:bg-ochre-dark"
        >
          Sign in
        </Link>
      </div>
    </section>
  </main>
);

}

return ( <main className="min-h-screen bg-parchment"> <section className="bg-acacia py-10 text-parchment"> <div className="mx-auto max-w-4xl px-6"> <Link
         href="/"
         className="text-sm text-parchment/70 hover:text-parchment"
       >
← Rongai Homes </Link>

      <h1 className="mt-6 font-display text-4xl italic sm:text-5xl">
        List your property
      </h1>

      <p className="mt-3 max-w-2xl text-parchment/75">
        Reach people actively looking for property in Ongata Rongai.
        Listing is free during our launch period.
      </p>
    </div>
  </section>

  <section className="mx-auto max-w-4xl px-6 py-10">
    {message && (
      <div className="mb-6 rounded-2xl border border-acacia/20 bg-acacia/10 p-5">
        <p className="text-sm font-medium text-acacia">{message}</p>
      </div>
    )}

    {error && (
      <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-5">
        <p className="text-sm font-medium text-red-700">{error}</p>
      </div>
    )}

    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="rounded-2xl border border-line bg-white p-6 shadow-sm">
        <p className="eyebrow">01 · Listing purpose</p>

        <h2 className="mt-2 font-display text-2xl text-acacia">
          What are you listing?
        </h2>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {INTENTS.map(([value, label]) => (
            <label
              key={value}
              className="flex cursor-pointer items-center gap-3 rounded-xl border border-line p-4 transition hover:border-acacia/40 hover:bg-parchment/40"
            >
              <input
                type="radio"
                name="intent"
                value={value}
                required
                className="h-4 w-4 accent-acacia"
              />

              <span className="text-sm font-medium text-ink">{label}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-line bg-white p-6 shadow-sm">
        <p className="eyebrow">02 · Property details</p>

        <h2 className="mt-2 font-display text-2xl text-acacia">
          Tell us about the property
        </h2>

        <div className="mt-5 space-y-5">
          <div>
            <label className="mb-1 block text-sm font-medium text-ink">
              Property title
            </label>

            <input
              name="title"
              required
              placeholder="e.g. Spacious 2 Bedroom Apartment"
              className="w-full rounded-xl border border-line px-4 py-3 text-sm outline-none focus:border-acacia"
            />
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-ink">
                Property type
              </label>

              <select
                name="propertyType"
                required
                className="w-full rounded-xl border border-line bg-white px-4 py-3 text-sm outline-none focus:border-acacia"
              >
                <option value="">Select type</option>

                {PROPERTY_TYPES.map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-ink">
                Neighbourhood
              </label>

              <select
                name="neighbourhood"
                required
                className="w-full rounded-xl border border-line bg-white px-4 py-3 text-sm outline-none focus:border-acacia"
              >
                <option value="">Select area</option>

                {NEIGHBOURHOODS.map((area) => (
                  <option key={area} value={area}>
                    {area}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-ink">
              Description
            </label>

            <textarea
              name="description"
              rows={5}
              placeholder="Describe the property, access, nearby landmarks, water, parking, security and other useful details."
              className="w-full resize-none rounded-xl border border-line px-4 py-3 text-sm outline-none focus:border-acacia"
            />
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-line bg-white p-6 shadow-sm">
        <p className="eyebrow">03 · Price & space</p>

        <h2 className="mt-2 font-display text-2xl text-acacia">
          Pricing and basic information
        </h2>

        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-ink">
              Rent per month
            </label>

            <input
              name="rentAmount"
              type="number"
              min="0"
              placeholder="e.g. 15000"
              className="w-full rounded-xl border border-line px-4 py-3 text-sm outline-none focus:border-acacia"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-ink">
              Sale price
            </label>

            <input
              name="saleAmount"
              type="number"
              min="0"
              placeholder="e.g. 8500000"
              className="w-full rounded-xl border border-line px-4 py-3 text-sm outline-none focus:border-acacia"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-ink">
              Bedrooms
            </label>

            <input
              name="bedrooms"
              type="number"
              min="0"
              placeholder="e.g. 2"
              className="w-full rounded-xl border border-line px-4 py-3 text-sm outline-none focus:border-acacia"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-ink">
              Bathrooms
            </label>

            <input
              name="bathrooms"
              type="number"
              min="0"
              placeholder="e.g. 2"
              className="w-full rounded-xl border border-line px-4 py-3 text-sm outline-none focus:border-acacia"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="mb-1 block text-sm font-medium text-ink">
              Deposit amount
            </label>

            <input
              name="depositAmount"
              type="number"
              min="0"
              placeholder="Optional"
              className="w-full rounded-xl border border-line px-4 py-3 text-sm outline-none focus:border-acacia"
            />
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-line bg-white p-6 shadow-sm">
        <p className="eyebrow">04 · Property photos</p>

        <h2 className="mt-2 font-display text-2xl text-acacia">
          Add photos of the property
        </h2>

        <p className="mt-3 text-sm leading-6 text-ink/60">
          Upload up to 10 clear photos. Good photos help people understand
          the property before arranging a viewing.
        </p>

        <div className="mt-5">
          <label
            htmlFor="property-images"
            className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-line bg-parchment/30 px-6 py-10 text-center transition hover:border-acacia/40 hover:bg-parchment/50"
          >
            <span className="text-sm font-semibold text-acacia">
              Choose property photos
            </span>

            <span className="mt-2 text-xs text-ink/50">
              JPG, PNG or WebP · Maximum 5MB per image · Up to 10 images
            </span>

            <input
              id="property-images"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              onChange={handleImageChange}
              className="sr-only"
            />
          </label>

          {selectedImages.length > 0 && (
            <div className="mt-4 rounded-xl bg-parchment/40 p-4">
              <p className="text-sm font-medium text-ink">
                {selectedImages.length} image
                {selectedImages.length === 1 ? "" : "s"} selected
              </p>

              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {selectedImages.map((file, index) => (
                  <div
                    key={`${file.name}-${file.size}-${index}`}
                    className="overflow-hidden rounded-xl border border-line bg-white"
                  >
                    <div className="relative aspect-square">
                      {previewUrls[index] && (
                        <img
                          src={previewUrls[index]}
                          alt={`Selected property photo ${index + 1}`}
                          className="h-full w-full object-cover"
                        />
                      )}

                      <button
                        type="button"
                        onClick={() => removeSelectedImage(index)}
                        className="absolute right-2 top-2 rounded-full bg-black/70 px-2.5 py-1 text-xs font-semibold text-white transition hover:bg-black"
                        aria-label={`Remove ${file.name}`}
                      >
                        Remove
                      </button>
                    </div>

                    <div className="p-3">
                      <p className="truncate text-xs font-medium text-ink">
                        {file.name}
                      </p>

                      <p className="mt-1 text-xs text-ink/40">
                        {(file.size / (1024 * 1024)).toFixed(1)} MB
                      </p>

                      {index === 0 && (
                        <p className="mt-2 text-xs font-semibold text-acacia">
                          Main photo
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-line bg-white p-6 shadow-sm">
        <p className="eyebrow">05 · Contact</p>

        <h2 className="mt-2 font-display text-2xl text-acacia">
          Your account
        </h2>

        <p className="mt-3 text-sm text-ink/60">
          You're signed in as{" "}
          <span className="font-medium text-ink">
            {session.user.name || session.user.email || "your account"}
          </span>
          .
        </p>

        <p className="mt-2 text-sm leading-6 text-ink/60">
          We'll use your verified account to associate this property with
          you. Your private contact details will not be exposed publicly.
        </p>
      </div>

      <div className="rounded-2xl border border-ochre/40 bg-ochre/10 p-6">
        <h2 className="font-display text-xl text-acacia">
          Verification matters
        </h2>

        <p className="mt-2 text-sm leading-6 text-ink/70">
          Rongai Homes is designed around verified availability. Your
          listing will initially be submitted for review before it appears
          as an active property.
        </p>

        <label className="mt-5 flex cursor-pointer items-start gap-3">
          <input
            type="checkbox"
            required
            className="mt-1 h-4 w-4 accent-acacia"
          />

          <span className="text-sm leading-6 text-ink/70">
            I confirm that I have the right to list this property and that
            the information provided is accurate to the best of my
            knowledge.
          </span>
        </label>
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-xl bg-ochre px-6 py-4 text-sm font-semibold text-acacia-dark transition hover:bg-ochre-dark disabled:cursor-not-allowed disabled:opacity-60"
      >
        {submitting
          ? "Submitting property..."
          : "Submit property for review"}
      </button>
    </form>
  </section>
</main>

);
}

