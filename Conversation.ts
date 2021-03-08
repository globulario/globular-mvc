
import { Conversation, ConnectRequest, Conversations, CreateConversationRequest, Message, CreateConversationResponse, DeleteConversationRequest, DeleteConversationResponse, FindConversationsRequest, FindConversationsResponse, JoinConversationRequest, JoinConversationResponse, ConnectResponse, SendMessageRequest, SendMessageResponse, SendInvitationRequest, Invitation } from "globular-web-client/conversation/conversation_pb";
import { GetConversationsRequest, GetConversationsResponse } from "globular-web-client/conversation/conversation_pb";

import { Account } from "./Account";
import { Model } from "./Model";
import { v4 as uuidv4 } from "uuid";

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

  // Send a conversation invitation to a given user.
  static sendConversationInvitation(conversation:string, from: string, to: string, successCallback :()=>void, errorCallback:(err:any)=>void){
    let rqst = new SendInvitationRequest
    let invitation = new Invitation
    invitation.setFrom(from)
    invitation.setTo(to)
    invitation.setConversation(conversation)
    rqst.setInvitation(invitation)

    Model.globular.conversationService.sendInvitation(rqst, {
      token: localStorage.getItem("user_token"),
      application: Model.application,
      domain: Model.domain,
    }).then((rsp:SendMessageResponse)=>{
      /** Nothing to do here... */
      successCallback()

    }).catch(errorCallback)
  }

  static sendMessage(conversationUuid: string, author: string, text:string, replyTo:string, successCallback :()=>void, errorCallback:()=>void){

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