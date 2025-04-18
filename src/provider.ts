/// <reference path="../node_modules/iina-plugin-definition/iina/index.d.ts" />

let { utils, subtitle: iinaSubtitle, core, mpv, http } = iina;

type YoutubeSubtitle = {
    name: string;
    lang: string;
    url: string;
    generated: boolean;
}
const getYtdPath = (): string => {
    let path = "youtube-dl";
    const searchList = ["@data/yt-dlp", "yt-dlp", "youtube-dl"];
    for (const item of searchList) {
        if (utils.fileInPath(item)) {
            console.log(`Found youtube-dl; using ${item}`);
            path = item;
            break;
        }
    }
    return path;
}

const youtubeProvider: IINA.API.SubtitleProvider<YoutubeSubtitle> = {
    search: async (): Promise<IINA.API.SubtitleItem<YoutubeSubtitle>[]> => {
        const ytdPath = getYtdPath();
        const url = mpv.getString("stream-open-filename");
        if (
            !url.startsWith("ytdl://") &&
            !url.startsWith("http://") &&
            !url.startsWith("https://")
        ) {
            return [];
        }
        const args = [
            "--write-subs",
            "--write-auto-subs",
            "--dump-json",
            url
        ]
        const result = await utils.exec(ytdPath, args);
        console.log({ result })
        const vidJson = JSON.parse(result.stdout) as YTDL.Video;
        const man_subs: YoutubeSubtitle[] = Object.entries(vidJson.requested_subtitles).filter(([k, v]) => v.ext === "vtt").map(([k, v]) => ({
            name: v.name,
            lang: k,
            url: v.url,
            generated: false
        }))
        const gen_subs: YoutubeSubtitle[] = Object.entries(vidJson.requested_subtitles).filter(([k, v]) => v.ext === "vtt").map(([k, v]) => ({
            name: v.name,
            lang: k,
            url: v.url,
            generated: true
        }))
        const subs = [...gen_subs, ...man_subs];
        return subs.map(sub => (
            iinaSubtitle.item(sub)
        ))
    },

    async download(item: IINA.API.SubtitleItem<YoutubeSubtitle>): Promise<string[]> {
        const path = await http.download(item.data.url, "@tmp")
        return [path];
    }
}
