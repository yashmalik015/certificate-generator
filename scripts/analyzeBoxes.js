import { loadImage, createCanvas } from 'canvas';

async function analyze() {
  const imgPath = '/Users/yashmalik/.gemini/antigravity-ide/brain/2d09883f-1947-4bd3-9515-56d10d8983e9/.user_uploaded/media_1789544526959.jpg';
  const img = await loadImage(imgPath);
  
  const canvas = createCanvas(img.width, img.height);
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0);
  const imgData = ctx.getImageData(0, 0, img.width, img.height);
  const data = imgData.data;
  
  function getPixel(x, y) {
    const idx = (y * img.width + x) * 4;
    return { r: data[idx], g: data[idx+1], b: data[idx+2] };
  }

  // QR Code is roughly top right (x: 550-700, y: 50-200)
  // Let's find the first black pixel in that region
  let qrTop = 1000, qrLeft = 1000, qrRight = 0, qrBottom = 0;
  for (let y = 30; y < 150; y++) {
    for (let x = 500; x < 700; x++) {
      const p = getPixel(x, y);
      if (p.r < 50 && p.g < 50 && p.b < 50) { // blackish
        if (x < qrLeft) qrLeft = x;
        if (x > qrRight) qrRight = x;
        if (y < qrTop) qrTop = y;
        if (y > qrBottom) qrBottom = y;
      }
    }
  }
  console.log(`QR Code approx bounding box: Left=${qrLeft}, Top=${qrTop}, Right=${qrRight}, Bottom=${qrBottom}, Width=${qrRight-qrLeft}, Height=${qrBottom-qrTop}`);

  // Top Left text (CIN NO...) is roughly top left (x: 50-200, y: 50-150)
  let tlTop = 1000, tlLeft = 1000, tlBottom = 0;
  for (let y = 50; y < 150; y++) {
    for (let x = 50; x < 300; x++) {
      const p = getPixel(x, y);
      if (p.r < 50 && p.g < 50 && p.b < 50) { // blackish
        if (x < tlLeft) tlLeft = x;
        if (y < tlTop) tlTop = y;
        if (y > tlBottom) tlBottom = y;
      }
    }
  }
  console.log(`Top Left Text approx bounding box: Left=${tlLeft}, Top=${tlTop}, Bottom=${tlBottom}`);

  // Profile picture is in the middle (x: 200-500, y: 300-500)
  let picTop = 1000, picLeft = 1000, picRight = 0, picBottom = 0;
  for (let y = 320; y < 480; y++) {
    for (let x = 300; x < 420; x++) {
      const p = getPixel(x, y);
      if (Math.abs(p.r - 251) > 20 || Math.abs(p.g - 252) > 20 || Math.abs(p.b - 236) > 20) {
        if (x < picLeft) picLeft = x;
        if (x > picRight) picRight = x;
        if (y < picTop) picTop = y;
        if (y > picBottom) picBottom = y;
      }
    }
  }
  console.log(`Profile Pic approx bounding box: Left=${picLeft}, Top=${picTop}, Right=${picRight}, Bottom=${picBottom}, Width=${picRight-picLeft}, Height=${picBottom-picTop}`);

}
analyze().catch(console.error);
