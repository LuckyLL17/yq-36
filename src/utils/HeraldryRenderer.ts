import {
  HeraldryConfig,
  HERALDRY_BASE_COLORS,
  HERALDRY_COLOR_SCHEMES,
} from '@/types/castle';

export function renderHeraldryToCanvas(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  config: HeraldryConfig
) {
  const scheme = HERALDRY_COLOR_SCHEMES[config.colorScheme];
  const baseColor = HERALDRY_BASE_COLORS[config.baseColor];

  ctx.clearRect(0, 0, width, height);

  const cx = width / 2;
  const cy = height / 2;
  const shieldW = width * 0.75;
  const shieldH = height * 0.85;

  drawShieldShape(ctx, cx, cy, shieldW, shieldH, baseColor);
  drawBorder(ctx, cx, cy, shieldW, shieldH, config.borderStyle, scheme);
  drawCenterPattern(ctx, cx, cy, shieldW, shieldH, config.centerPattern, scheme);
}

function drawShieldShape(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number, w: number, h: number,
  fillColor: string
) {
  const top = cy - h / 2;
  const left = cx - w / 2;
  const right = cx + w / 2;
  const pointY = cy + h / 2 + h * 0.08;

  ctx.beginPath();
  ctx.moveTo(left, top);
  ctx.lineTo(right, top);
  ctx.lineTo(right, top + h * 0.55);
  ctx.quadraticCurveTo(right, top + h * 0.8, cx, pointY);
  ctx.quadraticCurveTo(left, top + h * 0.8, left, top + h * 0.55);
  ctx.closePath();

  const gradient = ctx.createLinearGradient(cx, top, cx, pointY);
  gradient.addColorStop(0, fillColor);
  gradient.addColorStop(0.7, fillColor);
  gradient.addColorStop(1, darkenColor(fillColor, 30));
  ctx.fillStyle = gradient;
  ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,0.3)';
  ctx.lineWidth = 2;
  ctx.stroke();
}

function drawBorder(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number, w: number, h: number,
  style: HeraldryConfig['borderStyle'],
  scheme: { primary: string; secondary: string; accent: string }
) {
  if (style === 'none') return;

  const top = cy - h / 2;
  const left = cx - w / 2;
  const pointY = cy + h / 2 + h * 0.08;
  const inset = w * 0.06;

  function shieldPath(offset: number) {
    const t = top + offset;
    const l = left + offset;
    const r = cx + w / 2 - offset;
    const b = cy + h / 2 - offset * 0.5;
    const pY = pointY - offset * 0.3;
    ctx.beginPath();
    ctx.moveTo(l, t);
    ctx.lineTo(r, t);
    ctx.lineTo(r, t + (b - t) * 0.7);
    ctx.quadraticCurveTo(r, t + (b - t) * 0.95, cx, pY);
    ctx.quadraticCurveTo(l, t + (b - t) * 0.95, l, t + (b - t) * 0.7);
    ctx.closePath();
  }

  ctx.strokeStyle = scheme.secondary;
  ctx.lineWidth = style === 'double' ? 3 : style === 'simple' ? 4 : 3;

  if (style === 'simple') {
    shieldPath(inset);
    ctx.stroke();
  } else if (style === 'double') {
    shieldPath(inset);
    ctx.stroke();
    shieldPath(inset + 6);
    ctx.stroke();
  } else if (style === 'indented') {
    shieldPath(inset);
    ctx.setLineDash([8, 4]);
    ctx.stroke();
    ctx.setLineDash([]);
  } else if (style === 'wavy') {
    shieldPath(inset);
    ctx.setLineDash([3, 6]);
    ctx.lineWidth = 5;
    ctx.stroke();
    ctx.setLineDash([]);
  } else if (style === 'lozengy') {
    shieldPath(inset);
    ctx.stroke();
    ctx.save();
    shieldPath(inset + 2);
    ctx.clip();
    ctx.strokeStyle = `${scheme.accent}60`;
    ctx.lineWidth = 1;
    const step = 14;
    for (let i = -h; i < w + h; i += step) {
      ctx.beginPath();
      ctx.moveTo(left + i, top);
      ctx.lineTo(left + i + h * 0.5, pointY);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(left + i, top);
      ctx.lineTo(left + i - h * 0.5, pointY);
      ctx.stroke();
    }
    ctx.restore();
  }
}

