// src/ImageProcessor.js
class ImageProcessor {
    static async decodeDDS(buffer, format, width, height) {
        try {
            const result = await DDSDecoder.decode(buffer, format, width, height);
            return this.convertToCanvas(result);
        } catch (error) {
            throw new Error(`Failed to decode DDS: ${error.message}`);
        }
    }
    
    static convertToCanvas(decodedData) {
        const canvas = document.createElement('canvas');
        canvas.width = decodedData.width;
        canvas.height = decodedData.height;
        
        const ctx = canvas.getContext('2d');
        const imageData = new ImageData(
            decodedData.data, 
            decodedData.width, 
            decodedData.height
        );
        ctx.putImageData(imageData, 0, 0);
        
        return canvas;
    }
    
    static async exportToPNG(canvas) {
        return new Promise((resolve, reject) => {
            try {
                canvas.toBlob((blob) => {
                    if (blob) {
                        resolve(blob);
                    } else {
                        reject(new Error('Failed to create PNG blob'));
                    }
                }, 'image/png');
            } catch (error) {
                reject(error);
            }
        });
    }
}