import { ObjectId } from "mongodb";
import { v4 as uuidv4 } from "uuid";
import DocCollection, { BaseDoc } from "../framework/doc";
import { BadValuesError, NotFoundError } from "./errors";

export interface UserDoc extends BaseDoc {
  //userType
  username: string;
  userId: string; //should i use mongoDBs _id? or just a string id?
}

export default class UserConcept {
  public readonly users: DocCollection<UserDoc>;

  constructor(collectionName: string) {
    this.users = new DocCollection<UserDoc>(collectionName);

    // Create index on userId to make search queries for it performant
    void this.users.collection.createIndex({ userId: 1 });
  }

  //need register and the generate id function
  async registerUser(username: string) {
    await this.assertGoodCredentials(username);
    const userId: string = await this.generateUniqueUserId();
    const _id = await this.users.createOne({ username, userId }); //object id for the user itself in mongoDB
  }

  private async generateUniqueUserId() {
    const userId: string = uuidv4(); //generating random id for userid
    return userId;
  }

  private async assertGoodCredentials(username: string) {
    if (!username) {
      throw new BadValuesError("Username must be non-empty!");
    }
  }

  async getUsers(_id: ObjectId) {
    const user = await this.users.readOne({ _id });
    if (!user) {
      throw new NotFoundError(`User not found!`);
    }
    return this.hideId(user);
  }

  async getUserbyId(id: string) {
    const user = await this.users.readOne({ userId: id });
    if (!user) {
      throw new NotFoundError(`No user of this id exists!`);
    }
    return this.hideId(user);
  }

  async hideId(user: UserDoc) {
    // eslint-disable-next-line
    const { userId, ...rest } = user;
    return rest;
  }

  async updateUsername(_id: ObjectId, username: string) {
    await this.assertGoodCredentials(username);
    await this.users.partialUpdateOne({ _id }, { username });
    return { msg: "Username updated successfully!" };
  }
}
