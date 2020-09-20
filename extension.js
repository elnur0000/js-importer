// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require('vscode')
const path = require('path')

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed

/**
 * @param {vscode.ExtensionContext} context
 */
function activate (context) {
  // Use the console to output diagnostic information (console.log) and errors (console.error)
  // This line of code will only be executed once when your extension is activated

  // The command has been defined in the package.json file
  // Now provide the implementation of the command with  registerCommand
  // The commandId parameter must match the command field in package.json
  const disposable = vscode.commands.registerCommand('js-importer.run', async function () {
    // The code you place here will be executed every time your command is executed
    const files = await vscode.workspace.findFiles('**/*.{js,jsx,json,env}', '**/node_modules/**')
    const workspaceName = vscode.workspace.name
    const editor = vscode.window.activeTextEditor

    // build quick pick items from file list inside workspace
    const quickPickItems = files.map(fileObj => {
      const path = fileObj.path
      const fileName = path.slice(path.lastIndexOf('/') + 1)
      const fileNamePathRelativeToWorkspace = path.slice(path.indexOf(workspaceName), path.length - fileName.length - 1)
      return {
        label: fileName,
        description: fileNamePathRelativeToWorkspace
      }
    })
    const chosenFile = await vscode.window.showQuickPick(quickPickItems)
    if (!chosenFile) {
      return
    }
    const { description: fileNamePathRelativeToWorkspace, label: fileName } = chosenFile
    const currentFilePath = editor.document.fileName
    const fileNameWithoutExt = fileName.slice(0, fileName.indexOf('.'))

    const to = `${fileNamePathRelativeToWorkspace}/${fileName}`
    const from = path.resolve(currentFilePath, '..').slice(currentFilePath.indexOf(workspaceName))

    // in case it's a windows machine we replace "\" with "/"
    let relativePath = path.relative(from, to).replace(/\\/g, '/')

    // attach "./", if relative path doesn't go back, so we get "./math.js" instead of "math.js"
    if (relativePath[0] !== '.') {
      relativePath = './' + relativePath
    }

    editor.edit((editBuilder) => {
      editBuilder.insert(new vscode.Position(0), `import ${fileNameWithoutExt} from '${relativePath}'\n`)
    }
    )

    // take cursor and view to same place as new import statement
    const position = editor.selection.active
    const fromPosition = position.with(0, 7)
    const toPosition = position.with(0, 7 + fileNameWithoutExt.length)
    const newSelection = new vscode.Selection(fromPosition, toPosition)
    const range = new vscode.Range(fromPosition, fromPosition)
    editor.selection = newSelection
    editor.revealRange(range)
  })

  context.subscriptions.push(disposable)
}
exports.activate = activate

// this method is called when your extension is deactivated
function deactivate () {}

module.exports = {
  activate,
  deactivate
}
