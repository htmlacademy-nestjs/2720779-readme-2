import { Like } from '@project/shared-types';

export class LikeEntity implements Like {
  public userId!: string;
  public postId!: string;
  public createDate!: Date;

  constructor(like: Like) {
    this.populate(like);
  }

  public populate(data: Like): void {
    this.userId = data.userId;
    this.postId = data.postId;
    this.createDate = data.createDate;
  }

  public toPOJO(): Like {
    return {
      userId: this.userId,
      postId: this.postId,
      createDate: this.createDate,
    };
  }

  public get key(): string {
    return `${this.userId}|${this.postId}`;
  }
    static fromObject(data: Like): LikeEntity {
    return new LikeEntity(data);
  }
}
