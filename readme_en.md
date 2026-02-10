
---

# DDS Viewer – Visual Studio Code Extension

A DDS image preview tool designed for mod developers, enabling rapid texture inspection and format evaluation to support informed graphics format selection.

<p align="center">
  <img src="https://raw.gitcode.com/StarsAll_InFrost/dds-viewer/raw/main/icon.png" alt="DDS Viewer Logo">
</p>
<div align="center">
  <a href="README.md">中文</a> | 
  <a href="readme_en.md">English</a>
</div>
## 📋 Prerequisites

> **Note**: This tool is optimized for **small to medium mod development workflows**, focusing on real-time preview capabilities.  
> - For small mods or prototyping, PNG is recommended for its balance of size and compatibility.
> - For large-scale mods or batch processing, please use dedicated batch conversion tools.

## ✨ Core Features

### 🎯 Mod-Oriented Design
- **Real-time size comparison**: Quickly assess texture dimensions to evaluate PNG suitability.
- **Format evaluation**: Analyze volume differences across compression formats.
- **Lightweight tooling**: Focused on preview and assessment without complex batch processing.

### 🔍 Inspection Capabilities
- **Dimension display**: Immediate width and height visualization.
- **Format detection**: Automatic identification of DDS compression type with technical details.

### 📊 Assessment Metrics
- **File size comparison**: Display actual file size for storage impact analysis.
- **Technical parameters**: Mipmap counts, compression type, and other key metadata.
- **Compatibility indicators**: Flag format compatibility for common game engines.

## 🧠 DDS Format Overview

### Why Games Use DDS?
DDS (DirectDraw Surface) is the standard texture format for DirectX, offering the following advantages:

| Format       | Characteristics                     | Typical Use Case                |
|--------------|-------------------------------------|----------------------------------|
| **DXT1 (BC1)** | 4:1 compression, no/alpha simple   | Diffuse maps, simple textures   |
| **DXT3 (BC2)** | 4-bit alpha, sharp edges           | UI elements, masked textures    |
| **DXT5 (BC3)** | Interpolated alpha, smooth transparency | Particles, gradient alpha     |
| **BGRA/BGR**  | Uncompressed, lossless quality     | High-fidelity textures, reference images |
| **BC4/BC5**   | Single/dual channel compression    | Normal maps, height maps        |

### Recommendations for Small Mods
For most small to medium mods, consider:
1. **PNG format**: Small size, broad compatibility, easy editing.
2. **DXT1/DXT5**: When compression is needed and supported by the engine.
3. **Avoid DX10+**: Unless explicitly required by the target game.

## 🚀 Quick Start

### Installation
1. Search for "DDS Viewer" in the VSCode Extensions Marketplace.
2. Click Install.
3. Restart VSCode.
4. The extension is ready to handle your `.dds` files.

### Use Cases
1. **Texture dimension assessment**: Open a DDS file to view its size and volume.
2. **Format conversion reference**: Decide whether to convert to PNG based on compression info.
3. **Technical inspection**: Review mipmap counts, compression type, and other details.

### Interaction
1. **Double-click**: Open a `.dds` file directly in the Explorer.
2. **Context menu**: Right-click and select "Open with DDS Preview".
3. **Command palette**: Press `Ctrl+Shift+P` and type "DDS: Preview File".

## 📈 Format Support Summary

| Format  | Compression | Game Compatibility | Small Mod Recommendation   |
|---------|-------------|---------------------|----------------------------|
| **DXT1**  | 6:1         | ⭐⭐⭐⭐⭐             | Recommended (if compression needed) |
| **DXT3**  | 4:1         | ⭐⭐⭐⭐              | Less common                |
| **DXT5**  | 4:1         | ⭐⭐⭐⭐⭐             | Recommended (if alpha needed) |
| **BGRA**  | 1:1         | ⭐⭐⭐⭐⭐             | PNG preferred              |
| **BGR**   | 1:1         | ⭐⭐⭐⭐              | PNG preferred              |
| **DX10+** | Variable    | ⭐⭐                 | Large-scale mods only      |

## 💡 Mod Development Guidelines

### When to Use PNG
✅ **PNG recommended**:
- Texture dimensions ≤ 512×512
- Total file count < 50
- Frequent editing required
- High cross-engine compatibility needed

### When to Use DDS
✅ **DDS considered**:
- Texture dimensions ≥ 1024×1024
- Game engine mandates DDS format
- Mipmap auto-generation needed
- Memory footprint is a primary concern

### Tool Selection Advice
- **This extension**: Ideal for single-file preview and quick evaluation.
- **Batch tools**: e.g., TexConv, NVIDIA Texture Tools.
- **Editor plugins**: e.g., Photoshop DDS plugin.

## 🔧 Technical Notes

### How It Works
1. **Format detection**: Parses DDS header to identify compression.
2. **Real-time decoding**: JavaScript-based decoding for DXT1/3/5.
3. **Dimension assessment**: Calculates and displays texture pixel dimensions.
4. **Format suggestions**: Provides alternative recommendations based on size and format.

### Performance
- **Lightweight**: Low memory usage, single-file processing.
- **Fast preview**: Decoding and display within milliseconds.
- **Zero-configuration**: Works out of the box.

## 🤝 Contributions & Feedback

Mod developers are welcome to:
1. **Share experience**: Best practices for different game engines.
2. **Provide feedback**: Tell us what features you need most.
3. **Suggest improvements**: How to better align with mod development workflows.

---

> **Final note**: This tool is intended for **quick evaluation and reference**. Actual format selection should consider engine requirements, performance needs, and development workflow. For small mods, prioritize PNG for ease of use. For large projects, use dedicated batch-processing tools.

---
