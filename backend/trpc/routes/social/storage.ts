type Like = {
  id: string;
  postId: string;
  userId: string;
  createdAt: string;
};

type Comment = {
  id: string;
  postId: string;
  userId: string;
  username: string;
  text: string;
  createdAt: string;
};

export class SocialStorage {
  private static likes: Like[] = [];
  private static comments: Comment[] = [];

  static getLikesForPost(postId: string): Like[] {
    return this.likes.filter(like => like.postId === postId);
  }

  static getLikeCount(postId: string): number {
    return this.getLikesForPost(postId).length;
  }

  static hasUserLiked(postId: string, userId: string): boolean {
    return this.likes.some(like => like.postId === postId && like.userId === userId);
  }

  static addLike(postId: string, userId: string): Like {
    const existingLike = this.likes.find(
      like => like.postId === postId && like.userId === userId
    );
    
    if (existingLike) {
      return existingLike;
    }

    const newLike: Like = {
      id: Math.random().toString(36).substring(7),
      postId,
      userId,
      createdAt: new Date().toISOString(),
    };
    
    this.likes.push(newLike);
    return newLike;
  }

  static removeLike(postId: string, userId: string): boolean {
    const index = this.likes.findIndex(
      like => like.postId === postId && like.userId === userId
    );
    
    if (index !== -1) {
      this.likes.splice(index, 1);
      return true;
    }
    
    return false;
  }

  static getCommentsForPost(postId: string): Comment[] {
    return this.comments
      .filter(comment => comment.postId === postId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  static getCommentCount(postId: string): number {
    return this.getCommentsForPost(postId).length;
  }

  static addComment(postId: string, userId: string, username: string, text: string): Comment {
    const newComment: Comment = {
      id: Math.random().toString(36).substring(7),
      postId,
      userId,
      username,
      text,
      createdAt: new Date().toISOString(),
    };
    
    this.comments.push(newComment);
    return newComment;
  }

  static getAllInteractions(postId: string, userId: string) {
    return {
      likeCount: this.getLikeCount(postId),
      commentCount: this.getCommentCount(postId),
      isLiked: this.hasUserLiked(postId, userId),
      comments: this.getCommentsForPost(postId),
    };
  }
}
