import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
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
        { error: "Only landlords can view these requests." },
        { status: 403 }
      );
    }

    const viewingRequests = await prisma.viewingRequest.findMany({
      where: {
        property: {
          landlordId: session.user.id,
        },
      },
      include: {
        property: {
          select: {
            id: true,
            title: true,
            neighbourhood: {
              select: {
                name: true,
              },
            },
          },
        },
        tenant: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
      },
      orderBy: {
        preferredDate: "asc",
      },
    });

    return NextResponse.json({ viewingRequests });
  } catch (error) {
    console.error("MY_VIEWING_REQUESTS_ERROR", error);

    return NextResponse.json(
      { error: "Unable to load viewing requests." },
      { status: 500 }
    );
  }
}
