import { ObjectId } from "mongodb";
import DocCollection, { BaseDoc } from "../framework/doc";
import { NotAllowedError, NotFoundError } from "./errors";

export interface MessageDoc extends BaseDoc {
  message: ObjectId;
  sender: ObjectId;
  receiver: ObjectId;
}

export default class MessageConcept {
  public readonly messageHistory: DocCollection<MessageDoc>; //instanca variable

  constructor(collectionName: string) {
    this.messageHistory = new DocCollection<MessageDoc>(collectionName);
    // Create index on messageHistory to make search queries for it performant
    void this.messageHistory.collection.createIndex({ message: 1 });
  }

  async sendMessage(message: ObjectId, sender: ObjectId, receiver: ObjectId) {
    const _id = this.messageHistory.createOne({ message, sender, receiver });
    return { msg: "Message sent!", _id: await this.messageHistory.readOne({ _id }) }; //can i just put id instead of the readOne?
  }

  async delete(_id: ObjectId, user: ObjectId) {
    await this.assertUserIsSender(_id, user);
    //should I or assertUserIsSender?
    await this.messageHistory.deleteOne({ _id });
    return { msg: "Post deleted successfully!" };
  }

  //   ARE THESE NECESSARY? SHOULD I DO THEM BY THE USER TOO?
  //   async getBySender(_id: ObjectId, sender: ObjectId, user: ObjectId) {
  //     await this.assertUserIsSender(_id, user);
  //     return await this.messageHistory.readMany({ sender: sender });
  //   }

  //   async getByReceiver(_id: ObjectId, receiver: ObjectId, user: ObjectId) {
  //     await this.assertUserIsReceiver(_id, user);
  //     return await this.messageHistory.readMany({ receiver: receiver });
  //   }

  private async assertUserIsSender(_id: ObjectId, user: ObjectId) {
    const message = await this.messageHistory.readOne({ _id });
    if (!message) {
      throw new NotFoundError(`Message ${_id} does not exist!`);
    }
    if (message.sender.toString() !== user.toString()) {
      throw new NotAllowedError("User is not sender of message!");
    }
  }

  private async assertUserIsReceiver(_id: ObjectId, user: ObjectId) {
    const message = await this.messageHistory.readOne({ _id });
    if (!message) {
      throw new NotFoundError(`Message ${_id} does not exist!`);
    }
    if (message.receiver.toString() !== user.toString()) {
      throw new NotAllowedError("User is not receiver of message!");
    }
  }
}
