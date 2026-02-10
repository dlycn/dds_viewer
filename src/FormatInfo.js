// 创建新文件：src/FormatInfo.js

/**
 * 格式信息工具类
 */
class FormatInfo {
    /**
     * 获取格式详细描述
     */
    static getFormatDetails(formatCode) {
        const details = {
            'DXT1': {
                name: 'DXT1 / BC1',
                bitsPerPixel: 4,
                blockSize: 8, // bytes per 4x4 block
                features: ['RGB Compression', '1-bit Alpha (optional)'],
                typicalUse: ['Diffuse maps', 'Simple textures']
            },
            'DXT3': {
                name: 'DXT3 / BC2',
                bitsPerPixel: 8,
                blockSize: 16,
                features: ['RGB Compression', '4-bit Alpha'],
                typicalUse: ['Textures with sharp alpha edges']
            },
            'DXT5': {
                name: 'DXT5 / BC3',
                bitsPerPixel: 8,
                blockSize: 16,
                features: ['RGB Compression', 'Interpolated Alpha'],
                typicalUse: ['Textures with smooth alpha transitions']
            },
            'BGRA': {
                name: 'BGRA (32-bit)',
                bitsPerPixel: 32,
                blockSize: null,
                features: ['Uncompressed', 'Alpha Channel'],
                typicalUse: ['High-quality textures', 'UI elements']
            },
            'BGR': {
                name: 'BGR (24-bit)',
                bitsPerPixel: 24,
                blockSize: null,
                features: ['Uncompressed', 'No Alpha'],
                typicalUse: ['Simple textures without transparency']
            }
        };
        
        return details[formatCode] || {
            name: formatCode,
            bitsPerPixel: 'Unknown',
            features: [],
            typicalUse: []
        };
    }
    
    /**
     * 计算纹理大小
     */
    static calculateTextureSize(width, height, format) {
        const details = this.getFormatDetails(format);
        
        if (details.blockSize) {
            // 压缩格式：基于块大小计算
            const blocksWide = Math.max(1, Math.floor((width + 3) / 4));
            const blocksHigh = Math.max(1, Math.floor((height + 3) / 4));
            return blocksWide * blocksHigh * details.blockSize;
        } else if (details.bitsPerPixel) {
            // 未压缩格式：基于像素计算
            return width * height * (details.bitsPerPixel / 8);
        }
        
        return 0;
    }
}

module.exports = FormatInfo;