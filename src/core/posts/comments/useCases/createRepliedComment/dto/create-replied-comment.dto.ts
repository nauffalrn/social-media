export class CreateReplyDto {
  text: string;
}

class CreateRepliedCommentDto {
  userId: string;
  postId: string;
  commentId: string;
  text: string;
}
