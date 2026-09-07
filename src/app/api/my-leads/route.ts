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

    const leads = await prisma.lead.findMany({
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
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({
      leads,
    });
  } catch (error) {
    console.error("MY_LEADS_ERROR", error);

    return NextResponse.json(
      { error: "Unable to load your enquiries." },
      { status: 500 }
    );
  }
}
