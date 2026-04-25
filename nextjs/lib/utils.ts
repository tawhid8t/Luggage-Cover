import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(amount?: number): string {
  return `৳ ${(amount ?? 0).toLocaleString("en-BD")}`;
}

export function formatDate(date?: string | Date): string {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("en-BD", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatDatetime(date?: string | Date): string {
  if (!date) return "—";
  return new Date(date).toLocaleString("en-BD", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export const SIZES = [
  { value: "small" as const, label: "Small", range: '18" – 20"', price: 990 },
  { value: "medium" as const, label: "Medium", range: '20" – 24"', price: 1190 },
  { value: "large" as const, label: "Large", range: '24" – 28"', price: 1490 },
];

export const DISTRICTS = [
  "Dhaka",
  "Chittagong",
  "Sylhet",
  "Rajshahi",
  "Khulna",
  "Barisal",
  "Rangpur",
  "Mymensingh",
  "Gazipur",
  "Narayanganj",
  "Comilla",
  "Bogra",
  "Tangail",
  "Jessore",
  "Cox's Bazar",
  "Other",
];
