import { Module } from '@nestjs/common';
import { SmsService } from './sms.service';
import { Twilio } from 'twilio';

@Module({
      controllers: [],
      providers: [SmsService, { provide: Twilio, useFactory: () => new Twilio(process.env.TWILIO_API_ID, process.env.TWILIO_API_SECRET) }],
      exports: [SmsService, Twilio],
})
export class SmsModule {}