let uuidModule: typeof import("uuid") | null = null;

export async function getUuid() {
    if (!uuidModule) {
        uuidModule = await import("uuid");
    }
    return uuidModule.v4();
}
