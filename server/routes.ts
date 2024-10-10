import { Router, getExpressRouter } from "./framework/router";

import { Authing, Connecting, Consenting, Friending, Labelling, Messaging, Sessioning, User } from "./app";
import { SessionDoc } from "./concepts/sessioning";
import Responses from "./responses";

import { ObjectId } from "mongodb";
import { z } from "zod";

/**
 * Web server routes for the app. Implements synchronizations between concepts.
 */
class Routes {
  // Synchronize the concepts from `app.ts`.

  @Router.get("/session")
  async getSessionUser(session: SessionDoc) {
    const user = Sessioning.getUser(session);
    return await Authing.getUserById(user);
  }

  @Router.get("/users")
  async getUsers() {
    return await Authing.getUsers();
  }

  @Router.get("/users/:username")
  @Router.validate(z.object({ username: z.string().min(1) }))
  async getUser(username: string) {
    return await Authing.getUserByUsername(username);
  }

  @Router.post("/users")
  async createUser(session: SessionDoc, username: string, password: string) {
    Sessioning.isLoggedOut(session);
    return await Authing.create(username, password);
  }

  @Router.patch("/users/username")
  async updateUsername(session: SessionDoc, username: string) {
    const user = Sessioning.getUser(session);
    return await Authing.updateUsername(user, username);
  }

  @Router.patch("/users/password")
  async updatePassword(session: SessionDoc, currentPassword: string, newPassword: string) {
    const user = Sessioning.getUser(session);
    return Authing.updatePassword(user, currentPassword, newPassword);
  }

  @Router.delete("/users")
  async deleteUser(session: SessionDoc) {
    const user = Sessioning.getUser(session);
    Sessioning.end(session);
    return await Authing.delete(user);
  }

  @Router.post("/login")
  async logIn(session: SessionDoc, username: string, password: string) {
    const u = await Authing.authenticate(username, password);
    Sessioning.start(session, u._id);
    return { msg: "Logged in!" };
  }

  @Router.post("/logout")
  async logOut(session: SessionDoc) {
    Sessioning.end(session);
    return { msg: "Logged out!" };
  }

  @Router.get("/friends")
  async getFriends(session: SessionDoc) {
    const user = Sessioning.getUser(session);
    return await Authing.idsToUsernames(await Friending.getFriends(user));
  }

  @Router.delete("/friends/:friend")
  async removeFriend(session: SessionDoc, friend: string) {
    const user = Sessioning.getUser(session);
    const friendOid = (await Authing.getUserByUsername(friend))._id;
    return await Friending.removeFriend(user, friendOid);
  }

  @Router.get("/friend/requests")
  async getRequests(session: SessionDoc) {
    const user = Sessioning.getUser(session);
    return await Responses.friendRequests(await Friending.getRequests(user));
  }

  @Router.post("/friend/requests/:to")
  async sendFriendRequest(session: SessionDoc, to: string) {
    const user = Sessioning.getUser(session);
    const toOid = (await Authing.getUserByUsername(to))._id;
    return await Friending.sendRequest(user, toOid);
  }

  @Router.delete("/friend/requests/:to")
  async removeFriendRequest(session: SessionDoc, to: string) {
    const user = Sessioning.getUser(session);
    const toOid = (await Authing.getUserByUsername(to))._id;
    return await Friending.removeRequest(user, toOid);
  }

  @Router.put("/friend/accept/:from")
  async acceptFriendRequest(session: SessionDoc, from: string) {
    const user = Sessioning.getUser(session);
    const fromOid = (await Authing.getUserByUsername(from))._id;
    return await Friending.acceptRequest(fromOid, user);
  }

  @Router.put("/friend/reject/:from")
  async rejectFriendRequest(session: SessionDoc, from: string) {
    const user = Sessioning.getUser(session);
    const fromOid = (await Authing.getUserByUsername(from))._id;
    return await Friending.rejectRequest(fromOid, user);
  }

  ////NEWLY ADDED ROUTES///
  @Router.post("/user/register")
  async registerUser(session: SessionDoc, username: string) {
    //registering a user
    Sessioning.isLoggedOut(session);
    return await User.registerUser(username);
  }

  @Router.patch("/users/username")
  async changeUsername(session: SessionDoc, username: string) {
    ///use sessioning????
    const sessionUser = Sessioning.getUser(session); //which get user do i use??? what is the difference
    const user = await User.getUserInfo(sessionUser);
    return await User.updateUsername(user._id, username);
  }

  @Router.get("/homepage")
  async homepage(session: SessionDoc) {
    const sessionUser = Sessioning.getUser(session);
    const user = await User.getUserInfo(sessionUser);
    return await Connecting.displayConnections(user._id);
    //displaying a users homepage
  }

  @Router.post("/connector")
  async connect(session: SessionDoc, user2_id: string) {
    const sessionUser = Sessioning.getUser(session);
    const user1 = await User.getUserInfo(sessionUser);
    const user2 = await User.getUserbyId(user2_id);
    return await Connecting.makeConnection(user1._id, user2._id);

    //making a new connection
  }

  @Router.post("/connection/message")
  async message(session: SessionDoc, message: ObjectId, receiver: string) {
    const sessionUser = Sessioning.getUser(session);
    const user = await User.getUserInfo(sessionUser);
    const user2 = await User.getUserbyName(receiver);
    return await Messaging.sendMessage(message, user._id, user2._id);
    //messaging a connection
  }

  @Router.put("/consent")
  async consentSurvey(session: SessionDoc, message: ObjectId, consent: Boolean) {
    const sessionUser = Sessioning.getUser(session);
    const user = await User.getUserInfo(sessionUser);
    await Messaging.assertOwner(user._id, message);
    const content = await Messaging.getMessage(message);
    await Consenting.indicateConsent(content._id, consent, content.sender, content.receiver);
    const userConsent = await Consenting.getConsent(content._id);
    if (userConsent === false) {
      await Messaging.delete(user._id, message);
    }
    //conducting consent survey
  }

  @Router.put("/echo/add")
  async addEcho(session: SessionDoc, label: string, message: ObjectId) {
    const sessionUser = Sessioning.getUser(session); //which get user do i use??? what is the difference
    const user = await User.getUserInfo(sessionUser);
    await Messaging.assertOwner(user._id, message);
    return await Labelling.addLabel(user._id, message, label);
    //adding a label to a message
  }

  @Router.delete("/echo/remove")
  async removeEcho(session: SessionDoc, message: ObjectId) {
    const sessionUser = Sessioning.getUser(session);
    const user = await User.getUserInfo(sessionUser);
    await Messaging.assertOwner(user._id, message);
    return await Labelling.removeLabel(message);
    //removing a label to a message
  }
}

/** The web app. */
export const app = new Routes();

/** The Express router. */
export const appRouter = getExpressRouter(app);
