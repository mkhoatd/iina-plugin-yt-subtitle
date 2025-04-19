/// <reference path="../node_modules/iina-plugin-definition/iina/index.d.ts" />

let { utils, subtitle: iinaSubtitle, core, mpv, http, console: console2 } = iina;
import { opt } from "./opt";

// key: suburl
type PredownloadedSubtitleItem = {
    sub: IINA.API.SubtitleItem<YoutubeSubtitle>,
    links: string[]
}

// key: url
// nested key: suburl
const predownloadedSubtitles = new Map<string, Map<string, PredownloadedSubtitleItem>>()

async function search(url: string): Promise<IINA.API.SubtitleItem<YoutubeSubtitle>[]>  {
    console2.log("get search key: ", url)
    const predownloaded = predownloadedSubtitles.get(url)
    if (predownloaded) {
        console2.log("found predownloaded: ", predownloaded)
        return Array.from(predownloaded.values()).map(item => item.sub)
    }
    const ytdPath = getYtdPath();
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
    const vidJson = JSON.parse(result.stdout) as YTDL.Video;
    const man_subs: YoutubeSubtitle[] = Object.entries(vidJson.requested_subtitles).filter(([k, v]) => v.ext === "vtt").map(([k, v]) => ({
        name: v.name,
        lang: k,
        url: v.url,
        generated: false
    }))
    const gen_subs: YoutubeSubtitle[] = Object.entries(vidJson.automatic_captions).filter(([k, v]) => v.ext === "vtt").map(([k, v]) => ({
        name: k + " (auto)",
        lang: k,
        url: v.url,
        generated: true
    }))
    console2.log("man_subs: ", man_subs.map(sub => sub.url))
    console2.log("gen_subs: ", gen_subs.map(sub => sub.url))
    const subs = [...gen_subs, ...man_subs];
    const res = subs.map(sub => (
        iinaSubtitle.item(sub)
    ))
    console2.log("res len: ", res.length)
    return res
}

async function download(item: IINA.API.SubtitleItem<YoutubeSubtitle>): Promise<string[]> {
    console2.log("get download key: ", core.status.url)
    const predownloaded = predownloadedSubtitles.get(core.status.url)
    if (predownloaded) {
        console2.log("found predownloaded: ", predownloaded)
        const si = predownloaded.get(item.data.url)
        if (si) {
            return si.links
        }
    }
    console2.log("Provider download start: ", item.data.url)
    const dest = `@tmp/${item.data.name}.vtt`
    await http.download(item.data.url, dest)
    return [dest]
}

mpv.addHook("on_load", 50, async (next) => {
    const url = mpv.getString("stream-open-filename")
    console2.log("url hook on_load: ", url)
    console2.log("predownload subtitles")
    const subs = await search(url)
    const m: Map<string, PredownloadedSubtitleItem> = new Map()
    for (const sub of subs) {
        const links = await download(sub)
        m.set(sub.data.url, {
            sub,
            links
        })
    }
    predownloadedSubtitles.set(url, m)
    next()
})

mpv.addHook("on_unload", 50, async (next) => {
    predownloadedSubtitles.clear()
    next()
})

type YoutubeSubtitle = {
    name: string;
    lang: string;
    url: string;
    generated: boolean;
}
const getYtdPath = (): string => {
    let path = "youtube-dl";
    const searchList = [opt.ytdl_path, "yt-dlp", "@data/yt-dlp", "youtube-dl"];
    for (const item of searchList) {
        if (utils.fileInPath(item)) {
            console2.log(`Search item: ${item}`)
            console2.log(`Found youtube-dl; using ${item}`);
            path = item;
            break;
        }
    }
    return path;
}

const youtubeProvider: IINA.API.SubtitleProvider<YoutubeSubtitle> = {
    search: async (): Promise<IINA.API.SubtitleItem<YoutubeSubtitle>[]> => {
        const url = core.status.url;
        return search(url)
    },

    description(): IINA.API.SubtitleItemDescriptor<YoutubeSubtitle> {
        return (item: IINA.API.SubtitleItem<YoutubeSubtitle>): { name: string; left: string; right: string } => {
            console2.log("item description: ", item)
            const subData = item.data;
            return {
                name: subData.name,
                left: subData.lang ?? "Unknown language",
                right: subData.generated ? "Auto-generated" : "Manual"
            };
        };
    },

    async download(item: IINA.API.SubtitleItem<YoutubeSubtitle>): Promise<string[]> {
        return download(item)
    }
}

export { youtubeProvider };