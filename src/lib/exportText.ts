export function escapeCsvValue(value: string | number) {
  return `"${String(value).replaceAll('"', '""')}"`;
}

const xmlEntities: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&apos;",
};

export function escapeXmlText(value: string | number) {
  return String(value).replace(/[&<>"']/g, (char) => xmlEntities[char]);
}
