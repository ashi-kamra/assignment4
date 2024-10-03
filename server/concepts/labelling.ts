import { ObjectId } from "mongodb";
import DocCollection, { BaseDoc } from "../framework/doc";
import { BadValuesError, NotAllowedError, NotFoundError } from "./errors";

export interface ItemDoc extends BaseDoc {
  //itemType
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

  async addLabel(item: ObjectId, label: string) {
    await this.assertGoodLabel(label);
    await this.assertLabelUnique(label);
    const _id = await this.items.createOne({ item, label });
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
}
