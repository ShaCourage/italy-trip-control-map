export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard?.writeText(text);
    if (navigator.clipboard) return true;
  } catch {
    // Fallback below handles browsers that block clipboard.writeText.
  }

  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.left = "-9999px";
  document.body.append(textarea);
  textarea.select();

  try {
    return document.execCommand("copy");
  } catch {
    return false;
  } finally {
    textarea.remove();
  }
}
