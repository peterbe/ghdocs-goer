import { existsSync } from "fs"
import { sep } from "path"
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import type { InputBoxOptions } from "vscode"
import * as vscode from "vscode"

// this method is called when your extension is deactivated
export function deactivate() {}

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  // Use the console to output diagnostic information (console.log) and errors (console.error)
  // This line of code will only be executed once when your extension is activated

  function getCurrentURI(): {
    error?: string
    uri?: string
  } {
    try {
      return {
        uri: filenameToURI(vscode.window.activeTextEditor?.document.fileName),
      }
    } catch (err) {
      if (err instanceof Error) return { error: err.message }
      throw err
    }
  }

  function openExternal(prefix: string) {
    return () => {
      const { uri, error } = getCurrentURI()
      if (error) {
        vscode.window.showWarningMessage(error)
      } else {
        const url = `${prefix}${uri}`
        vscode.env.openExternal(vscode.Uri.parse(url))
      }
    }
  }

  context.subscriptions.push(
    vscode.commands.registerCommand(
      "ghdocs-goer.openProd",
      openExternal("https://docs.github.com/")
    )
  )

  context.subscriptions.push(
    vscode.commands.registerCommand(
      "ghdocs-goer.openLocalhost",
      openExternal("http://localhost:4000/")
    )
  )

  context.subscriptions.push(
    vscode.commands.registerCommand("ghdocs-goer.openByURL", () => {
      const options: InputBoxOptions = {
        prompt: "URL: ",
        placeHolder: "(paste in a full or partial URL)",
      }

      vscode.window.showInputBox(options).then(async (value) => {
        if (!value) return
        const pathName = inputToPathName(value)

        // 1. Try relative to the current document
        let contentRoot = ""
        const documentURI = vscode.window.activeTextEditor?.document.uri
        if (documentURI) {
          try {
            contentRoot = findContentsRoot(documentURI.path)
          } catch (err) {
            // If this fails, we'll deal with it later.
            // But up next is to try from the workspace folder.
          }
        }

        // 2. Try relevant to the workspace folder
        if (
          !contentRoot &&
          vscode.workspace.workspaceFolders &&
          vscode.workspace.workspaceFolders.length
        ) {
          const wf = vscode.workspace.workspaceFolders[0].uri.path
          try {
            contentRoot = findContentsRoot(wf)
          } catch (err) {
            if (err instanceof Error) {
              try {
                contentRoot = findContentsRoot([wf, "content"].join(sep))
              } catch (err) {
                if (err instanceof Error) {
                  vscode.window.showWarningMessage(err.message)
                  return
                }
                throw err
              }
            }
          }
        }

        if (!contentRoot) {
          vscode.window.showWarningMessage(
            `Can't figure out content root from current file or workspacefolder`
          )
          return
        }

        const mdFilePath = [contentRoot, pathName + ".md"].join(sep)
        const indexFilePath = [contentRoot, pathName, "index.md"].join(sep)

        const filePath = existsSync(mdFilePath)
          ? mdFilePath
          : existsSync(indexFilePath)
          ? indexFilePath
          : undefined
        if (!filePath) {
          vscode.window.showWarningMessage(
            `File does not exist in ${contentRoot}`
          )
          return
        }
        const doc = await vscode.workspace.openTextDocument(
          vscode.Uri.parse(filePath)
        )
        await vscode.window.showTextDocument(doc, { preview: false })
      })
    })
  )
}

function inputToPathName(value: string) {
  let pathName = ""
  try {
    pathName = new URL(value).pathname
  } catch {}
  if (pathName.endsWith("/")) {
    pathName = pathName.slice(0, pathName.length - 1)
  }
  if (pathName.startsWith("/en/")) {
    pathName = pathName.slice("/en/".length)
  }
  if (pathName.startsWith("/")) {
    pathName = pathName.slice(1)
  }
  return pathName
}

function findContentsRoot(fileName: string) {
  const split = fileName.split(sep)
  while (split.length && split.at(-1) !== "content") {
    split.pop()
  }
  if (split.length === 0) {
    throw new Error(`${fileName} not inside a directory called 'content'`)
  }
  const contentRoot = split.join(sep)
  if (existsSync(contentRoot)) return contentRoot
  throw new Error("content root does not exist")
}

function filenameToURI(fileName: string | undefined) {
  if (!fileName) throw new Error("No current file name open")

  if (fileName.endsWith(".md")) {
    const split = fileName.split(sep)
    if (split.includes("content")) {
      const rest = split.slice(split.findIndex((x) => x === "content") + 1)
      const last = rest.pop()
      if (last && last !== "index.md") {
        rest.push(last.replace(/\.md$/, ""))
      }
      return rest.join("/")
    } else {
      throw new Error("Current .md file is not inside a 'content' directory")
    }
  } else {
    throw new Error("Current file is not a .md file")
  }
}
