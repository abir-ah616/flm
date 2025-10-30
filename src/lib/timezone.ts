export function getBDTDate(): Date {
  const now = new Date();
  const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
  const bdtTime = new Date(utc + (6 * 60 * 60000));
  return bdtTime;
}

export function getBDTDateString(): string {
  const bdtDate = getBDTDate();
  const year = bdtDate.getFullYear();
  const month = String(bdtDate.getMonth() + 1).padStart(2, '0');
  const day = String(bdtDate.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function formatBDTDate(dateString: string): string {
  const date = new Date(dateString + 'T00:00:00Z');
  const utc = date.getTime();
  const bdtTime = new Date(utc + (6 * 60 * 60000));

  return bdtTime.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC"
  });
}

export function formatBDTTime(timeString: string): string {
  const time = new Date(timeString);
  const utc = time.getTime() + (time.getTimezoneOffset() * 60000);
  const bdtTime = new Date(utc + (6 * 60 * 60000));

  return bdtTime.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    timeZone: "UTC"
  });
}

export function compareBDTDates(dateString: string, comparison: 'today' | 'tomorrow'): boolean {
  const bdtToday = getBDTDate();
  const compareDate = new Date(dateString + 'T00:00:00Z');
  const utc = compareDate.getTime();
  const bdtCompareDate = new Date(utc + (6 * 60 * 60000));

  if (comparison === 'today') {
    return bdtToday.toDateString() === bdtCompareDate.toDateString();
  } else {
    const bdtTomorrow = new Date(bdtToday);
    bdtTomorrow.setDate(bdtTomorrow.getDate() + 1);
    return bdtTomorrow.toDateString() === bdtCompareDate.toDateString();
  }
}

export function isTournamentStillActive(startTimeString: string): boolean {
  const bdtNow = getBDTDate();
  const startTime = new Date(startTimeString);
  const oneHourAfterStart = new Date(startTime.getTime() + (60 * 60000));
  return bdtNow <= oneHourAfterStart;
}

export function isTournamentPast(dateString: string, startTimeString: string): boolean {
  const bdtNow = getBDTDate();
  const startTime = new Date(startTimeString);
  const oneHourAfterStart = new Date(startTime.getTime() + (60 * 60000));
  return bdtNow > oneHourAfterStart;
}
