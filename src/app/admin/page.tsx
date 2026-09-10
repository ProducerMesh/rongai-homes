import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";

import AdminModerationClient from "./AdminModerationClient";
import AdminViewingRequestsClient from "./viewing-requests/AdminViewingRequestsClient";

export default async function AdminPage() {
  const session = await getServerSession(authOptions);

  const userRole = (session?.user as { role?: string } | undefined)?.role;

  if (!session?.user || userRole !== "ADMIN") {
    return (
      <main className="min-h-screen bg-parchment px-6 py-12">
        <div className="mx-auto max-w-4xl">
          <h1 className="text-3xl font-bold text-acacia">
            Admin Moderation Center
          </h1>

          <p className="mt-4 text-gray-600">
            You do not have permission to access this area.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-parchment px-6 py-12">
      <div className="mx-auto max-w-6xl">
        <h1 className="text-3xl font-bold text-acacia">
          Admin Moderation Center
        </h1>

        <p className="mt-2 text-gray-600">
          Review and manage Rongai Homes property listings.
        </p>

        <AdminModerationClient />

        <AdminViewingRequestsClient />
      </div>
    </main>
  );
}
