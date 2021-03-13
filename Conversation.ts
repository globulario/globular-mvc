
import { Conversation, ConnectRequest, Conversations, CreateConversationRequest, Message, CreateConversationResponse, DeleteConversationRequest, DeleteConversationResponse, FindConversationsRequest, FindConversationsResponse, JoinConversationRequest, JoinConversationResponse, ConnectResponse, SendMessageRequest, SendMessageResponse, SendInvitationRequest, Invitation, Invitations, GetReceivedInvitationsRequest, GetReceivedInvitationsResponse, AcceptInvitationRequest, DeclineInvitationRequest, GetSentInvitationsRequest, GetSentInvitationsResponse, RevokeInvitationRequest, RevokeInvitationResponse, LeaveConversationRequest, LeaveConversationResponse } from "globular-web-client/conversation/conversation_pb";
import { GetConversationsRequest, GetConversationsResponse } from "globular-web-client/conversation/conversation_pb";

import { Account } from "./Account";
import { Model } from "./Model";
import { v4 as uuidv4 } from "uuid";
import { GetResourcePermissionsRsp } from "globular-web-client/rbac/rbac_pb";
import {encode, decode} from 'uint8-to-base64';

export class ConversationManager {
  public static uuid: string;

  constructor() {

  }


  static connect(successCallback: (uuid: string) => void, errorCallback: (err: any) => void) {
    ConversationManager.uuid = uuidv4();
    let rqst = new ConnectRequest
    rqst.setUuid(ConversationManager.uuid)

    // This will open the connection with the conversation manager.
    let stream = Model.globular.conversationService.connect(rqst, {
      token: localStorage.getItem("user_token"),
      application: Model.application,
      domain: Model.domain,
    })

    stream.on("data", (rsp: ConnectResponse) => {
      /** Local event... */
      Model.globular.eventHub.publish( `__received_message_${rsp.getMessage().getConversation()}_evt__`, rsp.getMessage(), true)
    });

    stream.on("status", (status) => {
      if (status.code != 0) {
        errorCallback(status.details)
      }
    });

  }

  /**
   * Create a new conversation.
   * @param name 
   * @param keywords 
   * @param language 
   * @param succesCallback 
   * @param errorCallback 
   */
  static createConversation(name: string, keywords: Array<string>, language: any, succesCallback: (conversation: Conversation) => void, errorCallback: (err: any) => void) {
    let rqst = new CreateConversationRequest
    rqst.setName(name)
    rqst.setKeywordsList(keywords)
    rqst.setLanguage("en")

    Model.globular.conversationService.createConversation(rqst, {
      token: localStorage.getItem("user_token"),
      application: Model.application,
      domain: Model.domain,
    }).then((rsp: CreateConversationResponse) => {
      succesCallback(rsp.getConversation())
    }).catch((err: any) => {

      errorCallback(err)
    })
  }

  /**
   * Load conversations of a given account.
   * @param account Must by the logged account.
   * @param succesCallback Return the list of conversation owned by the account.
   * @param errorCallback Error if any.
   */
  static loadConversation(account: Account, succesCallback: (conversations: Conversations) => void, errorCallback: (err: any) => void) {
    let rqst = new GetConversationsRequest
    rqst.setCreator(account.name);

    Model.globular.conversationService.getConversations(rqst, {
      token: localStorage.getItem("user_token"),
      application: Model.application,
      domain: Model.domain,
    }).then((rsp: GetConversationsResponse) => {
      succesCallback(rsp.getConversations())
    }).catch((err: any) => {
      errorCallback(err)
    })
  }

  static deleteConversation(conversationUuid: string, succesCallback: () => void, errorCallback: (err: any) => void) {
    let rqst = new DeleteConversationRequest
    rqst.setConversationUuid(conversationUuid)

    Model.globular.conversationService.deleteConversation(rqst, {
      token: localStorage.getItem("user_token"),
      application: Model.application,
      domain: Model.domain,
    }).then((rsp: DeleteConversationResponse) => {
      succesCallback()

    }).catch((err: any) => {
      errorCallback(err)
    })
  }

  static findConversations(query: string, succesCallback: (conversations: Conversation[]) => void, errorCallback: (err: any) => void) {
    let rqst = new FindConversationsRequest
    rqst.setQuery(query)
    rqst.setOffset(0)
    rqst.setLanguage(window.navigator.language.split("-")[0])
    rqst.setPagesize(500);
    rqst.setSnippetsize(500); // not realy necessary here...

    Model.globular.conversationService.findConversations(rqst, {
      token: localStorage.getItem("user_token"),
      application: Model.application,
      domain: Model.domain,
    }).then((rsp: FindConversationsResponse) => {
      succesCallback(rsp.getConversationsList())
    }).catch((err: any) => {
      errorCallback(err)
    })
  }

  static joinConversation(conversationUuid: string, succesCallback: (messages: Message[]) => void, errorCallback: (err: any) => void) {
    let rqst = new JoinConversationRequest
    rqst.setConnectionUuid(ConversationManager.uuid)
    rqst.setConversationUuid(conversationUuid)

    let stream = Model.globular.conversationService.joinConversation(rqst, {
      token: localStorage.getItem("user_token"),
      application: Model.application,
      domain: Model.domain,
    })

    // Now I will get existing message from the conversation.
    var messages = new Array<Message>();

    stream.on("data", (rsp: JoinConversationResponse) => {
      messages.push(rsp.getMsg())
    });

    stream.on("status", (status) => {

      if (status.code == 0) {
        succesCallback(messages)
      } else {
        // No message found...
        if(status.details == "EOF"){
          succesCallback(messages)
          return
        }
        // An error happen
        errorCallback(status.details)
      }
    });

  }

