function escapeCsvCell(value) {
  const s = String(
    value ?? ""
  );

  if (
    /[",\r\n]/.test(s)
  ) {
    return `"${s.replaceAll(
      '"',
      '""'
    )}"`;
  }

  return s;
}

export function rowsToCsv(rows) {
  return rows
    .map((row) =>
      row
        .map(escapeCsvCell)
        .join(",")
    )
    .join("\r\n");
}

export function downloadTextFile(
  filename,
  text,
  mime =
    "text/csv;charset=utf-8"
) {
  const blob = new Blob(
    [text],
    {
      type: mime,
    }
  );

  const url =
    URL.createObjectURL(blob);

  const a =
    document.createElement("a");

  a.href = url;
  a.download = filename;
  a.rel = "noopener";
  a.style.display = "none";
  document.body.append(a);
  a.click();
  a.remove();

  URL.revokeObjectURL(url);
}
