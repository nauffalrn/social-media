import { HttpService } from '@nestjs/axios';
import { ConsoleLogger, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { lastValueFrom } from 'rxjs';
import { EmailService } from 'src/infrastructure/email/email.service';
import { generateSnowflakeId } from 'src/infrastructure/snowflake/snowflake';
import { UploadsService } from 'src/infrastructure/storage/uploads.service';
import { Either, ErrorRegister, left, right } from 'src/libs/helpers/either';
import { UserRepository } from '../../repositories/user.repository';
import { SignUpDto } from './dto/sign-up.dto';

const SALT_ROUNDS = 10;

@Injectable()
export class SignUpUseCase {
  private readonly logger = new ConsoleLogger(SignUpUseCase.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly emailService: EmailService,
    private readonly httpService: HttpService,
    private readonly uploadsService: UploadsService,
    private readonly userRepository: UserRepository,
  ) {}

  async execute(
    createUserDto: SignUpDto,
  ): Promise<
    Either<
      ErrorRegister.EmailAlreadyRegistered | Error,
      { user: any; verificationToken: string }
    >
  > {
    try {
      const existingEmail = await this.userRepository.findByEmail(
        createUserDto.email,
      );
      if (existingEmail.length > 0) {
        return left(new ErrorRegister.EmailAlreadyRegistered());
      }

      const mainEmail = process.env.RESEND_MAIN_EMAIL;
      const isAutoVerified = createUserDto.email !== mainEmail;

      const emailId = generateSnowflakeId();
      await this.userRepository.insertEmail({
        id: emailId,
        value: createUserDto.email,
        verified_at: isAutoVerified ? new Date() : null,
      });

      const userId = generateSnowflakeId();
      const hashedPassword = await bcrypt.hash(
        createUserDto.password,
        SALT_ROUNDS,
      );
      await this.userRepository.insertUser({
        id: userId,
        email_id: emailId,
        password: hashedPassword,
      });

      const pictureUrl = await this.getRandomAvatarUrl();

      await this.userRepository.insertProfile({
        user_id: userId,
        full_name: '',
        bio: '',
        username: '',
        picture_url: pictureUrl,
        is_private: false,
      });

      let verifyToken: string | undefined = undefined;
      if (!isAutoVerified) {
        verifyToken = this.jwtService.sign(
          {
            sub: userId.toString(),
            email: createUserDto.email,
            type: 'verify',
          },
          { expiresIn: '24h' },
        );
        await this.emailService.sendVerificationEmail(
          createUserDto.email,
          verifyToken,
        );
      }

      return right({
        user: {
          id: userId.toString(),
          email: createUserDto.email,
          isEmailVerified: isAutoVerified,
          fullName: '',
          bio: '',
          username: '',
          pictureUrl,
          isPrivate: false,
        },
        verificationToken: verifyToken ?? '',
      });
    } catch (error) {
      this.logger.error(error);
      return left(new Error('Terjadi kesalahan, silahkan hubungi pihak kami.'));
    }
  }

  private async getRandomAvatarUrl(): Promise<string> {
    const url = 'https://xsgames.co/randomusers/avatar.php?g=pixel';
    try {
      const response = await lastValueFrom(
        this.httpService.get(url, { responseType: 'arraybuffer' }),
      );
      const buffer = Buffer.from(response.data);
      const uploadedUrl =
        await this.uploadsService.uploadToCloudinaryFromBuffer(
          buffer,
          'avatar.png',
        );
      return uploadedUrl;
    } catch (err) {
      this.logger.error(err);
      return url;
    }
  }
}
