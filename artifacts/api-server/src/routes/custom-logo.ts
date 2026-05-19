import { Router } from "express";
import { db } from "@workspace/db";
import { customLogoRequestsTable } from "@workspace/db/schema";
import nodemailer from "nodemailer";

const router = Router();

// Configure a mock or ethereal transport for demonstration since we don't have real credentials
const transporter = nodemailer.createTransport({
  host: 'smtp.ethereal.email',
  port: 587,
  auth: {
      user: 'tre.reichel24@ethereal.email',
      pass: 'C4dZ2r8G1gqV2rR5rM'
  }
});

router.post("/", async (req, res) => {
  try {
    const data = req.body;
    
    // Insert into database
    const [result] = await db.insert(customLogoRequestsTable).values({
      businessName: data.businessName,
      slogan: data.slogan || "",
      description: data.description,
      industry: data.industry,
      targetAudience: data.targetAudience,
      top3Things: JSON.stringify(data.top3Things),
      ideas: data.ideas || "",
      colors: data.colors,
      styles: JSON.stringify(data.styles),
      sliders: JSON.stringify(data.sliders),
      paymentId: data.paymentId,
      uploadLinks: JSON.stringify(data.uploadLinks || []),
    }).returning({ id: customLogoRequestsTable.id });

    // Send email
    const emailBody = `
      <h1>New Custom Logo Design Request</h1>
      <p><strong>Request ID:</strong> ${result.id}</p>
      <p><strong>Payment ID:</strong> ${data.paymentId}</p>
      <p><strong>Business Name:</strong> ${data.businessName}</p>
      <p><strong>Slogan:</strong> ${data.slogan || 'N/A'}</p>
      <p><strong>Description:</strong> ${data.description}</p>
      <p><strong>Industry:</strong> ${data.industry}</p>
      <p><strong>Target Audience:</strong> ${data.targetAudience}</p>
      <p><strong>Top 3 Things:</strong> ${data.top3Things.join(', ')}</p>
      <p><strong>Colors:</strong> ${data.colors}</p>
      <p><strong>Styles:</strong> ${data.styles.join(', ')}</p>
      <p><strong>Ideas/References:</strong> ${data.ideas || 'N/A'}</p>
      <h2>Sliders</h2>
      <ul>
        ${Object.entries(data.sliders).map(([key, value]) => `<li>${key}: ${value}%</li>`).join('')}
      </ul>
      <p><strong>Upload Links:</strong> ${data.uploadLinks ? data.uploadLinks.join(', ') : 'None'}</p>
    `;

    try {
      const info = await transporter.sendMail({
        from: '"Logo Store System" <system@logostore.local>',
        to: "yash.nagpure@prayaam.com",
        subject: "New Custom Logo Design Request",
        html: emailBody,
      });
      console.log("Email sent: %s", info.messageId);
      console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
    } catch (emailErr) {
      console.error("Failed to send email:", emailErr);
      // We still return success even if email fails, or handle it as needed
    }

    return res.status(201).json({
      success: true,
      message: "Request created successfully",
      id: result.id.toString(),
    });
  } catch (err: any) {
    console.error("Failed to create custom logo request:", err);
    return res.status(500).json({ error: "Failed to submit request", details: err.message });
  }
});

export default router;
