// src/constants.js
module.exports = {
    DDS_HEADER_SIZE: 128,
    DDS_MAGIC: 0x20534444,
    FORMATS: {
        DXT1: 'DXT1',
        DXT3: 'DXT3',
        DXT5: 'DXT5',
        ATI1: 'ATI1',
        ATI2: 'ATI2',
        BC4U: 'BC4U',
        BC4S: 'BC4S',
        BC5U: 'BC5U',
        BC5S: 'BC5S',
        DX10: 'DX10',
        BGRA: 'BGRA',
        BGR: 'BGR',
        UNKNOWN: 'UNKNOWN'
    },
    SUPPORTED_FORMATS: ['BGRA', 'BGR', 'DXT1', 'DXT3', 'DXT5'],
    // 添加更多格式支持描述
    FORMAT_DESCRIPTIONS: {
        'DXT1': 'BC1 / DXT1 Compression',
        'DXT3': 'BC2 / DXT3 Compression',
        'DXT5': 'BC3 / DXT5 Compression',
        'ATI1': 'BC4 Compression (ATI1)',
        'ATI2': 'BC5 Compression (ATI2)',
        'BC4U': 'BC4 Unsigned Normalized',
        'BC4S': 'BC4 Signed Normalized',
        'BC5U': 'BC5 Unsigned Normalized',
        'BC5S': 'BC5 Signed Normalized',
        'DX10': 'DX10 Extended Format',
        'BGRA': '32-bit BGRA (Uncompressed)',
        'BGR': '24-bit BGR (Uncompressed)'
    }
};