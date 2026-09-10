import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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

    if (session.user.role !== "TENANT") {
      return NextResponse.json(
        { error: "Only property seekers can cancel viewing requests." },
        { status: 403 }
      );
    }

    const viewingRequest = await prisma.viewingRequest.findFirst({
      where: {
        id: params.id,
        tenantId: session.user.id,
      },
      select: {
        id: true,
        status: true,
      },
    });

    if (!viewingRequest) {
      return NextResponse.json(
        { error: "Viewing request not found." },
        { status: 404 }
      );
    }

    if (
      !["PENDING", "ACCEPTED", "RESCHEDULE_REQUESTED"].includes(
        viewingRequest.status
      )
    ) {
      return NextResponse.json(
        {
          error: "This viewing request can no longer be cancelled.",
        },
        { status: 400 }
      );
    }

    const updatedRequest = await prisma.viewingRequest.update({
      where: {
        id: viewingRequest.id,
      },
      data: {
        status: "CANCELLED",
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
      message: "Viewing request cancelled successfully.",
    });
  } catch (error) {
    console.error("TENANT_VIEWING_REQUEST_CANCEL_ERROR", error);

    return NextResponse.json(
      { error: "Unable to cancel the viewing request." },
      { status: 500 }
    );
  }
}
