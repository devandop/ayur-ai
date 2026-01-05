import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

// Utility function to merge Tailwind CSS classes
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Generate Avatar for Ayurveda practitioner or patient based on name and gender
export function generateAvatar(name: string, gender: "MALE" | "FEMALE") {
  const username = name.replace(/\s+/g, "").toLowerCase();
  const base = "https://avatar.iran.liara.run/public";
  if (gender === "FEMALE") return `${base}/girl?username=${username}`;
  // default to male
  return `${base}/boy?username=${username}`;
}

// Phone number formatting function for Ayurvedic consultations
export const formatPhoneNumber = (value: string) => {
  if (!value) return value;

  const phoneNumber = value.replace(/[^\d]/g, "");
  const phoneNumberLength = phoneNumber.length;

  if (phoneNumberLength < 4) return phoneNumber;
  if (phoneNumberLength < 7) {
    return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3)}`;
  }
  return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3, 6)}-${phoneNumber.slice(6, 10)}`;
};

// AI-generated function to get the next 5 days in ISO format
export const getNext5Days = () => {
  const dates = [];
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);

  for (let i = 0; i < 5; i++) {
    const date = new Date(tomorrow);
    date.setDate(date.getDate() + i);
    dates.push(date.toISOString().split("T")[0]);
  }

  return dates;
};

// Function to get available time slots for Ayurvedic consultations
export const getAvailableTimeSlots = () => {
  return [
    "09:00",
    "09:30",
    "10:00",
    "10:30",
    "11:00",
    "11:30",
    "14:00",
    "14:30",
    "15:00",
    "15:30",
    "16:00",
    "16:30",
  ];
};

// Define different Ayurvedic consultation types with their details and prices in dollars
export const APPOINTMENT_TYPES = [
  { id: "consultation", name: "Ayurvedic Consultation", duration: "60 min", price: "$45" },
  { id: "panchakarma", name: "Panchakarma Therapy", duration: "120 min", price: "$120" },
  { id: "herbal_treatment", name: "Herbal Treatment", duration: "45 min", price: "$50" },
  { id: "diet_plan", name: "Customized Ayurvedic Diet Plan", duration: "30 min", price: "$55" },
];

// Optional: Functions for generating or formatting Ayurvedic-specific data can be added here.
