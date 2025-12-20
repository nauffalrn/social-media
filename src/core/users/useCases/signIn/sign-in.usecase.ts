import { ConsoleLogger, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { Either, ErrorRegister, left, right } from 'src/libs/helpers/either';
import { UserRepository } from '../../repositories/user.repository';
import { SignInDto } from './dto/sign-in.dto';

@Injectable()
export class SignInUseCase {
  private readonly logger = new ConsoleLogger(SignInUseCase.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly userRepository: UserRepository,
  ) {}

  async execute(
    loginDto: SignInDto,
  ): Promise<
    Either<
      | ErrorRegister.UserNotFound
      | ErrorRegister.EmailNotVerified
      | ErrorRegister.InvalidPassword
      | Error,
      { user: any; accessToken: string }
    >
  > {
    try {
      const emailRecord = await this.userRepository.findByEmail(loginDto.email);
      if (emailRecord.length === 0) {
        return left(new ErrorRegister.UserNotFound());
      }
      const emailId = emailRecord[0].id;

      const userRecord = await this.userRepository.findUserByEmailId(emailId);
      if (userRecord.length === 0) {
        return left(new ErrorRegister.UserNotFound());
      }
      const userId = userRecord[0].id;

      const profileRecord =
        await this.userRepository.findProfileByUserId(userId);
      const profileData = profileRecord[0];

      const isPasswordValid = await bcrypt.compare(
        loginDto.password,
        userRecord[0].password,
      );
      if (!isPasswordValid) {
        return left(new ErrorRegister.InvalidPassword());
      }

      if (!emailRecord[0].verified_at) {
        return left(new ErrorRegister.EmailNotVerified());
      }

      const payload = {
        sub: userId.toString(),
        email: loginDto.email,
        username: profileData?.username || '',
      };
      const accessToken = this.jwtService.sign(payload);

      return right({
        user: {
          id: userId.toString(),
          email: loginDto.email,
          isEmailVerified: !!emailRecord[0].verified_at,
          fullName: profileData?.full_name || '',
          bio: profileData?.bio || '',
          username: profileData?.username || '',
          pictureUrl: profileData?.picture_url || '',
          isPrivate: profileData?.is_private ?? false,
        },
        accessToken,
      });
    } catch (error) {
      this.logger.error(error);
      return left(new Error('Terjadi kesalahan, silahkan hubungi pihak kami.'));
    }
  }
}
