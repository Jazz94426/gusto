/**
 * Utility to extract a cropped image from an original image using an HTML5 Canvas.
 */

export const createImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', (error) => {
      console.error('Image load error for URL starting with:', url.substring(0, 30), error);
      reject(new Error(`Failed to load image for cropping. URL starts with: ${url.substring(0, 30)}`));
    });
    
    // Proxy external images to bypass CORS
    if (url.startsWith('http') && !url.includes('/api/proxy-image')) {
      image.setAttribute('crossOrigin', 'anonymous');
      image.src = `/api/proxy-image?url=${encodeURIComponent(url)}`;
    } else {
      image.src = url;
    }
  });

export function getRadianAngle(degreeValue: number) {
  return (degreeValue * Math.PI) / 180;
}

export interface PixelCrop {
  x: number;
  y: number;
  width: number;
  height: number;
}

export default async function getCroppedImg(
  imageSrc: string,
  pixelCrop: PixelCrop,
  rotation = 0,
  flip = { horizontal: false, vertical: false }
): Promise<string> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    return '';
  }

  const rotRad = getRadianAngle(rotation);

  // calculate bounding box of the rotated image
  const { width: bBoxWidth, height: bBoxHeight } = rotateSize(
    image.width,
    image.height,
    rotation
  );

  // set canvas size to match the bounding box
  canvas.width = bBoxWidth;
  canvas.height = bBoxHeight;

  // translate canvas context to a central location to allow rotating and flipping around the center
  ctx.translate(bBoxWidth / 2, bBoxHeight / 2);
  ctx.rotate(rotRad);
  ctx.scale(flip.horizontal ? -1 : 1, flip.vertical ? -1 : 1);
  ctx.translate(-image.width / 2, -image.height / 2);

  // draw rotated image
  ctx.drawImage(image, 0, 0);

  // croppedAreaPixels values are bounding box relative
  // extract the cropped image using default canvas crop function
  const data = ctx.getImageData(
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height
  );

  // set canvas width to final desired crop size - this will clear existing context
  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  // paste generated rotate image at the top left corner
  ctx.putImageData(data, 0, 0);

  // As a base64 data url
  try {
    return canvas.toDataURL('image/jpeg', 0.9);
  } catch (e: any) {
    console.error("Canvas toDataURL failed. Canvas might be tainted:", e);
    throw new Error("Unable to crop this image due to cross-origin restrictions (CORS). Try uploading a new image instead.");
  }
}

function rotateSize(width: number, height: number, rotation: number) {
  const rotRad = getRadianAngle(rotation);

  return {
    width:
      Math.abs(Math.cos(rotRad) * width) + Math.abs(Math.sin(rotRad) * height),
    height:
      Math.abs(Math.sin(rotRad) * width) + Math.abs(Math.cos(rotRad) * height),
  };
}
