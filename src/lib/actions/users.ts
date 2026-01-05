"use server";

import { currentUser } from "@clerk/nextjs/server";
import { auth } from "@clerk/nextjs/server";

const MOTIA_API_URL = process.env.NEXT_PUBLIC_MOTIA_API_URL || "http://localhost:4001";

async function motiaFetch(endpoint: string, options: RequestInit = {}) {
  const { userId } = await auth();
  if (!userId) throw new Error("You must be logged in");

  const url = `${MOTIA_API_URL}${endpoint}`;

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        "x-clerk-user-id": userId,
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = "Request failed";

      try {
        const errorJson = JSON.parse(errorText);
        errorMessage = errorJson.error || errorJson.message || "Request failed";
      } catch {
        errorMessage = errorText || "Request failed";
      }

      console.error(`Motia API Error: ${response.status} ${response.statusText}`, {
        url,
        status: response.status,
        error: errorMessage,
      });

      throw new Error(errorMessage);
    }

    return response.json();
  } catch (error: any) {
    // Handle connection errors specifically
    if (error.cause?.code === "ECONNREFUSED" || error.cause?.code === "ECONNRESET") {
      console.error(`Cannot connect to Motia backend at ${url}`);
      console.error("Make sure the backend is running: cd backend && npm run dev");
      throw new Error(`Backend not available. Please ensure Motia backend is running on ${MOTIA_API_URL}`);
    }
    throw error;
  }
}

export async function syncUser() {
  try {
    const user = await currentUser();
    if (!user) return;

    // The Motia API will handle user sync/creation via the clerkAuthMiddleware
    // Send user data in headers for auto-creation
    const { userId } = await auth();
    if (!userId) return;

    const url = `${MOTIA_API_URL}/api/users/me`;

    try {
      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "x-clerk-user-id": userId,
          "x-clerk-user-email": user.emailAddresses[0]?.emailAddress || "",
          "x-clerk-user-first-name": user.firstName || "",
          "x-clerk-user-last-name": user.lastName || "",
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Failed to sync user:", errorText);
        return;
      }

      return await response.json();
    } catch (error: any) {
      if (error.cause?.code === "ECONNREFUSED" || error.cause?.code === "ECONNRESET") {
        console.error("Cannot connect to Motia backend. Make sure it's running.");
        return;
      }
      throw error;
    }
  } catch (error) {
    console.log("Error in syncUser server action", error);
  }
}
