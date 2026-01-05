"use server";

import { Gender } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { auth, currentUser } from "@clerk/nextjs/server";

const MOTIA_API_URL = process.env.NEXT_PUBLIC_MOTIA_API_URL || "http://localhost:4001";

async function motiaFetch(endpoint: string, options: RequestInit = {}) {
  const { userId } = await auth();
  if (!userId) throw new Error("You must be logged in");

  const user = await currentUser();
  const url = `${MOTIA_API_URL}${endpoint}`;

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        "x-clerk-user-id": userId,
        "x-clerk-user-email": user?.emailAddresses[0]?.emailAddress || "",
        "x-clerk-user-first-name": user?.firstName || "",
        "x-clerk-user-last-name": user?.lastName || "",
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

export async function getDoctors() {
  try {
    return await motiaFetch("/api/doctors");
  } catch (error) {
    console.log("Error fetching doctors:", error);
    throw new Error("Failed to fetch doctors");
  }
}

interface CreateDoctorInput {
  name: string;
  email: string;
  phone: string;
  speciality: string;
  gender: Gender;
  isActive: boolean;
}

export async function createDoctor(input: CreateDoctorInput) {
  try {
    if (!input.name || !input.email) throw new Error("Name and email are required");

    const doctor = await motiaFetch("/api/doctors", {
      method: "POST",
      body: JSON.stringify(input),
    });

    revalidatePath("/admin");

    return doctor;
  } catch (error: any) {
    console.error("Error creating doctor:", error);
    throw error;
  }
}

interface UpdateDoctorInput extends Partial<CreateDoctorInput> {
  id: string;
}

export async function updateDoctor(input: UpdateDoctorInput) {
  try {
    if (!input.name || !input.email) throw new Error("Name and email are required");

    const { id, ...data } = input;

    const doctor = await motiaFetch(`/api/doctors/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });

    revalidatePath("/admin");

    return doctor;
  } catch (error) {
    console.error("Error updating doctor:", error);
    throw error;
  }
}

export async function getAvailableDoctors() {
  try {
    // Motia API /api/doctors already returns all doctors with appointment counts
    // Filter for active doctors on the client side if needed, or the API can be enhanced
    return await motiaFetch("/api/doctors");
  } catch (error) {
    console.error("Error fetching available doctors:", error);
    throw new Error("Failed to fetch available doctors");
  }
}
