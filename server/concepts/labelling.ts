import { ObjectId } from "mongodb";
import DocCollection, { BaseDoc } from "../framework/doc";
import { BadValuesError, NotAllowedError, NotFoundError } from "./errors";

export interface ItemDoc extends BaseDoc {
  //itemType
  owner: ObjectId;
  item: ObjectId;
  label: string;
}

export default class LabelConcept {
  public readonly items: DocCollection<ItemDoc>;

  constructor(collectionName: string) {
    this.items = new DocCollection<ItemDoc>(collectionName);
    // Create index on item to make search queries for it performant
    void this.items.collection.createIndex({ item: 1 });
  }

  async addLabel(owner: ObjectId, item: ObjectId, label: string) {
    await this.assertGoodLabel(label);
    await this.assertLabelUnique(label);
    const _id = await this.items.createOne({ owner, item, label });
    return { _id, msg: "Label added successfully!" };
  }

  async getItemsByLabel(label: string) {
    const items = await this.items.readMany({ label: label });
    if (!items) {
      throw new NotFoundError(`Items not found!`);
    }
    return items;
  }

  async removeLabel(item: ObjectId) {
    await this.assertHasLabel(item);
    await this.items.deleteOne({ item });
    return { msg: "Label removed successfully!" };
  }

  private async assertGoodLabel(label: string) {
    if (!label) {
      throw new BadValuesError("Label must be non-empty!");
    }
  }

  private async assertLabelUnique(label: string) {
    if (await this.items.readOne({ label })) {
      throw new NotAllowedError(`User with username ${label} already exists!`);
    }
  }

  private async assertHasLabel(message: ObjectId) {
    const item = await this.items.readOne({ message: message });
    if (!item) {
      throw new NotFoundError(`Item does not exist!`);
    }
    if (!item.label) {
      throw new NotFoundError(`Label does not exist for this item: ${item}!`);
    }
  }
}
