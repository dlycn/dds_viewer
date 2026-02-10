// src/constants.js
module.exports = {
    DDS_HEADER_SIZE: 128,
    DDS_MAGIC: 0x20534444,
    FORMATS: {
        DXT1: 'DXT1',
        DXT3: 'DXT3',
        DXT5: 'DXT5',
        BGRA: 'BGRA',
        BGR: 'BGR',
        UNKNOWN: 'UNKNOWN'
    },
    SUPPORTED_FORMATS: ['BGRA', 'BGR', 'DXT1', 'DXT5']
};