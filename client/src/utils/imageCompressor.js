const blobFromDataUrl = (dataUrl) => {
  const [metadata, encoded] = dataUrl.split(',');
  const mime = metadata.match(/^data:(.*?);base64$/)?.[1] || 'application/octet-stream';
  const binary = atob(encoded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return new Blob([bytes], { type: mime });
};

/**
 * Compresses an image file before upload.
 * - Resizes max width/height to 1920px (preserving aspect ratio).
 * - Converts to WebP (with JPEG fallback) at 0.78 quality.
 * - Drastically reduces file size from 5-20MB down to ~150-300KB.
 * - Returns { dataUrl, blob, originalSize, compressedSize, compressionRatio }
 */
export async function compressImage(file, maxWidth = 1920, maxHeight = 1920, quality = 0.78) {
  return new Promise((resolve, reject) => {
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file?.type)) {
      reject(new Error('Choose a PNG, JPEG, or WebP image.'));
      return;
    }

    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      let { width, height } = img;

      // Scale down while maintaining aspect ratio
      if (width > maxWidth || height > maxHeight) {
        if (width / height > maxWidth / maxHeight) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        } else {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('This browser could not prepare the image.'));
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);

      // Try webp first
      let dataUrl = canvas.toDataURL('image/webp', quality);
      let format = 'image/webp';
      if (!dataUrl.startsWith('data:image/webp')) {
        dataUrl = canvas.toDataURL('image/jpeg', quality);
        format = 'image/jpeg';
      }

      const finishCompression = (blob) => {
        const compressedBlob = blob || blobFromDataUrl(dataUrl);
        resolve({
          dataUrl,
          blob: compressedBlob,
          originalSize: file.size,
          compressedSize: compressedBlob.size,
          compressionRatio: Math.max(0, Math.round((1 - compressedBlob.size / file.size) * 100)),
        });
      };

      if (typeof canvas.toBlob === 'function') {
        canvas.toBlob(finishCompression, format, quality);
      } else {
        finishCompression(null);
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Failed to load image for compression'));
    };

    img.src = objectUrl;
  });
}

