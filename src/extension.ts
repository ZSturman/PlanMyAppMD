import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";

export function activate(context: vscode.ExtensionContext) {
  console.log('Congratulations, your extension "planmyappmd" is now active!');

  function loadAndCreateMarkdown(configPath: string, newFilePath: string) {
    try {
      const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
      const markdownTemplate = config.markdownTemplate;

      fs.writeFileSync(newFilePath, markdownTemplate);
      const fileUri = vscode.Uri.file(newFilePath);
      vscode.window.showTextDocument(fileUri);
    } catch (err) {
      console.error(err);
      vscode.window.showErrorMessage(
        "Error reading Markdown template. See console for details."
      );
    }
  }

  let openPlanMD = vscode.commands.registerCommand(
    "planmyappmd.openPlanMD",
    async () => {
      if (vscode.workspace.workspaceFolders) {
        let projectTitle = await vscode.window.showInputBox({
          prompt: "Enter the title of the project",
          placeHolder: "Project Title",
          validateInput: (value: string) => {
            if (value.length > 25) {
              return "Project title cannot exceed 50 characters.";
            }
            return null;
          },
        });

        if (!projectTitle) {
          vscode.window.showWarningMessage("Project title is required.");
          return;
        }

        projectTitle = projectTitle
          .replace(/\b\w/g, (match) => match.toUpperCase())
          .replace(/ /g, "");

        const filePath = path.join(
          vscode.workspace.workspaceFolders[0].uri.fsPath,
          projectTitle
        );

        let count = 1;
        let newFilePath = filePath + ".md";
        while (fs.existsSync(newFilePath)) {
          newFilePath = `${filePath}${count}.md`;
          count++;
        }

        // Show quick pick with options
        const options = ["Include examples", "Just headers"];
        const selectedOption = await vscode.window.showQuickPick(options, {
          placeHolder: "Choose a template type",
        });

        let configPath;
        if (selectedOption === "Include examples") {
          configPath = path.join(__dirname, "templateConfig.json");
        } else if (selectedOption === "Just headers") {
          configPath = path.join(__dirname, "headersConfig.json");
        } else {
          // User cancelled the quick pick, stop further execution
          return;
        }

        loadAndCreateMarkdown(configPath, newFilePath);
      } else {
        vscode.window.showErrorMessage(
          "No workspace is open. Please open a workspace and try again."
        );
      }
    }
  );

  context.subscriptions.push(openPlanMD);
}

// This method is called when your extension is deactivated
export function deactivate() {}
