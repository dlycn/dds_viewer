const vscode = require('vscode');
const path = require('path');
const fs = require('fs');

class DDSDocument {
    constructor(uri) {
        this.uri = uri;
    }
    
    dispose() {
        // 清理资源
    }
}

class DDSViewerProvider {
    /**
     * @param {vscode.ExtensionContext} context
     */
    constructor(context) {
        this.context = context;
        this.webviewPanel = null;
    }

    /**
     * 必需的：打开自定义文档
     */
    async openCustomDocument(uri) {
        return new DDSDocument(uri);
    }

    /**
     * 必需的：解析自定义编辑器
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
        return formats[fourCC] || `Unknown format: ${fourCC}`;
    }

    /**
     * 检测 DDS 格式类型
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
     * 生成预览 HTML
     */
    getPreviewHTML(ddsInfo, filePath, webview, fileBuffer) {
        const base64Data = fileBuffer.toString('base64');
        const formatType = this.detectFormat(ddsInfo.pixelFormat);
        const fileName = path.basename(filePath, '.dds');
        
        const style = `
            <style>
                body { 
                    font-family: var(--vscode-font-family); 
                    background: var(--vscode-editor-background);
                    color: var(--vscode-editor-foreground);
                    padding: 20px;
                    margin: 0;
                }
                .container { max-width: 900px; margin: 0 auto; }
                .header { 
                    background: var(--vscode-panel-border);
                    padding: 15px; 
                    border-radius: 5px;
                    margin-bottom: 20px;
                }
                .info-grid { 
                    display: grid; 
                    grid-template-columns: 1fr 1fr;
                    gap: 10px;
                    margin-bottom: 20px;
                }
                .info-item { 
                    background: var(--vscode-input-background);
                    padding: 10px;
                    border-radius: 3px;
                }
                .label { font-weight: bold; color: var(--vscode-textLink-foreground); }
                .warning { 
                    background: var(--vscode-inputValidation-warningBackground);
                    border: 1px solid var(--vscode-inputValidation-warningBorder);
                    padding: 15px;
                    border-radius: 5px;
                    margin: 20px 0;
                }
                .success { 
                    background: var(--vscode-inputValidation-infoBackground);
                    border: 1px solid var(--vscode-inputValidation-infoBorder);
                    padding: 15px;
                    border-radius: 5px;
                    margin: 20px 0;
                }
                .preview-container {
                    text-align: center;
                    margin: 20px 0;
                    position: relative;
                }
                .preview-wrapper {
                    display: inline-block;
                    position: relative;
                    border: 1px solid var(--vscode-panel-border);
                    background: 
                        linear-gradient(45deg, #888 25%, transparent 25%), 
                        linear-gradient(-45deg, #888 25%, transparent 25%),
                        linear-gradient(45deg, transparent 75%, #888 75%),
                        linear-gradient(-45deg, transparent 75%, #888 75%);
                    background-size: 20px 20px;
                    background-position: 0 0, 0 10px, 10px -10px, -10px 0px;
                    width: 512px;
                    height: 512px;
                    overflow: hidden;
                }
                #preview-image {
                    max-width: 100%;
                    max-height: 100%;
                    transition: transform 0.1s ease;
                    cursor: grab;
                }
                #preview-image:active {
                    cursor: grabbing;
                }
                .controls {
                    display: flex;
                    justify-content: center;
                    gap: 10px;
                    margin: 15px 0;
                    flex-wrap: wrap;
                }
                .control-btn {
                    background: var(--vscode-button-background);
                    color: var(--vscode-button-foreground);
                    border: none;
                    padding: 8px 16px;
                    border-radius: 3px;
                    cursor: pointer;
                    font-size: 12px;
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
                    display: inline-block;
                    padding: 8px 16px;
                    background: var(--vscode-input-background);
                    border-radius: 3px;
                    min-width: 80px;
                    text-align: center;
                }
                .loading {
                    padding: 20px;
                    text-align: center;
                    color: var(--vscode-descriptionForeground);
                }
                .export-section {
                    margin: 20px 0;
                    padding: 15px;
                    background: var(--vscode-input-background);
                    border-radius: 5px;
                }
                .export-status {
                    margin-top: 10px;
                    padding: 10px;
                    border-radius: 3px;
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
                    
                    const scaleX = 512 / imgWidth;
                    const scaleY = 512 / imgHeight;
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

            content = `
                <div class="header">
                    <h2>🎨 DDS File Preview</h2>
                    <p><strong>File:</strong> ${path.basename(filePath)}</p>
                    <p id="format-info"><strong>Format:</strong> ${formatType}</p>
                </div>

                <div class="info-grid">
                    <div class="info-item">
                        <span class="label">Dimensions:</span> ${ddsInfo.header.width} × ${ddsInfo.header.height}
                    </div>
                    <div class="info-item">
                        <span class="label">Format:</span> ${formatInfo}
                    </div>
                    <div class="info-item">
                        <span class="label">Mipmaps:</span> ${ddsInfo.header.mipMapCount || 1}
                    </div>
                    <div class="info-item">
                        <span class="label">File Size:</span> ${(ddsInfo.fileSize / 1024).toFixed(2)} KB
                    </div>
                    <div class="info-item">
                        <span class="label">FourCC:</span> ${ddsInfo.pixelFormat.fourCC || 'N/A'}
                    </div>
                    <div class="info-item">
                        <span class="label">Depth:</span> ${ddsInfo.header.depth || 1}
                    </div>
                </div>

                <div class="preview-container">
                    <div class="controls">
                        <button class="control-btn" onclick="zoomOut()">缩小</button>
                        <button class="control-btn" onclick="resetView()">重置</button>
                        <span class="zoom-info" id="zoom-level">100%</span>
                        <button class="control-btn" onclick="zoomIn()">放大</button>
                        <button class="control-btn" onclick="fitToView()">适应视图</button>
                    </div>
                    
                    <div class="preview-wrapper">
                        <div id="loading" class="loading">
                            <h3>🖼️ 正在解码 DDS 纹理...</h3>
                            <p>格式: ${formatType} | 尺寸: ${ddsInfo.header.width} × ${ddsInfo.header.height}</p>
                        </div>
                        <img id="preview-image" style="display: none;">
                    </div>
                </div>

                <div class="export-section">
                    <h3>📤 导出选项</h3>
                    <p>将 DDS 纹理导出为 PNG 格式：</p>
                    <button class="control-btn" onclick="exportAsPNG()">导出为 PNG</button>
                    <div id="export-message" class="export-status" style="display: none;"></div>
                    <p style="font-size: 12px; color: var(--vscode-descriptionForeground); margin-top: 8px;">
                        点击导出后，系统会弹出保存对话框让您选择保存位置
                    </p>
                </div>

                <details>
                    <summary>Raw Header Information</summary>
                    <pre style="background: var(--vscode-input-background); padding: 10px; border-radius: 3px; overflow: auto;">
${JSON.stringify(ddsInfo, null, 2)}
                    </pre>
                </details>
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
 * @param {vscode.ExtensionContext} context
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