// src/DDSFormatDetector.js
class DDSFormatDetector {
    /**
     * 解析 DDS 文件头信息
     */
    static parseDDSHeader(buffer) {
        if (buffer.length < 128) {
            return { error: 'File too small to be a valid DDS file' };
        }

        const magic = buffer.readUInt32LE(0);
        if (magic !== 0x20534444) {
            return { error: 'Not a valid DDS file' };
        }

        const header = {
            size: buffer.readUInt32LE(4),
            flags: buffer.readUInt32LE(8),
            height: buffer.readUInt32LE(12),
            width: buffer.readUInt32LE(16),
            pitchOrLinearSize: buffer.readUInt32LE(20),
            depth: buffer.readUInt32LE(24),
            mipMapCount: buffer.readUInt32LE(28)
        };

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
    static getFourCCDescription(fourCC) {
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
        return formats[fourCC] || `Uncompressed`;
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
}

module.exports = DDSFormatDetector;