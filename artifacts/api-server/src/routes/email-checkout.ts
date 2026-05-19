import { Router } from "express";
import multer from "multer";
import nodemailer from "nodemailer";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { requireAuth, type AuthRequest } from "../middlewares/authMiddleware";

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.resolve(__dirname, "../../../uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

router.post("/", requireAuth, upload.single("screenshot"), async (req: AuthRequest, res) => {
  try {
    const { utr, items } = req.body;
    const screenshot = req.file;

    console.log("----------------- DEBUG PAYLOAD -----------------");
    console.log("UTR received:", utr);
    console.log("Items received:", items);
    console.log("Screenshot file info:", screenshot ? {
      fieldname: screenshot.fieldname,
      originalname: screenshot.originalname,
      mimetype: screenshot.mimetype,
      size: screenshot.size
    } : "UNDEFINED / NULL");
    console.log("Full req.body:", req.body);
    console.log("-------------------------------------------------");

    // We assume the user has set EMAIL_USER and EMAIL_PASS in their .env
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      return res.status(500).json({ error: "Email credentials not configured on the server. Please add EMAIL_USER and EMAIL_PASS to your .env file." });
    }

    const transporter = nodemailer.createTransport({
      service: "gmail", // default to gmail
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // Format items as a beautiful table list with modern padding and icons
    let formattedItemsList = "";
    try {
      const parsed = JSON.parse(items);
      if (Array.isArray(parsed)) {
        formattedItemsList = parsed.map(item => `
          <tr style="border-bottom: 1px solid #f1f1f4;">
            <td style="padding: 12px 16px; color: #1e1e30; font-weight: 600; font-size: 14px; text-align: left;">
              <span style="color: #7C3AED; margin-right: 8px;">✦</span> ${item}
            </td>
            <td style="padding: 12px 16px; text-align: right; color: #10b981; font-weight: 700; font-size: 13px;">
              Pre-Paid ✅
            </td>
          </tr>
        `).join("");
      } else {
        formattedItemsList = `
          <tr style="border-bottom: 1px solid #f1f1f4;">
            <td style="padding: 12px 16px; color: #1e1e30; font-weight: 600; font-size: 14px; text-align: left;">
              <span style="color: #7C3AED; margin-right: 8px;">✦</span> ${items}
            </td>
            <td style="padding: 12px 16px; text-align: right; color: #10b981; font-weight: 700; font-size: 13px;">
              Pre-Paid ✅
            </td>
          </tr>
        `;
      }
    } catch {
      formattedItemsList = `
        <tr style="border-bottom: 1px solid #f1f1f4;">
          <td style="padding: 12px 16px; color: #1e1e30; font-weight: 600; font-size: 14px; text-align: left;">
            <span style="color: #7C3AED; margin-right: 8px;">✦</span> ${items}
          </td>
          <td style="padding: 12px 16px; text-align: right; color: #10b981; font-weight: 700; font-size: 13px;">
            Pre-Paid ✅
          </td>
        </tr>
      `;
    }

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: process.env.EMAIL_USER, // sending to themselves
      subject: `New QR Checkout - UTR: ${utr}`,
      text: `A new checkout was completed via QR Code.\n\nUTR/Transaction ID: ${utr}\n\nItems: ${items}`,
      html: `
        <div style="background-color: #f3f4f6; padding: 40px 20px; font-family: 'Inter', system-ui, -apple-system, sans-serif; min-height: 100%;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.05); border: 1px solid #e5e7eb;">
            
            <!-- Branded Header Banner -->
            <div style="background-color: #7C3AED; padding: 32px 24px; text-align: center;">
              <div style="background-color: rgba(255, 255, 255, 0.15); display: inline-block; padding: 6px 14px; border-radius: 50px; margin-bottom: 12px;">
                <span style="color: #ffffff; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 1.5px;">Pending Verification</span>
              </div>
              <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px;">GIBIYI STORE ORDER</h1>
              <p style="color: #cbd5e1; margin: 5px 0 0 0; font-size: 13px;">Manual UPI Payment Confirmation Request</p>
            </div>

            <div style="padding: 28px 24px;">
              
              <!-- Transaction UTR Coupon Card -->
              <div style="background-color: #f8fafc; border: 1px dashed #cbd5e1; border-radius: 12px; padding: 20px; text-align: center; margin-bottom: 28px;">
                <span style="display: block; color: #64748b; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 6px;">UTR / TRANSACTION NUMBER</span>
                <strong style="font-family: monospace; font-size: 24px; color: #1e293b; letter-spacing: 1px;">${utr}</strong>
              </div>

              <!-- Items List Section -->
              <h3 style="color: #1e293b; font-size: 14px; font-weight: 800; margin: 0 0 12px 0; text-transform: uppercase; letter-spacing: 0.5px;">Items Ordered</h3>
              <table style="width: 100%; border-collapse: collapse; margin-bottom: 28px;">
                <thead>
                  <tr style="background-color: #f8fafc; border-bottom: 2px solid #e2e8f0;">
                    <th style="padding: 10px 16px; text-align: left; color: #64748b; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">Product Title</th>
                    <th style="padding: 10px 16px; text-align: right; color: #64748b; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">Payment Mode</th>
                  </tr>
                </thead>
                <tbody>
                  ${formattedItemsList}
                </tbody>
              </table>

              <!-- Screenshot Section -->
              <h3 style="color: #1e293b; font-size: 14px; font-weight: 800; margin: 0 0 12px 0; text-transform: uppercase; letter-spacing: 0.5px;">Proof of Payment Screenshot</h3>
              ${screenshot ? `
                <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; text-align: center;">
                  <div style="border-radius: 8px; overflow: hidden; display: inline-block; border: 1px solid #cbd5e1; box-shadow: 0 10px 30px rgba(0,0,0,0.06); background-color: #ffffff;">
                    <img src="cid:paymentscreenshot" style="max-width: 100%; max-height: 520px; vertical-align: middle; display: block;" />
                  </div>
                  <p style="margin: 12px 0 0 0; font-size: 11px; color: #94a3b8; font-weight: 500;">Filename: ${screenshot.originalname || "screenshot.png"}</p>
                </div>
              ` : `
                <div style="background-color: #fef2f2; border: 1px solid #fca5a5; border-radius: 12px; padding: 20px; text-align: center;">
                  <p style="color: #ef4444; font-size: 14px; font-weight: 600; margin: 0;">⚠️ No payment screenshot attachment was uploaded!</p>
                </div>
              `}
              
            </div>

            <!-- Footer Details -->
            <div style="background-color: #f8fafc; border-top: 1px solid #f1f5f9; padding: 24px 20px; text-align: center; color: #94a3b8; font-size: 12px;">
              <p style="margin: 0 0 6px 0; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px;">GIBIYI STORE API SERVICE</p>
              <p style="margin: 0; line-height: 1.5;">This is an automated notification. Please verify the UTR matches your merchant bank account statement before approving the digital delivery.</p>
            </div>

          </div>
        </div>
      `,
      attachments: screenshot ? [
        {
          filename: screenshot.originalname || "screenshot.png",
          content: screenshot.buffer,
          cid: "paymentscreenshot", // embeds the image directly using Content-ID (CID)
        }
      ] : [],
    };

    // Save screenshot to disk and return URL regardless of email success
    let screenshotUrl: string | null = null;
    if (screenshot) {
      const ext = path.extname(screenshot.originalname || ".jpg") || ".jpg";
      const filename = `screenshot_${Date.now()}_${Math.random().toString(36).slice(2, 8)}${ext}`;
      const filepath = path.join(uploadsDir, filename);
      fs.writeFileSync(filepath, screenshot.buffer);
      screenshotUrl = `/api/uploads/${filename}`;
    }

    try {
      await transporter.sendMail(mailOptions);
    } catch (emailError) {
      console.warn("Email sending failed (SMTP issue), order will still be saved:", emailError);
    }

    res.json({ success: true, message: "Processed successfully", screenshotUrl });
  } catch (error) {
    console.error("Error in checkout handler:", error);
    res.status(500).json({ error: "Failed to process checkout" });
  }
});

export default router;
