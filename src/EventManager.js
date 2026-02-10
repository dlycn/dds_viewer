// src/EventManager.js
class EventManager {
    constructor() {
        this.handlers = new Map();
    }
    
    register(eventName, handler) {
        if (!this.handlers.has(eventName)) {
            this.handlers.set(eventName, []);
        }
        this.handlers.get(eventName).push(handler);
    }
    
    emit(eventName, data) {
        const handlers = this.handlers.get(eventName) || [];
        handlers.forEach(handler => handler(data));
    }
}

// 在 DDSViewerProvider 中使用
class DDSViewerProvider {
    constructor(context) {
        this.context = context;
        this.webviewPanel = null;
        this.events = new EventManager();
        
        this.setupEvents();
    }
    
    setupEvents() {
        this.events.register('exportPNG', this.handleExportPNG.bind(this));
        this.events.register('showMessage', (data) => {
            vscode.window.showInformationMessage(data.text);
        });
    }
    
    async resolveCustomEditor(document, webviewPanel) {
        webviewPanel.webview.onDidReceiveMessage((message) => {
            this.events.emit(message.command, message.data);
        });
        // ... rest of code
    }
}