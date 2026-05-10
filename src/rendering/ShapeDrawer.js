/**
 * ShapeDrawer — shared utility for drawing Mini Metro station/passenger shapes.
 * Uses Phaser Graphics API. Draws shapes centered at (0,0) in local space.
 */

/**
 * Draw a shape onto a Phaser Graphics object, centered at (0,0).
 * @param {Phaser.GameObjects.Graphics} graphics
 * @param {number} size - radius/half-size of the shape
 * @param {string} shape - shape name
 * @param {number} fillColor - hex color
 * @param {number} strokeColor - hex color
 * @param {number} strokeWidth
 */
export function drawShape(graphics, size, shape, fillColor, strokeColor = 0x333333, strokeWidth = 2) {
  graphics.clear();
  graphics.fillStyle(fillColor);
  graphics.lineStyle(strokeWidth, strokeColor);

  switch (shape) {
    case 'circle':
      graphics.fillCircle(0, 0, size);
      graphics.strokeCircle(0, 0, size);
      break;

    case 'square':
      graphics.fillRect(-size, -size, size * 2, size * 2);
      graphics.strokeRect(-size, -size, size * 2, size * 2);
      break;

    case 'triangle': {
      const h = size * 1.15;
      graphics.beginPath();
      graphics.moveTo(0, -h);
      graphics.lineTo(-size, h * 0.7);
      graphics.lineTo(size, h * 0.7);
      graphics.closePath();
      graphics.fillPath();
      graphics.strokePath();
      break;
    }

    case 'diamond':
      graphics.beginPath();
      graphics.moveTo(0, -size);
      graphics.lineTo(size, 0);
      graphics.lineTo(0, size);
      graphics.lineTo(-size, 0);
      graphics.closePath();
      graphics.fillPath();
      graphics.strokePath();
      break;

    case 'pentagon': {
      graphics.beginPath();
      for (let i = 0; i < 5; i++) {
        const a = (i * 2 * Math.PI) / 5 - Math.PI / 2;
        const px = size * Math.cos(a);
        const py = size * Math.sin(a);
        if (i === 0) graphics.moveTo(px, py);
        else graphics.lineTo(px, py);
      }
      graphics.closePath();
      graphics.fillPath();
      graphics.strokePath();
      break;
    }

    case 'hexagon': {
      graphics.beginPath();
      for (let i = 0; i < 6; i++) {
        const a = (i * Math.PI) / 3;
        const px = size * Math.cos(a);
        const py = size * Math.sin(a);
        if (i === 0) graphics.moveTo(px, py);
        else graphics.lineTo(px, py);
      }
      graphics.closePath();
      graphics.fillPath();
      graphics.strokePath();
      break;
    }

    case 'star': {
      graphics.beginPath();
      for (let i = 0; i < 10; i++) {
        const a = (i * Math.PI) / 5 - Math.PI / 2;
        const r = i % 2 === 0 ? size : size * 0.45;
        const px = r * Math.cos(a);
        const py = r * Math.sin(a);
        if (i === 0) graphics.moveTo(px, py);
        else graphics.lineTo(px, py);
      }
      graphics.closePath();
      graphics.fillPath();
      graphics.strokePath();
      break;
    }

    case 'cross': {
      const w = size * 0.35;
      graphics.beginPath();
      graphics.moveTo(-w, -size);
      graphics.lineTo(w, -size);
      graphics.lineTo(w, -w);
      graphics.lineTo(size, -w);
      graphics.lineTo(size, w);
      graphics.lineTo(w, w);
      graphics.lineTo(w, size);
      graphics.lineTo(-w, size);
      graphics.lineTo(-w, w);
      graphics.lineTo(-size, w);
      graphics.lineTo(-size, -w);
      graphics.lineTo(-w, -w);
      graphics.closePath();
      graphics.fillPath();
      graphics.strokePath();
      break;
    }

    default:
      graphics.fillCircle(0, 0, size);
      graphics.strokeCircle(0, 0, size);
  }
}