function drawCenterPattern(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number, w: number, h: number,
  pattern: HeraldryConfig['centerPattern'],
  scheme: { primary: string; secondary: string; accent: string }
) {
  const size = Math.min(w, h) * 0.35;
  const offsetY = h * 0.05;

  switch (pattern) {
    case 'lion': drawLion(ctx, cx, cy + offsetY, size, scheme); break;
    case 'eagle': drawEagle(ctx, cx, cy + offsetY, size, scheme); break;
    case 'cross': drawCross(ctx, cx, cy + offsetY, size, scheme); break;
    case 'fleur_de_lis': drawFleurDeLis(ctx, cx, cy + offsetY, size, scheme); break;
    case 'dragon': drawDragon(ctx, cx, cy + offsetY, size, scheme); break;
    case 'sword': drawSword(ctx, cx, cy + offsetY, size, scheme); break;
    case 'crown': drawCrown(ctx, cx, cy, size, scheme); break;
    case 'star': drawStar(ctx, cx, cy + offsetY, size, scheme); break;
  }
}

function drawLion(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number, scheme: { primary: string; secondary: string; accent: string }) {
  const s = size * 0.7;
  ctx.fillStyle = scheme.secondary;
  ctx.strokeStyle = scheme.accent;
  ctx.lineWidth = 1.5;

  ctx.beginPath();
  ctx.ellipse(cx, cy - s * 0.15, s * 0.35, s * 0.45, 0, 0, Math.PI * 2);
  ctx.fill(); ctx.stroke();

  ctx.beginPath();
  ctx.ellipse(cx - s * 0.25, cy - s * 0.55, s * 0.18, s * 0.22, -0.3, 0, Math.PI * 2);
  ctx.fill(); ctx.stroke();

  ctx.lineWidth = s * 0.08;
  ctx.strokeStyle = scheme.secondary;
  ctx.beginPath();
  ctx.moveTo(cx + s * 0.1, cy + s * 0.25);
  ctx.lineTo(cx + s * 0.15, cy + s * 0.7);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(cx - s * 0.35, cy - s * 0.1);
  ctx.lineTo(cx - s * 0.7, cy + s * 0.15);
  ctx.stroke();

  for (let i = 0; i < 5; i++) {
    const angle = -Math.PI / 2 + (i - 2) * 0.3;
    ctx.beginPath();
    ctx.moveTo(cx + s * 0.15, cy + s * 0.65);
    ctx.lineTo(cx + s * 0.15 + Math.cos(angle) * s * 0.2, cy + s * 0.65 + Math.sin(angle) * s * 0.2);
    ctx.lineWidth = s * 0.04;
    ctx.stroke();
  }
}

function drawEagle(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number, scheme: { primary: string; secondary: string; accent: string }) {
  const s = size * 0.7;
  ctx.fillStyle = scheme.secondary;
  ctx.strokeStyle = scheme.accent;
  ctx.lineWidth = 1.5;

  ctx.beginPath();
  ctx.ellipse(cx, cy, s * 0.2, s * 0.3, 0, 0, Math.PI * 2);
  ctx.fill(); ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(cx - s * 0.15, cy - s * 0.05);
  ctx.quadraticCurveTo(cx - s * 0.6, cy - s * 0.4, cx - s * 0.8, cy - s * 0.1);
  ctx.quadraticCurveTo(cx - s * 0.55, cy + s * 0.05, cx - s * 0.15, cy + s * 0.1);
  ctx.fill(); ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(cx + s * 0.15, cy - s * 0.05);
  ctx.quadraticCurveTo(cx + s * 0.6, cy - s * 0.4, cx + s * 0.8, cy - s * 0.1);
  ctx.quadraticCurveTo(cx + s * 0.55, cy + s * 0.05, cx + s * 0.15, cy + s * 0.1);
  ctx.fill(); ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(cx - s * 0.1, cy + s * 0.25);
  ctx.lineTo(cx - s * 0.3, cy + s * 0.7);
  ctx.lineTo(cx - s * 0.05, cy + s * 0.55);
  ctx.closePath();
  ctx.fill(); ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(cx + s * 0.1, cy + s * 0.25);
  ctx.lineTo(cx + s * 0.3, cy + s * 0.7);
  ctx.lineTo(cx + s * 0.05, cy + s * 0.55);
  ctx.closePath();
  ctx.fill(); ctx.stroke();
}

