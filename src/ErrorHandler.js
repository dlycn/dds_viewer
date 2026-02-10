// src/ErrorHandler.js
class ErrorHandler {
    static handleDDSDecodeError(error, webviewPanel) {
        console.error('DDS Decode Error:', error);
        
        const errorHTML = `
            <div class="error-container">
                <h3>❌ DDS Decoding Failed</h3>
                <p><strong>Error:</strong> ${error.message}</p>
                <p><strong>Supported formats:</strong> BGRA, BGR, DXT1,DXT3, DXT5</p>
            </div>
        `;
        
        if (webviewPanel) {
            webviewPanel.webview.html = this.wrapInHTML(errorHTML);
        }
    }
    
    static wrapInHTML(content) {
        return `
            <!DOCTYPE html>
            <html>
            <style>
                .error-container {
                    padding: 20px;
                    color: #ff6b6b;
                    background: #2d2d2d;
                    border-radius: 5px;
                    margin: 20px;
                }
            </style>
            <body>${content}</body>
            </html>
        `;
    }
}