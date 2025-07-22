import {
  BadRequestException,
  Controller,
  Delete,
  HttpCode,
  Param,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiResponse } from '@nestjs/swagger';
import { AuthGuard } from 'src/libs/guards/authGuard';
import { LoggedInUser } from 'src/libs/helpers/logged-in-user';
import { LikesService } from './likes.service';

@Controller('users')
export class LikesController {
  constructor(private readonly likesService: LikesService) {}

  @HttpCode(204)
  @UseGuards(AuthGuard)
  @ApiResponse({
    status: 204,
    description: 'Berhasil menyukai post'
  })
  @Post(':username/posts/:postId/likes')
  async likePost(
    @Request() req: LoggedInUser,
    @Param('username') username: string,
    @Param('postId') postId: string,
  ) {
    const userId = BigInt(req.user.sub);
    const result = await this.likesService.likePost(userId, BigInt(postId));

    if (result.isLeft()) {
      throw new BadRequestException('Gagal menyukai post');
    }

    return {
      message: 'Berhasil menyukai post',
    };
  }

  @HttpCode(204)
  @UseGuards(AuthGuard)
  @ApiResponse({
    status: 204,
    description: 'Berhasil membatalkan suka pada post'
  })
  @Delete(':username/posts/:postId/likes')
  async unlikePost(
    @Request() req: LoggedInUser,
    @Param('username') username: string,
    @Param('postId') postId: string,
  ) {
    const userId = BigInt(req.user.sub);
    const result = await this.likesService.unlikePost(userId, BigInt(postId));

    if (result.isLeft()) {
      throw new BadRequestException('Gagal membatalkan suka pada post');
    }

    return {
      message: 'Berhasil membatalkan suka pada post',
    };
  }
}
