// types/dds.d.ts
interface DDSHeader {
    size: number;
    flags: number;
    height: number;
    width: number;
    pitchOrLinearSize: number;
    depth: number;
    mipMapCount: number;
}

interface DDSFormat {
    size: number;
    flags: number;
    fourCC: string;
    rgbBitCount: number;
    rBitMask: number;
    gBitMask: number;
    bBitMask: number;
    aBitMask: number;
}

interface DDSInfo {
    valid: boolean;
    header: DDSHeader;
    pixelFormat: DDSFormat;
    caps: number;
    caps2: number;
    fileSize: number;
}

interface DecodeResult {
    width: number;
    height: number;
    data: Uint8ClampedArray;
    format: string;
}