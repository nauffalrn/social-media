import { HttpService } from '@nestjs/axios';
import { ConsoleLogger, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { lastValueFrom } from 'rxjs';
import { EmailService } from 'src/infrastructure/email/email.service';
import { generateSnowflakeId } from 'src/infrastructure/snowflake/snowflake';
import { UploadsService } from 'src/infrastructure/storage/uploads.service';
import { Either, ErrorRegister, left, right } from 'src/libs/helpers/either';
import { FollowRepository } from '../follows/repositories/follow.repository';
import { User } from './entities/user.entity';
import { UserRepository } from './repositories/user.repository';
import { GetProfileResponseDto } from './useCases/checkProfile/dto/get-profile-response.dto';
import { SignInDto } from './useCases/signIn/dto/sign-in.dto';
import { SignUpDto } from './useCases/signUp/dto/sign-up.dto';
import { UpdateProfileDto } from './useCases/updateProfile/update-profile.dto';

const SALT_ROUNDS = 10;

// Type definitions untuk hasil service
type CreateUserResult = Either<
  ErrorRegister.EmailAlreadyRegistered | ErrorRegister.InputanSalah,
  { user: Omit<User, 'password'>; verificationToken: string }
>;

type LoginResult = Either<
  | ErrorRegister.UserNotFound
  | ErrorRegister.EmailNotVerified
  | ErrorRegister.InvalidPassword
  | ErrorRegister.InputanSalah,
  { user: Omit<User, 'password'>; accessToken: string }
>;

type UpdateProfileResult = Either<
  ErrorRegister.UserNotFound | ErrorRegister.InputanSalah,
  Omit<User, 'password'>
>;
type FindUserResult = Either<ErrorRegister.UserNotFound, GetProfileResponseDto>;
type CanViewProfileResult = Either<ErrorRegister.UserNotFound, boolean>;

@Injectable()
export class UsersService {
  private readonly logger = new ConsoleLogger(UsersService.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly emailService: EmailService,
    private readonly httpService: HttpService,
    private readonly uploadsService: UploadsService,
    private readonly userRepository: UserRepository,
    private readonly followRepository: FollowRepository,
  ) {}

  async create(createUserDto: SignUpDto): Promise<CreateUserResult> {
    try {
      // Cek email sudah ada
      const existingEmail = await this.userRepository.findByEmail(
        createUserDto.email,
      );
      if (existingEmail.length > 0) {
        return left(new ErrorRegister.EmailAlreadyRegistered());
      }

      // Ambil email utama dari env
      const mainEmail = process.env.RESEND_MAIN_EMAIL;
      const isAutoVerified = createUserDto.email !== mainEmail;

      // Insert email
      const emailId = generateSnowflakeId();
      await this.userRepository.insertEmail({
        id: emailId,
        value: createUserDto.email,
        verified_at: isAutoVerified ? new Date() : null,
      });

      // Insert user
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

      // Insert profile
      await this.userRepository.insertProfile({
        user_id: userId,
        full_name: '',
        bio: '',
        username: '',
        picture_url: await this.getRandomAvatarUrl(),
        is_private: false,
      });

      let verifyToken: string | undefined = undefined;
      if (!isAutoVerified) {
        // Generate token verifikasi
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
          pictureUrl: '',
          isPrivate: false,
        },
        verificationToken: verifyToken ?? '',
      });
    } catch (error) {
      this.logger.error(error);
      return left(new Error('Terjadi kesalahan, silahkan hubungi pihak kami.'));
    }
  }

  async login(loginDto: SignInDto): Promise<LoginResult> {
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

  async updateProfile(
    userId: bigint,
    updateProfileDto: UpdateProfileDto,
  ): Promise<UpdateProfileResult> {
    try {
      await this.userRepository.updateProfile(userId, {
        full_name: updateProfileDto.fullName,
        bio: updateProfileDto.bio,
        username: updateProfileDto.username,
        picture_url: updateProfileDto.pictureUrl,
        is_private: updateProfileDto.isPrivate,
      });

      const profileRecord =
        await this.userRepository.findProfileByUserId(userId);
      if (profileRecord.length === 0) {
        return left(new ErrorRegister.UserNotFound());
      }
      const userRecord = await this.userRepository.findUserById(userId);
      if (userRecord.length === 0) {
        return left(new ErrorRegister.UserNotFound());
      }
      const emailRecord = await this.userRepository.findEmailById(
        userRecord[0].email_id,
      );

      return right({
        id: userId.toString(),
        email: emailRecord[0].value,
        isEmailVerified: !!emailRecord[0].verified_at,
        fullName: profileRecord[0].full_name ?? undefined,
        bio: profileRecord[0].bio ?? undefined,
        username: profileRecord[0].username ?? undefined,
        pictureUrl: profileRecord[0].picture_url ?? undefined,
        isPrivate: profileRecord[0].is_private ?? false,
      });
    } catch (error) {
      this.logger.error(error);
      return left(new Error('Terjadi kesalahan, silahkan hubungi pihak kami.'));
    }
  }

  async findById(userId: bigint): Promise<FindUserResult> {
    const userRecord = await this.userRepository.findUserById(userId);
    if (userRecord.length === 0) {
      return left(new ErrorRegister.UserNotFound());
    }
    const profileRecord = await this.userRepository.findProfileByUserId(userId);
    const profileData = profileRecord[0];

    const postCount = await this.userRepository.countPosts(userId);
    const followersCount = await this.userRepository.countFollowers(userId);
    const followingsCount = await this.userRepository.countFollowings(userId);
    const recentPosts = await this.userRepository.getRecentPosts(userId);

    const userProfile: GetProfileResponseDto = {
      username: profileData?.username || '',
      fullName: profileData?.full_name || '',
      bio: profileData?.bio || '',
      pictureUrl: profileData?.picture_url || '',
      summaries: {
        postsCounts: Number(postCount[0]?.count) || 0,
        followersCount: Number(followersCount[0]?.count) || 0,
        followingsCount: Number(followingsCount[0]?.count) || 0,
      },
      recentPosts: recentPosts.map((p) => ({
        id: p.id.toString(),
        pictureUrl: p.pictureUrl || '',
      })),
    };

    return right(userProfile);
  }

  async findByUsername(username: string): Promise<FindUserResult> {
    if (!username) {
      return left(new ErrorRegister.UserNotFound());
    }
    const profileRecord =
      await this.userRepository.findProfileByUsername(username);
    if (profileRecord.length === 0) {
      return left(new ErrorRegister.UserNotFound());
    }
    const userId = profileRecord[0].user_id;
    const userData = await this.userRepository.findUserById(userId);
    if (userData.length === 0) {
      return left(new ErrorRegister.UserNotFound());
    }
    const postCount = await this.userRepository.countPosts(userId);
    const followersCount = await this.userRepository.countFollowers(userId);
    const followingsCount = await this.userRepository.countFollowings(userId);
    const recentPosts = await this.userRepository.getRecentPosts(userId);

    const userProfile: GetProfileResponseDto = {
      username: profileRecord[0].username || '',
      fullName: profileRecord[0].full_name || '',
      bio: profileRecord[0].bio || '',
      pictureUrl: profileRecord[0].picture_url || '',
      summaries: {
        postsCounts: Number(postCount[0]?.count) || 0,
        followersCount: Number(followersCount[0]?.count) || 0,
        followingsCount: Number(followingsCount[0]?.count) || 0,
      },
      recentPosts: recentPosts.map((p) => ({
        id: p.id.toString(),
        pictureUrl: p.pictureUrl || '',
      })),
    };

    return right(userProfile);
  }

  async canViewUserProfile(
    viewerId: bigint,
    profileId: bigint,
  ): Promise<CanViewProfileResult> {
    if (viewerId === profileId) {
      return right(true);
    }
    const userRecord = await this.userRepository.findUserById(profileId);
    if (userRecord.length === 0) {
      return left(new ErrorRegister.UserNotFound());
    }
    const profileRecord =
      await this.userRepository.findProfileByUserId(profileId);
    const isPrivate = profileRecord[0]?.is_private ?? false;
    if (!isPrivate) {
      return right(true);
    }
    // Cek apakah viewer sudah follow
    const follow = await this.followRepository.findFollow(viewerId, profileId);
    if (follow.length > 0) {
      return right(true);
    }
    return right(false);
  }

  async markEmailVerified(userId: bigint): Promise<void> {
    const userRecord = await this.userRepository.findUserById(userId);
    if (userRecord.length === 0) return;
    const emailId = userRecord[0].email_id;
    await this.userRepository.updateEmailVerified(emailId, new Date());
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
