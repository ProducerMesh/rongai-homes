import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "You must be signed in." },
        { status: 401 }
      );
    }

    const properties = await prisma.property.findMany({
      where: {
        landlordId: session.user.id,
      },
      include: {
        neighbourhood: {
          select: {
            name: true,
          },
        },
        images: {
          orderBy: {
            sortOrder: "asc",
          },
          take: 1,
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({
      properties,
    });
  } catch (error) {
    console.error("MY_LISTINGS_ERROR", error);

    return NextResponse.json(
      { error: "Unable to load your listings." },
      { status: 500 }
    );
  }
}
