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

    if (session.user.role !== "TENANT") {
      return NextResponse.json(
        { error: "Only property seekers can view their viewing requests." },
        { status: 403 }
      );
    }

    const viewingRequests = await prisma.viewingRequest.findMany({
      where: {
        tenantId: session.user.id,
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
      },
      orderBy: [
        {
          preferredDate: "asc",
        },
        {
          createdAt: "desc",
        },
      ],
    });

    return NextResponse.json({ viewingRequests });
  } catch (error) {
    console.error("MY_TENANT_VIEWING_REQUESTS_ERROR", error);
    return NextResponse.json(
      { error: "Unable to load your viewing requests." },
      { status: 500 }
    );
  }
}
