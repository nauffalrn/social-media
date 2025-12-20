import {
  BadRequestException,
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
import { ApiQuery, ApiResponse } from '@nestjs/swagger';
import { AuthGuard } from 'src/libs/guards/authGuard';
import { GetFollowersResponseDto } from './useCases/checkFollowers/dto/get-followers.dto';
import { GetFollowingsResponseDto } from './useCases/checkFollowings/dto/get-followings.dto';
import { GetFollowingsUseCase } from './useCases/checkFollowings/get-followings.usecase';
import { FollowUserUseCase } from './useCases/followUser/following.usecase';
import { GetFollowersUseCase } from './useCases/checkFollowers/get-followers.usecase';

@Controller('users')
export class FollowsController {
  constructor(
    private readonly getFollowingsUseCase: GetFollowingsUseCase,
    private readonly followingUserUseCase: FollowUserUseCase,
    private readonly unfollowUserUseCase: FollowUserUseCase,
    private readonly getFollowersUseCase: GetFollowersUseCase,
  ) {}

  @HttpCode(204)
  @UseGuards(AuthGuard)
  @ApiResponse({
    status: 204,
    description: 'Berhasil mengikuti pengguna',
  })
  @Post(':username/follows')
  async followUser(@Request() req, @Param('username') username: string) {
    const result = await this.followingUserUseCase.execute(
      BigInt(req.user.sub),
      username,
    );
    if (result.isLeft())
      throw new BadRequestException(
        (result.error as { message: string }).message,
      );
    return {
      message: 'Berhasil mengikuti pengguna',
      follow: result.value,
    };
  }

  @HttpCode(204)
  @UseGuards(AuthGuard)
  @ApiResponse({
    status: 204,
    description: 'Berhasil berhenti mengikuti pengguna',
  })
  @Delete(':username/follows')
  async unfollowUser(@Request() req, @Param('username') username: string) {
    const result = await this.unfollowUserUseCase.execute(
      BigInt(req.user.sub),
      username,
    );
    if (result.isLeft()) throw new BadRequestException((result.error as { message: string }).message);
    return { message: 'Berhasil berhenti mengikuti pengguna' };
  }

  @ApiQuery({ name: 'take', required: true, example: 10 })
  @ApiQuery({ name: 'page', required: true, example: 1 })
  @ApiResponse({
    status: 200,
    description: 'List of followers',
    type: GetFollowersResponseDto,
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
    const result = await this.getFollowersUseCase.execute({
      username,
      take: parsedTake,
      page: parsedPage,
    });
    if (result.isLeft()) throw new BadRequestException((result.error as { message: string }).message);

    return {
      followers: result.value.followers.map((f) => ({
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
    type: GetFollowingsResponseDto,
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
    const result = await this.getFollowingsUseCase.execute({
      username,
      take: parsedTake,
      page: parsedPage,
    });

    if (result.isLeft()) throw new BadRequestException(result.error.message);
    return { followings: result.value.followings };
  }
}
