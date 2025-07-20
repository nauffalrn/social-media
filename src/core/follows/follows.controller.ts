import { BadRequestException, Controller, Delete, Get, Param, Post, Query, Request, UseGuards } from '@nestjs/common';

import { FollowsService } from './follows.service';
import { AuthGuard } from 'src/libs/guards/authGuard';

@Controller('users')
export class FollowsController {
  constructor(private readonly followsService: FollowsService) {}

  @UseGuards(AuthGuard)
  @Post(':username/follows')
  async followUser(@Request() req, @Param('username') username: string) {
    const result = await this.followsService.followUserByUsername(BigInt(req.user.sub), username);
    if (result.isLeft()) throw new BadRequestException(result.error.message);
    return {
      message: 'Berhasil mengikuti pengguna',
      follow: result.value,
    };
  }

  @UseGuards(AuthGuard)
  @Delete(':username/follows')
  async unfollowUser(@Request() req, @Param('username') username: string) {
    const result = await this.followsService.unfollowUserByUsername(BigInt(req.user.sub), username);
    if (result.isLeft()) throw new BadRequestException(result.error.message);
    return { message: 'Berhasil berhenti mengikuti pengguna' };
  }

  @Get(':username/followers')
  async getFollowers(@Param('username') username: string, @Query('take') take?: string, @Query('page') page?: string) {
    if (!take || !page) {
      throw new BadRequestException('Parameter take dan page harus diisi');
    }

    const parsedTake = parseInt(take);
    const parsedPage = parseInt(page);

    if (isNaN(parsedTake) || isNaN(parsedPage) || parsedTake < 1 || parsedPage < 1) {
      throw new BadRequestException('Parameter take dan page harus berupa angka positif');
    }

    // Teruskan parameter ke service
    const result = await this.followsService.getFollowersByUsername(username, parsedTake, parsedPage);

    if (result.isLeft()) throw new BadRequestException(result.error.message);
    return { followers: result.value };
  }

  @Get(':username/followings')
  async getFollowings(@Param('username') username: string, @Query('take') take?: string, @Query('page') page?: string) {
    if (!take || !page) {
      throw new BadRequestException('Parameter take dan page harus diisi');
    }

    const parsedTake = parseInt(take);
    const parsedPage = parseInt(page);

    if (isNaN(parsedTake) || isNaN(parsedPage) || parsedTake < 1 || parsedPage < 1) {
      throw new BadRequestException('Parameter take dan page harus berupa angka positif');
    }

    // Teruskan parameter ke service
    const result = await this.followsService.getFollowingsByUsername(username, parsedTake, parsedPage);

    if (result.isLeft()) throw new BadRequestException(result.error.message);
    return { followings: result.value };
  }
}
