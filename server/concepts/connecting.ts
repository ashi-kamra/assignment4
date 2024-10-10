import { ObjectId } from "mongodb";
import DocCollection, { BaseDoc } from "../framework/doc";
import { NotAllowedError, NotFoundError } from "./errors";

export interface ConnectionDoc extends BaseDoc {
  user1: ObjectId;
  user2: ObjectId;
}

///do i need a burned collection?? for individuals we've blocked????

export default class ConnectingConcept {
  public readonly connections: DocCollection<ConnectionDoc>;

  constructor(collectionName: string) {
    this.connections = new DocCollection<ConnectionDoc>(collectionName);
  }

  async makeConnection(user1: ObjectId, user2: ObjectId) {
    await this.assertNotFriends(user1, user2);
    const _id1 = this.connections.createOne({ user1, user2 }); //do i need to create both?
    const _id2 = this.connections.createOne({ user2, user1 });
    return { msg: "Connection successful made!", _id: await this.connections.readOne({ _id1 }), _id2: await this.connections.readOne({ _id2 }) };
  }

  async deleteConnection(user: ObjectId, connection: ObjectId) {
    const connect = await this.connections.popOne({
      $and: [
        { user1: user, user2: connection },
        { user1: connection, user2: user },
      ],
    });
    if (connect === null) {
      throw new FriendNotFoundError(user, connection);
    }
    return { msg: "Deleted Connection!" };
  }

  async mutuals(user: ObjectId, connection: ObjectId) {
    const mutuals = await this.connections.readMany({
      //find users who has connections with both user and connections
      $and: [
        {
          $or: [
            //either which user as 1 or 2
            { user1: user },
            { user2: user },
          ],
        },
        {
          $or: [
            //either with connection as 1 or 2
            { user1: connection },
            { user2: connection },
          ],
        },
      ],
    });
    return mutuals;
  }

  async displayConnections(user: ObjectId) {
    const connections = await this.connections.readMany({
      $or: [{ user1: user }, { user2: user }],
    });
    return connections.map((connection) => (connection.user1.toString() === user.toString() ? connection.user2 : connection.user1));
  }

  private async assertNotFriends(user1: ObjectId, user2: ObjectId) {
    const isFriends = await this.connections.readOne({
      $and: [
        { user1: user1, user2: user2 },
        { user1: user2, user2: user1 },
      ],
    });
    if (isFriends !== null) {
      throw new AlreadyConnectedError(user1, user2);
    }
  }
}

export class AlreadyConnectedError extends NotAllowedError {
  constructor(
    public readonly user1: ObjectId,
    public readonly user2: ObjectId,
  ) {
    super("{0} and {1} are already friends!", user1, user2);
  }
}

export class FriendNotFoundError extends NotFoundError {
  constructor(
    public readonly user1: ObjectId,
    public readonly user2: ObjectId,
  ) {
    super("Friendship between {0} and {1} does not exist!", user1, user2);
  }
}
