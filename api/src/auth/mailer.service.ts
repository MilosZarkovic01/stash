import { Injectable, Logger } from '@nestjs/common';
import nodemailer from 'nodemailer';

@Injectable()
export class MailerService {
  private readonly logger = new Logger(MailerService.name);
  private readonly smtp: {
    sendMail: (mail: Record<string, string>) => Promise<unknown>;
  } | null;

  constructor() {
    if ((process.env.MAIL_TRANSPORT ?? 'console') === 'smtp') {
      this.smtp = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT ?? 587),
        secure: process.env.SMTP_SECURE === 'true',
        auth:
          process.env.SMTP_USER && process.env.SMTP_PASS
            ? {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
              }
            : undefined,
      });
    } else {
      this.smtp = null;
    }
  }

  async send(to: string, subject: string, text: string): Promise<void> {
    const from = process.env.MAIL_FROM ?? 'stash@localhost';
    if (!this.smtp) {
      this.logger.log(`[console mail] to=${to} subject=${subject}\n${text}`);
      return;
    }
    await this.smtp.sendMail({ from, to, subject, text });
  }
}
