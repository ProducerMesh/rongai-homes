"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ChangeEvent, useEffect, useState } from "react";
import { useSession } from "next-auth/react";

type Property = {
  id: string;
  title: string;
  description: string | null;
  intent: string;
  propertyType: string;
  rentAmount: number | null;
  saleAmount: number | null;
  depositAmount: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  listingStatus: string;
  availability: string;
  verification: string;
  createdAt: string;
  lastVerifiedAt: string | null;
  neighbourhood: {
    name: string;
  };
  images: {
    url: string;
  }[];
};

const MAX_IMAGES = 10;
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
];

export default function ManageListingPage() {
  const { data: session, status } = useSession();
  const params = useParams();
  const id = params.id as string;

  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [confirmingAvailability, setConfirmingAvailability] =
    useState(false);
  const [saveMessage, setSaveMessage] = useState("");

  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [uploadingImages, setUploadingImages] = useState(false);

  const [form, setForm] = useState({
    title: "",
    description: "",
    bedrooms: "",
    bathrooms: "",
    rentAmount: "",
    saleAmount: "",
    depositAmount: "",
  });

  useEffect(() => {
    if (status !== "authenticated" || !id) {
      return;
    }

    async function loadProperty() {
      try {
        const response = await fetch(`/api/my-listings/${id}`);
        const data = await response.json();

        if (!response.ok) {
          setError(data.error || "Unable to load this listing.");
          return;
        }

        setProperty(data.property);

        setForm({
          title: data.property.title || "",
          description: data.property.description || "",
          bedrooms: data.property.bedrooms?.toString() || "",
          bathrooms: data.property.bathrooms?.toString() || "",
          rentAmount: data.property.rentAmount?.toString() || "",
          saleAmount: data.property.saleAmount?.toString() || "",
          depositAmount:
            data.property.depositAmount?.toString() || "",
        });
      } catch {
        setError("Unable to load this listing.");
      } finally {
        setLoading(false);
      }
    }

    loadProperty();
  }, [status, id]);

  useEffect(() => {
    const urls = selectedImages.map((file) =>
      URL.createObjectURL(file)
    );

    setPreviewUrls(urls);

    return () => {
      urls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [selectedImages]);

  function updateForm(field: string, value: string) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function handleImageChange(
    event: ChangeEvent<HTMLInputElement>
  ) {
    const files = Array.from(event.target.files || []);

    setError("");
    setSaveMessage("");

    const existingImageCount = property?.images?.length || 0;

    if (files.length === 0) {
      return;
    }

    if (existingImageCount + files.length > MAX_IMAGES) {
      setError(
        `This listing can have a maximum of ${MAX_IMAGES} images.`
      );
      event.target.value = "";
      setSelectedImages([]);
      return;
    }

    for (const file of files) {
      if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
        setError(
          "Only JPG, PNG, and WebP images are allowed."
        );
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
      currentImages.filter(
        (_, index) => index !== indexToRemove
      )
    );

    setError("");
  }

  async function uploadImages() {
    if (!property || selectedImages.length === 0) {
      return;
    }

    setUploadingImages(true);
    setError("");
    setSaveMessage("");

    try {
      const imageFormData = new FormData();

      imageFormData.append("propertyId", property.id);

      selectedImages.forEach((file) => {
        imageFormData.append("files", file);
      });

      const response = await fetch("/api/property-images", {
        method: "POST",
        body: imageFormData,
      });

      const data = await response.json();

      if (!response.ok) {
        setError(
          data.error ||
            "Unable to upload property images."
        );
        return;
      }

      const refreshedResponse = await fetch(
        `/api/my-listings/${id}`
      );

      const refreshedData = await refreshedResponse.json();

      if (refreshedResponse.ok) {
        setProperty(refreshedData.property);
      }

      setSelectedImages([]);

      setSaveMessage(
        "Property photos uploaded successfully."
      );
    } catch {
      setError(
        "Unable to upload property photos. Please try again."
      );
    } finally {
      setUploadingImages(false);
    }
  }

  async function saveChanges() {
    setSaving(true);
    setSaveMessage("");
    setError("");

    try {
      const response = await fetch(
        `/api/my-listings/${id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            title: form.title,
            description: form.description,
            bedrooms: form.bedrooms
              ? Number(form.bedrooms)
              : null,
            bathrooms: form.bathrooms
              ? Number(form.bathrooms)
              : null,
            rentAmount: form.rentAmount
              ? Number(form.rentAmount)
              : null,
            saleAmount: form.saleAmount
              ? Number(form.saleAmount)
              : null,
            depositAmount: form.depositAmount
              ? Number(form.depositAmount)
              : null,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(
          data.error || "Unable to save changes."
        );
        return;
      }

      setProperty(data.property);
      setEditing(false);

      setSaveMessage(
        "Listing updated successfully."
      );
    } catch {
      setError("Unable to save changes.");
    } finally {
      setSaving(false);
    }
  }

  async function confirmAvailability() {
    setConfirmingAvailability(true);
    setSaveMessage("");
    setError("");

    try {
      const response = await fetch(
        `/api/my-listings/${id}`,
        {
          method: "POST",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(
          data.error ||
            "Unable to confirm availability."
        );
        return;
      }

      setProperty(data.property);

      setSaveMessage(
        "Availability confirmed. Your listing is now marked available."
      );
    } catch {
      setError("Unable to confirm availability.");
    } finally {
      setConfirmingAvailability(false);
    }
  }

  function formatDate(date: string | null) {
    if (!date) {
      return "Not yet confirmed";
    }

    return new Date(date).toLocaleString("en-KE", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  }

  if (status === "loading" || loading) {
    return (
      <main className="min-h-screen bg-parchment">
        <div className="mx-auto max-w-5xl px-6 py-20 text-center">
          <p className="text-sm text-ink/50">
            Loading your listing...
          </p>
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
              Manage listing
            </h1>
          </div>
        </section>

        <section className="mx-auto max-w-md px-6 py-16 text-center">
          <div className="rounded-2xl border border-line bg-white p-8 shadow-sm">
            <h2 className="font-display text-2xl text-acacia">
              Sign in to continue
            </h2>

            <p className="mt-3 text-sm leading-6 text-ink/60">
              Sign in to manage your property listing.
            </p>

            <Link
              href={`/auth/sign-in?callbackUrl=/dashboard/listings/${id}`}
              className="mt-6 block rounded-xl bg-ochre px-6 py-3 text-sm font-semibold text-acacia-dark hover:bg-ochre-dark"
            >
              Sign in
            </Link>
          </div>
        </section>
      </main>
    );
  }

  if (error || !property) {
    return (
      <main className="min-h-screen bg-parchment">
        <section className="bg-acacia py-12 text-parchment">
          <div className="mx-auto max-w-5xl px-6">
            <Link
              href="/dashboard"
              className="text-sm text-parchment/70 hover:text-parchment"
            >
              ← Back to dashboard
            </Link>

            <h1 className="mt-6 font-display text-4xl italic">
              Manage listing
            </h1>
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-6 py-10">
          <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
            <p className="text-sm font-medium text-red-700">
              {error || "Listing not found."}
            </p>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-parchment">
      <section className="bg-acacia py-10 text-parchment">
        <div className="mx-auto max-w-5xl px-6">
          <Link
            href="/dashboard"
            className="text-sm text-parchment/70 hover:text-parchment"
          >
            ← Back to dashboard
          </Link>

          <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="eyebrow text-ochre">
                Manage listing
              </p>

              <h1 className="mt-2 font-display text-4xl italic sm:text-5xl">
                {property.title}
              </h1>

              <p className="mt-3 text-sm text-parchment/70">
                {property.neighbourhood.name}
              </p>
            </div>

            <div className="text-sm text-parchment/60">
              Listed {formatDate(property.createdAt)}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-6 py-10">
        {saveMessage && (
          <div className="mb-6 rounded-2xl border border-acacia/20 bg-acacia/10 p-5">
            <p className="text-sm font-medium text-acacia">
              {saveMessage}
            </p>
          </div>
        )}

        {error && (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-5">
            <p className="text-sm font-medium text-red-700">
              {error}
            </p>
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            {editing ? (
              <div className="rounded-2xl border border-line bg-white p-6 shadow-sm">
                <p className="eyebrow">
                  Edit property details
                </p>

                <div className="mt-5 space-y-5">
                  <div>
                    <label className="text-xs font-medium text-ink/60">
                      Property title
                    </label>

                    <input
                      type="text"
                      value={form.title}
                      onChange={(e) =>
                        updateForm(
                          "title",
                          e.target.value
                        )
                      }
                      className="mt-2 w-full rounded-xl border border-line px-4 py-3 text-sm outline-none focus:border-acacia"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-medium text-ink/60">
                      Description
                    </label>

                    <textarea
                      value={form.description}
                      onChange={(e) =>
                        updateForm(
                          "description",
                          e.target.value
                        )
                      }
                      rows={5}
                      className="mt-2 w-full rounded-xl border border-line px-4 py-3 text-sm outline-none focus:border-acacia"
                    />
                  </div>

                  <div className="grid gap-5 sm:grid-cols-2">
                    <div>
                      <label className="text-xs font-medium text-ink/60">
                        Bedrooms
                      </label>

                      <input
                        type="number"
                        min="0"
                        value={form.bedrooms}
                        onChange={(e) =>
                          updateForm(
                            "bedrooms",
                            e.target.value
                          )
                        }
                        className="mt-2 w-full rounded-xl border border-line px-4 py-3 text-sm outline-none focus:border-acacia"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-medium text-ink/60">
                        Bathrooms
                      </label>

                      <input
                        type="number"
                        min="0"
                        value={form.bathrooms}
                        onChange={(e) =>
                          updateForm(
                            "bathrooms",
                            e.target.value
                          )
                        }
                        className="mt-2 w-full rounded-xl border border-line px-4 py-3 text-sm outline-none focus:border-acacia"
                      />
                    </div>
                  </div>

                  <div className="grid gap-5 sm:grid-cols-2">
                    <div>
                      <label className="text-xs font-medium text-ink/60">
                        Monthly rent
                      </label>

                      <input
                        type="number"
                        min="0"
                        value={form.rentAmount}
                        onChange={(e) =>
                          updateForm(
                            "rentAmount",
                            e.target.value
                          )
                        }
                        className="mt-2 w-full rounded-xl border border-line px-4 py-3 text-sm outline-none focus:border-acacia"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-medium text-ink/60">
                        Sale price
                      </label>

                      <input
                        type="number"
                        min="0"
                        value={form.saleAmount}
                        onChange={(e) =>
                          updateForm(
                            "saleAmount",
                            e.target.value
                          )
                        }
                        className="mt-2 w-full rounded-xl border border-line px-4 py-3 text-sm outline-none focus:border-acacia"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-ink/60">
                      Deposit
                    </label>

                    <input
                      type="number"
                      min="0"
                      value={form.depositAmount}
                      onChange={(e) =>
                        updateForm(
                          "depositAmount",
                          e.target.value
                        )
                      }
                      className="mt-2 w-full rounded-xl border border-line px-4 py-3 text-sm outline-none focus:border-acacia"
                    />
                  </div>

                  <div className="flex flex-col gap-3 sm:flex-row">
                    <button
                      type="button"
                      onClick={saveChanges}
                      disabled={saving}
                      className="rounded-xl bg-ochre px-5 py-3 text-sm font-semibold text-acacia-dark hover:bg-ochre-dark disabled:opacity-50"
                    >
                      {saving
                        ? "Saving..."
                        : "Save changes"}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setEditing(false);
                        setSaveMessage("");
                        setError("");
                      }}
                      disabled={saving}
                      className="rounded-xl border border-line px-5 py-3 text-sm font-semibold text-ink hover:bg-parchment disabled:opacity-50"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <>
                <div className="rounded-2xl border border-line bg-white p-6 shadow-sm">
                  <p className="eyebrow">
                    Listing status
                  </p>

                  <div className="mt-5 grid gap-4 sm:grid-cols-3">
                    <div>
                      <p className="text-xs text-ink/40">
                        Status
                      </p>

                      <p className="mt-1 text-sm font-semibold capitalize text-ink">
                        {property.listingStatus.replaceAll(
                          "_",
                          " "
                        )}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-ink/40">
                        Availability
                      </p>

                      <p className="mt-1 text-sm font-semibold capitalize text-ink">
                        {property.availability.replaceAll(
                          "_",
                          " "
                        )}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-ink/40">
                        Verification
                      </p>

                      <p className="mt-1 text-sm font-semibold text-ink">
                        {property.verification}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-line bg-white p-6 shadow-sm">
                  <p className="eyebrow">
                    Property information
                  </p>

                  <div className="mt-5 grid gap-5 sm:grid-cols-2">
                    <div>
                      <p className="text-xs text-ink/40">
                        Property type
                      </p>

                      <p className="mt-1 text-sm font-semibold capitalize text-ink">
                        {property.propertyType.replaceAll(
                          "_",
                          " "
                        )}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-ink/40">
                        Purpose
                      </p>

                      <p className="mt-1 text-sm font-semibold capitalize text-ink">
                        {property.intent.replaceAll(
                          "_",
                          " "
                        )}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-ink/40">
                        Bedrooms
                      </p>

                      <p className="mt-1 text-sm font-semibold text-ink">
                        {property.bedrooms ?? "—"}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-ink/40">
                        Bathrooms
                      </p>

                      <p className="mt-1 text-sm font-semibold text-ink">
                        {property.bathrooms ?? "—"}
                      </p>
                    </div>
                  </div>

                  {property.description && (
                    <div className="mt-6 border-t border-line pt-5">
                      <p className="text-xs text-ink/40">
                        Description
                      </p>

                      <p className="mt-2 text-sm leading-7 text-ink/70">
                        {property.description}
                      </p>
                    </div>
                  )}
                </div>

                <div className="rounded-2xl border border-line bg-white p-6 shadow-sm">
                  <p className="eyebrow">
                    Pricing
                  </p>

                  <div className="mt-5 grid gap-5 sm:grid-cols-3">
                    <div>
                      <p className="text-xs text-ink/40">
                        Monthly rent
                      </p>

                      <p className="mt-1 text-sm font-semibold text-ink">
                        {property.rentAmount
                          ? `KSh ${property.rentAmount.toLocaleString()}`
                          : "—"}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-ink/40">
                        Sale price
                      </p>

                      <p className="mt-1 text-sm font-semibold text-ink">
                        {property.saleAmount
                          ? `KSh ${property.saleAmount.toLocaleString()}`
                          : "—"}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-ink/40">
                        Deposit
                      </p>

                      <p className="mt-1 text-sm font-semibold text-ink">
                        {property.depositAmount
                          ? `KSh ${property.depositAmount.toLocaleString()}`
                          : "—"}
                      </p>
                    </div>
                  </div>
                </div>
              </>
            )}

            <div
              id="property-photos"
              className="rounded-2xl border border-line bg-white p-6 shadow-sm"
            >
              <p className="eyebrow">
                Property photos
              </p>

              <h2 className="mt-2 font-display text-2xl text-acacia">
                Photos on this listing
              </h2>

              {property.images.length === 0 ? (
                <div className="mt-5 rounded-xl border border-dashed border-line bg-parchment/30 p-8 text-center">
                  <p className="text-sm text-ink/50">
                    No property photos have been uploaded yet.
                  </p>
                </div>
              ) : (
                <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {property.images.map((image, index) => (
                    <div
                      key={`${image.url}-${index}`}
                      className="overflow-hidden rounded-xl border border-line bg-parchment"
                    >
                      <div className="relative aspect-square">
                        <img
                          src={image.url}
                          alt={`${property.title} photo ${
                            index + 1
                          }`}
                          className="h-full w-full object-cover"
                        />

                        {index === 0 && (
                          <span className="absolute bottom-2 left-2 rounded-full bg-acacia px-3 py-1 text-xs font-semibold text-parchment">
                            Main photo
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-6 border-t border-line pt-6">
                <label className="text-xs font-medium text-ink/60">
                  Add more photos
                </label>

                <label
                  htmlFor="listing-property-images"
                  className="mt-2 flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-line bg-parchment/30 px-6 py-8 text-center transition hover:border-acacia/40 hover:bg-parchment/50"
                >
                  <span className="text-sm font-semibold text-acacia">
                    Choose property photos
                  </span>

                  <span className="mt-2 text-xs text-ink/50">
                    JPG, PNG or WebP · Maximum 5MB per image · Up to{" "}
                    {MAX_IMAGES} images total
                  </span>

                  <input
                    id="listing-property-images"
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
                      {selectedImages.length === 1
                        ? ""
                        : "s"}{" "}
                      selected
                    </p>

                    <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                      {selectedImages.map(
                        (file, index) => (
                          <div
                            key={`${file.name}-${file.size}-${index}`}
                            className="overflow-hidden rounded-xl border border-line bg-white"
                          >
                            <div className="relative aspect-square">
                              {previewUrls[index] && (
                                <img
                                  src={previewUrls[index]}
                                  alt={`Selected property photo ${
                                    index + 1
                                  }`}
                                  className="h-full w-full object-cover"
                                />
                              )}

                              <button
                                type="button"
                                onClick={() =>
                                  removeSelectedImage(
                                    index
                                  )
                                }
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
                                {(
                                  file.size /
                                  (1024 * 1024)
                                ).toFixed(1)}{" "}
                                MB
                              </p>
                            </div>
                          </div>
                        )
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={uploadImages}
                      disabled={uploadingImages}
                      className="mt-5 rounded-xl bg-ochre px-5 py-3 text-sm font-semibold text-acacia-dark hover:bg-ochre-dark disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {uploadingImages
                        ? "Uploading photos..."
                        : "Upload photos"}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          <aside className="space-y-6">
            <div className="rounded-2xl border border-line bg-white p-6 shadow-sm">
              <p className="eyebrow">
                Manage
              </p>

              <div className="mt-5 space-y-3">
                {!editing && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditing(true);
                      setSaveMessage("");
                      setError("");
                    }}
                    className="w-full rounded-xl bg-ochre px-4 py-3 text-left text-sm font-semibold text-acacia-dark hover:bg-ochre-dark"
                  >
                    Edit property details
                  </button>
                )}

                {property.availability !==
                  "AVAILABLE" && (
                  <button
                    type="button"
                    onClick={confirmAvailability}
                    disabled={confirmingAvailability}
                    className="w-full rounded-xl border border-acacia/30 bg-acacia/5 px-4 py-3 text-left text-sm font-semibold text-acacia hover:bg-acacia/10 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {confirmingAvailability
                      ? "Confirming..."
                      : "Confirm availability"}
                  </button>
                )}

                <a
                  href="#property-photos"
                  className="block w-full rounded-xl border border-line px-4 py-3 text-left text-sm font-medium text-ink hover:bg-parchment"
                >
                  Manage property photos
                </a>

                <button
                  type="button"
                  disabled
                  className="w-full rounded-xl border border-line px-4 py-3 text-left text-sm font-medium text-ink/40"
                >
                  Add amenities
                </button>
              </div>

              <p className="mt-5 text-xs leading-5 text-ink/45">
                More listing management tools will be
                enabled as we build each feature.
              </p>
            </div>

            <div className="rounded-2xl border border-ochre/40 bg-ochre/10 p-6">
              <h2 className="font-display text-xl text-acacia">
                Verification
              </h2>

              <p className="mt-2 text-sm leading-6 text-ink/70">
                Your listing is currently at{" "}
                <strong>
                  {property.verification}
                </strong>{" "}
                verification level.
              </p>

              <p className="mt-3 text-xs leading-5 text-ink/55">
                Rongai Homes will introduce stronger
                verification workflows before a property
                is marked as verified.
              </p>
            </div>

            <div className="rounded-2xl border border-line bg-white p-6 shadow-sm">
              <p className="text-xs text-ink/40">
                Last availability confirmation
              </p>

              <p className="mt-2 text-sm font-semibold text-ink">
                {formatDate(property.lastVerifiedAt)}
              </p>
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}
