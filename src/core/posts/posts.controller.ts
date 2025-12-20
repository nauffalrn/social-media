import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiConsumes, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from 'src/libs/guards/authGuard';
import { LoggedInUser } from 'src/libs/helpers/logged-in-user';
import { FastifyFileInterceptor } from 'src/libs/decorators/fastify-file.interceptor';
import { UploadedFile } from 'src/libs/decorators/uploaded-file.decorator';
import { CreatePostDto } from './useCases/createPost/dto/create-post.dto';
import { CreatePostUseCase } from './useCases/createPost/createPost.usecase';
import { SearchPostUseCase } from './useCases/searchPost/searchPost.usecase';
import { TaggedPostUseCase } from './useCases/taggedPost/taggedPost.usecase';

@ApiTags('Posts')
@Controller('posts')
export class PostsController {
  constructor(
    private readonly createPostUseCase: CreatePostUseCase,
    private readonly searchPostUseCase: SearchPostUseCase,
    private readonly taggedPostUseCase: TaggedPostUseCase,
  ) {}

  @Post('create')
  @UseGuards(AuthGuard)
  @UseInterceptors(FastifyFileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  async createPost(
    @LoggedInUser() user: { userId: string },
    @Body() createPostDto: CreatePostDto,
    @UploadedFile() file: any,
  ) {
    return this.createPostUseCase.execute(
      BigInt(user.userId),
      createPostDto,
      file,
    );
  }

  @Get('search')
  @UseGuards(AuthGuard)
  async searchPosts(
    @LoggedInUser() user: { userId: string },
    @Query('q') query: string = '',
    @Query('take') take?: number,
    @Query('page') page?: number,
  ) {
    return this.searchPostUseCase.execute(
      BigInt(user.userId),
      query,
      take,
      page,
    );
  }

  @Get('tagged/:username')
  @UseGuards(AuthGuard)
  async getTaggedPosts(
    @LoggedInUser() user: { userId: string },
    @Param('username') username: string,
    @Query('take') take?: number,
    @Query('page') page?: number,
  ) {
    return this.taggedPostUseCase.execute(
      BigInt(user.userId),
      username,
      take,
      page,
    );
  }
}