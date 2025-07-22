import { HttpService } from '@nestjs/axios';
import { Inject, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { and, desc, eq, isNull, sql } from 'drizzle-orm';
import { lastValueFrom } from 'rxjs';
import { DrizzleInstance } from 'src/infrastructure/database';
import {
  email,
  follow,
  post,
  profile,
  user,
} from 'src/infrastructure/database/schema';
import { EmailService } from 'src/infrastructure/email/email.service';
import { generateSnowflakeId } from 'src/infrastructure/snowflake/snowflake';
import { UploadsService } from 'src/infrastructure/storage/uploads.service';
import { Either, ErrorRegister, left, right } from 'src/libs/helpers/either';
import { User } from './entities/user.entity';
import { UpdateProfileDto } from './useCases/updateProfile/update-profile.dto';
import { SignUpDto } from './useCases/signUp/dto/sign-up.dto';
import { SignInDto } from './useCases/signIn/dto/sign-in.dto';

const SALT_ROUNDS = 10;

// Update definisi tipe untuk PublicProfileOutput agar sesuai dengan GetProfileResponseDto
type PublicProfileOutput = {
  username: string;
  fullName: string;
  bio: string;
  pictureUrl: string;
  summaries: {
    postsCounts: number;
    followersCount: number;
    followingsCount: number;
  };
  recentPosts: Array<{
    id: string;
    pictureUrl: string;
  }>;
};

// Type definitions untuk hasil service
type CreateUserResult = Either<
  ErrorRegister.EmailAlreadyRegistered | ErrorRegister.InputanSalah,
  { user: Omit<User, 'password'>; verificationToken: string }
>;

type VerifyEmailResult = Either<
  | ErrorRegister.InvalidVerificationToken
  | ErrorRegister.UserNotFound
  | ErrorRegister.InputanSalah,
  Omit<User, 'password'>
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
type FindUserResult = Either<ErrorRegister.UserNotFound, PublicProfileOutput>;
type CanViewProfileResult = Either<ErrorRegister.UserNotFound, boolean>;

@Injectable()
export class UsersService {
  constructor(
    private readonly jwtService: JwtService,
    @Inject('DB') private db: DrizzleInstance,
    private readonly emailService: EmailService,
    private readonly httpService: HttpService,
    private readonly uploadsService: UploadsService,
  ) {}

  async create(createUserDto: SignUpDto): Promise<CreateUserResult> {
    try {
      // Cek email sudah ada
      const existingEmail = await this.db
        .select()
        .from(email)
        .where(eq(email.value, createUserDto.email))
        .limit(1);
      if (existingEmail.length > 0) {
        return left(new ErrorRegister.EmailAlreadyRegistered());
      }

      // Insert email
      const emailId = generateSnowflakeId();
      await this.db.insert(email).values({
        id: emailId,
        value: createUserDto.email,
        verified_at: process.env.NODE_ENV === 'development' ? new Date() : null, // <-- ini kuncinya
      });

      // Insert user
      const userId = generateSnowflakeId();
      const hashedPassword = await bcrypt.hash(
        createUserDto.password,
        SALT_ROUNDS,
      );
      await this.db.insert(user).values({
        id: userId,
        email_id: emailId,
        password: hashedPassword,
        is_private: false,
      });

      // Insert profile
      await this.db.insert(profile).values({
        user_id: userId,
        full_name: '',
        bio: '',
        username: `user${userId}`, // isi dengan nilai unik, misal: userId atau email
        picture_url: await this.getRandomAvatarUrl(),
        is_private: false,
      });

      // Generate token verifikasi
      const verifyToken = this.jwtService.sign(
        { sub: userId.toString(), email: createUserDto.email, type: 'verify' },
        { expiresIn: '24h' },
      );

      await this.emailService.sendVerificationEmail(
        createUserDto.email,
        verifyToken,
      );

      return right({
        user: {
          id: userId.toString(),
          email: createUserDto.email,
          isEmailVerified: false,
          fullName: '',
          bio: '',
          username: '',
          pictureUrl: '',
          isPrivate: false,
        },
        verificationToken: verifyToken,
      });
    } catch (error) {
      console.error('❌ Error detail saat create user:', error); // Tambahkan log ini
      return left(new ErrorRegister.InputanSalah('Gagal membuat user'));
    }
  }

  async login(loginDto: SignInDto): Promise<LoginResult> {
    try {
      // Cari email
      const emailRecord = await this.db
        .select()
        .from(email)
        .where(eq(email.value, loginDto.email))
        .limit(1);
      if (emailRecord.length === 0) {
        return left(new ErrorRegister.UserNotFound());
      }
      const emailId = emailRecord[0].id;

      // Cari user
      const userRecord = await this.db
        .select()
        .from(user)
        .where(eq(user.email_id, emailId))
        .limit(1);
      if (userRecord.length === 0) {
        return left(new ErrorRegister.UserNotFound());
      }
      const userId = userRecord[0].id;

      // Cari profile
      const profileRecord = await this.db
        .select()
        .from(profile)
        .where(eq(profile.user_id, userId))
        .limit(1);
      const profileData = profileRecord[0];

      // Password check
      const isPasswordValid = await bcrypt.compare(
        loginDto.password,
        userRecord[0].password,
      );
      if (!isPasswordValid) {
        return left(new ErrorRegister.InvalidPassword());
      }

      // Email verified check
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
          isPrivate: userRecord[0].is_private,
        },
        accessToken,
      });
    } catch (error) {
      return left(new ErrorRegister.InputanSalah('Login gagal'));
    }
  }

  async updateProfile(
    userId: bigint,
    updateProfileDto: UpdateProfileDto,
  ): Promise<UpdateProfileResult> {
    try {
      await this.db
        .update(profile)
        .set({
          full_name: updateProfileDto.fullName,
          bio: updateProfileDto.bio,
          username: updateProfileDto.username,
          picture_url: updateProfileDto.pictureUrl,
          is_private: updateProfileDto.isPrivate,
        })
        .where(eq(profile.user_id, userId));

      // Ambil profile terbaru
      const profileRecord = await this.db
        .select()
        .from(profile)
        .where(eq(profile.user_id, userId))
        .limit(1);
      if (profileRecord.length === 0) {
        return left(new ErrorRegister.UserNotFound());
      }
      const userRecord = await this.db
        .select()
        .from(user)
        .where(eq(user.id, userId))
        .limit(1);
      if (userRecord.length === 0) {
        return left(new ErrorRegister.UserNotFound());
      }
      const emailRecord = await this.db
        .select()
        .from(email)
        .where(eq(email.id, userRecord[0].email_id))
        .limit(1);

      return right({
        id: userId.toString(),
        email: emailRecord[0].value,
        isEmailVerified: !!emailRecord[0].verified_at,
        fullName: profileRecord[0].full_name,
        bio: profileRecord[0].bio,
        username: profileRecord[0].username,
        pictureUrl: profileRecord[0].picture_url,
        isPrivate: userRecord[0].is_private,
      });
    } catch (error) {
      return left(new ErrorRegister.InputanSalah('Gagal update profile'));
    }
  }

  async findById(userId: bigint): Promise<FindUserResult> {
    // Ambil user
    const userRecord = await this.db
      .select()
      .from(user)
      .where(eq(user.id, userId))
      .limit(1);
    if (userRecord.length === 0) {
      return left(new ErrorRegister.UserNotFound());
    }
    const userData = userRecord[0];

    // Ambil profile
    const profileRecord = await this.db
      .select()
      .from(profile)
      .where(eq(profile.user_id, userId))
      .limit(1);
    const profileData = profileRecord[0];

    // Hitung jumlah post, followers dan followings
    const postCount = await this.db
      .select({ count: sql`count(*)` })
      .from(post)
      .where(and(eq(post.user_id, userId), isNull(post.deleted_at)));

    const followersCount = await this.db
      .select({ count: sql`count(*)` })
      .from(follow)
      .where(eq(follow.following_id, userId));

    const followingsCount = await this.db
      .select({ count: sql`count(*)` })
      .from(follow)
      .where(eq(follow.follower_id, userId));

    // Ambil 3 post terbaru
    const recentPosts = await this.db
      .select({
        id: post.id,
        pictureUrl: post.picture_url,
      })
      .from(post)
      .where(and(eq(post.user_id, userId), isNull(post.deleted_at)))
      .orderBy(desc(post.id))
      .limit(3);

    // Format response sesuai PublicProfileOutput (tanpa id dan email)
    const userProfile: PublicProfileOutput = {
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

    // Cari profile berdasarkan username
    const profileRecord = await this.db
      .select()
      .from(profile)
      .where(eq(profile.username, username))
      .limit(1);

    if (profileRecord.length === 0) {
      return left(new ErrorRegister.UserNotFound());
    }

    // Ambil userId dari profile
    const userId = profileRecord[0].user_id;

    // Ambil user data
    const userData = await this.db
      .select()
      .from(user)
      .where(eq(user.id, userId))
      .limit(1);

    if (userData.length === 0) {
      return left(new ErrorRegister.UserNotFound());
    }

    // Hitung jumlah post, followers dan followings
    const postCount = await this.db
      .select({ count: sql`count(*)` })
      .from(post)
      .where(and(eq(post.user_id, userId), isNull(post.deleted_at)));

    const followersCount = await this.db
      .select({ count: sql`count(*)` })
      .from(follow)
      .where(eq(follow.following_id, userId));

    const followingsCount = await this.db
      .select({ count: sql`count(*)` })
      .from(follow)
      .where(eq(follow.follower_id, userId));

    // Ambil 3 post terbaru
    const recentPosts = await this.db
      .select({
        id: post.id,
        pictureUrl: post.picture_url,
      })
      .from(post)
      .where(and(eq(post.user_id, userId), isNull(post.deleted_at)))
      .orderBy(desc(post.id))
      .limit(3);

    // Format response sesuai GetProfileResponseDto
    const userProfile: PublicProfileOutput = {
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
    // Ambil user
    const userRecord = await this.db
      .select()
      .from(user)
      .where(eq(user.id, profileId))
      .limit(1);
    if (userRecord.length === 0) {
      return left(new ErrorRegister.UserNotFound());
    }
    // Ambil profile
    const profileRecord = await this.db
      .select()
      .from(profile)
      .where(eq(profile.user_id, profileId))
      .limit(1);
    const isPrivate = profileRecord[0]?.is_private ?? false;
    if (!isPrivate) {
      return right(true);
    }
    // Cek apakah viewer sudah follow
    const followRecord = await this.db
      .select()
      .from(follow)
      .where(
        and(
          eq(follow.follower_id, viewerId),
          eq(follow.following_id, profileId),
        ),
      )
      .limit(1);
    return right(followRecord.length > 0);
  }

  async markEmailVerified(userId: bigint): Promise<void> {
    // Ambil user
    const userRecord = await this.db
      .select()
      .from(user)
      .where(eq(user.id, userId))
      .limit(1);
    if (userRecord.length === 0) return;
    const emailId = userRecord[0].email_id;
    await this.db
      .update(email)
      .set({ verified_at: new Date() })
      .where(eq(email.id, emailId));
  }

  // Tambahkan method ini di bawah class UsersService
  private async getRandomAvatarUrl(): Promise<string> {
    // Ambil gambar random dari API eksternal
    const url = 'https://xsgames.co/randomusers/avatar.php?g=pixel';
    try {
      // Ambil gambar sebagai buffer
      const response = await lastValueFrom(
        this.httpService.get(url, { responseType: 'arraybuffer' }),
      );
      const buffer = Buffer.from(response.data);

      // Upload ke Cloudinary menggunakan adaptasi untuk Fastify
      const uploadedUrl =
        await this.uploadsService.uploadToCloudinaryFromBuffer(
          buffer,
          'avatar.png',
        );
      return uploadedUrl;
    } catch (err) {
      // fallback jika gagal, pakai URL randomuser langsung
      return url;
    }
  }
}
