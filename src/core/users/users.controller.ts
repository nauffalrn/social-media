import {
  BadRequestException,
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from './users.service';
import { AuthGuard } from 'src/libs/guards/authGuard';

@Controller()
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService
  ) {}

  @Post('sign-up')
  async signup(@Body() createUserDto: SignUpDto) {
    const result = await this.usersService.create(createUserDto);

    if (result.isLeft()) {
      throw new BadRequestException(result.error.message);
    }

    return {
      message: 'Pendaftaran berhasil, silakan cek email untuk verifikasi',
      user: result.value,
    };
  }

  @Post('sign-up/verification')
  async verifySignUp(@Body() verificationDto: SignUpVerificationDto) {
    try {
      const payload = this.jwtService.verify(verificationDto.verificationToken);
      if (payload.type !== 'verify' || payload.email !== verificationDto.email) {
        throw new BadRequestException('Token tidak valid');
      }
      await this.usersService.markEmailVerified(BigInt(payload.sub));
      return { message: 'Email berhasil diverifikasi' };
    } catch (err) {
      throw new BadRequestException('Token verifikasi tidak valid atau kedaluwarsa');
    }
  }

  @Post('sign-in')
  async login(@Body() loginDto: SignInDto) {
    const result = await this.usersService.login(loginDto);

    if (result.isLeft()) {
      throw new BadRequestException(result.error.message);
    }

    return {
      message: 'Login berhasil',
      user: result.value.user,
      accessToken: result.value.accessToken,
    };
  }

  @Get('users/:username')
  @UseGuards(AuthGuard)
  async getUserByUsername(@Request() req, @Param('username') username: string) {
    const result = await this.usersService.findByUsername(username);

    if (result.isLeft()) {
      throw new NotFoundException(result.error.message);
    }

    // Output sesuai gambar/DTO
    return {
      user: result.value,
    };
  }
}
