export async function getUuid() {
  const { v4 } = await import("uuid");
  return v4();
}
