// src/DDSDecoder.js
/**
 * DDS解码器（通用环境）
 */
class DDSDecoder {
    /**
     * 解码 DDS 文件
     * @param {Buffer|ArrayBuffer} buffer - DDS文件缓冲区
     * @param {string} format - 格式类型
     * @param {number} width - 宽度
     * @param {number} height - 高度
     * @returns {Object} 解码结果
     */
    static decode(buffer, format, width, height) {
        // 检查buffer类型，如果是ArrayBuffer则创建适配器
        const bufferAdapter = this.createBufferAdapter(buffer);
        const dataOffset = 128; // DDS头大小
        
        // 使用工厂方法获取解码器
        const decoder = DDSDecoderFactory.createDecoder(format);
        return decoder.call(this, bufferAdapter, width, height, dataOffset, format);
    }
    
    /**
     * 解码未压缩格式
     * @param {Object} buffer - 数据缓冲区适配器
     * @param {number} width - 宽度
     * @param {number} height - 高度
     * @param {number} dataOffset - 数据偏移量
     * @param {string} format - 格式
     * @returns {Object} 解码结果
     */
    static decodeUncompressed(buffer, width, height, dataOffset, format) {
        const pixelData = new Uint8ClampedArray(width * height * 4);
        const bytesPerPixel = format === 'BGRA' ? 4 : 3;
        
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const srcPos = dataOffset + (y * width + x) * bytesPerPixel;
                const destPos = (y * width + x) * 4;
                
                if (format === 'BGRA') {
                    // BGRA to RGBA
                    pixelData[destPos] = buffer.get(srcPos + 2);     // R
                    pixelData[destPos + 1] = buffer.get(srcPos + 1); // G
                    pixelData[destPos + 2] = buffer.get(srcPos);     // B
                    pixelData[destPos + 3] = buffer.get(srcPos + 3); // A
                } else if (format === 'BGR') {
                    // BGR to RGBA
                    pixelData[destPos] = buffer.get(srcPos + 2);     // R
                    pixelData[destPos + 1] = buffer.get(srcPos + 1); // G
                    pixelData[destPos + 2] = buffer.get(srcPos);     // B
                    pixelData[destPos + 3] = 255;                   // A (fully opaque)
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
    
    /**
     * 解码 DXT1 格式
     * @param {Object} buffer - 数据缓冲区适配器
     * @param {number} width - 宽度
     * @param {number} height - 高度
     * @param {number} dataOffset - 数据偏移量
     * @param {string} format - 格式（未使用，为了接口统一）
     * @returns {Object} 解码结果
     */
    static decodeDXT1(buffer, width, height, dataOffset, format) {
        // DXT1 块压缩格式：每个 4x4 像素块占用 8 字节
        const blockWidth = Math.ceil(width / 4);
        const blockHeight = Math.ceil(height / 4);
        const pixelData = new Uint8ClampedArray(width * height * 4);
        
        for (let blockY = 0; blockY < blockHeight; blockY++) {
            for (let blockX = 0; blockX < blockWidth; blockX++) {
                const blockOffset = dataOffset + (blockY * blockWidth + blockX) * 8;
                
                if (blockOffset + 8 > buffer.length) {
                    continue; // 跳过不完整的块
                }
                
                // 读取颜色值
                const color0 = buffer.readUInt16LE(blockOffset);
                const color1 = buffer.readUInt16LE(blockOffset + 2);
                const codes = buffer.readUInt32LE(blockOffset + 4);
                
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
    
    /**
     * 解码 DXT5 格式
     * @param {Object} buffer - 数据缓冲区适配器
     * @param {number} width - 宽度
     * @param {number} height - 高度
     * @param {number} dataOffset - 数据偏移量
     * @param {string} format - 格式（未使用，为了接口统一）
     * @returns {Object} 解码结果
     */
    static decodeDXT5(buffer, width, height, dataOffset, format) {
        // DXT5 块压缩格式：每个 4x4 像素块占用 16 字节
        const blockWidth = Math.ceil(width / 4);
        const blockHeight = Math.ceil(height / 4);
        const pixelData = new Uint8ClampedArray(width * height * 4);
        
        for (let blockY = 0; blockY < blockHeight; blockY++) {
            for (let blockX = 0; blockX < blockWidth; blockX++) {
                const blockOffset = dataOffset + (blockY * blockWidth + blockX) * 16;
                
                if (blockOffset + 16 > buffer.length) {
                    continue; // 跳过不完整的块
                }
                
                // 读取alpha值
                const alpha0 = buffer.get(blockOffset);
                const alpha1 = buffer.get(blockOffset + 1);
                
                // 读取alpha索引数据（6字节）
                const alphaBytes = [
                    buffer.get(blockOffset + 2),
                    buffer.get(blockOffset + 3),
                    buffer.get(blockOffset + 4),
                    buffer.get(blockOffset + 5),
                    buffer.get(blockOffset + 6),
                    buffer.get(blockOffset + 7)
                ];
                
                // 计算alpha索引（48位数据）
                let alphaIndices = 0;
                for (let i = 0; i < 6; i++) {
                    alphaIndices = (alphaIndices << 8) | alphaBytes[i];
                }
                
                // 读取颜色值
                const color0 = buffer.readUInt16LE(blockOffset + 8);
                const color1 = buffer.readUInt16LE(blockOffset + 10);
                const colorCodes = buffer.readUInt32LE(blockOffset + 12);
                
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
    
    /**
     * 转换 RGB565 到 RGB888
     * @param {number} color565 - RGB565颜色值
     * @returns {Array} RGB888颜色数组
     */
    static rgb565ToRgb888(color565) {
        const r = ((color565 >> 11) & 0x1F) * 255 / 31;
        const g = ((color565 >> 5) & 0x3F) * 255 / 63;
        const b = (color565 & 0x1F) * 255 / 31;
        return [r, g, b, 255]; // 完全不透明
    }
    
    /**
     * 插值颜色
     * @param {Array} color1 - 颜色1
     * @param {Array} color2 - 颜色2
     * @param {number} factor - 插值因子
     * @returns {Array} 插值后的颜色
     */
    static interpolateColor(color1, color2, factor) {
        const r = Math.round(color1[0] * (1 - factor) + color2[0] * factor);
        const g = Math.round(color1[1] * (1 - factor) + color2[1] * factor);
        const b = Math.round(color1[2] * (1 - factor) + color2[2] * factor);
        return [r, g, b, 255]; // 完全不透明
    }
    
    /**
     * 创建缓冲区适配器
     * @param {Buffer|ArrayBuffer} buffer - 输入缓冲区
     * @returns {Object} 适配器对象
     */
    static createBufferAdapter(buffer) {
        if (buffer instanceof ArrayBuffer) {
            // 浏览器环境
            const view = new DataView(buffer);
            return {
                length: buffer.byteLength,
                readUInt16LE: (offset) => view.getUint16(offset, true),
                readUInt32LE: (offset) => view.getUint32(offset, true),
                get: (offset) => view.getUint8(offset),
                [Symbol.iterator]: function*() {
                    for (let i = 0; i < this.length; i++) {
                        yield this.get(i);
                    }
                }
            };
        } else {
            // Node.js环境
            return buffer;
        }
    }
}

/**
 * DDS解码器工厂类
 */
/**
 * DDS解码器工厂类
 */
class DDSDecoderFactory {
    /**
     * 创建解码器
     * @param {string} format - 格式类型
     * @returns {Function} 解码器函数
     */
    static createDecoder(format) {
        const decoders = {
            'BGRA': DDSDecoder.decodeUncompressed,
            'BGR': DDSDecoder.decodeUncompressed,
            'DXT1': DDSDecoder.decodeDXT1,
            'DXT3': DDSDecoder.decodeDXT3,  // 添加 DXT3 支持
            'DXT5': DDSDecoder.decodeDXT5
        };
        
        const decoder = decoders[format];
        if (!decoder) {
            throw new Error(`Unsupported format: ${format}. Supported formats: BGRA, BGR, DXT1, DXT3, DXT5.`);
        }
        return decoder;
    }
}

// Node.js环境导出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DDSDecoder;
}
// 浏览器环境 - 全局导出
if (typeof window !== 'undefined') {
    window.DDSDecoder = DDSDecoder;
    window.DDSDecoderFactory = DDSDecoderFactory;
}