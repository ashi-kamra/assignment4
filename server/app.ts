import AuthenticatingConcept from "./concepts/authenticating";
import FriendingConcept from "./concepts/friending";
import SessioningConcept from "./concepts/sessioning";

//NEW concepts
import ConnectingConcept from "./concepts/connecting";
import ConsentSurveyConcept from "./concepts/consentSurvey";
import LabelConcept from "./concepts/labelling";
import MessageConcept from "./concepts/messaging";
import UserConcept from "./concepts/user";

// The app is a composition of concepts instantiated here
// and synchronized together in `routes.ts`.
export const Sessioning = new SessioningConcept();
export const Authing = new AuthenticatingConcept("users");
export const Friending = new FriendingConcept("friends");

//NEW
export const User = new UserConcept("users");
export const Messaging = new MessageConcept("messages");
export const Labelling = new LabelConcept("labeled");
export const Consenting = new ConsentSurveyConcept("content"); //change title
export const Connecting = new ConnectingConcept("connections");
