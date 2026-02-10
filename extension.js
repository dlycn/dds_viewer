// extension.js
const vscode = require('vscode');
const DDSViewerProvider = require('./src/DDSViewerProvider');

function activate(context) {
    // 注册 DDS 查看器
    const provider = new DDSViewerProvider(context);
    
    const providerRegistration = vscode.window.registerCustomEditorProvider(
        'ddsViewer.ddsViewer',
        provider,
        {
            webviewOptions: {
                retainContextWhenHidden: true,
            },
            supportsMultipleEditorsPerDocument: false,
        }
    );
    
    context.subscriptions.push(providerRegistration);
    
    // 注册命令
    const commands = [
        {
            command: 'ddsViewer.exportPNG',
            handler: (uri) => provider.handleExportCommand(uri)
        }
    ];
    
    commands.forEach(cmd => {
        const disposable = vscode.commands.registerCommand(cmd.command, cmd.handler);
        context.subscriptions.push(disposable);
    });
    
    console.log('DDS Viewer extension activated');
}

function deactivate() {
    console.log('DDS Viewer extension deactivated');
}

module.exports = { activate, deactivate };