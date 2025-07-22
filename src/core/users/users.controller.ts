import {
  BadRequestException,
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ApiResponse } from '@nestjs/swagger';
import { AuthGuard } from 'src/libs/guards/authGuard';
import { createUserSchema } from './schemas/user.schema';
import { UpdateProfileDto } from './useCases/updateProfile/update-profile.dto';
import { UsersService } from './users.service';

@Controller()
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  @Post('sign-up')
  @ApiResponse({
    status: 200,
    description: 'Pendaftaran berhasil',
    content: {
      'application/json': {
        example: {
          message: 'Pendaftaran berhasil, silakan cek email untuk verifikasi',
          user: {
            id: '1',
            username: 'nauffal',
            email: 'nauffal@email.com',
            fullName: 'Nauffal',
            pictureUrl: 'https://cdn.example.com/avatar1.jpg',
          },
        },
      },
    },
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

  @Post('sign-up/verification')
  @ApiResponse({
    status: 200,
    description: 'Email berhasil diverifikasi',
    content: {
      'application/json': {
        example: {
          message: 'Email berhasil diverifikasi',
        },
      },
    },
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
    content: {
      'application/json': {
        example: {
          message: 'Login berhasil',
          user: {
            id: '1',
            username: 'nauffal',
            email: 'nauffal@email.com',
            fullName: 'Nauffal',
            pictureUrl: 'https://cdn.example.com/avatar1.jpg',
          },
          accessToken: 'jwt.token.here',
        },
      },
    },
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

  @ApiResponse({
    status: 200,
    description: 'Detail user',
    content: {
      'application/json': {
        example: {
          user: {
            id: '1',
            username: 'nauffal',
            email: 'nauffal@email.com',
            fullName: 'Nauffal',
            pictureUrl: 'https://cdn.example.com/avatar1.jpg',
            bio: 'Halo, saya Nauffal!',
          },
        },
      },
    },
  })
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

  @Get('users/verify')
  @ApiResponse({
    status: 200,
    description: 'Email berhasil diverifikasi',
    content: {
      'application/json': {
        example: {
          message: 'Email berhasil diverifikasi',
        },
      },
    },
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
    content: {
      'application/json': {
        example: {
          message: 'Profil berhasil diupdate',
          user: {
            id: '1',
            username: 'nauffal',
            email: 'nauffal@email.com',
            fullName: 'Nauffal',
            pictureUrl: 'https://cdn.example.com/avatar1.jpg',
            bio: 'Bio baru',
          },
        },
      },
    },
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
