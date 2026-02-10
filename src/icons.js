// src/icons.js
/**
 * SVG图标生成器
 */
class Icons {
    /**
     * 获取SVG图标
     * @param {string} iconName - 图标名称
     * @returns {string} SVG图标HTML
     */
    static getIcon(iconName) {
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
}

module.exports = Icons;