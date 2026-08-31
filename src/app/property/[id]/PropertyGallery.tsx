"use client";

import { useState } from "react";

type PropertyImage = {
  id: string;
  url: string;
};

type PropertyGalleryProps = {
  title: string;
  images: PropertyImage[];
};

export default function PropertyGallery({
  title,
  images,
}: PropertyGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);

  if (images.length === 0) {
    return (
      <div className="flex min-h-[320px] items-center justify-center rounded-2xl border border-line bg-white">
        <span className="text-sm text-ink/40">
          No photo available yet
        </span>
      </div>
    );
  }

  const selectedImage = images[selectedIndex];

  return (
    <div className="space-y-3">
      <div className="flex min-h-[320px] items-center justify-center overflow-hidden rounded-2xl border border-line bg-white">
        <img
          src={selectedImage.url}
          alt={title}
          className="h-full max-h-[500px] w-full rounded-2xl object-cover"
        />
      </div>

      {images.length > 1 && (
        <div className="grid grid-cols-4 gap-3 sm:grid-cols-5">
          {images.map((image, index) => (
            <button
              key={image.id}
              type="button"
              onClick={() => setSelectedIndex(index)}
              className={`overflow-hidden rounded-xl border-2 bg-white ${
                selectedIndex === index
                  ? "border-acacia"
                  : "border-line"
              }`}
              aria-label={`View photo ${index + 1}`}
            >
              <img
                src={image.url}
                alt={`${title} photo ${index + 1}`}
                className="h-24 w-full object-cover transition hover:opacity-80"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
