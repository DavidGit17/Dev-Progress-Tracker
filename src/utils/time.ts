export function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

export function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60) % 24;
  const m = minutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

export function formatSeconds(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) {
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function calcPlannedDuration(
  startTime: string,
  endTime: string,
): number {
  const start = timeToMinutes(startTime);
  let end = timeToMinutes(endTime);
  if (end < start) end += 24 * 60; // crosses midnight
  return end - start;
}

function parseDateWithTime(date: string, time: string): Date {
  const [year, month, day] = date.split("-").map(Number);
  const [hours, minutes] = time.split(":").map(Number);
  return new Date(year, month - 1, day, hours, minutes, 0, 0);
}

export function getTaskStartDate(task: {
  date: string;
  startTime: string;
}): Date {
  return parseDateWithTime(task.date, task.startTime);
}

export function getTaskEndDate(task: {
  date: string;
  startTime: string;
  endTime: string;
}): Date {
  const startDate = parseDateWithTime(task.date, task.startTime);
  const endDate = parseDateWithTime(task.date, task.endTime);
  if (endDate <= startDate) {
    endDate.setDate(endDate.getDate() + 1);
  }
  return endDate;
}

export function isTaskOverdue(task: {
  startTime: string;
  endTime: string;
  date: string;
  status: string;
}): boolean {
  if (task.status !== "pending") return false;
  return Date.now() > getTaskEndDate(task).getTime();
}
