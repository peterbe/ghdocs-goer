import { sep } from "path"
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode"

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  // Use the console to output diagnostic information (console.log) and errors (console.error)
  // This line of code will only be executed once when your extension is activated
  // console.log('Congratulations, your extension "ghdocs-goer" is now active!');

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
    vscode.commands.registerCommand(
      "ghdocs-goer.openLocalhost",
      openExternal("http://localhost:4000/")
    )
  )
}

// this method is called when your extension is deactivated
export function deactivate() {}

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
