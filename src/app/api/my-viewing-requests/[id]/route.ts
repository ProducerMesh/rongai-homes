import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const updateViewingRequestSchema = z.object({
  status: z.enum([
    "ACCEPTED",
    "DECLINED",
    "RESCHEDULE_REQUESTED",
    "COMPLETED",
    "CANCELLED",
  ]),
});

export const dynamic = "force-dynamic";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "You must be signed in." },
        { status: 401 }
      );
    }

    if (session.user.role !== "LANDLORD") {
      return NextResponse.json(
        { error: "Only landlords can manage viewing requests." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const result = updateViewingRequestSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        {
          error: "Please provide a valid viewing request status.",
          details: result.error.flatten(),
        },
        { status: 400 }
      );
    }

    const viewingRequest = await prisma.viewingRequest.findFirst({
      where: {
        id: params.id,
        property: {
          landlordId: session.user.id,
        },
      },
      select: {
        id: true,
        status: true,
        propertyId: true,
        tenantId: true,
        preferredDate: true,
      },
    });

    if (!viewingRequest) {
      return NextResponse.json(
        { error: "Viewing request not found." },
        { status: 404 }
      );
    }

    const updatedRequest = await prisma.viewingRequest.update({
      where: {
        id: viewingRequest.id,
      },
      data: {
        status: result.data.status,
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

    return NextResponse.json({
      success: true,
      request: updatedRequest,
      message: "Viewing request status updated successfully.",
    });
  } catch (error) {
    console.error("MY_VIEWING_REQUEST_UPDATE_ERROR", error);

    return NextResponse.json(
      { error: "Unable to update the viewing request." },
      { status: 500 }
    );
  }
}
