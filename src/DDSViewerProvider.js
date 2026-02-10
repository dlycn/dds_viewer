// src/DDSViewerProvider.js
const vscode = require('vscode');
const fs = require('fs');
const path = require('path');

const DDSDocument = require('./DDSDocument');
const DDSFormatDetector = require('./DDSFormatDetector');
const HTMLGenerator = require('./HTMLGenerator');

class DDSViewerProvider {
    /**
     * @param {vscode.ExtensionContext} context - VSCode扩展上下文
     */
    constructor(context) {
        this.context = context;
        this.webviewPanel = null;
    }

    /**
     * 打开自定义文档
     * @param {vscode.Uri} uri - DDS文件的URI
     * @returns {Promise<DDSDocument>} DDS文档实例
     */
    async openCustomDocument(uri) {
        return new DDSDocument(uri);
    }

    /**
     * 解析自定义编辑器
     * @param {DDSDocument} document - DDS文档实例
     * @param {vscode.WebviewPanel} webviewPanel - Webview面板
     */
    async resolveCustomEditor(document, webviewPanel) {
        const filePath = document.uri.fsPath;
        this.webviewPanel = webviewPanel;
        
        // 设置消息处理器
        webviewPanel.webview.onDidReceiveMessage(
            async (message) => {
                switch (message.command) {
                    case 'exportPNG':
                        await this.handleExportPNG(message.data, filePath);
                        return;
                    case 'showMessage':
                        vscode.window.showInformationMessage(message.text);
                        return;
                }
            }
        );
        
        // 设置 Webview 内容
        webviewPanel.webview.options = {
            enableScripts: true,
            localResourceRoots: []
        };
        
        try {
            // 读取 DDS 文件
            const buffer = fs.readFileSync(filePath);
            const ddsInfo = DDSFormatDetector.parseDDSHeader(buffer);
            const formatType = DDSFormatDetector.detectFormat(ddsInfo.pixelFormat);
            
            // 传递文件 buffer 用于解码
            const base64Data = buffer.toString('base64');
            
            // 使用 HTMLGenerator 生成预览界面
            webviewPanel.webview.html = HTMLGenerator.generatePreviewHTML(
                ddsInfo, 
                filePath, 
                base64Data, 
                formatType
            );
            
        } catch (error) {
            // 文件读取失败时，创建包含错误的ddsInfo对象
            const ddsInfo = {
                error: `Error reading DDS file: ${error.message}`,
                valid: false,
                header: {
                    width: 0,
                    height: 0
                },
                pixelFormat: {},
                fileSize: 0
            };
            
            // 生成预览界面，错误信息将在预览界面内部显示
            webviewPanel.webview.html = HTMLGenerator.generatePreviewHTML(
                ddsInfo, 
                filePath, 
                '',  // 空base64数据
                'UNKNOWN'
            );
        }
    }

    /**
     * 处理 PNG 导出
     * @param {string} pngData - Base64编码的PNG数据
     * @param {string} originalFilePath - 原始DDS文件路径
     */
    async handleExportPNG(pngData, originalFilePath) {
        try {
            // 移除 data URL 前缀
            const base64Data = pngData.replace(/^data:image\/png;base64,/, '');
            const buffer = Buffer.from(base64Data, 'base64');
            
            // 获取原文件名（不含扩展名）
            const originalName = path.basename(originalFilePath, '.dds');
            const defaultFileName = `${originalName}.png`;
            
            // 获取默认下载文件夹路径
            const downloadsPath = path.join(require('os').homedir(), 'Downloads', defaultFileName);
            
            // 显示保存对话框
            const uri = await vscode.window.showSaveDialog({
                defaultUri: vscode.Uri.file(downloadsPath),
                filters: {
                    'PNG Images': ['png']
                },
                title: '导出 PNG 文件'
            });
            
            if (uri) {
                // 写入文件
                await vscode.workspace.fs.writeFile(uri, buffer);
                
                // 显示成功消息和文件位置
                const savePath = uri.fsPath;
                const action = await vscode.window.showInformationMessage(
                    `PNG 文件已保存到: ${savePath}`,
                    '在文件管理器中显示',
                    '打开文件'
                );
                
                if (action === '在文件管理器中显示') {
                    // 在文件管理器中显示文件
                    vscode.commands.executeCommand('revealFileInOS', uri);
                } else if (action === '打开文件') {
                    // 打开文件
                    vscode.commands.executeCommand('vscode.open', uri);
                }
                
                // 通知 Webview 导出成功
                if (this.webviewPanel) {
                    this.webviewPanel.webview.postMessage({
                        command: 'exportSuccess',
                        path: savePath
                    });
                }
            }
        } catch (error) {
            vscode.window.showErrorMessage(`导出失败: ${error.message}`);
            
            // 通知 Webview 导出失败
            if (this.webviewPanel) {
                this.webviewPanel.webview.postMessage({
                    command: 'exportError',
                    error: error.message
                });
            }
        }
    }
}

module.exports = DDSViewerProvider;