"use server";

import { auth, currentUser } from "@clerk/nextjs/server";
import { AppointmentStatus } from "@prisma/client";

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
        fullErrorText: errorText,
      });

      throw new Error(`[${response.status}] ${errorMessage}`);
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

export async function getAppointments() {
  try {
    return await motiaFetch("/api/appointments");
  } catch (error) {
    console.log("Error fetching appointments:", error);
    throw new Error("Failed to fetch appointments");
  }
}

export async function getAdminAppointments() {
  try {
    return await motiaFetch("/api/admin/appointments");
  } catch (error) {
    console.log("Error fetching admin appointments:", error);
    throw new Error("Failed to fetch appointments");
  }
}

export async function getUserAppointments() {
  try {
    // Motia API /api/appointments already filters by authenticated user
    return await motiaFetch("/api/appointments");
  } catch (error) {
    console.error("Error fetching user appointments:", error);
    throw new Error("Failed to fetch user appointments");
  }
}

export async function getUserAppointmentStats() {
  try {
    return await motiaFetch("/api/appointments/stats");
  } catch (error) {
    console.error("Error fetching user appointment stats:", error);
    return { totalAppointments: 0, completedAppointments: 0 };
  }
}

export async function getBookedTimeSlots(doctorId: string, date: string) {
  try {
    const response = await motiaFetch(`/api/doctors/${doctorId}/availability?date=${date}`);
    // Extract just the bookedSlots array from the response
    return response.bookedSlots || [];
  } catch (error) {
    console.error("Error fetching booked time slots:", error);
    return []; // return empty array if there's an error
  }
}

interface BookAppointmentInput {
  doctorId: string;
  date: string;
  time: string;
  reason?: string;
  duration?: number;
}

export async function bookAppointment(input: BookAppointmentInput) {
  try {
    if (!input.doctorId || !input.date || !input.time) {
      throw new Error("Doctor, date, and time are required");
    }

    return await motiaFetch("/api/appointments", {
      method: "POST",
      body: JSON.stringify({
        doctorId: input.doctorId,
        date: input.date,
        time: input.time,
        reason: input.reason || "General consultation",
        duration: input.duration,
      }),
    });
  } catch (error: any) {
    console.error("Error booking appointment:", error);
    // Preserve the specific error message from backend
    throw error;
  }
}

export async function updateAppointmentStatus(input: { id: string; status: AppointmentStatus }) {
  try {
    return await motiaFetch(`/api/appointments/${input.id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status: input.status }),
    });
  } catch (error) {
    console.error("Error updating appointment:", error);
    throw new Error("Failed to update appointment");
  }
}
