import {
  BadRequestException,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiQuery, ApiResponse } from '@nestjs/swagger';

import { AuthGuard } from 'src/libs/guards/authGuard';
import { FollowsService } from './follows.service';

@Controller('users')
export class FollowsController {
  constructor(private readonly followsService: FollowsService) {}

  @UseGuards(AuthGuard)
  @ApiResponse({
    status: 200,
    description: 'Berhasil mengikuti pengguna',
    content: {
      'application/json': {
        example: {
          message: 'Berhasil mengikuti pengguna',
          follow: {
            id: '1',
            followerId: '2',
            followingId: '3',
            createdAt: '2025-07-22T13:20:00.000Z',
          },
        },
      },
    },
  })
  @Post(':username/follows')
  async followUser(@Request() req, @Param('username') username: string) {
    const result = await this.followsService.followUserByUsername(
      BigInt(req.user.sub),
      username,
    );
    if (result.isLeft()) throw new BadRequestException(result.error.message);
    return {
      message: 'Berhasil mengikuti pengguna',
      follow: result.value,
    };
  }

  @UseGuards(AuthGuard)
  @ApiResponse({
    status: 200,
    description: 'Berhasil berhenti mengikuti pengguna',
    content: {
      'application/json': {
        example: {
          message: 'Berhasil berhenti mengikuti pengguna',
        },
      },
    },
  })
  @Delete(':username/follows')
  async unfollowUser(@Request() req, @Param('username') username: string) {
    const result = await this.followsService.unfollowUserByUsername(
      BigInt(req.user.sub),
      username,
    );
    if (result.isLeft()) throw new BadRequestException(result.error.message);
    return { message: 'Berhasil berhenti mengikuti pengguna' };
  }

  @ApiQuery({ name: 'take', required: true, example: 10 })
  @ApiQuery({ name: 'page', required: true, example: 1 })
  @ApiResponse({
    status: 200,
    description: 'List of followers',
    content: {
      'application/json': {
        example: {
          followers: [
            {
              username: 'userA',
              fullName: 'User A',
              pictureUrl: 'https://cdn.example.com/avatarA.jpg',
            },
          ],
        },
      },
    },
  })
  @Get(':username/followers')
  async getFollowers(
    @Param('username') username: string,
    @Query('take') take?: string,
    @Query('page') page?: string,
  ) {
    if (!take || !page)
      throw new BadRequestException('Parameter take dan page harus diisi');
    const parsedTake = parseInt(take);
    const parsedPage = parseInt(page);
    if (
      isNaN(parsedTake) ||
      isNaN(parsedPage) ||
      parsedTake < 1 ||
      parsedPage < 1
    )
      throw new BadRequestException(
        'Parameter take dan page harus berupa angka positif',
      );
    const result = await this.followsService.getFollowersByUsername(
      username,
      parsedTake,
      parsedPage,
    );
    if (result.isLeft()) throw new BadRequestException(result.error.message);

    return {
      followers: result.value.map((f) => ({
        username: f.username,
        fullName: f.fullName,
        pictureUrl: f.pictureUrl ?? '',
      })),
    };
  }

  @ApiQuery({ name: 'take', required: true, example: 10 })
  @ApiQuery({ name: 'page', required: true, example: 1 })
  @ApiResponse({
    status: 200,
    description: 'List of followings',
    content: {
      'application/json': {
        example: {
          followings: [
            {
              username: 'userB',
              fullName: 'User B',
              pictureUrl: 'https://cdn.example.com/avatarB.jpg',
            },
          ],
        },
      },
    },
  })
  @Get(':username/followings')
  async getFollowings(
    @Param('username') username: string,
    @Query('take') take?: string,
    @Query('page') page?: string,
  ) {
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

    // Teruskan parameter ke service
    const result = await this.followsService.getFollowingsByUsername(
      username,
      parsedTake,
      parsedPage,
    );

    if (result.isLeft()) throw new BadRequestException(result.error.message);
    return { followings: result.value };
  }
}
