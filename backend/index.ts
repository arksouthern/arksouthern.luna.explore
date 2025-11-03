import { Stats } from "fs"
import { readdir, readFile, stat, writeFile, cp, rm, rename } from "fs/promises"
import { dirname } from "path"
import { Shortcut } from "~/Types"

export type FioStat = (Stats & { name: string, type: { as: "shortcut", shortcut: Shortcut } | { as: "file" } | { as: "folder", fios: FioStat[] } | { as: "locked" } })
export type SaveLocation =
    | "Desktop"
    | "Documents"
    | "Favorites"
    | "Music"
    | "Games"
    | "Pictures"
    | "Downloads"

export const api = {
    dirList: async (props: { path: string }) => {
        console.log(props.path)
        const dir = dirname(props.path)
        return api.folderRead({ dir })
    },
    folderRead: async (props: { dir: string }) => {
        const dirFiles = await readdir(props.dir)
        const files = [] as FioStat[]
        for (const dirFile of dirFiles) {
            try {
                const file = await stat(`${props.dir}/${dirFile}`) as FioStat
                file.name = dirFile
                if (dirFile.endsWith(".xp.json"))
                    file.type = { as: "shortcut", shortcut: JSON.parse(await readFile(`${props.dir}/${dirFile}`, "utf-8")) }
                else
                    file.type = file.isDirectory() ? { as: "folder", fios: [] } : { as: "file" }
                files.push(file)
            } catch (error) {
                const file = { name: dirFile, type: { as: "locked" } } as FioStat
                files.push(file)
            }
        }
        return files
    },
    anyCopy: async (props: { originalPath: string, destPath: string }) => {
        await cp(props.originalPath, props.destPath, { recursive: true, preserveTimestamps: true })
    },
    fileDangerouslyRename: async (props: { filePath: string, newFilePath: string }) => {
        const file = await stat(props.filePath)
        if (!file.isFile()) return
        await rename(props.filePath, props.newFilePath)
    },
    fileDangerouslyDelete: async (props: { filePath: string }) => {
        const file = await stat(props.filePath)
        if (!file.isFile()) return
        await rm(props.filePath)
    },
    shortcutCreateBasic: async (props: { params: {}, progName: string, icon: string, prog: string, saveLocation: SaveLocation }) => {
        const shortcut = {
            ...props, progName: undefined
        }
        await writeFile(`${__dirname}/../../../../../../data/${props.saveLocation}/${props.progName}.xp.json`, JSON.stringify(shortcut))
    },
    backgroundImageSet: async (props: { filePath: string }) => {
        const diJson = {
            "background-image": `url('R00T/read-media/?url=${encodeURIComponent(props.filePath)}')`,
            "background-size": "contain",
            "background-color": "black",
            "background-repeat": "no-repeat",
            "background-position": "center"
        }
        await writeFile(`${__dirname}/../../../../../../data/Desktop/Background.di.json`, JSON.stringify(diJson))
    }
}