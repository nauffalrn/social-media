import { ApiProperty } from '@nestjs/swagger';

export class SignUpVerificationDto {
  @ApiProperty()
  email: string;
  @ApiProperty()
  verificationToken: string;
}

export class SignUpVerificationResponseDto {}