function drawCross(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number, scheme: { primary: string; secondary: string; accent: string }) {
  const s = size * 0.6;
  const arm = s * 0.25;
  ctx.fillStyle = scheme.secondary;
  ctx.strokeStyle = scheme.accent;
  ctx.lineWidth = 2;

  ctx.fillRect(cx - arm / 2, cy - s, arm, s * 2);
  ctx.strokeRect(cx - arm / 2, cy - s, arm, s * 2);
  ctx.fillRect(cx - s, cy - arm / 2, s * 2, arm);
  ctx.strokeRect(cx - s, cy - arm / 2, s * 2, arm);
}

function drawFleurDeLis(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number, scheme: { primary: string; secondary: string; accent: string }) {
  const s = size * 0.65;
  ctx.fillStyle = scheme.secondary;
  ctx.strokeStyle = scheme.accent;
  ctx.lineWidth = 1.5;

  ctx.beginPath();
  ctx.moveTo(cx, cy - s);
  ctx.quadraticCurveTo(cx + s * 0.12, cy - s * 0.6, cx + s * 0.05, cy - s * 0.2);
  ctx.quadraticCurveTo(cx + s * 0.4, cy - s * 0.7, cx + s * 0.55, cy - s * 0.3);
  ctx.quadraticCurveTo(cx + s * 0.45, cy - s * 0.1, cx + s * 0.15, cy);
  ctx.lineTo(cx + s * 0.3, cy + s * 0.5);
  ctx.quadraticCurveTo(cx, cy + s * 0.35, cx - s * 0.3, cy + s * 0.5);
  ctx.lineTo(cx - s * 0.15, cy);
  ctx.quadraticCurveTo(cx - s * 0.45, cy - s * 0.1, cx - s * 0.55, cy - s * 0.3);
  ctx.quadraticCurveTo(cx - s * 0.4, cy - s * 0.7, cx - s * 0.05, cy - s * 0.2);
  ctx.quadraticCurveTo(cx - s * 0.12, cy - s * 0.6, cx, cy - s);
  ctx.closePath();
  ctx.fill(); ctx.stroke();

  ctx.fillRect(cx - s * 0.06, cy + s * 0.35, s * 0.12, s * 0.3);
  ctx.strokeRect(cx - s * 0.06, cy + s * 0.35, s * 0.12, s * 0.3);
  ctx.fillRect(cx - s * 0.2, cy + s * 0.6, s * 0.4, s * 0.06);
  ctx.strokeRect(cx - s * 0.2, cy + s * 0.6, s * 0.4, s * 0.06);
}

function drawDragon(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number, scheme: { primary: string; secondary: string; accent: string }) {
  const s = size * 0.6;
  ctx.fillStyle = scheme.secondary;
  ctx.strokeStyle = scheme.accent;
  ctx.lineWidth = 1.5;

  ctx.beginPath();
  ctx.ellipse(cx, cy - s * 0.1, s * 0.25, s * 0.35, 0, 0, Math.PI * 2);
  ctx.fill(); ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(cx - s * 0.2, cy - s * 0.35);
  ctx.lineTo(cx - s * 0.35, cy - s * 0.7);
  ctx.lineTo(cx - s * 0.15, cy - s * 0.55);
  ctx.lineTo(cx - s * 0.3, cy - s * 0.85);
  ctx.lineTo(cx, cy - s * 0.55);
  ctx.lineTo(cx + s * 0.3, cy - s * 0.85);
  ctx.lineTo(cx + s * 0.15, cy - s * 0.55);
  ctx.lineTo(cx + s * 0.35, cy - s * 0.7);
  ctx.lineTo(cx + s * 0.2, cy - s * 0.35);
  ctx.closePath();
  ctx.fill(); ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(cx, cy + s * 0.2);
  ctx.quadraticCurveTo(cx + s * 0.15, cy + s * 0.5, cx + s * 0.6, cy + s * 0.35);
  ctx.quadraticCurveTo(cx + s * 0.5, cy + s * 0.6, cx + s * 0.7, cy + s * 0.5);
  ctx.lineWidth = s * 0.06;
  ctx.strokeStyle = scheme.secondary;
  ctx.stroke();
}

