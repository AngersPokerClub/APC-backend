export const parseDateTimeLocal = (isoString: string) => {
  const [datePart, timePart] = isoString.split("T");
  const [year, month, day] = datePart.split("-").map(Number);
  const [hours, minutes] = timePart.split(":").map(Number);
  return new Date(Date.UTC(year, month - 1, day, hours, minutes));
};

export const formatDate = (value: string | Date) => {
  const date = new Date(value);
  if (isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("fr-FR", { timeZone: "UTC" });
};

export const formatHour = (value: string | Date) => {
  const date = new Date(value);
  if (isNaN(date.getTime())) return "-";

  const hours = date.getUTCHours().toString().padStart(2, "0");
  const minutes = date.getUTCMinutes().toString().padStart(2, "0");
  return `${hours}:${minutes}`;
};

export function getDurationInMinutes(start: Date, end: Date): number {
  return Math.floor((end.getTime() - start.getTime()) / 60000);
}

export const toLocalDate = (isoDate: string) => {
  const date = new Date(isoDate);
  const timezoneOffsetMs = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() + timezoneOffsetMs);
};

export const toDateTimeLocalString = (date: Date): string => {
  const tzDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return tzDate.toISOString().slice(0, 16);
};

export const toISODateOnly = (date: string | Date): string => {
  const tzDate = new Date(new Date(date).getTime() - new Date(date).getTimezoneOffset() * 60000);
  return tzDate.toISOString().slice(0, 10); // garde seulement YYYY-MM-DD
};


export const formatDateFR = (value: string | Date) => {
  const date = new Date(value);
  if (isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("fr-FR", { timeZone: "Europe/Paris" });
};

export const formatHourFR = (value: string | Date) => {
  const date = new Date(value);
  if (isNaN(date.getTime())) return "-";
  const hours = new Intl.DateTimeFormat("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Europe/Paris"
  }).format(date);
  return hours;
};

export function toLocalISOString(date: Date) {
  const tzoffset = date.getTimezoneOffset() * 60000; // offset en ms
  const localISOTime = new Date(date.getTime() - tzoffset).toISOString().slice(0, -1);
  return localISOTime;
}

export function parseLocalDateTime(dateTimeString: string) {
  // Ex: "2025-08-27T08:00"
  const [datePart, timePart] = dateTimeString.split("T");
  const [year, month, day] = datePart.split("-").map(Number);
  const [hours, minutes] = timePart.split(":").map(Number);
  return new Date(year, month - 1, day, hours, minutes);
}

export const formatHourUTC = (value: string | Date) => {
  const date = new Date(value);
  if (isNaN(date.getTime())) return "-";
  const hours = date.getUTCHours().toString().padStart(2, "0");
  const minutes = date.getUTCMinutes().toString().padStart(2, "0");
  return `${hours}:${minutes}`;
};

export const safeParseDate = (dateString: string | Date): Date | null => {
  if (!dateString) return null;

  if (dateString instanceof Date && !isNaN(dateString.getTime())) return dateString;

  let isoString = String(dateString);

  // Ajoute un "Z" si la chaîne ne contient pas d’indication de fuseau
  if (!isoString.endsWith("Z") && !isoString.includes("+")) {
    isoString += "Z";
  }  

  const d = new Date(isoString);
  return isNaN(d.getTime()) ? null : d;
};


export function formatDateTimeFr(date: string | Date): string {
  const d = new Date(date);
  if (isNaN(d.getTime())) return '-';

  // Format complet (date + heure) avec fuseau Europe/Paris
  return d.toLocaleString('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'Europe/Paris'
  }).replace(':', 'h');
}

export function formatDateFr(date: string | Date): string {
  const d = new Date(date);
  if (isNaN(d.getTime())) return '-';
  return d.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    timeZone: 'Europe/Paris',
  });
}

export function formatHourFr(date: string | Date): string {
  const d = new Date(date);
  if (isNaN(d.getTime())) return '-';
  return d.toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'Europe/Paris',
  }).replace(':', 'h');
}

export const formatDurationFromMinutes = (minutes: number) => {
  if (typeof minutes !== "number" || minutes < 0) return "-";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h${m}` : `${h}h`;
};




