import { ObjectId } from "mongodb";
import DocCollection, { BaseDoc } from "../framework/doc";
import { BadValuesError, NotFoundError } from "./errors";

//need to determine how to do system scan, or whether i want to implement that as a manual user action instead

export interface ExplicitContentDoc extends BaseDoc {
  //consentType
  content: ObjectId;
  consent: Boolean;
  sender: ObjectId;
  receiver: ObjectId;
}

export default class ConsentSurveyConcept {
  public readonly content: DocCollection<ExplicitContentDoc>;

  constructor(collectionName: string) {
    this.content = new DocCollection<ExplicitContentDoc>(collectionName);
  }

  //survey? automatic?
  async indicateConsent(content: ObjectId, consent: Boolean, sender: ObjectId, receiver: ObjectId) {
    await this.assertValidConsent(consent);
    await this.content.partialUpdateOne({ content: content }, { consent: consent, sender: sender, receiver: receiver });
    return { msg: "Non-consensual Content Captured!" };
  }

  async getConsent(content: ObjectId) {
    const message = await this.content.readOne({ content: content });
    if (!message) {
      throw new NotFoundError(`Message not found!`);
    }
    return message.consent;
  }

  private assertValidConsent(consent: Boolean) {
    if (consent === null || typeof consent === "boolean") {
      throw new BadValuesError("Consent must be non-empty and boolean!");
    }
  }
}
