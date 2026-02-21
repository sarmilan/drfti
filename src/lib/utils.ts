import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDuration(minutes: number): string {
  return `~${minutes} min`;
}

export function getJourneyStats(path: string[]): { exchanges: number } {
  return { exchanges: Math.floor(path.length / 2) };
}
