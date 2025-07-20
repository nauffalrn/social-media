import { IsArray, IsOptional, IsString, IsUrl } from 'class-validator';

export class CreatePostDto {
  @IsString()
  userId: string;

  @IsString()
  @IsOptional()
  caption?: string;

  @IsString()
  @IsUrl()
  pictureUrl: string;

  @IsArray()
  @IsOptional()
  tags?: string[];
}
