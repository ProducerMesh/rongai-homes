import { NextResponse } from "next/server";

import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";

import { prisma } from "@/lib/prisma";

import { supabaseServer } from "@/lib/supabase-server";

const BUCKET_NAME = "property-images";

type RouteContext = {
  params: {
    imageId: string;
  };
};

export async function DELETE(
  request: Request,
  context: RouteContext
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        {
          error:
            "You must be signed in to delete property images.",
        },
        { status: 401 }
      );
    }

    const { imageId } = context.params;

    if (!imageId) {
      return NextResponse.json(
        { error: "Image ID is required." },
        { status: 400 }
      );
    }

    const image = await prisma.propertyImage.findUnique({
      where: {
        id: imageId,
      },
      select: {
        id: true,
        propertyId: true,
        url: true,
        property: {
          select: {
            id: true,
            landlordId: true,
            caretakerId: true,
            agentId: true,
          },
        },
      },
    });

    if (!image) {
      return NextResponse.json(
        { error: "Property image not found." },
        { status: 404 }
      );
    }

    const user = await prisma.user.findUnique({
      where: {
        id: session.user.id,
      },
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
      (user.role === "LANDLORD" &&
        image.property.landlordId === user.id) ||
      (user.role === "CARETAKER" &&
        image.property.caretakerId === user.id) ||
      (user.role === "AGENT" &&
        user.agentProfile?.id &&
        image.property.agentId === user.agentProfile.id);

    if (!ownsProperty) {
      return NextResponse.json(
        {
          error:
            "You are not authorized to delete images for this property.",
        },
        { status: 403 }
      );
    }

    const publicUrlMarker = `/storage/v1/object/public/${BUCKET_NAME}/`;

    const markerIndex = image.url.indexOf(publicUrlMarker);

    if (markerIndex === -1) {
      return NextResponse.json(
        {
          error:
            "The property image has an invalid storage URL.",
        },
        { status: 500 }
      );
    }

    const filePath = image.url.substring(
      markerIndex + publicUrlMarker.length
    );

    if (!filePath) {
      return NextResponse.json(
        {
          error:
            "The property image has an invalid storage path.",
        },
        { status: 500 }
      );
    }

    const { error: storageError } =
      await supabaseServer.storage
        .from(BUCKET_NAME)
        .remove([filePath]);

    if (storageError) {
      console.error(
        "SUPABASE_IMAGE_DELETE_ERROR",
        storageError
      );

      return NextResponse.json(
        {
          error:
            "Unable to delete the property image from storage.",
        },
        { status: 500 }
      );
    }

    await prisma.propertyImage.delete({
      where: {
        id: image.id,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Property image deleted successfully.",
    });
  } catch (error) {
    console.error(
      "PROPERTY_IMAGE_DELETE_ERROR",
      error
    );

    return NextResponse.json(
      {
        error:
          "Something went wrong while deleting the property image.",
      },
      { status: 500 }
    );
  }
}
