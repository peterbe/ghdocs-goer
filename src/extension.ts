import { sep } from "path";
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  // Use the console to output diagnostic information (console.log) and errors (console.error)
  // This line of code will only be executed once when your extension is activated
  // console.log('Congratulations, your extension "ghdocs-goer" is now active!');

  function getCurrentURI(): {
    error?: string;
    uri?: string;
  } {
    const fileName = vscode.window.activeTextEditor?.document.fileName;
    if (fileName) {
      if (fileName.endsWith(".md")) {
        const split = fileName.split(sep);
        if (split.includes("content")) {
          const rest = split.slice(split.findIndex((x) => x === "content") + 1);
          // console.log({ rest });
          const last = rest.pop();
          if (last && last !== "index.md") {
            rest.push(last.replace(/\.md$/, ""));
          }
          const uri = rest.join("/");
          // console.log({ uri });

          return { uri };
        } else {
          return {
            error: "Current .md file is not inside a 'content' directory",
          };
        }
      } else {
        // vscode.window.showWarningMessage();
        return { error: "Current file is not a .md file" };
      }
    } else {
      return { error: "No current file name open" };
    }
  }

  let openProd = vscode.commands.registerCommand("ghdocs-goer.openProd", () => {
    const { uri, error } = getCurrentURI();
    if (error) {
      vscode.window.showWarningMessage(error);
    } else {
      const url = `https://docs.github.com/${uri}`;
      vscode.env.openExternal(vscode.Uri.parse(url));
    }
  });
  context.subscriptions.push(openProd);

  let openLocalhost = vscode.commands.registerCommand(
    "ghdocs-goer.openLocalhost",
    () => {
      const { uri, error } = getCurrentURI();
      if (error) {
        vscode.window.showWarningMessage(error);
      } else {
        const url = `http://localhost:4000/${uri}`;
        vscode.env.openExternal(vscode.Uri.parse(url));
      }
    }
  );
  context.subscriptions.push(openLocalhost);
}

// this method is called when your extension is deactivated
export function deactivate() {}
