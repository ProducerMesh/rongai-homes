import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { supabaseServer } from "@/lib/supabase-server";

const BUCKET_NAME = "property-images";
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const MAX_FILES = 10;

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "You must be signed in to upload property images." },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const propertyId = formData.get("propertyId");
    const files = formData.getAll("files");

    if (typeof propertyId !== "string" || !propertyId) {
      return NextResponse.json(
        { error: "Property ID is required." },
        { status: 400 }
      );
    }

    if (files.length === 0) {
      return NextResponse.json(
        { error: "Please select at least one image." },
        { status: 400 }
      );
    }

    if (files.length > MAX_FILES) {
      return NextResponse.json(
        { error: `You can upload a maximum of ${MAX_FILES} images.` },
        { status: 400 }
      );
    }

    const property = await prisma.property.findUnique({
      where: { id: propertyId },
      select: {
        id: true,
        landlordId: true,
        caretakerId: true,
        agentId: true,
      },
    });

    if (!property) {
      return NextResponse.json(
        { error: "Property not found." },
        { status: 404 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        role: true,
        agentProfile: {
          select: {
            id: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Your account could not be found." },
        { status: 401 }
      );
    }

    const ownsProperty =
      (user.role === "LANDLORD" && property.landlordId === user.id) ||
      (user.role === "CARETAKER" && property.caretakerId === user.id) ||
      (user.role === "AGENT" &&
        user.agentProfile?.id &&
        property.agentId === user.agentProfile.id);

    if (!ownsProperty) {
      return NextResponse.json(
        { error: "You are not authorized to upload images for this property." },
        { status: 403 }
      );
    }

    const uploadedImages = [];

    for (let index = 0; index < files.length; index++) {
      const file = files[index];

      if (!(file instanceof File)) {
        return NextResponse.json(
          { error: "Invalid image file." },
          { status: 400 }
        );
      }

      if (!file.type.startsWith("image/")) {
        return NextResponse.json(
          { error: "Only image files are allowed." },
          { status: 400 }
        );
      }

      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          { error: "Each image must be 5MB or smaller." },
          { status: 400 }
        );
      }

      const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const filePath = `${propertyId}/${crypto.randomUUID()}.${extension}`;

      const buffer = Buffer.from(await file.arrayBuffer());

      const { error: uploadError } = await supabaseServer.storage
        .from(BUCKET_NAME)
        .upload(filePath, buffer, {
          contentType: file.type,
          upsert: false,
        });

      if (uploadError) {
        console.error("SUPABASE_IMAGE_UPLOAD_ERROR", uploadError);

        return NextResponse.json(
          { error: "Unable to upload one or more property images." },
          { status: 500 }
        );
      }

      const {
        data: { publicUrl },
      } = supabaseServer.storage.from(BUCKET_NAME).getPublicUrl(filePath);

      const image = await prisma.propertyImage.create({
        data: {
          propertyId,
          url: publicUrl,
          sortOrder: index,
        },
      });

      uploadedImages.push(image);
    }

    return NextResponse.json(
      {
        success: true,
        images: uploadedImages,
        message: "Property images uploaded successfully.",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("PROPERTY_IMAGE_UPLOAD_ERROR", error);

    return NextResponse.json(
      { error: "Something went wrong while uploading property images." },
      { status: 500 }
    );
  }
}
