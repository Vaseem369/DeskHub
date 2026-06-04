export function formatDate(date) {
  if (!date) {
    return "-";
  }

  return new Intl.DateTimeFormat(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }
  ).format(new Date(date));
}

export function formatDateTime(
  date
) {
  if (!date) {
    return "-";
  }

  return new Intl.DateTimeFormat(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }
  ).format(new Date(date));
}

export function formatRelative(
  date
) {
  if (!date) {
    return "-";
  }

  const now = new Date();

  const target = new Date(date);

  const diffMs =
    target.getTime() -
    now.getTime();

  const absDiffMs =
    Math.abs(diffMs);

  const rtf =
    new Intl.RelativeTimeFormat(
      "en-IN",
      {
        numeric: "auto",
      }
    );

  const units = [
    ["year", 1000 * 60 * 60 * 24 * 365],
    ["month", 1000 * 60 * 60 * 24 * 30],
    ["day", 1000 * 60 * 60 * 24],
    ["hour", 1000 * 60 * 60],
    ["minute", 1000 * 60],
  ];

  for (const [unit, ms] of units) {
    if (absDiffMs >= ms) {
      return rtf.format(
        Math.round(diffMs / ms),
        unit
      );
    }
  }

  return "just now";
}
