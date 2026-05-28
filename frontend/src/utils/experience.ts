import { ExperienceItem } from "../types";

export function calculateTotalExperience(experience: ExperienceItem[]): string {
  if (!experience || experience.length === 0) return "0 mos";

  const intervals: { start: Date; end: Date }[] = [];

  for (const item of experience) {
    if (item.start_date && item.end_date) {
      const start = new Date(item.start_date);
      const end = new Date(item.end_date);
      if (!isNaN(start.getTime()) && !isNaN(end.getTime()) && start <= end) {
        intervals.push({ start, end });
      }
    }
  }

  if (intervals.length === 0) {
    // Fallback: If no date intervals could be parsed, sum up the parsed text (e.g. "2 yrs") if any
    let totalMonthsFallback = 0;
    for (const item of experience) {
      if (item.years) {
        const yrMatch = item.years.match(/(\d+(?:\.\d+)?)\s*(yr|year)/i);
        const moMatch = item.years.match(/(\d+(?:\.\d+)?)\s*(mo|month)/i);
        if (yrMatch) totalMonthsFallback += Math.round(parseFloat(yrMatch[1]) * 12);
        if (moMatch) totalMonthsFallback += Math.round(parseFloat(moMatch[1]));
      }
    }
    if (totalMonthsFallback > 0) {
      return formatMonths(totalMonthsFallback);
    }
    return "0 mos";
  }

  // Sort intervals by start date
  intervals.sort((a, b) => a.start.getTime() - b.start.getTime());

  // Merge overlapping intervals
  const merged: { start: Date; end: Date }[] = [{ start: new Date(intervals[0].start), end: new Date(intervals[0].end) }];

  for (let i = 1; i < intervals.length; i++) {
    const current = intervals[i];
    const lastMerged = merged[merged.length - 1];

    if (current.start <= lastMerged.end) {
      // Overlap: merge by taking the maximum end date
      if (current.end > lastMerged.end) {
        lastMerged.end = current.end;
      }
    } else {
      merged.push({ start: new Date(current.start), end: new Date(current.end) });
    }
  }

  // Calculate total months across merged intervals
  let totalMonths = 0;
  for (const interval of merged) {
    const diffTime = Math.abs(interval.end.getTime() - interval.start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    // Approximate months: 30.44 days per month
    const months = diffDays / 30.44;
    totalMonths += months;
  }

  const roundedMonths = Math.round(totalMonths);
  return formatMonths(roundedMonths);
}

export function formatMonths(totalMonths: number): string {
  if (totalMonths <= 0) return "0 mos";
  const years = Math.floor(totalMonths / 12);
  const months = totalMonths % 12;

  const parts: string[] = [];
  if (years > 0) {
    parts.push(`${years} yr${years !== 1 ? "s" : ""}`);
  }
  if (months > 0) {
    parts.push(`${months} mo${months !== 1 ? "s" : ""}`);
  }
  if (parts.length === 0) {
    return "0 mos";
  }
  return parts.join(" ");
}
