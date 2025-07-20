import { MultipartFile } from '@fastify/multipart';
import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  NotFoundException,
  Param,
  Post,
  Query,
  Request,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { PostsService } from './posts.service';
import { CreatePostDto } from './useCases/createPost/dto/create-post.dto';
import { UploadsService } from 'src/infrastructure/storage/uploads.service';
import { AuthGuard } from 'src/libs/guards/authGuard';
import { LoggedInUser } from 'src/libs/helpers/logged-in-user';
import { ErrorRegister } from 'src/libs/helpers/either';
import { FastifyFileInterceptor } from 'src/libs/decorators/fastify-file.interceptor';

@Controller('users')
export class PostsController {
  constructor(
    private readonly postsService: PostsService,
    private readonly uploadsService: UploadsService
  ) {}

  @UseGuards(AuthGuard)
  @Get(':username/posts')
  async getUserPosts(
    @Request() req: LoggedInUser,
    @Param('username') username: string,
    @Query('take') take?: string,
    @Query('page') page?: string,
    @Query('tag') isTagged?: boolean
  ) {
    if (!req.user?.sub) {
      throw new ForbiddenException('Anda harus login untuk melihat post pengguna.');
    }

    if (!take || !page) {
      throw new BadRequestException('Parameter take dan page harus diisi');
    }

    const viewerId = BigInt(req.user.sub);
    const parsedTake = parseInt(take);
    const parsedPage = parseInt(page);

    if (isNaN(parsedTake) || isNaN(parsedPage) || parsedTake < 1 || parsedPage < 1) {
      throw new BadRequestException('Parameter take dan page harus berupa angka positif');
    }

    // Teruskan parameter ke service
    const result = isTagged
      ? await this.postsService.findTaggedPostsByUsername(viewerId, username, parsedTake, parsedPage)
      : await this.postsService.findPostsByUsername(viewerId, username, parsedTake, parsedPage);

    if (result.isLeft()) {
      if (result.error instanceof ErrorRegister.ProfilePrivate) {
        throw new ForbiddenException(result.error.message);
      }
      if (result.error instanceof ErrorRegister.UserNotFound) {
        throw new NotFoundException(result.error.message);
      }
      throw new BadRequestException('Gagal mengambil daftar post');
    }

    return {
      posts: result.value,
    };
  }

  @UseGuards(AuthGuard)
  @Post(':username/posts')
  @UseInterceptors(FastifyFileInterceptor('file'))
  async create(
    @Request() req: LoggedInUser,
    @Param('username') username: string,
    @Body() createPostDto: CreatePostDto,
    @UploadedFile() file: MultipartFile
  ) {
    // Verifikasi username dengan user yang login
    if (req.user.username !== username) {
      throw new ForbiddenException('Anda hanya dapat membuat post untuk akun sendiri');
    }

    if (!file) {
      throw new BadRequestException('Gambar harus diunggah');
    }

    const pictureUrl = await this.uploadsService.uploadToCloudinary(file);
    const postData: CreatePostDto = {
      userId: req.user.sub,
      pictureUrl,
      caption: createPostDto.caption,
      tags: createPostDto.tags,
    };

    const userId = BigInt(req.user.sub);
    const result = await this.postsService.create(userId, postData);

    if (result.isLeft()) {
      if (result.error instanceof ErrorRegister.InputanSalah) {
        throw new BadRequestException(result.error.message);
      }
      throw new BadRequestException('Gagal membuat post');
    }

    return {
      message: 'Post berhasil dibuat',
      post: result.value,
    };
  }

  @UseGuards(AuthGuard)
  @Delete(':username/posts/:postId')
  async delete(@Request() req: LoggedInUser, @Param('username') username: string, @Param('postId') postId: string) {
    // Verifikasi username dengan user yang login
    if (req.user.username !== username) {
      throw new ForbiddenException('Anda hanya dapat menghapus post milik sendiri');
    }

    const userId = BigInt(req.user.sub);
    const result = await this.postsService.delete(userId, BigInt(postId));

    if (result.isLeft()) {
      if (result.error instanceof ErrorRegister.PostNotFound) {
        throw new NotFoundException(result.error.message);
      }
      throw new BadRequestException('Gagal menghapus post');
    }

    return {
      message: 'Post berhasil dihapus',
    };
  }
}