function drawSword(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number, scheme: { primary: string; secondary: string; accent: string }) {
  const s = size * 0.65;
  ctx.fillStyle = scheme.secondary;
  ctx.strokeStyle = scheme.accent;
  ctx.lineWidth = 1.5;

  ctx.beginPath();
  ctx.moveTo(cx, cy - s);
  ctx.lineTo(cx + s * 0.08, cy - s * 0.1);
  ctx.lineTo(cx - s * 0.08, cy - s * 0.1);
  ctx.closePath();
  ctx.fill(); ctx.stroke();

  ctx.fillRect(cx - s * 0.03, cy - s * 0.1, s * 0.06, s * 0.5);
  ctx.strokeRect(cx - s * 0.03, cy - s * 0.1, s * 0.06, s * 0.5);

  ctx.beginPath();
  ctx.moveTo(cx - s * 0.25, cy + s * 0.35);
  ctx.lineTo(cx + s * 0.25, cy + s * 0.35);
  ctx.lineWidth = s * 0.06;
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(cx, cy + s * 0.4);
  ctx.lineTo(cx, cy + s * 0.7);
  ctx.lineWidth = s * 0.08;
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(cx, cy + s * 0.75, s * 0.06, 0, Math.PI * 2);
  ctx.fill();
}

function drawCrown(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number, scheme: { primary: string; secondary: string; accent: string }) {
  const s = size * 0.6;
  ctx.fillStyle = scheme.secondary;
  ctx.strokeStyle = scheme.accent;
  ctx.lineWidth = 1.5;

  ctx.beginPath();
  ctx.moveTo(cx - s * 0.5, cy + s * 0.2);
  ctx.lineTo(cx - s * 0.5, cy - s * 0.1);
  ctx.lineTo(cx - s * 0.3, cy + s * 0.1);
  ctx.lineTo(cx - s * 0.15, cy - s * 0.3);
  ctx.lineTo(cx, cy + s * 0.05);
  ctx.lineTo(cx + s * 0.15, cy - s * 0.3);
  ctx.lineTo(cx + s * 0.3, cy + s * 0.1);
  ctx.lineTo(cx + s * 0.5, cy - s * 0.1);
  ctx.lineTo(cx + s * 0.5, cy + s * 0.2);
  ctx.closePath();
  ctx.fill(); ctx.stroke();

  const gemPositions = [
    [cx - s * 0.3, cy - s * 0.05],
    [cx, cy + s * 0.05],
    [cx + s * 0.3, cy - s * 0.05],
  ];
  gemPositions.forEach(([gx, gy]) => {
    ctx.beginPath();
    ctx.arc(gx, gy, s * 0.06, 0, Math.PI * 2);
    ctx.fillStyle = scheme.primary;
    ctx.fill();
    ctx.strokeStyle = scheme.accent;
    ctx.stroke();
  });

  ctx.fillStyle = scheme.secondary;
  ctx.fillRect(cx - s * 0.5, cy + s * 0.2, s, s * 0.1);
  ctx.strokeRect(cx - s * 0.5, cy + s * 0.2, s, s * 0.1);
}

function drawStar(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number, scheme: { primary: string; secondary: string; accent: string }) {
  const s = size * 0.6;
  const points = 5;
  const outerR = s;
  const innerR = s * 0.4;

  ctx.fillStyle = scheme.secondary;
  ctx.strokeStyle = scheme.accent;
  ctx.lineWidth = 2;

  ctx.beginPath();
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? outerR : innerR;
    const angle = (i / (points * 2)) * Math.PI * 2 - Math.PI / 2;
    const x = cx + Math.cos(angle) * r;
    const y = cy + Math.sin(angle) * r;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fill(); ctx.stroke();
}

function darkenColor(hex: string, amount: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const r = Math.max(0, (num >> 16) - amount);
  const g = Math.max(0, ((num >> 8) & 0x00ff) - amount);
  const b = Math.max(0, (num & 0x0000ff) - amount);
  return `#${(r << 16 | g << 8 | b).toString(16).padStart(6, '0')}`;
}
