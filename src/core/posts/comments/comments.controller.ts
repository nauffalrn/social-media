import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiQuery, ApiResponse, OmitType, PickType } from '@nestjs/swagger';
import { AuthGuard } from 'src/libs/guards/authGuard';
import { LoggedInUser } from 'src/libs/helpers/logged-in-user';
import { CommentsService } from './comments.service';
import { CreateCommentDto } from './useCases/createPostComment/dto/create-post-comment.dto';
import { CreateRepliedCommentDto } from './useCases/createRepliedComment/dto/create-replied-comment.dto';
import { GetPostCommentsResponseDto } from './useCases/getPostComments/dto/get-post-comments-response.dto';
import { omit, pick } from 'zod/v4/core/util.cjs';
import { DeletePostCommentDto } from './useCases/deletePostComment/dto/delete-post-comment.dto';
import { GetRepliedCommentsResponseDto } from './useCases/getRepliedComments/dto/get-replied-comments-response.dto';

export class CreateCommentDtoParams extends PickType(CreateCommentDto, [
  'username',
  'postId',
]) {}
export class CreateCommentDtoBody extends PickType(CreateCommentDto, [
  'text',
]) {}
export class CreateCommentReplyDtoParams extends OmitType(CreateRepliedCommentDto, [
  'text',
]) {}
export class CreateCommentReplyDtoBody extends PickType(CreateRepliedCommentDto, [
  'text',
]) {}


@Controller('users')
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @UseGuards(AuthGuard)
  @ApiQuery({ name: 'take', required: true, example: 10 })
  @ApiQuery({ name: 'page', required: true, example: 1 })
  @ApiResponse({
    status: 200,
    description: 'List of comments',
    type: GetPostCommentsResponseDto,
  })
  @Get(':username/posts/:postId/comments')
  async getPostComments(
    @Param('username') username: string,
    @Param('postId') postId: string,
    @Query('take') take?: string,
    @Query('page') page?: string,
  ): Promise<any> {
    if (!take || !page) {
      throw new BadRequestException('Parameter take dan page harus diisi');
    }

    const parsedTake = parseInt(take);
    const parsedPage = parseInt(page);

    if (
      isNaN(parsedTake) ||
      isNaN(parsedPage) ||
      parsedTake < 1 ||
      parsedPage < 1
    ) {
      throw new BadRequestException(
        'Parameter take dan page harus berupa angka positif',
      );
    }

    const result = await this.commentsService.getPostComments(
      BigInt(postId),
      parsedTake,
      parsedPage,
    );

    if (result.isLeft()) {
      throw new BadRequestException(result.error.message);
    }

    return {
      comments: result.value,
    };
  }

  @HttpCode(204)
  @UseGuards(AuthGuard)
  @ApiResponse({
    status: 204,
    description: 'Komentar berhasil dibuat',
  })
  @Post(':username/posts/:postId/comments')
  async createComment(
    @Request() req: LoggedInUser,
    @Param('postId') postId: string,
    @Body() createCommentDto: CreateCommentDto,
  ): Promise<any> {
    const userId = BigInt(req.user.sub);
    const result = await this.commentsService.createComment(
      userId,
      BigInt(postId),
      createCommentDto.text,
    );

    if (result.isLeft()) {
      throw new BadRequestException(result.error.message);
    }

    return {
      message: 'Komentar berhasil dibuat',
      comment: result.value,
    };
  }

  @HttpCode(204)
  @UseGuards(AuthGuard)
  @ApiResponse({
    status: 204,
    description: 'Komentar berhasil dihapus'
  })
  @Delete(':username/posts/:postId/comments/:commentId')
  async deleteComment(
    @Request() req: LoggedInUser,
    @Param('commentId') commentId: string,
  ): Promise<any> {
    const userId = BigInt(req.user.sub);
    const result = await this.commentsService.deleteComment(
      userId,
      BigInt(commentId),
    );

    if (result.isLeft()) {
      throw new BadRequestException(result.error.message);
    }

    return {
      message: 'Komentar berhasil dihapus',
    };
  }

  @UseGuards(AuthGuard)
  @ApiQuery({ name: 'take', required: true, example: 10 })
  @ApiQuery({ name: 'page', required: true, example: 1 })
  @ApiResponse({
    status: 200,
    description: 'List of replies',
    type: GetRepliedCommentsResponseDto,
  })
  @Get(':username/posts/:postId/comments/:commentId/replies')
  async getReplies(
    @Param('commentId') commentId: string,
    @Query('take') take?: string,
    @Query('page') page?: string,
  ): Promise<any> {
    if (!take || !page) {
      throw new BadRequestException('Parameter take dan page harus diisi');
    }

    const parsedTake = parseInt(take);
    const parsedPage = parseInt(page);

    if (
      isNaN(parsedTake) ||
      isNaN(parsedPage) ||
      parsedTake < 1 ||
      parsedPage < 1
    ) {
      throw new BadRequestException(
        'Parameter take dan page harus berupa angka positif',
      );
    }

    const result = await this.commentsService.getReplies(
      BigInt(commentId),
      parsedTake,
      parsedPage,
    );

    if (result.isLeft()) {
      throw new BadRequestException(result.error.message);
    }

    return {
      replies: result.value,
    };
  }

  @HttpCode(204)
  @UseGuards(AuthGuard)
  @ApiResponse({
    status: 204,
    description: 'Balasan komentar berhasil dibuat',
  })
  @Post(':username/posts/:postId/comments/:commentId/replies')
  async createReply(
    @Request() req: LoggedInUser,
    @Param('postId') postId: string,
    @Param('commentId') commentId: string,
    @Body() createReplyDto: CreateRepliedCommentDto,
  ): Promise<any> {
    const userId = BigInt(req.user.sub);
    const result = await this.commentsService.createReply(
      userId,
      BigInt(postId),
      BigInt(commentId),
      createReplyDto.text,
    );

    if (result.isLeft()) {
      throw new BadRequestException(result.error.message);
    }

    return {
      message: 'Balasan komentar berhasil dibuat',
      reply: result.value,
    };
  }

  @HttpCode(204)
  @UseGuards(AuthGuard)
  @ApiResponse({
    status: 204,
    description: 'Balasan komentar berhasil dihapus'
  })
  @Delete(':username/posts/:postId/comments/:commentId/replies/:replyId')
  async deleteReply(
    @Request() req: LoggedInUser,
    @Param('replyId') replyId: string,
  ): Promise<any> {
    const userId = BigInt(req.user.sub);
    const result = await this.commentsService.deleteReply(
      userId,
      BigInt(replyId),
    );

    if (result.isLeft()) {
      throw new BadRequestException(result.error.message);
    }

    return {
      message: 'Balasan komentar berhasil dihapus',
    };
  }
}
