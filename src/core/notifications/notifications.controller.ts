import {
  BadRequestException,
  Controller,
  Get,
  Param,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from 'src/libs/guards/authGuard';
import { LoggedInUser } from 'src/libs/helpers/logged-in-user';
import { NotificationsService } from './notifications.service';

@Controller('users')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @UseGuards(AuthGuard)
  @Get(':username/notifications')
  async getNotifications(
    @Request() req: LoggedInUser,
    @Param('username') username: string,
    @Query('take') take?: string,
    @Query('page') page?: string,
  ): Promise<any> {
    if (req.user.username !== username) {
      throw new BadRequestException(
        'Anda hanya dapat melihat notifikasi dari akun sendiri',
      );
    }

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

    const userId = BigInt(req.user.sub);

    const result = await this.notificationsService.getUserNotifications(
      userId,
      parsedTake,
      parsedPage,
    );

    if (result.isLeft()) {
      throw new BadRequestException(result.error.message);
    }

    return {
      notifications: result.value,
    };
  }
}
