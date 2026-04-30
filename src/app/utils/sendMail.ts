// import { User } from '@prisma/client';
// import nodemailer from 'nodemailer';
// import config from '../../config';

// class Email {
//   private to: string;
//   private user: User;
//   private from: string;

//   constructor(user: User) {
//     this.user = user;
//     this.to = user.email || 'admin@gmail.com';
//     this.from = `Recite one <${config.mail}>`; // আপনার Gmail এখানে যাবে
//   }

//   private newTransport() {
//     return nodemailer.createTransport({
//       host: 'smtp.hostinger.com',
//       port: 465,
//       secure: true,
//       auth: {
//         user: process.env.MAIL, // আপনার Gmail address
//         pass: process.env.MAIL_PASS, // Gmail App Password
//       },
//     });
//   }

//   private async send(subject: string, html: string) {
//     const mailOptions = {
//       from: this.from,
//       to: this.to,
//       subject,
//       html,
//     };

//     try {
//       const result = await this.newTransport().sendMail(mailOptions);

//     } catch (error) {
//       console.error('❌ Failed to send email:', error);
//     }
//   }

//   async sendEmailVerificationLink(subject: string, link: string) {
//     const html = `
//       <div style="padding: 20px; background: #fff; font-family: Arial;">
//         <h2 style="color: #8dc63f;">Email Verification</h2>
//         <p>Click the link below to verify your email:</p>
//         <a href="${link}" style="display: inline-block; background: #000; color: #fff; padding: 10px 15px; border-radius: 4px;">VERIFY NOW</a>
//       </div>
//     `;
//     await this.send(subject, html);
//   }

//   async sendPasswordReset(OTP: string) {
//     const html = `
//       <div style="padding: 20px; background: #fff; font-family: Arial;">
//         <h2 style="color: #FF7600;">OTP Verification</h2>
//         <p>Your OTP is:</p>
//         <div style="font-size: 32px; font-weight: bold; color: #FF7600;">${OTP}</div>
//         <p>This OTP is valid for 5 minutes.</p>
//       </div>
//     `;
//     await this.send('Reset your password', html);
//   }

//   async sendContactMail(message: string) {
//     const html = `<p>${message}</p>`;
//     await this.send('Contact Message', html);
//   }

//   async sendCustomEmail(subject: string, message: string) {
//     const html = `<div><p>${message}</p></div>`;
//     await this.send(subject, html);
//   }

//   async sendWelcome() {
//     const html = `<h2>Welcome to FLIND!</h2><p>We’re glad to have you on board.</p>`;
//     await this.send('Welcome to FLIND', html);
//   }
// }

// export default Email;




import { User } from '@prisma/client';
import nodemailer from 'nodemailer';
import SMTPTransport from 'nodemailer/lib/smtp-transport';

class Email {
  private to: string;
  private user: User;
  private from: string;

  constructor(user: User) {
    this.user = user;
    this.to = user.email || 'admin@reciteone.com';
    this.from = `Recite One <${process.env.MAIL}>`;
  }

  // Nodemailer transport setup (Hostinger SMTP, TypeScript compatible)
  private newTransport() {
    const options: SMTPTransport.Options = {
      host: 'smtp.hostinger.com',
      port: 465,
      secure: true,
      auth: {
        user: process.env.MAIL,
        pass: process.env.MAIL_PASS,
      },
      tls: {
        rejectUnauthorized: true,
      },
    };

    return nodemailer.createTransport(options);
  }

  // Generic send function
  private async send(subject: string, html: string) {
    const mailOptions = {
      from: this.from,
      to: this.to,
      subject,
      html,
      text: html.replace(/<[^>]+>/g, ''), // plain text fallback
      headers: {
        'X-Mailer': 'ReciteOne Mailer',
        'X-Priority': '3',
        'List-Unsubscribe': `<mailto:${process.env.MAIL}>`,
      },
    };

    try {
      const result = await this.newTransport().sendMail(mailOptions);
      
    } catch (error: any) {
      console.error('❌ Email send failed:', error.message);
    }
  }

  // Email Verification
  async sendEmailVerificationLink(subject: string, link: string) {
    const html = `
      <div style="padding:20px;font-family:Arial,Helvetica,sans-serif;background:#f7f7f7;">
        <div style="max-width:600px;margin:auto;background:#fff;padding:30px;border-radius:10px;">
          <h2 style="color:#2C3E50;">Verify Your Email</h2>
          <p style="font-size:16px;">Click the button below to verify your email:</p>
          <a href="${link}" style="display:inline-block;background:#28a745;color:#fff;text-decoration:none;padding:10px 20px;border-radius:5px;">Verify Now</a>
          <p style="font-size:13px;color:#888;">If you didn’t request this, please ignore this email.</p>
        </div>
      </div>
    `;
    await this.send(subject, html);
  }

  // Password reset / OTP
  async sendPasswordReset(OTP: string) {
    const html = `
      <div style="padding:20px;font-family:Arial;background:#f7f7f7;">
        <div style="max-width:600px;margin:auto;background:#fff;padding:30px;border-radius:10px;">
          <h2 style="color:#FF7600;">OTP Verification</h2>
          <p>Your OTP code is:</p>
          <div style="font-size:32px;font-weight:bold;color:#FF7600;">${OTP}</div>
          <p>This OTP is valid for 5 minutes.</p>
        </div>
      </div>
    `;
    await this.send('ReciteOne - Password reset code', html);
  }

  // Contact message
  async sendContactMail(message: string) {
    const html = `
      <div style="padding:20px;background:#f7f7f7;">
        <div style="background:#fff;padding:20px;border-radius:10px;">
          <p>${message}</p>
        </div>
      </div>
    `;
    await this.send('ReciteOne - Contact Message', html);
  }

  // Custom email
  async sendCustomEmail(subject: string, message: string) {
    const html = `
      <div  style="padding:20px;background:#f7f7f7;" dir="rtl">
        <div  style="background:#fff;padding:20px;border-radius:10px; font-size:24px;">
          <div>${message}</div>
        </div>
      </div>
    `;
    await this.send(subject, html);
  }

  // Welcome email
  async sendWelcome() {
    const html = `
      <div style="padding:20px;background:#f7f7f7;">
        <div style="background:#fff;padding:20px;border-radius:10px;text-align:center;">
          <h2>Welcome to ReciteOne!</h2>
          <p>We’re glad to have you with us.</p>
        </div>
      </div>
    `;
    await this.send('Welcome to ReciteOne', html);
  }
}

export default Email;
