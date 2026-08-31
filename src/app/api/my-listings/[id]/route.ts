import { NextResponse } from "next/server";

import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";

import { prisma } from "@/lib/prisma";

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "You must be signed in to view this listing." },
        { status: 401 }
      );
    }

    const property = await prisma.property.findFirst({
      where: {
        id: params.id,
        landlordId: session.user.id,
      },
      include: {
        neighbourhood: {
          select: {
            name: true,
          },
        },
        images: {
          select: {
            id: true,
            url: true,
          },
          orderBy: {
            sortOrder: "asc",
          },
        },
      },
    });

    if (!property) {
      return NextResponse.json(
        {
          error:
            "Listing not found or you do not have access to it.",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({ property });
  } catch (error) {
    console.error("MY_LISTING_ERROR", error);

    return NextResponse.json(
      { error: "Unable to load this listing." },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "You must be signed in to edit this listing." },
        { status: 401 }
      );
    }

    const existing = await prisma.property.findFirst({
      where: {
        id: params.id,
        landlordId: session.user.id,
      },
    });

    if (!existing) {
      return NextResponse.json(
        {
          error:
            "Listing not found or you do not have access to it.",
        },
        { status: 404 }
      );
    }

    const body = await request.json();

    const property = await prisma.property.update({
      where: {
        id: params.id,
      },
      data: {
        title: body.title,
        description: body.description || null,
        bedrooms:
          body.bedrooms === "" || body.bedrooms == null
            ? null
            : Number(body.bedrooms),
        bathrooms:
          body.bathrooms === "" || body.bathrooms == null
            ? null
            : Number(body.bathrooms),
        rentAmount:
          body.rentAmount === "" || body.rentAmount == null
            ? null
            : Number(body.rentAmount),
        saleAmount:
          body.saleAmount === "" || body.saleAmount == null
            ? null
            : Number(body.saleAmount),
        depositAmount:
          body.depositAmount === "" || body.depositAmount == null
            ? null
            : Number(body.depositAmount),
      },
      include: {
        neighbourhood: {
          select: {
            name: true,
          },
        },
        images: {
          select: {
            id: true,
            url: true,
          },
          orderBy: {
            sortOrder: "asc",
          },
        },
      },
    });

    return NextResponse.json({ property });
  } catch (error) {
    console.error("UPDATE_LISTING_ERROR", error);

    return NextResponse.json(
      { error: "Unable to update this listing." },
      { status: 500 }
    );
  }
}

export async function POST(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        {
          error:
            "You must be signed in to confirm availability.",
        },
        { status: 401 }
      );
    }

    const existing = await prisma.property.findFirst({
      where: {
        id: params.id,
        landlordId: session.user.id,
      },
    });

    if (!existing) {
      return NextResponse.json(
        {
          error:
            "Listing not found or you do not have access to it.",
        },
        { status: 404 }
      );
    }

    const now = new Date();

    const property = await prisma.$transaction(async (tx) => {
      await tx.availabilityRecord.create({
        data: {
          propertyId: existing.id,
          status: "AVAILABLE_NOW",
          confirmedBy: session.user.id,
        },
      });

      return tx.property.update({
        where: {
          id: existing.id,
        },
        data: {
          availability: "AVAILABLE_NOW",
          lastVerifiedAt: now,
        },
        include: {
          neighbourhood: {
            select: {
              name: true,
            },
          },
          images: {
            select: {
              id: true,
              url: true,
            },
            orderBy: {
              sortOrder: "asc",
            },
          },
        },
      });
    });

    return NextResponse.json({
      property,
      message: "Availability confirmed successfully.",
    });
  } catch (error) {
    console.error("CONFIRM_AVAILABILITY_ERROR", error);

    return NextResponse.json(
      { error: "Unable to confirm availability." },
      { status: 500 }
    );
  }
}
