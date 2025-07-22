export class CreatePostDto {
  userId: string;
  caption?: string;
  pictureUrl: string;
  tags?: string[];
}
