import { appDirectoryName, fileEncoding, welcomeNoteFilename } from "@shared/constants"
import { NoteInfo } from "@shared/models"
import { CreateNote, DeleteNote, GetNotes, ReadNote, WriteNote } from "@shared/types"
import * as chardet from "chardet"
import { dialog } from "electron"
import { ensureDir, readdir, readFile, remove, stat, writeFile } from "fs-extra"
import * as iconv from "iconv-lite"
import { isEmpty } from "lodash"
import { homedir } from "os"
import path from "path"
import welcomeNoteFile from "../../../resources/welcomeNote.md?asset"

export const getRootDir = () => {
  return process.platform === "win32"
    ? `${homedir}\\${appDirectoryName}`
    : `${homedir}/${appDirectoryName}`
}

export const getNotes: GetNotes = async () => {
  const rootDir = getRootDir()

  await ensureDir(rootDir)

  const notesFileNames = await readdir(rootDir, {
    encoding: fileEncoding,
    withFileTypes: false
  })

  const notes = notesFileNames.filter((fileName) => fileName.endsWith(".md"))

  if (isEmpty(notes)) {
    console.info("No notes found, showing welcome note")
    const content = await readFile(welcomeNoteFile, { encoding: fileEncoding })
    await writeFile(`${rootDir}/${welcomeNoteFilename}`, content, { encoding: fileEncoding })

    notes.push(welcomeNoteFilename)
  }

  return Promise.all(notes.map(getNoteInfoFromFilename))
}

export const getNoteInfoFromFilename = async (filename: string): Promise<NoteInfo> => {
  const fileStats = await stat(`${getRootDir()}/${filename}`)

  return {
    title: filename.replace(/\.md$/, ""),
    lastEditTime: fileStats.mtimeMs
  }
}

export const readNote: ReadNote = async (filename) => {
  const rootDir = getRootDir()
  const filePath = `${rootDir}/${filename}.md`

  const buffer = await readFile(filePath)
  const encoding = chardet.detect(buffer) || "utf-8"

  const content = iconv.decode(buffer, encoding)

  return content
}

export const writeNote: WriteNote = async (filename, content) => {
  const rootDir = getRootDir()

  console.info(`Writing note ${filename}`)
  return writeFile(`${rootDir}/${filename}.md`, content, { encoding: fileEncoding })
}

export const createNote: CreateNote = async () => {
  const rootDir = getRootDir()
  console.log(rootDir)

  await ensureDir(rootDir)
  const { filePath, canceled } = await dialog.showSaveDialog({
    title: "New note",
    defaultPath: `${rootDir}/untitled.md`,
    buttonLabel: "Create",
    properties: ["showOverwriteConfirmation"],
    showsTagField: false,
    filters: [{ name: "NoteMark Markdown", extensions: ["md"] }]
  })

  if (canceled || !filePath) {
    console.error("Note creation cancelled")
    return false
  }

  const { name: filename, dir: parentDir } = path.parse(filePath)

  if (parentDir !== rootDir) {
    await dialog.showMessageBox({
      type: "error",
      title: "Creation failed",
      message: `All notes must be saved under ${rootDir}, avoid using other directories.`
    })
    return false
  }

  console.info(`Creating note: ${filePath}`)

  await writeFile(filePath, "")

  return filename
}

export const deleteNote: DeleteNote = async (filename) => {
  const rootDir = getRootDir()

  const { response } = await dialog.showMessageBox({
    type: "warning",
    title: "Delete note",
    message: `Are you sure you want to delete ${filename}`,
    buttons: ["Delete", "Cancel"],
    defaultId: 1,
    cancelId: 1
  })

  if (response === 1) {
    console.error("Note deletion canceled")
    return false
  }

  console.info(`Deleting note: ${filename}`)

  await remove(
    process.platform === "win32" ? `${rootDir}\\${filename}.md` : `${rootDir}/${filename}.md`
  )
  return true
}
