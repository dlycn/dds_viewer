// src/DDSFormatDetector.js
class DDSFormatDetector {
    /**
     * 解析 DDS 文件头信息
     */
    // src/DDSFormatDetector.js
    static parseDDSHeader(buffer) {
        // 确保 buffer 足够大
        if (!buffer || buffer.length < 128) {
            return { 
                error: `File too small to be a valid DDS file. Required at least 128 bytes, but got ${buffer ? buffer.length : 0} bytes.`,
                valid: false 
            };
        }

        let magic;
        try {
            // 检查 buffer 的类型并读取魔数
            if (Buffer.isBuffer(buffer)) {
                magic = buffer.readUInt32LE(0);
            } else if (buffer instanceof ArrayBuffer || ArrayBuffer.isView(buffer)) {
                // 处理 ArrayBuffer 或 TypedArray
                const view = new DataView(buffer instanceof ArrayBuffer ? buffer : buffer.buffer);
                magic = view.getUint32(0, true);
            } else {
                // 如果 buffer 是 Uint8Array 或类似类型
                magic = new DataView(buffer.buffer).getUint32(0, true);
            }
        } catch (error) {
            return { 
                error: `Failed to read DDS magic number: ${error.message}`,
                valid: false 
            };
        }

        if (magic !== 0x20534444) {
            return { 
                error: 'Not a valid DDS file (incorrect magic number)',
                valid: false 
            };
        }

        try {
            // 使用适当的读取方式
            const readUInt32LE = (offset) => {
                if (Buffer.isBuffer(buffer)) {
                    return buffer.readUInt32LE(offset);
                } else {
                    const view = new DataView(
                        buffer instanceof ArrayBuffer ? buffer : buffer.buffer
                    );
                    return view.getUint32(offset, true);
                }
            };

            const readUInt16LE = (offset) => {
                if (Buffer.isBuffer(buffer)) {
                    return buffer.readUInt16LE(offset);
                } else {
                    const view = new DataView(
                        buffer instanceof ArrayBuffer ? buffer : buffer.buffer
                    );
                    return view.getUint16(offset, true);
                }
            };

            const header = {
                size: readUInt32LE(4),
                flags: readUInt32LE(8),
                height: readUInt32LE(12),
                width: readUInt32LE(16),
                pitchOrLinearSize: readUInt32LE(20),
                depth: readUInt32LE(24),
                mipMapCount: readUInt32LE(28)
            };

            // 读取像素格式信息
            const pixelFormatSize = readUInt32LE(76);
            const pixelFormatFlags = readUInt32LE(80);
            
            // 读取 FourCC 代码
            let fourCC = '    ';
            try {
                if (Buffer.isBuffer(buffer)) {
                    fourCC = buffer.toString('ascii', 84, 88);
                } else {
                    // 从 ArrayBuffer 或 TypedArray 读取 ASCII 字符串
                    const view = new Uint8Array(
                        buffer instanceof ArrayBuffer ? buffer : buffer.buffer
                    );
                    const chars = [];
                    for (let i = 84; i < 88; i++) {
                        chars.push(String.fromCharCode(view[i]));
                    }
                    fourCC = chars.join('');
                }
            } catch (error) {
                console.warn('Failed to read FourCC:', error);
                fourCC = 'UNKN';
            }

            const pixelFormat = {
                size: pixelFormatSize,
                flags: pixelFormatFlags,
                fourCC: fourCC,
                rgbBitCount: readUInt32LE(88),
                rBitMask: readUInt32LE(92),
                gBitMask: readUInt32LE(96),
                bBitMask: readUInt32LE(100),
                aBitMask: readUInt32LE(104)
            };

            const caps = readUInt32LE(108);
            const caps2 = readUInt32LE(112);

            return {
                valid: true,
                header,
                pixelFormat,
                caps,
                caps2,
                fileSize: buffer.length
            };
        } catch (error) {
            return { 
                error: `Failed to parse DDS header: ${error.message}`,
                valid: false 
            };
        }
    }

    /**
     * 获取 FourCC 代码的描述
     * @param {Object} pixelFormat - 像素格式信息对象
     * @returns {string} 格式描述
     */
    static getFourCCDescription(pixelFormat) {
        const fourCC = pixelFormat.fourCC.trim();
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
        
        if (formats[fourCC]) return formats[fourCC];
        
        // 对于未压缩格式
        if ((pixelFormat.flags & 0x40) !== 0) {
            if (pixelFormat.rgbBitCount === 32) {
                return pixelFormat.aBitMask !== 0 ? 'BGRA' : 'BGR';
            } else if (pixelFormat.rgbBitCount === 24) {
                return 'BGR';
            }
        }
        
        return 'Unknown Format';
    }

