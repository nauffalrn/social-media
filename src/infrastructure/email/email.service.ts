import { ConsoleLogger, Injectable } from '@nestjs/common';
import { Resend } from 'resend';
import { appSchema } from 'src/app.module';
import z from 'zod';
import { EnvVariable } from '../env/envService';

@Injectable()
export class EmailService {
  private readonly logger = new ConsoleLogger(EmailService.name);
  private readonly resend: Resend;


  constructor(private readonly env: EnvVariable<z.infer<typeof appSchema>>) {
    const apiKey = this.env.get('RESEND_API_KEY');
    this.resend = new Resend(apiKey);
  }

  async sendVerificationEmail(to: string, token: string) {
    const verifyUrl = `http://localhost:3000/users/verify?token=${token}`;
    const { error } = await this.resend.emails.send({
      from: 'SimpleInstagram <noreply@resend.dev>',
      to: [to],
      subject: 'Verifikasi Email Anda',
      html: `<p>Silakan klik link berikut untuk verifikasi email:</p>
             <a href="${verifyUrl}">${verifyUrl}</a>`,
    });
    if (error) {
      this.logger.error('Resend error:', error);
      return false;
    }
    return true;
  }
}
