import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ApiResponse, PickType } from '@nestjs/swagger';
import { AuthGuard } from 'src/libs/guards/authGuard';
import { createUserSchema } from './schemas/user.schema';
import { UpdateProfileDto } from './useCases/updateProfile/update-profile.dto';
import { UsersService } from './users.service';
import { Sign, sign } from 'crypto';
import { SignUpDto } from './useCases/signUp/dto/sign-up.dto';
import { SignUpVerificationDto } from 'src/infrastructure/email/verificationEmail/dto/sign-up-verification.dto';
import { SignInDto } from './useCases/signIn/dto/sign-in.dto';
import { SignInResponseDto } from './useCases/signIn/dto/sign-in-response.dto';
import { get } from 'http';
import { GetProfileDto } from './useCases/checkProfile/dto/get-profile.dto';
import { GetProfileResponseDto } from './useCases/checkProfile/dto/get-profile-response.dto';

export class SignUpDtoBody extends PickType(SignUpDto, ['email', 'password']) {}
export class SignUpVerificationDtoBody extends PickType(SignUpVerificationDto, [
  'email',
  'verificationToken',
]) {}
export class SignInDtoBody extends PickType(SignInDto, ['email', 'password']) {}
export class SignInResponseDtoBody extends PickType(
  SignInResponseDto,
  ['accessToken'],
) {}
export class GetProfileDtoParams extends PickType(GetProfileDto, ['username']) {}
export class GetProfileDtoResponse extends PickType(GetProfileResponseDto, ['bio', 'fullName', 'username', 'pictureUrl', 'summaries', 'recentPosts']) {}
export class UpdateProfileDtoBody extends PickType(UpdateProfileDto, [
  'bio',
  'fullName',
  'username',
  'pictureUrl',
]) {}


@Controller()
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  @HttpCode(204)
  @Post('sign-up')
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

    const result = await this.usersService.create(createUserDto);

    if (result.isLeft()) {
      throw new BadRequestException(result.error.message);
    }

    return {
      message: 'Pendaftaran berhasil, silakan cek email untuk verifikasi',
      user: result.value,
    };
  }

  @HttpCode(204)
  @Post('sign-up/verification')
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
      await this.usersService.markEmailVerified(BigInt(payload.sub));
      return { message: 'Email berhasil diverifikasi' };
    } catch (err) {
      throw new BadRequestException(
        'Token verifikasi tidak valid atau kedaluwarsa',
      );
    }
  }

  @Post('sign-in')
  @ApiResponse({
    status: 200,
    description: 'Login berhasil',
    type: SignInResponseDtoBody,
  })
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
  @ApiResponse({
    status: 200,
    description: 'Detail user',
    type: GetProfileDtoResponse,
  })
  async getUserByUsername(@Request() req, @Param('username') username: string) {
    const result = await this.usersService.findByUsername(username);

    if (result.isLeft()) {
      throw new NotFoundException(result.error.message);
    }

    return {
      user: result.value,
    };
  }


  // development only
  @HttpCode(204)
  @Get('users/verify')
  @ApiResponse({
    status: 204,
    description: 'Email berhasil diverifikasi',
  })
  async verifyEmail(@Query('token') token: string) {
    // Verifikasi token langsung, tanpa AuthGuard
    try {
      const payload = this.jwtService.verify(token);
      if (payload.type !== 'verify') {
        throw new BadRequestException('Token tidak valid');
      }
      await this.usersService.markEmailVerified(BigInt(payload.sub));
      return { message: 'Email berhasil diverifikasi' };
    } catch (err) {
      throw new BadRequestException(
        'Token verifikasi tidak valid atau kedaluwarsa',
      );
    }
  }

  @Patch('users/profile')
  @UseGuards(AuthGuard)
  @ApiResponse({
    status: 200,
    description: 'Profil berhasil diupdate',
    type: UpdateProfileDtoBody,
  })
  async updateProfile(
    @Request() req,
    @Body() updateProfileDto: UpdateProfileDto,
  ) {
    // Ambil userId dari token
    const userId = BigInt(req.user.sub);

    // Update profile
    const result = await this.usersService.updateProfile(
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
