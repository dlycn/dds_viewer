class DDSDecoder {
    static decodeDDS(buffer) {
        if (buffer.length < 128) {
            throw new Error('File too small to be a valid DDS file');
        }

        // 解析 DDS 头（复用你现有的代码）
        const header = this.parseDDSHeader(buffer);
        
        // 根据格式选择解码方法
        if (header.pixelFormat.fourCC.trim() === 'DXT1') {
            return this.decodeDXT1(buffer, header);
        } else if (header.pixelFormat.fourCC.trim() === 'DXT5') {
            return this.decodeDXT5(buffer, header);
        } else {
            // 默认尝试 RGB 解码
            return this.decodeUncompressed(buffer, header);
        }
    }

    static decodeUncompressed(buffer, header) {
        const { width, height } = header.header;
        const dataOffset = 128; // DDS 头大小
        const pixelData = new Uint8ClampedArray(width * height * 4);
        
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const srcPos = dataOffset + (y * width + x) * 4;
                const destPos = (y * width + x) * 4;
                
                // BGRA 转 RGBA
                pixelData[destPos] = buffer[srcPos + 2];     // R
                pixelData[destPos + 1] = buffer[srcPos + 1]; // G
                pixelData[destPos + 2] = buffer[srcPos];     // B
                pixelData[destPos + 3] = buffer[srcPos + 3]; // A
            }
        }
        
        return {
            width,
            height,
            data: pixelData,
            format: 'RGBA'
        };
    }

    // 这里可以添加 DXT1、DXT5 等压缩格式的解码方法
    // 由于代码较长，可以先实现基础的 RGB 解码
}