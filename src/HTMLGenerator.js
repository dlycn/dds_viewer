// src/HTMLGenerator.js
const path = require('path');
const Icons = require('./icons');
const DDSFormatDetector = require('./DDSFormatDetector');
const fs = require('fs');

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
     * 解析错误详细信息
     * @param {string} errorMessage - 原始错误信息
     * @param {string} filePath - 文件路径
     * @returns {Object} 解析后的错误信息
     */
    static parseErrorDetails(errorMessage, filePath) {
        const details = {
            message: errorMessage,
            fileSize: null,
            sizeStatus: null,
            possibleCauses: []
        };

        // 尝试从错误信息中提取详细信息
        const errorLower = errorMessage.toLowerCase();

        // 检测文件大小相关的错误
        if (errorLower.includes('file too small') ||
            errorLower.includes('cannot read') ||
            errorLower.includes('undefined')) {

            details.possibleCauses.push('文件大小不足 128 字节（最小 DDS 头部大小）');
            details.possibleCauses.push('文件可能已损坏或不完整');
            details.possibleCauses.push('文件可能不是有效的 DDS 格式');
        }

        // 检测格式错误
        if (errorLower.includes('magic number') || errorLower.includes('not a valid')) {
            details.possibleCauses.push('文件头部缺少有效的 DDS 标识符');
            details.possibleCauses.push('文件可能被其他程序损坏');
            details.possibleCauses.push('文件扩展名可能不正确');
        }

        // 检测读取错误
        if (errorLower.includes('failed to read') || errorLower.includes('error reading')) {
            details.possibleCauses.push('文件访问权限问题');
            details.possibleCauses.push('文件正在被其他程序使用');
            details.possibleCauses.push('磁盘空间不足');
        }

        // 添加通用原因
        if (details.possibleCauses.length === 0) {
            details.possibleCauses.push('DDS 文件格式不兼容');
            details.possibleCauses.push('文件结构损坏');
            details.possibleCauses.push('不支持此版本的 DDS 文件');
        }

        // 尝试获取文件大小信息
        try {
            if (fs && fs.existsSync && fs.existsSync(filePath)) {
                const stats = fs.statSync(filePath);
                details.fileSize = `${stats.size} bytes`;

                if (stats.size < 128) {
                    details.sizeStatus = `❌ 不足 (缺少 ${128 - stats.size} 字节)`;
                } else if (stats.size < 256) {
                    details.sizeStatus = `⚠️ 可能不完整`;
                } else {
                    details.sizeStatus = `✅ 大小正常`;
                }
            }
        } catch (e) {
            // 忽略文件大小获取错误
        }

        return details;
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
            // 解析错误详细信息
            const errorDetails = this.parseErrorDetails(ddsInfo.error, filePath);

            return `
            <div class="dds-error-preview">
                <div class="header">
                    <h2>
                        <span class="header-icon">${Icons.getIcon('image')}</span>
                        DDS 文件预览 - 错误报告
                    </h2>
                    <div class="file-meta">
                        <div class="meta-item">
                            <span class="meta-label">文件:</span>
                            <span class="meta-value">${path.basename(filePath)}</span>
                        </div>
                        <div class="meta-item">
                            <span class="meta-label">状态:</span>
                            <span class="status-badge error">❌ 读取失败</span>
                        </div>
                        <div class="meta-item">
                            <span class="meta-label">格式:</span>
                            <span class="meta-value">${formatType}</span>
                        </div>
                    </div>
                </div>

                <div class="error-summary">
                    <div class="error-header">
                        <span class="error-icon">⚠️</span>
                        <h3>错误摘要</h3>
                    </div>
                    <div class="error-message">
                        <code>${ddsInfo.error}</code>
                    </div>
                </div>

                <div class="content-grid">
                    ${errorDetails.fileSize ? `
                    <div class="info-card">
                        <div class="card-header">
                            <span class="card-icon">📊</span>
                            <h4>文件大小分析</h4>
                        </div>
                        <div class="card-content">
                            <div class="info-row">
                                <span class="info-label">文件大小:</span>
                                <span class="info-value">${errorDetails.fileSize}</span>
                            </div>
                            <div class="info-row">
                                <span class="info-label">最小要求:</span>
                                <span class="info-value">128 bytes (DDS头部)</span>
                            </div>
                            <div class="info-row">
                                <span class="info-label">状态:</span>
                                <span class="status-badge ${errorDetails.sizeStatus.includes('不足') ? 'error' : 'warning'}">
                                    ${errorDetails.sizeStatus}
                                </span>
                            </div>
                        </div>
                    </div>
                    ` : ''}

                    <div class="info-card">
                        <div class="card-header">
                            <span class="card-icon">🔍</span>
                            <h4>问题诊断</h4>
                        </div>
                        <div class="card-content">
                            ${errorDetails.possibleCauses.length > 0 ? `
                            <div class="section">
                                <h5>可能的原因:</h5>
                                <ul class="diagnosis-list">
                                    ${errorDetails.possibleCauses.map(cause => `<li>${cause}</li>`).join('')}
                                </ul>
                            </div>
                            ` : ''}
                            
                            <div class="section">
                                <h5>建议解决方案:</h5>
                                <ol class="solution-list">
                                    <li>确认文件是有效的 DDS 格式</li>
                                    <li>检查文件是否损坏或不完整</li>
                                    <li>使用其他 DDS 查看器验证文件</li>
                                    <li>重新下载或重新生成文件</li>
                                    <li>检查磁盘空间和读写权限</li>
                                </ol>
                            </div>
                        </div>
                    </div>
                </div>

                <style>
                .dds-error-preview {
                    background: var(--vscode-editor-background);
                    border-radius: 8px;
                    padding: 24px;
                    margin: 16px 0;
                    border: 1px solid var(--vscode-panel-border);
                    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
                }

                .header {
                    margin-bottom: 24px;
                    padding-bottom: 20px;
                    border-bottom: 2px solid var(--vscode-panel-border);
                }

                .header h2 {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    margin: 0 0 16px 0;
                    color: var(--vscode-foreground);
                    font-size: 20px;
                    font-weight: 600;
                }

                .header-icon {
                    color: var(--vscode-errorForeground);
                    display: flex;
                    align-items: center;
                    font-size: 24px;
                }

                .file-meta {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                    gap: 16px;
                    background: var(--vscode-sideBar-background);
                    padding: 16px;
                    border-radius: 6px;
                    border: 1px solid var(--vscode-panel-border);
                }

                .meta-item {
                    display: flex;
                    flex-direction: column;
                    gap: 4px;
                }

                .meta-label {
                    color: var(--vscode-descriptionForeground);
                    font-size: 12px;
                    font-weight: 500;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }

                .meta-value {
                    color: var(--vscode-foreground);
                    font-size: 14px;
                    font-weight: 500;
                    font-family: var(--vscode-editor-font-family, monospace);
                }

                .error-summary {
                    background: linear-gradient(135deg, 
                        var(--vscode-inputValidation-errorBackground) 0%, 
                        rgba(255, 0, 0, 0.05) 100%);
                    border: 1px solid var(--vscode-inputValidation-errorBorder);
                    border-radius: 8px;
                    padding: 20px;
                    margin-bottom: 24px;
                }

                .error-header {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    margin-bottom: 16px;
                }

                .error-header h3 {
                    margin: 0;
                    color: var(--vscode-errorForeground);
                    font-size: 16px;
                    font-weight: 600;
                }

                .error-icon {
                    font-size: 20px;
                    color: var(--vscode-errorForeground);
                }

                .error-message {
                    background: rgba(0, 0, 0, 0.2);
                    border-radius: 6px;
                    padding: 16px;
                }

                .error-message code {
                    color: var(--vscode-errorForeground);
                    font-family: var(--vscode-editor-font-family, monospace);
                    font-size: 13px;
                    line-height: 1.6;
                    white-space: pre-wrap;
                    word-break: break-word;
                }

                .content-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
                    gap: 20px;
                    margin-top: 24px;
                }

                .info-card {
                    background: var(--vscode-sideBar-background);
                    border: 1px solid var(--vscode-panel-border);
                    border-radius: 8px;
                    overflow: hidden;
                    transition: all 0.3s ease;
                }

                .info-card:hover {
                    border-color: var(--vscode-focusBorder);
                    transform: translateY(-2px);
                    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
                }

                .card-header {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 16px;
                    background: var(--vscode-editor-background);
                    border-bottom: 1px solid var(--vscode-panel-border);
                }

                .card-header h4 {
                    margin: 0;
                    color: var(--vscode-foreground);
                    font-size: 15px;
                    font-weight: 600;
                }

                .card-icon {
                    font-size: 18px;
                    color: var(--vscode-button-background);
                }

                .card-content {
                    padding: 20px;
                }

                .info-row {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 10px 0;
                    border-bottom: 1px solid var(--vscode-panel-border);
                }

                .info-row:last-child {
                    border-bottom: none;
                }

                .info-label {
                    color: var(--vscode-descriptionForeground);
                    font-size: 13px;
                }

                .info-value {
                    color: var(--vscode-foreground);
                    font-weight: 500;
                    font-family: var(--vscode-editor-font-family, monospace);
                    font-size: 13px;
                }

                .status-badge {
                    padding: 4px 12px;
                    border-radius: 20px;
                    font-size: 12px;
                    font-weight: 600;
                    text-transform: uppercase;
                    letter-spacing: 0.3px;
                }

                .status-badge.error {
                    background: var(--vscode-errorForeground);
                    color: white;
                }

                .status-badge.warning {
                    background: var(--vscode-editorWarning-foreground);
                    color: white;
                }

                .section {
                    margin-bottom: 20px;
                }

                .section:last-child {
                    margin-bottom: 0;
                }

                .section h5 {
                    margin: 0 0 12px 0;
                    color: var(--vscode-foreground);
                    font-size: 14px;
                    font-weight: 600;
                }

                .diagnosis-list,
                .solution-list {
                    margin: 0;
                    padding: 0 0 0 20px;
                }

                .diagnosis-list li,
                .solution-list li {
                    margin-bottom: 8px;
                    color: var(--vscode-foreground);
                    line-height: 1.5;
                    font-size: 13px;
                }

                .diagnosis-list li:last-child,
                .solution-list li:last-child {
                    margin-bottom: 0;
                }

                .diagnosis-list li {
                    list-style-type: disc;
                }

                .solution-list {
                    list-style-type: none;
                    counter-reset: solution-counter;
                    padding-left: 0;
                }

                .solution-list li {
                    counter-increment: solution-counter;
                    position: relative;
                    padding-left: 32px;
                    margin-bottom: 12px;
                }

                .solution-list li:before {
                    content: counter(solution-counter);
                    position: absolute;
                    left: 0;
                    top: -2px;
                    background: var(--vscode-button-background);
                    color: var(--vscode-button-foreground);
                    width: 24px;
                    height: 24px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 12px;
                    font-weight: 600;
                }

                .debug-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                    gap: 12px;
                }

                .debug-item {
                    display: flex;
                    flex-direction: column;
                    gap: 4px;
                    padding: 12px;
                    background: var(--vscode-editor-background);
                    border-radius: 6px;
                    border: 1px solid var(--vscode-panel-border);
                }

                .debug-label {
                    color: var(--vscode-descriptionForeground);
                    font-size: 11px;
                    font-weight: 500;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }

                .debug-value {
                    color: var(--vscode-foreground);
                    font-family: var(--vscode-editor-font-family, monospace);
                    font-size: 12px;
                    word-break: break-word;
                }

                @media (max-width: 768px) {
                    .content-grid {
                        grid-template-columns: 1fr;
                    }
                    
                    .file-meta {
                        grid-template-columns: 1fr;
                    }
                    
                    .debug-grid {
                        grid-template-columns: 1fr;
                    }
                }
                </style>
            </div>
            `;
        }

        const formatInfo = DDSFormatDetector.getFourCCDescription(ddsInfo.pixelFormat);
        const supportStatus = DDSFormatDetector.checkSupportStatus(ddsInfo.pixelFormat);

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

                    // 修改 decode 方法，添加 DXT3 支持
                    static decode(buffer, format, width, height) {
                        const view = new DataView(buffer);
                        const dataOffset = 128; // DDS header size
                        
                        console.log('Decoding DDS:', { format, width, height });
                        
                        if (format === 'BGRA' || format === 'BGR') {
                            return this.decodeUncompressed(view, width, height, dataOffset, format);
                        } else if (format === 'DXT1') {
                            return this.decodeDXT1(view, width, height, dataOffset);
                        } else if (format === 'DXT3') {
                            return this.decodeDXT3(view, width, height, dataOffset);
                        } else if (format === 'DXT5') {
                            return this.decodeDXT5(view, width, height, dataOffset);
                        } else {
                            throw new Error('Unsupported format: ' + format + '. Supported formats: BGRA, BGR, DXT1, DXT3, DXT5.');
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
                    
                    // 在 decodeDXT1 和 decodeDXT5 之间添加 decodeDXT3 方法
                    static decodeDXT3(view, width, height, dataOffset) {
                        // DXT3 块压缩格式：每个 4x4 像素块占用 16 字节
                        const blockWidth = Math.ceil(width / 4);
                        const blockHeight = Math.ceil(height / 4);
                        const pixelData = new Uint8ClampedArray(width * height * 4);
                        
                        for (let blockY = 0; blockY < blockHeight; blockY++) {
                            for (let blockX = 0; blockX < blockWidth; blockX++) {
                                const blockOffset = dataOffset + (blockY * blockWidth + blockX) * 16;
                                
                                if (blockOffset + 16 > view.byteLength) {
                                    continue; // 跳过不完整的块
                                }
                                
                                // 读取alpha值（4位直接存储，每个像素4位，共16个像素）
                                const alphaValues = new Uint8Array(16);
                                
                                // DXT3的alpha存储方式：8字节，每字节存储2个像素的4位alpha值
                                for (let i = 0; i < 8; i++) {
                                    const alphaByte = view.getUint8(blockOffset + i);
                                    const alpha1 = (alphaByte & 0x0F) * 17; // 低4位 (0-15) 映射到 0-255
                                    const alpha2 = ((alphaByte >> 4) & 0x0F) * 17; // 高4位 (0-15) 映射到 0-255
                                    
                                    // 存储到alpha值数组
                                    alphaValues[i * 2] = alpha1;
                                    alphaValues[i * 2 + 1] = alpha2;
                                }
                                
                                // 读取颜色值（后8字节，与DXT1相同）
                                const color0 = view.getUint16(blockOffset + 8, true);
                                const color1 = view.getUint16(blockOffset + 10, true);
                                const colorCodes = view.getUint32(blockOffset + 12, true);
                                
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
                                        
                                        const pixelIndex = pixelY * 4 + pixelX;
                                        const alpha = alphaValues[pixelIndex];
                                        
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