    /**
     * 检测 DDS 格式类型
     */
    static detectFormat(pixelFormat) {
        const fourCC = pixelFormat.fourCC.trim();
        
        if (fourCC === 'DXT1') return 'DXT1';
        if (fourCC === 'DXT3') return 'DXT3';
        if (fourCC === 'DXT5') return 'DXT5';
        if (fourCC === 'ATI1' || fourCC === 'BC4U') return 'BC4';
        if (fourCC === 'ATI2' || fourCC === 'BC5U') return 'BC5';
        if (fourCC === 'DX10') return 'DX10';
        
        // 未压缩格式
        if ((pixelFormat.flags & 0x40) !== 0) {
            if (pixelFormat.rgbBitCount === 32) {
                return pixelFormat.aBitMask !== 0 ? 'BGRA' : 'BGR';
            } else if (pixelFormat.rgbBitCount === 24) {
                return 'BGR';
            }
        }
        
        return 'UNKNOWN';
    }

    /**
     * 检测是否为支持的格式
     * @param {Object} pixelFormat - 像素格式信息
     * @returns {Object} 包含支持状态和信息的对象
     */
    static checkSupportStatus(pixelFormat) {
        const format = this.detectFormat(pixelFormat);
        const description = this.getFourCCDescription(pixelFormat);
        const isSupported = this.isFormatSupported(pixelFormat);
        
        return {
            format: format,
            description: description,
            supported: isSupported,
            reason: isSupported ? 'Format is supported' : this.getUnsupportedReason(pixelFormat)
        };
    }

    /**
     * 检查格式是否受支持
     * @param {Object} pixelFormat - 像素格式信息
     * @returns {boolean} 是否支持
     */
    static isFormatSupported(pixelFormat) {
        const format = this.detectFormat(pixelFormat);
        const supportedFormats = ['BGRA', 'BGR', 'DXT1', 'DXT3', 'DXT5'];
        return supportedFormats.includes(format);
    }

    /**
     * 获取不支持的原因
     * @param {Object} pixelFormat - 像素格式信息
     * @returns {string} 不支持的原因描述
     */
    static getUnsupportedReason(pixelFormat) {
        const format = this.detectFormat(pixelFormat);
        const fourCC = pixelFormat.fourCC.trim();
        
        const reasons = {
            'DX10': 'DX10 extended format requires additional header parsing',
            'ATI1': 'BC4/ATI1 compression not yet implemented',
            'ATI2': 'BC5/ATI2 compression not yet implemented',
            'BC4U': 'BC4 Unsigned format not yet implemented',
            'BC4S': 'BC4 Signed format not yet implemented',
            'BC5U': 'BC5 Unsigned format not yet implemented',
            'BC5S': 'BC5 Signed format not yet implemented'
        };
        
        return reasons[fourCC] || `Format '${format}' is not currently supported`;
    }

    /**
     * 获取所有已知格式信息
     * @returns {Array} 格式信息数组
     */
    static getAllKnownFormats() {
        return [
            { code: 'DXT1', name: 'DXT1 / BC1', supported: true, type: 'Compressed' },
            { code: 'DXT3', name: 'DXT3 / BC2', supported: true, type: 'Compressed' },
            { code: 'DXT5', name: 'DXT5 / BC3', supported: true, type: 'Compressed' },
            { code: 'ATI1', name: 'ATI1 / BC4', supported: false, type: 'Compressed' },
            { code: 'ATI2', name: 'ATI2 / BC5', supported: false, type: 'Compressed' },
            { code: 'BGRA', name: 'BGRA (32-bit)', supported: true, type: 'Uncompressed' },
            { code: 'BGR', name: 'BGR (24-bit)', supported: true, type: 'Uncompressed' },
            { code: 'DX10', name: 'DX10 Extended', supported: false, type: 'Extended' }
        ];
    }

    /**
     * 检测是否为体积纹理（3D纹理）
     * @param {Object} caps2 - caps2标志位
     * @returns {boolean} 是否为体积纹理
     */
    static isVolumeTexture(caps2) {
        return (caps2 & 0x200000) !== 0; // DDS_CAPS2_VOLUME
    }

    /**
     * 检测是否为立方体贴图
     * @param {Object} caps2 - caps2标志位
     * @returns {boolean} 是否为立方体贴图
     */
    static isCubemap(caps2) {
        return (caps2 & 0x200) !== 0; // DDS_CAPS2_CUBEMAP
    }

}

module.exports = DDSFormatDetector;