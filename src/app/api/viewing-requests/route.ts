import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const viewingRequestSchema = z.object({
  propertyId: z.string().uuid(),
  preferredDate: z.string().datetime(),
  message: z.string().trim().max(1000).optional(),
});

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        {
          error: "Please sign in to request a viewing.",
        },
        { status: 401 }
      );
    }

    if (session.user.role !== "TENANT") {
      return NextResponse.json(
        {
          error: "Only property seekers can request a viewing.",
        },
        { status: 403 }
      );
    }

    const body = await request.json();
    const result = viewingRequestSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        {
          error: "Please provide valid viewing request information.",
          details: result.error.flatten(),
        },
        { status: 400 }
      );
    }

    const data = result.data;
    const preferredDate = new Date(data.preferredDate);

    if (preferredDate <= new Date()) {
      return NextResponse.json(
        {
          error: "Please choose a future date and time.",
        },
        { status: 400 }
      );
    }

    const property = await prisma.property.findUnique({
      where: {
        id: data.propertyId,
      },
      select: {
        id: true,
        title: true,
      },
    });

    if (!property) {
      return NextResponse.json(
        {
          error: "The property could not be found.",
        },
        { status: 404 }
      );
    }

    const existingRequest = await prisma.viewingRequest.findFirst({
      where: {
        propertyId: property.id,
        tenantId: session.user.id,
        status: {
          in: ["PENDING", "ACCEPTED", "RESCHEDULE_REQUESTED"],
        },
      },
      select: {
        id: true,
        status: true,
      },
    });

    if (existingRequest) {
      return NextResponse.json(
        {
          error:
            "You already have an active viewing request for this property.",
          requestId: existingRequest.id,
          status: existingRequest.status,
        },
        { status: 409 }
      );
    }

    const viewingRequest = await prisma.viewingRequest.create({
      data: {
        propertyId: property.id,
        tenantId: session.user.id,
        preferredDate,
        message: data.message?.trim() || null,
        status: "PENDING",
      },
      select: {
        id: true,
        propertyId: true,
        tenantId: true,
        preferredDate: true,
        message: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json(
      {
        success: true,
        request: viewingRequest,
        message: "Your viewing request has been submitted.",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("VIEWING_REQUEST_CREATION_ERROR", error);

    return NextResponse.json(
      {
        error: "Something went wrong while requesting the viewing.",
      },
      { status: 500 }
    );
  }
}
