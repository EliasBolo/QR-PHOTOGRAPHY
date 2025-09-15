import QRCode from "qrcode"

export async function generateQRCode(data: string): Promise<string> {
  try {
    return await QRCode.toString(data, {
      type: "svg",
      margin: 1,
      color: {
        dark: "#000000",
        light: "#ffffff",
      },
    })
  } catch (err) {
    console.error("Error generating QR code:", err)
    throw new Error("Failed to generate QR code")
  }
}
