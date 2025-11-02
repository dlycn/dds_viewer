const vscode = require('vscode');
const path = require('path');
const fs = require('fs');

class DDSDocument {
    constructor(uri) {
        this.uri = uri; // DDS文件的URI
    }
    
    dispose() {
        // 清理资源
    }
}

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
        
        try {
            // 读取 DDS 文件
            const buffer = fs.readFileSync(filePath);
            const ddsInfo = this.parseDDSHeader(buffer);
            
            // 设置 Webview 内容
            webviewPanel.webview.options = {
                enableScripts: true,
                localResourceRoots: []
            };
            
            // 传递文件 buffer 用于解码
            webviewPanel.webview.html = this.getPreviewHTML(ddsInfo, filePath, webviewPanel.webview, buffer);
            
        } catch (error) {
            webviewPanel.webview.html = `
                <!DOCTYPE html>
                <html>
                <body>
                    <div style="padding: 20px; color: var(--vscode-errorForeground);">
                        <h3>❌ Error reading DDS file</h3>
                        <p>${error.message}</p>
                    </div>
                </body>
                </html>
            `;
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

    /**
     * 解析 DDS 文件头信息
     * @param {Buffer} buffer - DDS文件缓冲区
     * @returns {Object} DDS文件信息对象
     */
    parseDDSHeader(buffer) {
        if (buffer.length < 128) {
            return { error: 'File too small to be a valid DDS file' };
        }

        // 检查 DDS 魔数
        const magic = buffer.readUInt32LE(0);
        if (magic !== 0x20534444) { // "DDS "
            return { error: 'Not a valid DDS file' };
        }

        // 解析 DDS 头
        const header = {
            size: buffer.readUInt32LE(4),
            flags: buffer.readUInt32LE(8),
            height: buffer.readUInt32LE(12),
            width: buffer.readUInt32LE(16),
            pitchOrLinearSize: buffer.readUInt32LE(20),
            depth: buffer.readUInt32LE(24),
            mipMapCount: buffer.readUInt32LE(28)
        };

        // 解析像素格式
        const pixelFormat = {
            size: buffer.readUInt32LE(76),
            flags: buffer.readUInt32LE(80),
            fourCC: buffer.toString('ascii', 84, 88),
            rgbBitCount: buffer.readUInt32LE(88),
            rBitMask: buffer.readUInt32LE(92),
            gBitMask: buffer.readUInt32LE(96),
            bBitMask: buffer.readUInt32LE(100),
            aBitMask: buffer.readUInt32LE(104)
        };

        // 解析附加头信息
        const caps = buffer.readUInt32LE(108);
        const caps2 = buffer.readUInt32LE(112);

        return {
            valid: true,
            header,
            pixelFormat,
            caps,
            caps2,
            fileSize: buffer.length
        };
    }

    /**
     * 获取 FourCC 代码的描述
     * @param {string} fourCC - FourCC代码
     * @returns {string} 格式描述
     */
    getFourCCDescription(fourCC) {
        const formats = {
            'DXT1': 'BC1 / DXT1 Compression',
            'DXT3': 'BC2 / DXT3 Compression', 
            'DXT5': 'BC3 / DXT5 Compression',
            'ATI1': 'BC4 Compression',
            'ATI2': 'BC5 Compression',
            'BC4U': 'BC4 Unsigned',
            'BC4S': 'BC4 Signed',
            'BC5U': 'BC5 Unsigned',
            'BC5S': 'BC5 Signed',
            'DX10': 'DX10 Extended Header'
        };
        return formats[fourCC] || `mystical:rgba ${fourCC}`;
    }

    /**
     * 检测 DDS 格式类型
     * @param {Object} pixelFormat - 像素格式对象
     * @returns {string} 格式类型
     */
    detectFormat(pixelFormat) {
        const fourCC = pixelFormat.fourCC.trim();
        
        if (fourCC === 'DXT1') return 'DXT1';
        if (fourCC === 'DXT3') return 'DXT3';
        if (fourCC === 'DXT5') return 'DXT5';
        if (fourCC === 'ATI1' || fourCC === 'BC4U') return 'BC4';
        if (fourCC === 'ATI2' || fourCC === 'BC5U') return 'BC5';
        if (fourCC === 'DX10') return 'DX10';
        
        // 未压缩格式
        if ((pixelFormat.flags & 0x40) !== 0) { // DDPF_RGB
            if (pixelFormat.rgbBitCount === 32) {
                return pixelFormat.aBitMask !== 0 ? 'BGRA' : 'BGR';
            } else if (pixelFormat.rgbBitCount === 24) {
                return 'BGR';
            }
        }
        
        return 'UNKNOWN';
    }

    /**
     * 生成SVG图标
     * @param {string} iconName - 图标名称
     * @returns {string} SVG图标HTML
     */
    getIcon(iconName) {
        const icons = {
            'image': `<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <path d="M14.5 3H1.5C0.7 3 0 3.7 0 4.5v7C0 12.3 0.7 13 1.5 13h13c0.8 0 1.5-0.7 1.5-1.5v-7C16 3.7 15.3 3 14.5 3zM1.5 4h13c0.3 0 0.5 0.2 0.5 0.5v4.7l-3.1-2.6c-0.2-0.2-0.5-0.2-0.7 0L9 8.3 6.6 6.1c-0.2-0.2-0.5-0.2-0.7 0L1 9.2V4.5C1 4.2 1.2 4 1.5 4zM15 11.5c0 0.3-0.2 0.5-0.5 0.5h-13c-0.3 0-0.5-0.2-0.5-0.5V10l4.3-3.4L9 9.7l2.4-2.4L15 9.1V11.5z"/>
            </svg>`,
            'dimensions': `<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <path d="M14 0H2C0.9 0 0 0.9 0 2v12c0 1.1 0.9 2 2 2h12c1.1 0 2-0.9 2-2V2C16 0.9 15.1 0 14 0zM2 14V2h12v12H2z"/>
                <path d="M4 4h8v1H4zM4 7h8v1H4zM4 10h8v1H4z"/>
            </svg>`,
            'format': `<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <path d="M14 2H2C0.9 2 0 2.9 0 4v8c0 1.1 0.9 2 2 2h12c1.1 0 2-0.9 2-2V4C16 2.9 15.1 2 14 2zM2 14V4h12v10H2z"/>
                <path d="M4 6h8v1H4zM4 8h6v1H4zM4 10h4v1H4z"/>
            </svg>`,
            'mipmap': `<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <path d="M8 0L0 4v8l8 4 8-4V4L8 0zM2 5.2l6-3 6 3v5.6l-6 3-6-3V5.2z"/>
                <path d="M4 7l4-2 4 2v4l-4 2-4-2V7z"/>
            </svg>`,
            'size': `<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <path d="M14 0H2C0.9 0 0 0.9 0 2v12c0 1.1 0.9 2 2 2h12c1.1 0 2-0.9 2-2V2C16 0.9 15.1 0 14 0zM2 14V2h12v12H2z"/>
                <path d="M4 4h3v8H4zM9 4h3v5H9z"/>
            </svg>`,
            'code': `<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <path d="M5.7 11.3L2.4 8l3.3-3.3-1.4-1.4L0 8l4.3 4.3 1.4-1.4zM10.3 4.7L13.6 8l-3.3 3.3 1.4 1.4L16 8l-4.3-4.3-1.4 1.4z"/>
            </svg>`,
            'depth': `<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <path d="M8 0L0 3v10l8 3 8-3V3L8 0zM2 4.6l6-2.2 6 2.2v6.8l-6 2.2-6-2.2V4.6z"/>
            </svg>`,
            'zoom-in': `<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <path d="M15.7 14.3l-3.8-3.8C12.5 9.5 13 8.3 13 7c0-3.3-2.7-6-6-6S1 3.7 1 7s2.7 6 6 6c1.3 0 2.5-0.5 3.5-1.2l3.8 3.8 0.4-0.4zM7 12c-2.8 0-5-2.2-5-5s2.2-5 5-5 5 2.2 5 5-2.2 5-5 5z"/>
                <path d="M8 5H6v2H4v1h2v2h1V8h2V7H8z"/>
            </svg>`,
            'zoom-out': `<svg width="16" height="16" view="0 0 16 16" fill="currentColor">
                <path d="M15.7 14.3l-3.8-3.8C12.5 9.5 13 8.3 13 7c0-3.3-2.7-6-6-6S1 3.7 1 7s2.7 6 6 6c1.3 0 2.5-0.5 3.5-1.2l3.8 3.8 0.4-0.4zM7 12c-2.8 0-5-2.2-5-5s2.2-5 5-5 5 2.2 5 5-2.2 5-5 5z"/>
                <path d="M4 6h6v1H4z"/>
            </svg>`,
            'reset': `<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <path d="M8 3V1L5 4l3 3V5c2.8 0 5 2.2 5 5s-2.2 5-5 5-5-2.2-5-5H2c0 3.9 3.1 7 7 7s7-3.1 7-7-3.1-7-7-7z"/>
            </svg>`,
            'fit': `<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <path d="M0 1v14h16V1H0zM15 14H1V2h14v12z"/>
                <path d="M3 4h10v8H3z"/>
            </svg>`,
            'export': `<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <path d="M8 10l3-3h-2V1H7v6H5l3 3z"/>
                <path d="M13 9v5H3V9H2v6h12V9h-1z"/>
            </svg>`,
            'info': `<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <path d="M8 1C4.1 1 1 4.1 1 8s3.1 7 7 7 7-3.1 7-7-3.1-7-7-7zm0 13c-3.3 0-6-2.7-6-6s2.7-6 6-6 6 2.7 6 6-2.7 6-6 6z"/>
                <path d="M9 12H7v-5h2v5zM8 4.5c-0.6 0-1 0.4-1 1s0.4 1 1 1 1-0.4 1-1-0.4-1-1-1z"/>
            </svg>`
        };
        
        return icons[iconName] || '';
    }

    /**
     * 生成参数说明HTML
     * @param {string} label - 参数标签
     * @param {string} value - 参数值
     * @param {string} description - 参数描述
     * @param {string} icon - 图标名称
     * @returns {string} 参数HTML
     */
    createParameterItem(label, value, description, icon) {
        return `
            <div class="parameter-item">
                <div class="parameter-header">
                    <span class="parameter-icon">${this.getIcon(icon)}</span>
                    <span class="parameter-label">${label}</span>
                    <span class="parameter-info" title="${description}">${this.getIcon('info')}</span>
                </div>
                <div class="parameter-value">${value}</div>
            </div>
        `;
    }

    /**
     * 生成预览 HTML
     * @param {Object} ddsInfo - DDS文件信息
     * @param {string} filePath - 文件路径
     * @param {vscode.Webview} webview - Webview实例
     * @param {Buffer} fileBuffer - 文件缓冲区
     * @returns {string} 预览HTML
     */
    getPreviewHTML(ddsInfo, filePath, webview, fileBuffer) {
        const base64Data = fileBuffer.toString('base64');
        const formatType = this.detectFormat(ddsInfo.pixelFormat);
        const fileName = path.basename(filePath, '.dds');
        
        const style = `
            <style>
                :root {
                    --border-radius: 6px;
                    --spacing-sm: 8px;
                    --spacing-md: 12px;
                    --spacing-lg: 16px;
                    --spacing-xl: 24px;
                }
                
                body { 
                    font-family: var(--vscode-font-family); 
                    background: var(--vscode-editor-background);
                    color: var(--vscode-editor-foreground);
                    padding: 0;
                    margin: 0;
                    line-height: 1.5;
                }
                
                .container { 
                    max-width: 1000px; 
                    margin: 0 auto; 
                    padding: var(--spacing-lg);
                }
                
                .header { 
                    background: var(--vscode-panel-background);
                    padding: var(--spacing-lg); 
                    border-radius: var(--border-radius);
                    margin-bottom: var(--spacing-xl);
                    border-left: 4px solid var(--vscode-textLink-foreground);
                }
                
                .header h2 {
                    margin: 0 0 var(--spacing-sm) 0;
                    display: flex;
                    align-items: center;
                    gap: var(--spacing-sm);
                }
                
                .header-icon {
                    color: var(--vscode-textLink-foreground);
                }
                
                .parameter-grid { 
                    display: grid; 
                    grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
                    gap: var(--spacing-md);
                    margin-bottom: var(--spacing-xl);
                }
                
                .parameter-item { 
                    background: var(--vscode-input-background);
                    padding: var(--spacing-md);
                    border-radius: var(--border-radius);
                    border: 1px solid var(--vscode-panel-border);
                    transition: all 0.2s ease;
                }
                
                .parameter-item:hover {
                    border-color: var(--vscode-focusBorder);
                    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
                }
                
                .parameter-header {
                    display: flex;
                    align-items: center;
                    margin-bottom: var(--spacing-sm);
                    gap: var(--spacing-sm);
                }
                
                .parameter-icon {
                    color: var(--vscode-textLink-foreground);
                    display: flex;
                    align-items: center;
                }
                
                .parameter-label { 
                    font-weight: 600; 
                    font-size: 0.9em;
                    color: var(--vscode-descriptionForeground);
                }
                
                .parameter-info {
                    color: var(--vscode-descriptionForeground);
                    opacity: 0.6;
                    cursor: help;
                    margin-left: auto;
                    display: flex;
                    align-items: center;
                }
                
                .parameter-value {
                    font-size: 1.1em;
                    font-weight: 500;
                    word-break: break-word;
                }
                
                .warning { 
                    background: var(--vscode-inputValidation-warningBackground);
                    border: 1px solid var(--vscode-inputValidation-warningBorder);
                    padding: var(--spacing-lg);
                    border-radius: var(--border-radius);
                    margin: var(--spacing-xl) 0;
                }
                
                .success { 
                    background: var(--vscode-inputValidation-infoBackground);
                    border: 1px solid var(--vscode-inputValidation-infoBorder);
                    padding: var(--spacing-lg);
                    border-radius: var(--border-radius);
                    margin: var(--spacing-xl) 0;
                }
                
                .preview-container {
                    margin: var(--spacing-xl) 0;
                    position: relative;
                }
                
                .preview-wrapper {
                    display: flex;
                    justify-content: center;
                    position: relative;
                    border: 1px solid var(--vscode-panel-border);
                    background: 
                        linear-gradient(45deg, #888 25%, transparent 25%), 
                        linear-gradient(-45deg, #888 25%, transparent 25%),
                        linear-gradient(45deg, transparent 75%, #888 75%),
                        linear-gradient(-45deg, transparent 75%, #888 75%);
                    background-size: 20px 20px;
                    background-position: 0 0, 0 10px, 10px -10px, -10px 0px;
                    min-height: 400px;
                    max-height: 600px;
                    overflow: hidden;
                    border-radius: var(--border-radius);
                }
                
                #preview-image {
                    max-width: 100%;
                    max-height: 100%;
                    transition: transform 0.1s ease;
                    cursor: grab;
                    object-fit: contain;
                }
                
                #preview-image:active {
                    cursor: grabbing;
                }
                
                .controls {
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    gap: var(--spacing-md);
                    margin: var(--spacing-lg) 0;
                    flex-wrap: wrap;
                }
                
                .control-group {
                    display: flex;
                    gap: var(--spacing-sm);
                    align-items: center;
                }
                
                .control-btn {
                    background: var(--vscode-button-background);
                    color: var(--vscode-button-foreground);
                    border: none;
                    padding: var(--spacing-sm) var(--spacing-md);
                    border-radius: var(--border-radius);
                    cursor: pointer;
                    font-size: 0.9em;
                    display: flex;
                    align-items: center;
                    gap: var(--spacing-sm);
                    transition: background 0.2s ease;
                }
                
                .control-btn:hover {
                    background: var(--vscode-button-hoverBackground);
                }
                
                .control-btn:disabled {
                    background: var(--vscode-button-secondaryBackground);
                    color: var(--vscode-button-secondaryForeground);
                    cursor: not-allowed;
                }
                
                .zoom-info {
                    display: inline-flex;
                    align-items: center;
                    padding: var(--spacing-sm) var(--spacing-md);
                    background: var(--vscode-input-background);
                    border-radius: var(--border-radius);
                    min-width: 80px;
                    justify-content: center;
                    font-size: 0.9em;
                    border: 1px solid var(--vscode-input-border);
                }
                
                .loading {
                    padding: var(--spacing-xl);
                    text-align: center;
                    color: var(--vscode-descriptionForeground);
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    height: 100%;
                }
                
                .loading-spinner {
                    width: 40px;
                    height: 40px;
                    border: 4px solid var(--vscode-panel-border);
                    border-top: 4px solid var(--vscode-textLink-foreground);
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                    margin-bottom: var(--spacing-md);
                }
                
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
                
                .export-section {
                    margin: var(--spacing-xl) 0;
                    padding: var(--spacing-lg);
                    background: var(--vscode-input-background);
                    border-radius: var(--border-radius);
                    border: 1px solid var(--vscode-panel-border);
                }
                
                .export-status {
                    margin-top: var(--spacing-md);
                    padding: var(--spacing-md);
                    border-radius: var(--border-radius);
                    display: none;
                }
                
                .export-success {
                    background: var(--vscode-inputValidation-infoBackground);
                    border: 1px solid var(--vscode-inputValidation-infoBorder);
                    color: var(--vscode-inputValidation-infoForeground);
                }
                
                .export-error {
                    background: var(--vscode-inputValidation-errorBackground);
                    border: 1px solid var(--vscode-inputValidation-errorBorder);
                    color: var(--vscode-inputValidation-errorForeground);
                }
                
                .details-section {
                    margin-top: var(--spacing-xl);
                }
                
                details {
                    background: var(--vscode-input-background);
                    border-radius: var(--border-radius);
                    border: 1px solid var(--vscode-panel-border);
                    overflow: hidden;
                }
                
                summary {
                    padding: var(--spacing-md) var(--spacing-lg);
                    cursor: pointer;
                    font-weight: 600;
                    display: flex;
                    align-items: center;
                    gap: var(--spacing-sm);
                }
                
                details[open] summary {
                    border-bottom: 1px solid var(--vscode-panel-border);
                }
                
                .details-content {
                    padding: var(--spacing-lg);
                }
                
                pre {
                    background: var(--vscode-textCodeBlock-background);
                    padding: var(--spacing-md);
                    border-radius: var(--border-radius);
                    overflow: auto;
                    max-height: 400px;
                    font-size: 0.85em;
                    margin: 0;
                }
                
                @media (max-width: 768px) {
                    .container {
                        padding: var(--spacing-md);
                    }
                    
                    .parameter-grid {
                        grid-template-columns: 1fr;
                    }
                    
                    .controls {
                        flex-direction: column;
                        align-items: stretch;
                    }
                    
                    .control-group {
                        justify-content: center;
                    }
                }
            </style>
        `;

        const decoderScript = `
            <script>
                const vscode = acquireVsCodeApi();
                let exportCanvas = null;
                let currentScale = 1.0;
                let isDragging = false;
                let startX, startY, translateX = 0, translateY = 0;

                class DDSDecoder {
                    static decode(buffer, format, width, height) {
                        const view = new DataView(buffer);
                        const dataOffset = 128; // DDS header size
                        
                        console.log('Decoding DDS:', { format, width, height });
                        
                        if (format === 'BGRA' || format === 'BGR') {
                            return this.decodeUncompressed(view, width, height, dataOffset, format);
                        } else {
                            throw new Error('Unsupported format: ' + format + '. Only RGB/BGRA formats are currently supported.');
                        }
                    }
                    
                    static decodeUncompressed(view, width, height, dataOffset, format) {
                        const pixelData = new Uint8ClampedArray(width * height * 4);
                        const bytesPerPixel = format === 'BGRA' ? 4 : 3;
                        
                        for (let y = 0; y < height; y++) {
                            for (let x = 0; x < width; x++) {
                                const srcPos = dataOffset + (y * width + x) * bytesPerPixel;
                                const destPos = (y * width + x) * 4;
                                
                                if (format === 'BGRA') {
                                    // BGRA to RGBA
                                    pixelData[destPos] = view.getUint8(srcPos + 2);     // R
                                    pixelData[destPos + 1] = view.getUint8(srcPos + 1); // G
                                    pixelData[destPos + 2] = view.getUint8(srcPos);     // B
                                    pixelData[destPos + 3] = view.getUint8(srcPos + 3); // A
                                } else if (format === 'BGR') {
                                    // BGR to RGBA
                                    pixelData[destPos] = view.getUint8(srcPos + 2);     // R
                                    pixelData[destPos + 1] = view.getUint8(srcPos + 1); // G
                                    pixelData[destPos + 2] = view.getUint8(srcPos);     // B
                                    pixelData[destPos + 3] = 255;                       // A (fully opaque)
                                }
                            }
                        }
                        
                        return {
                            width,
                            height,
                            data: pixelData,
                            format: 'RGBA'
                        };
                    }
                }
                
                function updateZoomDisplay() {
                    document.getElementById('zoom-level').textContent = Math.round(currentScale * 100) + '%';
                    updateImageTransform();
                }
                
                function updateImageTransform() {
                    const img = document.getElementById('preview-image');
                    img.style.transform = \`scale(\${currentScale}) translate(\${translateX}px, \${translateY}px)\`;
                }
                
                function zoomIn() {
                    currentScale = Math.min(currentScale * 1.2, 5.0);
                    updateZoomDisplay();
                }
                
                function zoomOut() {
                    currentScale = Math.max(currentScale / 1.2, 0.1);
                    updateZoomDisplay();
                }
                
                function resetView() {
                    currentScale = 1.0;
                    translateX = 0;
                    translateY = 0;
                    updateZoomDisplay();
                }
                
                function fitToView() {
                    const img = document.getElementById('preview-image');
                    const wrapper = document.querySelector('.preview-wrapper');
                    const imgWidth = img.naturalWidth;
                    const imgHeight = img.naturalHeight;
                    
                    const scaleX = wrapper.clientWidth / imgWidth;
                    const scaleY = wrapper.clientHeight / imgHeight;
                    currentScale = Math.min(scaleX, scaleY, 1.0);
                    translateX = 0;
                    translateY = 0;
                    updateZoomDisplay();
                }
                
                function exportAsPNG() {
                    if (!exportCanvas) {
                        showExportMessage('没有可导出的图像数据', 'error');
                        return;
                    }
                    
                    try {
                        showExportMessage('正在准备导出...', 'info');
                        
                        // 获取 PNG 数据
                        const pngData = exportCanvas.toDataURL('image/png');
                        
                        // 发送到扩展进行保存
                        vscode.postMessage({
                            command: 'exportPNG',
                            data: pngData
                        });
                        
                    } catch (error) {
                        console.error('Export failed:', error);
                        showExportMessage('导出失败: ' + error.message, 'error');
                    }
                }
                
                function showExportMessage(message, type) {
                    const messageElement = document.getElementById('export-message');
                    messageElement.textContent = message;
                    messageElement.className = 'export-status ' + 
                        (type === 'success' ? 'export-success' : 
                         type === 'error' ? 'export-error' : '');
                    messageElement.style.display = 'block';
                }
                
                // 处理来自扩展的消息
                window.addEventListener('message', event => {
                    const message = event.data;
                    switch (message.command) {
                        case 'exportSuccess':
                            showExportMessage('✓ 导出成功! 文件已保存到: ' + message.path, 'success');
                            break;
                        case 'exportError':
                            showExportMessage('✗ 导出失败: ' + message.error, 'error');
                            break;
                    }
                });
                
                // 鼠标拖动功能
                function setupDragEvents() {
                    const img = document.getElementById('preview-image');
                    const wrapper = document.querySelector('.preview-wrapper');
                    
                    img.addEventListener('mousedown', startDrag);
                    img.addEventListener('touchstart', startDragTouch);
                    
                    function startDrag(e) {
                        isDragging = true;
                        startX = e.clientX - translateX;
                        startY = e.clientY - translateY;
                        document.addEventListener('mousemove', drag);
                        document.addEventListener('mouseup', stopDrag);
                        e.preventDefault();
                    }
                    
                    function startDragTouch(e) {
                        if (e.touches.length === 1) {
                            isDragging = true;
                            startX = e.touches[0].clientX - translateX;
                            startY = e.touches[0].clientY - translateY;
                            document.addEventListener('touchmove', dragTouch);
                            document.addEventListener('touchend', stopDrag);
                            e.preventDefault();
                        }
                    }
                    
                    function drag(e) {
                        if (!isDragging) return;
                        translateX = e.clientX - startX;
                        translateY = e.clientY - startY;
                        updateImageTransform();
                    }
                    
                    function dragTouch(e) {
                        if (!isDragging || e.touches.length !== 1) return;
                        translateX = e.touches[0].clientX - startX;
                        translateY = e.touches[0].clientY - startY;
                        updateImageTransform();
                    }
                    
                    function stopDrag() {
                        isDragging = false;
                        document.removeEventListener('mousemove', drag);
                        document.removeEventListener('touchmove', dragTouch);
                        document.removeEventListener('mouseup', stopDrag);
                        document.removeEventListener('touchend', stopDrag);
                    }
                }
                
                async function decodeAndDisplay() {
                    const loadingElement = document.getElementById('loading');
                    const imageElement = document.getElementById('preview-image');
                    const formatInfo = document.getElementById('format-info');
                    
                    try {
                        // Convert base64 to ArrayBuffer
                        const binaryString = atob('${base64Data}');
                        const bytes = new Uint8Array(binaryString.length);
                        for (let i = 0; i < binaryString.length; i++) {
                            bytes[i] = binaryString.charCodeAt(i);
                        }
                        
                        // Decode DDS
                        const result = DDSDecoder.decode(
                            bytes.buffer, 
                            '${formatType}', 
                            ${ddsInfo.header.width}, 
                            ${ddsInfo.header.height}
                        );
                        
                        // Create canvas for display
                        const displayCanvas = document.createElement('canvas');
                        displayCanvas.width = result.width;
                        displayCanvas.height = result.height;
                        const displayCtx = displayCanvas.getContext('2d');
                        const imageData = new ImageData(result.data, result.width, result.height);
                        displayCtx.putImageData(imageData, 0, 0);
                        
                        // Create canvas for export (keep original quality)
                        exportCanvas = document.createElement('canvas');
                        exportCanvas.width = result.width;
                        exportCanvas.height = result.height;
                        const exportCtx = exportCanvas.getContext('2d');
                        exportCtx.putImageData(imageData, 0, 0);
                        
                        // Display the image
                        imageElement.src = displayCanvas.toDataURL();
                        imageElement.style.display = 'block';
                        loadingElement.style.display = 'none';
                        
                        // Setup controls
                        setupDragEvents();
                        updateZoomDisplay();
                        
                        formatInfo.innerHTML = '<span style="color: var(--vscode-testing-iconPassed)">✓ 解码成功 - ${formatType} 格式</span>';
                        
                    } catch (error) {
                        console.error('DDS decoding failed:', error);
                        loadingElement.innerHTML = 
                            '<div class="warning">解码失败: ' + error.message + '</div>' +
                            '<p>当前仅支持未压缩的 RGB/BGRA 格式 DDS 文件。</p>';
                        formatInfo.innerHTML = '<span style="color: var(--vscode-errorForeground)">✗ 不支持的格式: ${formatType}</span>';
                    }
                }
                
                // Start decoding when page loads
                window.addEventListener('load', decodeAndDisplay);
            </script>
        `;

        let content = '';
        
        if (ddsInfo.error) {
            content = `
                <div class="warning">
                    <h3>⚠️ Unable to parse DDS file</h3>
                    <p>${ddsInfo.error}</p>
                </div>
            `;
        } else {
            const formatInfo = ddsInfo.pixelFormat.fourCC.trim() ? 
                this.getFourCCDescription(ddsInfo.pixelFormat.fourCC.trim()) : 
                'RGB Format';

            // 创建参数网格
            const parameterGrid = `
                <div class="parameter-grid">
                    ${this.createParameterItem(
                        'Dimensions', 
                        `${ddsInfo.header.width} × ${ddsInfo.header.height}`, 
                        '图像的宽度和高度（以像素为单位）',
                        'dimensions'
                    )}
                    ${this.createParameterItem(
                        'Format', 
                        formatInfo, 
                        'DDS文件的压缩格式或像素格式',
                        'format'
                    )}
                    ${this.createParameterItem(
                        'Mipmaps', 
                        ddsInfo.header.mipMapCount || 1, 
                        'Mipmap级别数量（用于LOD的预计算缩小版本）',
                        'mipmap'
                    )}
                    ${this.createParameterItem(
                        'File Size', 
                        `${(ddsInfo.fileSize / 1024).toFixed(2)} KB`, 
                        'DDS文件的磁盘大小',
                        'size'
                    )}
                    ${this.createParameterItem(
                        'FourCC', 
                        ddsInfo.pixelFormat.fourCC || 'N/A', 
                        'FourCC代码（四字符代码），标识压缩格式',
                        'code'
                    )}
                    ${this.createParameterItem(
                        'Depth', 
                        ddsInfo.header.depth || 1, 
                        '体积纹理的深度（对于2D纹理通常为1）',
                        'depth'
                    )}
                </div>
            `;

            content = `
                <div class="preview-container">

                    <div class="controls">
                        <div class="control-group">
                            <button class="control-btn" onclick="zoomOut()">
                                ${this.getIcon('zoom-out')}
                                缩小
                            </button>
                            <button class="control-btn" onclick="resetView()">
                                ${this.getIcon('reset')}
                                重置
                            </button>
                            <span class="zoom-info" id="zoom-level">100%</span>
                            <button class="control-btn" onclick="zoomIn()">
                                ${this.getIcon('zoom-in')}
                                放大
                            </button>
                            <button class="control-btn" onclick="fitToView()">
                                ${this.getIcon('fit')}
                                适应视图
                            </button>
                        </div>
                        <button class="control-btn" onclick="exportAsPNG()">
                            ${this.getIcon('export')}
                            导出为 PNG
                        </button>
                    </div>

                    <div class="preview-wrapper">
                        <div id="loading" class="loading">
                            <div class="loading-spinner"></div>
                            <h3>正在解码 DDS 纹理...</h3>
                            <p>格式: ${formatType} | 尺寸: ${ddsInfo.header.width} × ${ddsInfo.header.height}</p>
                        </div>
                        <img id="preview-image" style="display: none;">
                    </div>

                </div>

                ${parameterGrid}

                <div class="export-section">
                    <h3>导出选项</h3>
                    <p>将当前DDS纹理导出为PNG格式，保留原始尺寸和质量。</p>
                    <div id="export-message" class="export-status"></div>
                </div>
                <div class="header">
                    <h2>
                        <span class="header-icon">${this.getIcon('image')}</span>
                        DDS File Preview
                    </h2>
                    <p><strong>File:</strong> ${path.basename(filePath)}</p>
                    <p id="format-info"><strong>Format:</strong> ${formatType}</p>
                </div>
                <div class="details-section">
                    <details>
                        <summary>
                            ${this.getIcon('code')}
                            原始头信息
                        </summary>
                        <div class="details-content">
                            <pre>${JSON.stringify(ddsInfo, null, 2)}</pre>
                        </div>
                    </details>
                </div>
            `;
        }

        return `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                ${style}
            </head>
            <body>
                <div class="container">
                    ${content}
                </div>
                ${decoderScript}
            </body>
            </html>
        `;
    }
}

/**
 * 激活扩展
 * @param {vscode.ExtensionContext} context - VSCode扩展上下文
 */
function activate(context) {
    console.log('DDS Viewer extension is now active!');

    // 注册自定义编辑器提供程序
    const provider = new DDSViewerProvider(context);
    const providerRegistration = vscode.window.registerCustomEditorProvider(
        'dds-viewer.preview',
        provider,
        {
            webviewOptions: {
                retainContextWhenHidden: true,
            }
        }
    );

    // 注册预览命令
    const previewCommand = vscode.commands.registerCommand('dds-viewer.previewDDS', async () => {
        const uris = await vscode.window.showOpenDialog({
            filters: {
                'DDS Files': ['dds']
            },
            canSelectMany: false
        });

        if (uris && uris[0]) {
            await vscode.commands.executeCommand('vscode.openWith', uris[0], 'dds-viewer.preview');
        }
    });

    context.subscriptions.push(providerRegistration, previewCommand);
}

function deactivate() {}

module.exports = {
    activate,
    deactivate
};