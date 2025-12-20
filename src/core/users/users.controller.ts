import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  InternalServerErrorException,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ApiBody, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { SignUpVerificationDto } from 'src/infrastructure/email/verificationEmail/dto/sign-up-verification.dto';
import { AuthGuard } from 'src/libs/guards/authGuard';
import { UserRepository } from './repositories/user.repository';
import { createUserSchema } from './schemas/user.schema';
import { GetProfileResponseDto } from './useCases/checkProfile/dto/get-profile.dto';
import { GetProfileUseCase } from './useCases/checkProfile/get-profile.usecase';
import {
  SignInDto,
  SignInResponseDto,
} from './useCases/signIn/dto/sign-in.dto';
import { SignInUseCase } from './useCases/signIn/sign-in.usecase';
import { SignUpDto } from './useCases/signUp/dto/sign-up.dto';
import { SignUpUseCase } from './useCases/signUp/sign-up.usecase';
import { UpdateProfileDto } from './useCases/updateProfile/dto/update-profile.dto';
import { UpdateProfileUseCase } from './useCases/updateProfile/update-profile.usecase';

@Controller()
export class UsersController {
  constructor(
    private readonly signUpUseCase: SignUpUseCase,
    private readonly signInUseCase: SignInUseCase,
    private readonly getProfileUseCase: GetProfileUseCase,
    private readonly updateProfileUseCase: UpdateProfileUseCase,
    private readonly jwtService: JwtService,
    private readonly userRepository: UserRepository,
  ) {}

  @HttpCode(204)
  @Post('sign-up')
  @ApiBody({ type: SignUpDto })
  @ApiResponse({
    status: 204,
    description: 'Pendaftaran berhasil, silakan cek email untuk verifikasi',
  })
  async signup(@Body() createUserDto: SignUpDto) {
    const parseResult = createUserSchema.safeParse(createUserDto);
    if (!parseResult.success) {
      throw new BadRequestException(
        parseResult.error.issues.map((e) => e.message).join(', '),
      );
    }
    const result = await this.signUpUseCase.execute(createUserDto);
    if (result.isLeft()) {
      throw new BadRequestException(result.error.message);
    }
    return {
      message: 'Pendaftaran berhasil, silakan cek email untuk verifikasi',
      user: result.value.user,
      verificationToken: result.value.verificationToken,
    };
  }

  @HttpCode(204)
  @Post('sign-up/verification')
  @ApiBody({ type: SignUpVerificationDto })
  @ApiResponse({
    status: 204,
    description: 'Email berhasil diverifikasi',
  })
  async verifySignUp(@Body() verificationDto: SignUpVerificationDto) {
    try {
      const payload = this.jwtService.verify(verificationDto.verificationToken);
      if (
        payload.type !== 'verify' ||
        payload.email !== verificationDto.email
      ) {
        throw new BadRequestException('Token tidak valid');
      }
      await this.userRepository.updateEmailVerified(
        BigInt(payload.sub),
        new Date(),
      );
      return { message: 'Email berhasil diverifikasi' };
    } catch (err) {
      throw new BadRequestException(
        'Token verifikasi tidak valid atau kedaluwarsa',
      );
    }
  }

  @Post('sign-in')
  @ApiBody({ type: SignInDto })
  @ApiResponse({
    status: 200,
    description: 'Login berhasil',
    type: SignInResponseDto,
  })
  async login(@Body() loginDto: SignInDto) {
    const result = await this.signInUseCase.execute(loginDto);
    if (result.isLeft()) {
      const error = result.error;
      switch (error.name) {
        case 'InputanSalah':
          throw new NotFoundException(error.message);
        case 'UserNotFound':
          throw new NotFoundException('Pengguna tidak ditemukan');
        case 'EmailNotVerified':
          throw new BadRequestException('Email belum diverifikasi');
        case 'InvalidPassword':
          throw new BadRequestException('Kata sandi salah');
        default:
          throw new InternalServerErrorException(
            'Terjadi kesalahan, silahkan hubungi pihak kami.',
          );
      }
    }
    return {
      message: 'Login berhasil',
      user: result.value.user,
      accessToken: result.value.accessToken,
    };
  }

  @Get('users/:username')
  @ApiResponse({
    status: 200,
    description: 'Detail user',
    type: GetProfileResponseDto,
  })
  async getUserByUsername(@Param('username') username: string) {
    const result = await this.getProfileUseCase.execute(username);
    if (result.isLeft()) {
      throw new NotFoundException(result.error.message);
    }
    return {
      user: result.value,
    };
  }

  @HttpCode(204)
  @Get('users/verify')
  @ApiQuery({ name: 'token', required: true })
  @ApiResponse({
    status: 204,
    description: 'Email berhasil diverifikasi',
  })
  async verifyEmail(@Query('token') token: string) {
    try {
      const payload = this.jwtService.verify(token);
      if (payload.type !== 'verify') {
        throw new BadRequestException('Token tidak valid');
      }
      await this.userRepository.updateEmailVerified(
        BigInt(payload.sub),
        new Date(),
      );
      return { message: 'Email berhasil diverifikasi' };
    } catch (err) {
      throw new BadRequestException(
        'Token verifikasi tidak valid atau kedaluwarsa',
      );
    }
  }

  @Patch('users/profile')
  @UseGuards(AuthGuard)
  @ApiBody({ type: UpdateProfileDto })
  @ApiResponse({
    status: 200,
    description: 'Profil berhasil diupdate',
    type: UpdateProfileDto,
  })
  async updateProfile(
    @Request() req,
    @Body() updateProfileDto: UpdateProfileDto,
  ) {
    const userId = BigInt(req.user.sub);
    const result = await this.updateProfileUseCase.execute(
      userId,
      updateProfileDto,
    );
    if (result.isLeft()) {
      throw new BadRequestException(result.error.message);
    }
    return {
      message: 'Profil berhasil diupdate',
      user: result.value,
    };
  }
}
