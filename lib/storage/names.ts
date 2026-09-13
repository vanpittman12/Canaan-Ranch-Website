export function originalFileName(name: string) {
  const base = name.replace(/\\/g, "/").split("/").pop();
  return base && base.length > 0 ? base : "signed.pdf";
}

export function safeStoredName(storedName: string) {
  const base = originalFileName(storedName);
  const safe = base.replace(/[^A-Za-z0-9._-]/g, "-");
  return safe || "signed.pdf";
}

export function uploadObjectKey(storedName: string) {
  return `uploads/${safeStoredName(storedName)}`;
}
