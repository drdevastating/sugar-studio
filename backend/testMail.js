const nodemailer = require("nodemailer");
require("dotenv").config();

// Create transporter
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Verify SMTP
transporter.verify((error) => {
  if (error) {
    console.error("❌ SMTP CONNECTION FAILED");
    console.error(error);
  } else {
    console.log("✅ SMTP SERVER IS READY");
  }
});

async function sendTestMail() {
  try {
    const info = await transporter.sendMail({
      from: `"Bakery Test" <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_USER,
      subject: "Nodemailer Test Successful ✅",
      text: "If you received this email, Nodemailer is working correctly.",
      html: "<h2>Nodemailer Test Successful ✅</h2><p>Your mail service is working.</p>"
    });

    console.log("📨 Message sent:", info.messageId);
  } catch (err) {
    console.error("❌ EMAIL SEND FAILED");
    console.error(err);
  }
}

sendTestMail();
