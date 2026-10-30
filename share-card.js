import qrcode from "./vendor/qrcode-generator.js";

const colors = { paper: "#f4f1e9", navy: "#17263a", mint: "#bdebd9", muted: "#607184", blue: "#5b82ff", white: "#fffdf8" };

function roundedRect(context, x, y, width, height, radius, fill) {
  context.beginPath();
  context.roundRect(x, y, width, height, radius);
  context.fillStyle = fill;
  context.fill();
}

function wrapText(context, value, x, y, maxWidth, lineHeight, maxLines = 3) {
  const lines = [];
  let line = "";
  for (const character of Array.from(value)) {
    const candidate = line + character;
    if (line && context.measureText(candidate).width > maxWidth) {
      lines.push(line);
      line = character;
    } else line = candidate;
  }
  if (line) lines.push(line);
  const visible = lines.slice(0, maxLines);
  if (lines.length > maxLines) visible[maxLines - 1] = `${visible[maxLines - 1].slice(0, -1)}…`;
  visible.forEach((text, index) => context.fillText(text, x, y + index * lineHeight));
  return visible.length;
}

function drawQr(context, value, x, y, size) {
  const code = qrcode(0, "M");
  code.addData(value, "Byte");
  code.make();
  const cells = code.getModuleCount();
  const quiet = 4;
  const scale = Math.floor(size / (cells + quiet * 2));
  const offset = Math.floor((size - scale * (cells + quiet * 2)) / 2);
  context.fillStyle = colors.white;
  context.fillRect(x, y, size, size);
  context.fillStyle = colors.navy;
  for (let row = 0; row < cells; row += 1) {
    for (let column = 0; column < cells; column += 1) {
      if (code.isDark(row, column)) {
        context.fillRect(x + offset + (column + quiet) * scale, y + offset + (row + quiet) * scale, scale, scale);
      }
    }
  }
}

function drawMetric(context, label, value, x, y, width) {
  context.fillStyle = colors.navy;
  context.font = '700 26px "Microsoft YaHei", sans-serif';
  context.textAlign = "left";
  context.fillText(label, x, y);
  context.textAlign = "right";
  context.fillStyle = colors.blue;
  context.font = "600 23px Arial, sans-serif";
  context.fillText(String(value), x + width, y);
  roundedRect(context, x, y + 19, width, 10, 5, "#e8e2d6");
  roundedRect(context, x, y + 19, width * value / 100, 10, 5, colors.blue);
}

export function buildShareCard(result, url) {
  const canvas = document.createElement("canvas");
  canvas.width = 1080;
  canvas.height = 1440;
  const context = canvas.getContext("2d");

  context.fillStyle = colors.paper;
  context.fillRect(0, 0, canvas.width, canvas.height);
  roundedRect(context, 48, 48, 984, 1344, 32, colors.navy);

  context.save();
  context.strokeStyle = "rgba(189, 235, 217, 0.12)";
  context.lineWidth = 2;
  for (const radius of [105, 155, 205]) {
    context.beginPath();
    context.arc(1000, 160, radius, 0, Math.PI * 2);
    context.stroke();
  }
  context.restore();

  context.textAlign = "left";
  context.fillStyle = colors.mint;
  context.font = '700 23px "Microsoft YaHei", sans-serif';
  context.fillText("科研潜力实验室", 112, 126);
  context.textAlign = "right";
  context.fillStyle = "rgba(255, 255, 255, .55)";
  context.font = "500 18px Arial, sans-serif";
  context.fillText("RESEARCH POTENTIAL LAB", 972, 126);
  context.fillStyle = "rgba(255, 255, 255, .2)";
  context.fillRect(112, 160, 856, 1);

  context.textAlign = "center";
  context.strokeStyle = colors.mint;
  context.lineWidth = 2;
  context.beginPath();
  context.arc(540, 270, 53, 0, Math.PI * 2);
  context.stroke();
  context.fillStyle = colors.mint;
  context.font = '700 48px "Microsoft YaHei", sans-serif';
  context.fillText(result.badge, 540, 286);

  context.fillStyle = "rgba(255, 255, 255, .6)";
  context.font = '500 23px "Microsoft YaHei", sans-serif';
  context.fillText("我的科研人格是", 540, 382);
  context.fillStyle = colors.mint;
  context.font = `800 ${Array.from(result.name).length > 12 ? 61 : 72}px "Microsoft YaHei", sans-serif`;
  const nameLines = wrapText(context, result.name, 540, 474, 840, 88, 2);

  context.fillStyle = "rgba(255, 255, 255, .77)";
  context.font = '500 28px "Microsoft YaHei", sans-serif';
  const commentY = 474 + nameLines * 88 + 10;
  wrapText(context, result.comment, 540, commentY, 800, 44, 2);

  roundedRect(context, 112, 690, 856, 152, "#213650");
  context.textAlign = "left";
  context.fillStyle = "rgba(255, 255, 255, .64)";
  context.font = '500 21px "Microsoft YaHei", sans-serif';
  context.fillText("综合科研指数", 148, 740);
  context.fillStyle = colors.white;
  context.font = "700 70px Arial, sans-serif";
  context.fillText(String(result.score), 148, 818);
  context.fillStyle = "rgba(255, 255, 255, .55)";
  context.font = "500 24px Arial, sans-serif";
  context.fillText("/ 100", 264, 818);
  roundedRect(context, 400, 766, 520, 12, 6, "#43536a");
  roundedRect(context, 400, 766, 520 * result.score / 100, 12, 6, colors.mint);
  context.fillStyle = colors.mint;
  context.font = '700 21px "Microsoft YaHei", sans-serif';
  context.fillText("科研指数", 400, 738);

  drawMetric(context, "创新性", result.metrics.innovation, 142, 924, 360);
  drawMetric(context, "前沿性", result.metrics.frontier, 578, 924, 360);
  drawMetric(context, "可行性", result.metrics.feasibility, 142, 1028, 360);
  drawMetric(context, "抗导师打击", result.metrics.resilience, 578, 1028, 360);

  roundedRect(context, 112, 1150, 856, 190, colors.white);
  drawQr(context, url, 124, 1155, 180);
  context.textAlign = "left";
  context.fillStyle = colors.navy;
  context.font = '700 27px "Microsoft YaHei", sans-serif';
  context.fillText("扫码测测你的科研人格", 330, 1204);
  context.fillStyle = colors.muted;
  context.font = "500 21px Arial, sans-serif";
  context.fillText("diginto112.github.io", 330, 1245);
  context.fillText("/research-potential-lab", 330, 1277);
  context.fillStyle = colors.blue;
  context.font = '600 20px "Microsoft YaHei", sans-serif';
  context.fillText("转给你的科研搭子，看看谁更抽象", 330, 1311);

  return new Promise((resolve, reject) => canvas.toBlob((blob) => {
    if (blob) resolve(blob);
    else reject(new Error("Could not encode the share card"));
  }, "image/png"));
}
