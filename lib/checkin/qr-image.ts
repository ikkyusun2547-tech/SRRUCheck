import QRCode from "qrcode";

export function generateQrPng(data: string): Promise<Buffer> {
  return QRCode.toBuffer(data, { type: "png", width: 512, margin: 2 });
}