  // leave the conversation.
  static leaveConversation(conversation:string, successCallback :()=>void, errorCallback:(err:any)=>void){
    let rqst = new LeaveConversationRequest
    rqst.setConversationUuid(conversation)
    rqst.setConnectionUuid(ConversationManager.uuid)

    Model.globular.conversationService.leaveConversation(rqst, {
      token: localStorage.getItem("user_token"),
      application: Model.application,
      domain: Model.domain,
    }).then((rsp:LeaveConversationResponse)=>{
      successCallback();
    }).catch(errorCallback)
  }

  // Send a conversation invitation to a given user.
  static sendConversationInvitation(conversation:string, name: string, from: string, to: string, successCallback :()=>void, errorCallback:(err:any)=>void){
    let rqst = new SendInvitationRequest
    let invitation = new Invitation
    invitation.setFrom(from)
    invitation.setTo(to)
    invitation.setConversation(conversation)
    invitation.setName(name)
    rqst.setInvitation(invitation)

    Model.globular.conversationService.sendInvitation(rqst, {
      token: localStorage.getItem("user_token"),
      application: Model.application,
      domain: Model.domain,
    }).then((rsp:SendMessageResponse)=>{
      /** Nothing to do here... */
      successCallback()
      const encoded = encode(invitation.serializeBinary());
      // publish network event.
      Model.eventHub.publish(`send_conversation_invitation_${from}_evt`, encoded, false)
      Model.eventHub.publish(`receive_conversation_invitation_${to}_evt`, encoded, false)
    }).catch(errorCallback)
  }

  /**
   * Get the list of received invitations.
   * @param accountId The account id
   * @param successCallback 
   * @param errorCallback 
   */
  static getReceivedInvitations(accountId: string, successCallback :(invitation: Array<Invitation>)=>void, errorCallback:(err:any)=>void){
    let rqst = new GetReceivedInvitationsRequest
    rqst.setAccount(accountId);
    Model.globular.conversationService.getReceivedInvitations(rqst, {
      token: localStorage.getItem("user_token"),
      application: Model.application,
      domain: Model.domain,
    }).then((rsp:GetReceivedInvitationsResponse)=>{
      /** Nothing to do here... */
      successCallback(rsp.getInvitations().getInvitationsList())

    }).catch(errorCallback)
  }

  /**
   * Get the list of sent invitations.
   * @param accountId The account id
   * @param successCallback 
   * @param errorCallback 
   */
  static getSentInvitations(accountId: string, successCallback :(invitation: Array<Invitation>)=>void, errorCallback:(err:any)=>void){
    let rqst = new GetSentInvitationsRequest
    rqst.setAccount(accountId);
    Model.globular.conversationService.getSentInvitations(rqst, {
      token: localStorage.getItem("user_token"),
      application: Model.application,
      domain: Model.domain,
    }).then((rsp:GetSentInvitationsResponse)=>{
      /** Nothing to do here... */
      successCallback(rsp.getInvitations().getInvitationsList())

    }).catch(errorCallback)
  }

  /**
   * Conversation invitation is accepted!
   * @param invitation The invitation
   * @param successCallback The success callback.
   * @param errorCallback The error callback.
   */
  static acceptConversationInvitation(invitation:Invitation, successCallback: ()=>void, errorCallback: (err:any)=>void){
    let rqst = new AcceptInvitationRequest
    rqst.setInvitation(invitation);
    Model.globular.conversationService.acceptInvitation(rqst, {
      token: localStorage.getItem("user_token"),
      application: Model.application,
      domain: Model.domain,
    }).then((rsp:AcceptInvitationRequest)=>{
      /** Nothing to do here... */
      successCallback()

    }).catch(errorCallback)
  }

  /**
   * The conversation invitation was declined!
   * @param invitation The invitation.
   * @param successCallback The success callback
   * @param errorCallback The error callback
   */
  static declineConversationInvitation(invitation:Invitation, successCallback: ()=>void, errorCallback: (err:any)=>void){
    let rqst = new DeclineInvitationRequest
    rqst.setInvitation(invitation);
    Model.globular.conversationService.declineInvitation(rqst, {
      token: localStorage.getItem("user_token"),
      application: Model.application,
      domain: Model.domain,
    }).then((rsp:AcceptInvitationRequest)=>{
      /** Nothing to do here... */
      successCallback()
    }).catch(errorCallback)
  }

  static revokeConversationInvitation(invitation:Invitation, successCallback: ()=>void, errorCallback: (err:any)=>void){
    let rqst = new RevokeInvitationRequest
    rqst.setInvitation(invitation);
    Model.globular.conversationService.revokeInvitation(rqst, {
      token: localStorage.getItem("user_token"),
      application: Model.application,
      domain: Model.domain,
    }).then((rsp:RevokeInvitationResponse)=>{
      /** Nothing to do here... */
      successCallback()
    }).catch(errorCallback)
  }

  static sendMessage(conversationUuid: string, author: string, text:string, replyTo:string, successCallback :()=>void, errorCallback:(err:any)=>void){

    let rqst = new SendMessageRequest
    let message = new Message
    message.setUuid(uuidv4())
    message.setConversation(conversationUuid)
    message.setText(text)
    message.setInReplyTo(replyTo)
    message.setCreationTime(new Date().getTime());
    message.setAuthor(author);
    message.setLanguage(window.navigator.language.split("-")[0]);

    rqst.setMsg(message)

    Model.globular.conversationService.sendMessage(rqst, {
      token: localStorage.getItem("user_token"),
      application: Model.application,
      domain: Model.domain,
    }).then((rsp:SendMessageResponse)=>{
      /** Nothing to do here... */
      console.log("----> message was sent!", message)

    }).catch(errorCallback)
    
  }
}