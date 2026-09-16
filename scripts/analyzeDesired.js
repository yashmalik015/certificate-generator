import { loadImage, createCanvas } from 'canvas';

async function analyze() {
  const imgPath = '/Users/yashmalik/.gemini/antigravity-ide/brain/2d09883f-1947-4bd3-9515-56d10d8983e9/.user_uploaded/media_1789545822472.png';
  const img = await loadImage(imgPath);
  console.log(`Desired image resolution: ${img.width}x${img.height}`);
  
  const canvas = createCanvas(img.width, img.height);
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0);
  const imgData = ctx.getImageData(0, 0, img.width, img.height);
  const data = imgData.data;
  
  function getPixel(x, y) {
    const idx = (y * img.width + x) * 4;
    return { r: data[idx], g: data[idx+1], b: data[idx+2] };
  }

  // Find QR code
  let qrTop = 1000, qrLeft = 1000, qrRight = 0, qrBottom = 0;
  for (let y = 50; y < 200; y++) {
    for (let x = 600; x < 750; x++) {
      const p = getPixel(x, y);
      if (p.r < 50 && p.g < 50 && p.b < 50) {
        if (x < qrLeft) qrLeft = x;
        if (x > qrRight) qrRight = x;
        if (y < qrTop) qrTop = y;
        if (y > qrBottom) qrBottom = y;
      }
    }
  }
  console.log(`QR Code bounding box: Left=${qrLeft}, Top=${qrTop}, Right=${qrRight}, Bottom=${qrBottom}, Width=${qrRight-qrLeft}, Height=${qrBottom-qrTop}`);

  // Find Profile Photo (greyish area in center, approx y=300 to 500, x=300 to 450)
  // Let's just find pixels that are not background
  let picTop = 1000, picLeft = 1000, picRight = 0, picBottom = 0;
  for (let y = 300; y < 550; y++) {
    for (let x = 300; x < 450; x++) {
      const p = getPixel(x, y);
      // Not background
      if (Math.abs(p.r - 251) > 30 || Math.abs(p.g - 252) > 30 || Math.abs(p.b - 236) > 30) {
        // Also avoid the laurels and text (Dr. Mahendran text is red)
        if (p.r > 200 && p.g < 100 && p.b < 100) continue; // Skip red text
        if (x < picLeft) picLeft = x;
        if (x > picRight) picRight = x;
        if (y < picTop) picTop = y;
        if (y > picBottom) picBottom = y;
      }
    }
  }
  console.log(`Profile Pic approx: Left=${picLeft}, Top=${picTop}, Right=${picRight}, Bottom=${picBottom}, Width=${picRight-picLeft}, Height=${picBottom-picTop}`);

}
analyze().catch(console.error);
