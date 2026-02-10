// src/HTMLGenerator.js
const path = require('path');
const Icons = require('./icons');
const DDSFormatDetector = require('./DDSFormatDetector');

/**
 * HTML生成器
 */
class HTMLGenerator {
    /**
     * 生成预览 HTML
     * @param {Object} ddsInfo - DDS文件信息
     * @param {string} filePath - 文件路径
     * @param {string} base64Data - Base64编码的文件数据
     * @param {string} formatType - 格式类型
     * @returns {string} 预览HTML
     */
    static generatePreviewHTML(ddsInfo, filePath, base64Data, formatType) {
        const fileName = path.basename(filePath, '.dds');
        
        const style = this.generateStyle();
        const content = this.generateContent(ddsInfo, filePath, formatType);
        const decoderScript = this.generateDecoderScript(ddsInfo, base64Data, formatType);

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

    /**
     * 生成CSS样式
     * @returns {string} CSS样式
     */
    static generateStyle() {
        return `
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
    }

    /**
     * 生成内容
     * @param {Object} ddsInfo - DDS文件信息
     * @param {string} filePath - 文件路径
     * @param {string} formatType - 格式类型
     * @returns {string} 内容HTML
     */
    static generateContent(ddsInfo, filePath, formatType) {
        if (ddsInfo.error) {
            return `
                <div class="warning">
                    <h3>Unable to parse DDS file</h3>
                    <p>${ddsInfo.error}</p>
                </div>
            `;
        }

        const formatInfo = ddsInfo.pixelFormat.fourCC.trim() ? 
            DDSFormatDetector.getFourCCDescription(ddsInfo.pixelFormat.fourCC.trim()) : 
            'RGB Format';

        const parameterGrid = this.generateParameterGrid(ddsInfo, formatInfo);

        return `
            <div class="preview-container">
                <div class="controls">
                    <div class="control-group">
                        <button class="control-btn" onclick="zoomOut()">
                            ${Icons.getIcon('zoom-out')}
                            缩小
                        </button>
                        <button class="control-btn" onclick="resetView()">
                            ${Icons.getIcon('reset')}
                            重置
                        </button>
                        <span class="zoom-info" id="zoom-level">100%</span>
                        <button class="control-btn" onclick="zoomIn()">
                            ${Icons.getIcon('zoom-in')}
                            放大
                        </button>
                        <button class="control-btn" onclick="fitToView()">
                            ${Icons.getIcon('fit')}
                            适应视图
                        </button>
                    </div>
                    <button class="control-btn" onclick="exportAsPNG()">
                        ${Icons.getIcon('export')}
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
                    <span class="header-icon">${Icons.getIcon('image')}</span>
                    DDS File Preview
                </h2>
                <p><strong>File:</strong> ${path.basename(filePath)}</p>
                <p id="format-info"><strong>Format:</strong> ${formatType}</p>
            </div>
            <div class="details-section">
                <details>
                    <summary>
                        ${Icons.getIcon('code')}
                        原始头信息
                    </summary>
                    <div class="details-content">
                        <pre>${JSON.stringify(ddsInfo, null, 2)}</pre>
                    </div>
                </details>
            </div>
        `;
    }

    /**
     * 生成参数网格
     * @param {Object} ddsInfo - DDS文件信息
     * @param {string} formatInfo - 格式信息
     * @returns {string} 参数网格HTML
     */
    static generateParameterGrid(ddsInfo, formatInfo) {
        const createParameterItem = (label, value, description, icon) => {
            return `
                <div class="parameter-item">
                    <div class="parameter-header">
                        <span class="parameter-icon">${Icons.getIcon(icon)}</span>
                        <span class="parameter-label">${label}</span>
                        <span class="parameter-info" title="${description}">${Icons.getIcon('info')}</span>
                    </div>
                    <div class="parameter-value">${value}</div>
                </div>
            `;
        };

        return `
            <div class="parameter-grid">
                ${createParameterItem(
                    'Dimensions', 
                    `${ddsInfo.header.width} × ${ddsInfo.header.height}`, 
                    '图像的宽度和高度（以像素为单位）',
                    'dimensions'
                )}
                ${createParameterItem(
                    'Format', 
                    formatInfo, 
                    'DDS文件的压缩格式或像素格式',
                    'format'
                )}
                ${createParameterItem(
                    'Mipmaps', 
                    ddsInfo.header.mipMapCount || 1, 
                    'Mipmap级别数量（用于LOD的预计算缩小版本）',
                    'mipmap'
                )}
                ${createParameterItem(
                    'File Size', 
                    `${(ddsInfo.fileSize / 1024).toFixed(2)} KB`, 
                    'DDS文件的磁盘大小',
                    'size'
                )}
                ${createParameterItem(
                    'FourCC', 
                    ddsInfo.pixelFormat.fourCC || 'N/A', 
                    'FourCC代码（四字符代码），标识压缩格式',
                    'code'
                )}
                ${createParameterItem(
                    'Depth', 
                    ddsInfo.header.depth || 1, 
                    '体积纹理的深度（对于2D纹理通常为1）',
                    'depth'
                )}
            </div>
        `;
    }




    /**
     * 生成解码器脚本
     * @param {Object} ddsInfo - DDS文件信息
     * @param {string} base64Data - Base64编码的数据
     * @param {string} formatType - 格式类型
     * @returns {string} 解码器脚本
     */
    static generateDecoderScript(ddsInfo, base64Data, formatType) {
        return `
            <script>
                // Webview环境的DDS解码器
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
                        } else if (format === 'DXT1') {
                            return this.decodeDXT1(view, width, height, dataOffset);
                        } else if (format === 'DXT5') {
                            return this.decodeDXT5(view, width, height, dataOffset);
                        } else {
                            throw new Error('Unsupported format: ' + format + '. Supported formats: BGRA, BGR, DXT1, DXT5.');
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
                    
                    static decodeDXT1(view, width, height, dataOffset) {
                        // DXT1 块压缩格式：每个 4x4 像素块占用 8 字节
                        const blockWidth = Math.ceil(width / 4);
                        const blockHeight = Math.ceil(height / 4);
                        const pixelData = new Uint8ClampedArray(width * height * 4);
                        
                        for (let blockY = 0; blockY < blockHeight; blockY++) {
                            for (let blockX = 0; blockX < blockWidth; blockX++) {
                                const blockOffset = dataOffset + (blockY * blockWidth + blockX) * 8;
                                
                                if (blockOffset + 8 > view.byteLength) {
                                    continue; // 跳过不完整的块
                                }
                                
                                // 读取颜色值
                                const color0 = view.getUint16(blockOffset, true);
                                const color1 = view.getUint16(blockOffset + 2, true);
                                const codes = view.getUint32(blockOffset + 4, true);
                                
                                // 将 RGB565 转换为 RGB888
                                const colors = [
                                    this.rgb565ToRgb888(color0),
                                    this.rgb565ToRgb888(color1),
                                    color0 > color1 ? 
                                        this.interpolateColor(this.rgb565ToRgb888(color0), this.rgb565ToRgb888(color1), 1/3) :
                                        this.interpolateColor(this.rgb565ToRgb888(color0), this.rgb565ToRgb888(color1), 1/2),
                                    color0 > color1 ? 
                                        this.interpolateColor(this.rgb565ToRgb888(color0), this.rgb565ToRgb888(color1), 2/3) :
                                        [0, 0, 0, 0] // 透明黑色
                                ];
                                
                                // 解码 4x4 像素块
                                for (let pixelY = 0; pixelY < 4; pixelY++) {
                                    for (let pixelX = 0; pixelX < 4; pixelX++) {
                                        const x = blockX * 4 + pixelX;
                                        const y = blockY * 4 + pixelY;
                                        
                                        if (x >= width || y >= height) {
                                            continue; // 跳过超出边界的像素
                                        }
                                        
                                        const codeIndex = (pixelY * 4 + pixelX);
                                        const code = (codes >> (codeIndex * 2)) & 0x03;
                                        const color = colors[code];
                                        
                                        const pixelIndex = (y * width + x) * 4;
                                        pixelData[pixelIndex] = color[0];     // R
                                        pixelData[pixelIndex + 1] = color[1]; // G
                                        pixelData[pixelIndex + 2] = color[2]; // B
                                        pixelData[pixelIndex + 3] = color[3]; // A
                                    }
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
                    
                    static decodeDXT5(view, width, height, dataOffset) {
                        // DXT5 块压缩格式：每个 4x4 像素块占用 16 字节
                        const blockWidth = Math.ceil(width / 4);
                        const blockHeight = Math.ceil(height / 4);
                        const pixelData = new Uint8ClampedArray(width * height * 4);
                        
                        for (let blockY = 0; blockY < blockHeight; blockY++) {
                            for (let blockX = 0; blockX < blockWidth; blockX++) {
                                const blockOffset = dataOffset + (blockY * blockWidth + blockX) * 16;
                                
                                if (blockOffset + 16 > view.byteLength) {
                                    continue; // 跳过不完整的块
                                }
                                
                                // 读取alpha值
                                const alpha0 = view.getUint8(blockOffset);
                                const alpha1 = view.getUint8(blockOffset + 1);
                                
                                // 读取alpha索引数据（6字节）
                                const alphaBytes = [
                                    view.getUint8(blockOffset + 2),
                                    view.getUint8(blockOffset + 3),
                                    view.getUint8(blockOffset + 4),
                                    view.getUint8(blockOffset + 5),
                                    view.getUint8(blockOffset + 6),
                                    view.getUint8(blockOffset + 7)
                                ];
                                
                                // 计算alpha索引（48位数据）
                                let alphaIndices = 0;
                                for (let i = 0; i < 6; i++) {
                                    alphaIndices = (alphaIndices << 8) | alphaBytes[i];
                                }
                                
                                // 读取颜色值
                                const color0 = view.getUint16(blockOffset + 8, true);
                                const color1 = view.getUint16(blockOffset + 10, true);
                                const colorCodes = view.getUint32(blockOffset + 12, true);
                                
                                // 计算alpha值数组
                                const alphaValues = new Array(8);
                                alphaValues[0] = alpha0;
                                alphaValues[1] = alpha1;
                                
                                if (alpha0 > alpha1) {
                                    // 6个插值alpha值
                                    alphaValues[2] = Math.floor((6 * alpha0 + 1 * alpha1) / 7);
                                    alphaValues[3] = Math.floor((5 * alpha0 + 2 * alpha1) / 7);
                                    alphaValues[4] = Math.floor((4 * alpha0 + 3 * alpha1) / 7);
                                    alphaValues[5] = Math.floor((3 * alpha0 + 4 * alpha1) / 7);
                                    alphaValues[6] = Math.floor((2 * alpha0 + 5 * alpha1) / 7);
                                    alphaValues[7] = Math.floor((1 * alpha0 + 6 * alpha1) / 7);
                                } else {
                                    // 4个插值alpha值
                                    alphaValues[2] = Math.floor((4 * alpha0 + 1 * alpha1) / 5);
                                    alphaValues[3] = Math.floor((3 * alpha0 + 2 * alpha1) / 5);
                                    alphaValues[4] = Math.floor((2 * alpha0 + 3 * alpha1) / 5);
                                    alphaValues[5] = Math.floor((1 * alpha0 + 4 * alpha1) / 5);
                                    alphaValues[6] = 0;
                                    alphaValues[7] = 255;
                                }
                                
                                // 将 RGB565 转换为 RGB888
                                const colors = [
                                    this.rgb565ToRgb888(color0),
                                    this.rgb565ToRgb888(color1),
                                    this.interpolateColor(this.rgb565ToRgb888(color0), this.rgb565ToRgb888(color1), 1/3),
                                    this.interpolateColor(this.rgb565ToRgb888(color0), this.rgb565ToRgb888(color1), 2/3)
                                ];
                                
                                // 解码 4x4 像素块
                                for (let pixelY = 0; pixelY < 4; pixelY++) {
                                    for (let pixelX = 0; pixelX < 4; pixelX++) {
                                        const x = blockX * 4 + pixelX;
                                        const y = blockY * 4 + pixelY;
                                        
                                        if (x >= width || y >= height) {
                                            continue; // 跳过超出边界的像素
                                        }
                                        
                                        const pixelIndex = pixelY * 4 + pixelX;
                                        
                                        // 获取alpha索引（每个像素3位）
                                        const alphaBitOffset = pixelIndex * 3;
                                        const alphaIndex = (alphaIndices >> alphaBitOffset) & 0x07;
                                        const alpha = alphaValues[alphaIndex];
                                        
                                        // 获取颜色索引（每个像素2位）
                                        const colorCodeIndex = pixelIndex;
                                        const colorCode = (colorCodes >> (colorCodeIndex * 2)) & 0x03;
                                        const color = colors[colorCode];
                                        
                                        const destIndex = (y * width + x) * 4;
                                        pixelData[destIndex] = color[0];     // R
                                        pixelData[destIndex + 1] = color[1]; // G
                                        pixelData[destIndex + 2] = color[2]; // B
                                        pixelData[destIndex + 3] = alpha;   // A
                                    }
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
                    
                    static rgb565ToRgb888(color565) {
                        const r = ((color565 >> 11) & 0x1F) * 255 / 31;
                        const g = ((color565 >> 5) & 0x3F) * 255 / 63;
                        const b = (color565 & 0x1F) * 255 / 31;
                        return [r, g, b, 255]; // 完全不透明
                    }
                    
                    static interpolateColor(color1, color2, factor) {
                        const r = Math.round(color1[0] * (1 - factor) + color2[0] * factor);
                        const g = Math.round(color1[1] * (1 - factor) + color2[1] * factor);
                        const b = Math.round(color1[2] * (1 - factor) + color2[2] * factor);
                        return [r, g, b, 255]; // 完全不透明
                    }
                }
                
                // UI控制函数
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
                    '<div class="warning">解码失败: ' + error.message + '</div>';
                    formatInfo.innerHTML = '<span style="color: var(--vscode-errorForeground)">✗ 解码失败: ' + error.message + '</span>';
                }
            }
            
            // Start decoding when page loads
            window.addEventListener('load', decodeAndDisplay);
        </script>
    `;
    }
}
module.exports = HTMLGenerator