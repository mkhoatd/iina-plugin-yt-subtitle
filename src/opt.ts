const { preferences } = iina;

export const opt = {
    get ytdl_path(): string {
        return preferences.get("ytdl_path");
    },
}