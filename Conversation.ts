
import { Conversation, ConnectRequest, Conversations, CreateConversationRequest, Message, CreateConversationResponse, DeleteConversationRequest, DeleteConversationResponse, FindConversationsRequest, FindConversationsResponse, JoinConversationRequest, JoinConversationResponse, ConnectResponse, SendMessageRequest, SendMessageResponse, SendInvitationRequest, Invitation, Invitations, GetReceivedInvitationsRequest, GetReceivedInvitationsResponse, AcceptInvitationRequest, DeclineInvitationRequest, GetSentInvitationsRequest, GetSentInvitationsResponse, RevokeInvitationRequest, RevokeInvitationResponse, LeaveConversationRequest, LeaveConversationResponse, KickoutFromConversationRequest, LikeMessageRqst, DisconnectRequest, DislikeMessageRqst, LikeMessageResponse, DislikeMessageResponse, DeleteMessageRequest, DeleteMessageResponse } from "globular-web-client/conversation/conversation_pb";
import { GetConversationsRequest, GetConversationsResponse } from "globular-web-client/conversation/conversation_pb";

import { Account } from "./Account";
import { generatePeerToken, Model } from "./Model";
import { v4 as uuidv4 } from "uuid";
import { encode } from 'uint8-to-base64';
import { Application } from "./Application";
import { Globular } from "globular-web-client";

export class ConversationManager {
  public static uuid: string;
  private static conversations: Map<string, Conversation> = new Map<string, Conversation>()

  constructor() {

  }

  // Open conversation channels with each globule.
  static connect(errorCallback: (err: any) => void) {

    let __connect__ = (globule:Globular)=>{
      generatePeerToken(globule, token => {
        // This will open the connection with the conversation manager.
        let rqst = new ConnectRequest
        rqst.setUuid(ConversationManager.uuid)
        let stream = globule.conversationService.connect(rqst, {
          token: token,
          application: Model.application,
          domain: Model.domain,
          address: Model.address
        })

        stream.on("data", (rsp: ConnectResponse) => {
          /** Local event... */
          Model.globular.eventHub.publish(`__received_message_${rsp.getMsg().getConversation()}_evt__`, rsp.getMsg(), true)
        });

        stream.on("status", (status) => {
          if (status.code != 0) {
            errorCallback(status.details)
          }
        });
      }, errorCallback)
    }
    ConversationManager.uuid = uuidv4();

    Model.getGlobules().forEach(globule => {
      __connect__(globule)

    })

    // connect / reconnect to globule that get online.
    Model.eventHub.subscribe("start_peer_evt_", uuid => { }, evt => {
      let globule = Model.getGlobule(evt.getDomain())
      __connect__(globule)
    }, false)
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
      address: Model.address
    }).then((rsp: CreateConversationResponse) => {
      succesCallback(rsp.getConversation())
    }).catch(errorCallback)
  }

  /**
   * Load conversations of a given account.
   * @param account Must by the logged account.
   * @param succesCallback Return the list of conversation owned by the account.
   * @param errorCallback Error if any.
   */
  private static loadConversations_(globule: Globular, account: Account, succesCallback: (conversations: Conversations) => void, errorCallback: (err: any) => void) {
    let rqst = new GetConversationsRequest
    rqst.setCreator(account.id + "@" + account.domain);

    globule.conversationService.getConversations(rqst, {
      token: localStorage.getItem("user_token"),
      application: Model.application,
      domain: Model.domain,
      address: Model.address
    }).then((rsp: GetConversationsResponse) => {

      // Keep conversation in the map...
      rsp.getConversations().getConversationsList().forEach((conversation: Conversation) => {
        ConversationManager.conversations.set(conversation.getUuid(), conversation)
      });

      succesCallback(rsp.getConversations())
    }).catch((err: any) => {
      // return an empty conversation array...
      succesCallback(new Conversations)
    })
  }


  static loadConversations(account: Account, succesCallback: (conversations: Array<Conversation>) => void, errorCallback: (err: any) => void) {
    let globules = Model.getGlobules()
    let conversations = new Array<Conversation>()

    let loadConversations = () => {
      let globule = globules.pop()
      ConversationManager.loadConversations_(globule, account, (converstions_) => {
        conversations = conversations.concat(converstions_.getConversationsList())
        if (globules.length > 0) {
          loadConversations()
        } else {
          succesCallback(conversations)
        }
      }, err => {
        if (globules.length > 0) {
          console.log(err)
          loadConversations()
        } else {
          succesCallback(conversations)
        }
      })
    }

    // call once
    loadConversations()
  }

  static deleteConversation(conversation: Conversation, succesCallback: () => void, errorCallback: (err: any) => void) {

    let globule = Model.getGlobule(conversation.getMac())
    let conversationUuid = conversation.getUuid()
    let rqst = new DeleteConversationRequest
    rqst.setConversationUuid(conversationUuid)

    globule.conversationService.deleteConversation(rqst, {
      token: localStorage.getItem("user_token"),
      application: Model.application,
      domain: Model.domain,
      address: Model.address
    }).then((rsp: DeleteConversationResponse) => {
      succesCallback()

      // remove it from the map...
      ConversationManager.conversations.delete(conversation.getUuid())

      // Here the conversation has been deleted...
      // Model.eventHub.publish(`delete_conversation_${conversationUuid}_evt`, conversationUuid, false)
      Model.eventHub.publish(`__delete_conversation_${conversationUuid}_evt__`, conversationUuid, true)

    }).catch((err: any) => {
      succesCallback()
      Model.eventHub.publish(`__leave_conversation_evt__`, conversationUuid, true)

      Model.eventHub.publish(`__delete_conversation_${conversationUuid}_evt__`, conversationUuid, true)
    })
  }

  static kickoutFromConversation(conversation: Conversation, account: string, succesCallback: () => void, errorCallback: (err: any) => void) {
    let globule = Model.getGlobule(conversation.getMac())
    generatePeerToken(globule, token => {
      let conversationUuid = conversation.getUuid()
      let rqst = new KickoutFromConversationRequest
      rqst.setConversationUuid(conversationUuid)
      rqst.setAccount(account)
      globule.conversationService.kickoutFromConversation(rqst, {
        token: token,
        application: Model.application,
        domain: Model.domain,
        address: Model.address
      }).then((rsp: DeleteConversationResponse) => {
        succesCallback()
        Model.publish(`kickout_conversation_${conversationUuid}_evt`, { accountId: account, conversationUuid: conversationUuid }, false)
      }).catch(errorCallback)
    }, errorCallback)
  }

  private static findConversations_(globule: Globular, query: string, succesCallback: (conversations: Conversation[]) => void, errorCallback: (err: any) => void) {

    generatePeerToken(globule, token => {

      let rqst = new FindConversationsRequest
      rqst.setQuery(query)
      rqst.setOffset(0)
      rqst.setLanguage(window.navigator.language.split("-")[0])
      rqst.setPagesize(500);
      rqst.setSnippetsize(500); // not realy necessary here...

      globule.conversationService.findConversations(rqst, {
        token: token,
        application: Model.application,
        domain: Model.domain,
        address: Model.address
      }).then((rsp: FindConversationsResponse) => {
        succesCallback(rsp.getConversationsList())
      }).catch((err: any) => {
        errorCallback(err)
      })
    }, errorCallback)
  }

  static findConversations(query: string, successCallback: (conversations: Conversation[]) => void, errorCallback: (err: any) => void) {
    let globules = Model.getGlobules()
    let conversations = new Array<Conversation>()

    let findConversations = () => {
      let globule = globules.pop()

      ConversationManager.findConversations_(globule, query,
        conversations_ => {
          conversations = conversations.concat(conversations_)
          if (globules.length > 0) {
            findConversations()
          } else {
            successCallback(conversations)
          }
        },
        err => {
          if (globules.length > 0) {
            findConversations()
          } else {
            if (conversations.length > 0) {
              successCallback(conversations)
            } else {
              errorCallback(err)
            }
          }
        })
    }

    findConversations()
  }

  /**
   * Join a conversation
   * @param conversation The conversation with given uuid
   * @param succesCallback On success callback
   * @param errorCallback On error callback
   */
  static joinConversation(conversation: Conversation, succesCallback: (conversation: Conversation, messages: Message[]) => void, errorCallback: (err: any) => void) {

    let globule = Model.getGlobule(conversation.getMac())

    generatePeerToken(globule, token => {
      let conversationUuid = conversation.getUuid()

      let rqst = new JoinConversationRequest
      rqst.setConnectionUuid(ConversationManager.uuid)
      rqst.setConversationUuid(conversationUuid)

      let stream = globule.conversationService.joinConversation(rqst, {
        token: token,
        application: Model.application,
        domain: Model.domain,
        address: Model.address
      })

      // Now I will get existing message from the conversation.
      var messages = new Array<Message>();

      stream.on("data", (rsp: JoinConversationResponse) => {
        if (rsp.getConversation() != undefined) {
          conversation = rsp.getConversation();
        }
        if (rsp.getMsg() != undefined) {
          messages.push(rsp.getMsg())
        }
      });

      stream.on("status", (status) => {

        if (status.code == 0) {
          succesCallback(conversation, messages)

          let participants = conversation.getParticipantsList()

          // network event.
          Model.getGlobule(conversation.getMac()).eventHub.publish(`ready_conversation_${conversationUuid}_evt`, JSON.stringify({ "participants": participants, "participant": Application.account.id + "@" + Application.account.domain }), false)

        } else {
          // No message found...
          if (status.details == "EOF") {
            succesCallback(conversation, messages)
            let participants = conversation.getParticipantsList()
            // network event.
            Model.getGlobule(conversation.getMac()).eventHub.publish(`leave_conversation_${conversationUuid}_evt`, JSON.stringify({ "conversationUuid": conversation.getUuid(), "participants": participants, "participant": Application.account.id + "@" + Application.account.domain }), false)
            return
          }
          // An error happen
          errorCallback(status.details)
        }
      })
    }, errorCallback)

  }


  // leave the conversation.
  static leaveConversation(conversation: Conversation, successCallback: () => void, errorCallback: (err: any) => void) {

    let globule = Model.getGlobule(conversation.getMac())

    generatePeerToken(globule, token => {
      let conversationUuid = conversation.getUuid()

      let rqst = new LeaveConversationRequest
      rqst.setConversationUuid(conversationUuid)
      rqst.setConnectionUuid(ConversationManager.uuid)

      globule.conversationService.leaveConversation(rqst, {
        token: token,
        application: Model.application,
        domain: Model.domain,
        address: Model.address
      }).then((rsp: LeaveConversationResponse) => {
        successCallback();
        let participants = rsp.getConversation().getParticipantsList()

        // network event.
        Model.getGlobule(conversation.getMac()).eventHub.publish(`leave_conversation_${conversationUuid}_evt`, JSON.stringify({ "conversationUuid": conversation.getUuid(), "participants": participants, "participant": Application.account.id + "@" + Application.account.domain }), false)

      }).catch(errorCallback)
    }, errorCallback)
  }

  // Send a conversation invitation to a given user.
  static sendConversationInvitation(conversation: Conversation, from: string, to: string, successCallback: () => void, errorCallback: (err: any) => void) {

    let globule = Model.getGlobule(conversation.getMac())
    generatePeerToken(globule, token => {
      let rqst = new SendInvitationRequest
      let invitation = new Invitation
      invitation.setFrom(from)
      invitation.setTo(to)
      invitation.setConversation(conversation.getUuid())
      invitation.setName(conversation.getName())
      invitation.setMac(conversation.getMac())
      rqst.setInvitation(invitation)

      globule.conversationService.sendInvitation(rqst, {
        token: token,
        application: Model.application,
        domain: Model.domain,
        address: Model.address
      }).then((rsp: SendMessageResponse) => {
        /** Nothing to do here... */
        successCallback()
        const encoded = encode(invitation.serializeBinary());

        // publish network event.
        Model.publish(`send_conversation_invitation_${from}_evt`, encoded, false)
        Model.publish(`receive_conversation_invitation_${to}_evt`, encoded, false)

      }).catch(errorCallback)
    }, errorCallback)
  }

  /**
   * Get the list of received invitations.
   * @param accountId The account id
   * @param successCallback 
   * @param errorCallback 
   */
  private static getReceivedInvitations_(globule: Globular, accountId: string, successCallback: (invitations: Array<Invitation>) => void, errorCallback: (err: any) => void) {
    generatePeerToken(globule, token => {
      let rqst = new GetReceivedInvitationsRequest
      rqst.setAccount(accountId);
      globule.conversationService.getReceivedInvitations(rqst, {
        token: token,
        application: Model.application,
        domain: Model.domain,
        address: Model.address
      }).then((rsp: GetReceivedInvitationsResponse) => {
        /** Nothing to do here... */
        successCallback(rsp.getInvitations().getInvitationsList())

      }).catch((err: any) => {
        successCallback([])
      })
    }, errorCallback)
  }


  static getReceivedInvitations(accountId: string, successCallback: (invitations: Array<Invitation>) => void, errorCallback: (err: any) => void) {
    let globules = Model.getGlobules()
    let invitations = new Array<Invitation>()

    let getReceivedInvitations = () => {
      let globule = globules.pop()


      ConversationManager.getReceivedInvitations_(globule, accountId,
        invitations_ => {
          invitations = invitations.concat(invitations_)
          if (globules.length > 0) {
            getReceivedInvitations()
          } else {
            successCallback(invitations)
          }
        },
        err => {
          console.log(err)
          if (globules.length > 0) {
            getReceivedInvitations()
          } else {
            successCallback(invitations)
          }
        })
    }

    getReceivedInvitations()
  }

  /**
   * Get the list of sent invitations.
   * @param accountId The account id
   * @param successCallback 
   * @param errorCallback 
   */
  private static getSentInvitations_(globule: Globular, accountId: string, successCallback: (invitation: Array<Invitation>) => void, errorCallback: (err: any) => void) {
    generatePeerToken(globule, token => {
      let rqst = new GetSentInvitationsRequest
      rqst.setAccount(accountId);
      globule.conversationService.getSentInvitations(rqst, {
        token: token,
        application: Model.application,
        domain: Model.domain,
        address: Model.address
      }).then((rsp: GetSentInvitationsResponse) => {
        /** Nothing to do here... */
        successCallback(rsp.getInvitations().getInvitationsList())
      }).catch((err: any) => {
        successCallback([])
      })
    }, errorCallback)
  }

  static getSentInvitations(accountId: string, successCallback: (invitation: Array<Invitation>) => void, errorCallback: (err: any) => void) {
    let globules = Model.getGlobules()
    let invitations = new Array<Invitation>()

    let getSentInvitations = () => {
      let globule = globules.pop()
      ConversationManager.getSentInvitations_(globule, accountId,
        invitations_ => {
          invitations = invitations.concat(invitations_)
          if (globules.length > 0) {
            getSentInvitations()
          } else {
            successCallback(invitations)
          }
        },
        err => {
          console.log(err)
          if (globules.length > 0) {
            getSentInvitations()
          } else {
            successCallback(invitations)
          }
        })
    }

    getSentInvitations()
  }

  /**
   * Conversation invitation is accepted!
   * @param invitation The invitation
   * @param successCallback The success callback.
   * @param errorCallback The error callback.
   */
  static acceptConversationInvitation(invitation: Invitation, successCallback: () => void, errorCallback: (err: any) => void) {
    let globule = Model.getGlobule(invitation.getMac())
    generatePeerToken(globule, token => {
      let rqst = new AcceptInvitationRequest
      rqst.setInvitation(invitation);
      globule.conversationService.acceptInvitation(rqst, {
        token: token,
        application: Model.application,
        domain: Model.domain,
        address: Model.address
      }).then((rsp: AcceptInvitationRequest) => {
        /** Nothing to do here... */
        successCallback()

      }).catch(errorCallback)
    }, errorCallback)
  }

  /**
   * The conversation invitation was declined!
   * @param invitation The invitation.
   * @param successCallback The success callback
   * @param errorCallback The error callback
   */
  static declineConversationInvitation(invitation: Invitation, successCallback: () => void, errorCallback: (err: any) => void) {
    let globule = Model.getGlobule(invitation.getMac())
    generatePeerToken(globule, token => {
      let rqst = new DeclineInvitationRequest
      rqst.setInvitation(invitation);
      globule.conversationService.declineInvitation(rqst, {
        token: token,
        application: Model.application,
        domain: Model.domain,
        address: Model.address
      }).then((rsp: AcceptInvitationRequest) => {
        /** Nothing to do here... */
        successCallback()
      }).catch(errorCallback)
    }, errorCallback)
  }

  static revokeConversationInvitation(invitation: Invitation, successCallback: () => void, errorCallback: (err: any) => void) {
    let globule = Model.getGlobule(invitation.getMac())
    generatePeerToken(globule, token => {
      let rqst = new RevokeInvitationRequest
      rqst.setInvitation(invitation);
      globule.conversationService.revokeInvitation(rqst, {
        token: token,
        application: Model.application,
        domain: Model.domain,
        address: Model.address
      }).then((rsp: RevokeInvitationResponse) => {
        /** Nothing to do here... */
        successCallback()
      }).catch(errorCallback)
    }, errorCallback)
  }

  static likeIt(conversationUuid: string, message: string, account: string, successCallback: () => void, errorCallback: (err: any) => void) {
    let conversation = ConversationManager.conversations.get(conversationUuid)
    let globule = Model.getGlobule(conversation.getMac())
    generatePeerToken(globule, token => {
      let rqst = new LikeMessageRqst
      rqst.setMessage(message)
      rqst.setConversation(conversation.getUuid())
      rqst.setAccount(account)

      globule.conversationService.likeMessage(rqst, {
        token: token,
        application: Model.application,
        domain: Model.domain,
        address: Model.address
      }).then((rsp: LikeMessageResponse) => {
        if (successCallback != undefined) {
          successCallback()
        }
      }).catch(errorCallback)
    }, errorCallback)
  }

  static dislikeIt(conversationUuid: string, message: string, account: string, successCallback: () => void, errorCallback: (err: any) => void) {
    let conversation = ConversationManager.conversations.get(conversationUuid)
    let globule = Model.getGlobule(conversation.getMac())
    generatePeerToken(globule, token => {
      let rqst = new DislikeMessageRqst
      rqst.setMessage(message)
      rqst.setConversation(conversation.getUuid())
      rqst.setAccount(account)
      globule.conversationService.dislikeMessage(rqst, {
        token: token,
        application: Model.application,
        domain: Model.domain,
        address: Model.address
      }).then((rsp: DislikeMessageResponse) => {
        if (successCallback != undefined) {
          successCallback()
        }
      }).catch(errorCallback)
    }, errorCallback)
  }


  static deleteMessage(msg: Message, successCallback: () => void, errorCallback: (err: any) => void) {
    // Retreive the conversation from the map
    let conversation = ConversationManager.conversations.get(msg.getConversation())

    // Retreive the conversation host...
    let globule = Model.getGlobule(conversation.getMac())

    generatePeerToken(globule, token => {
      let rqst = new DeleteMessageRequest
      rqst.setUuid(msg.getUuid())
      rqst.setConversation(msg.getConversation())

      globule.conversationService.deleteMessage(rqst, {
        token: token,
        application: Model.application,
        domain: Model.domain,
        address: Model.address
      }).then((rsp: DeleteMessageResponse) => {
        if (successCallback != undefined) {
          successCallback()
        }

        // Simply send event on the network...
        Model.publish(`delete_message_${msg.getUuid()}_evt`, null, false)

      }).catch(errorCallback)
    }, errorCallback)
  }

  static sendMessage(conversation: Conversation, author: Account, text: string, replyTo: string, successCallback: () => void, errorCallback: (err: any) => void) {

    let globule = Model.getGlobule(conversation.getMac())
    let conversationUuid = conversation.getUuid()

    generatePeerToken(globule, token => {
      let rqst = new SendMessageRequest
      let message = new Message
      let uuid = uuidv4();
      if (replyTo.length > 0) {
        uuid = replyTo + "/" + uuid
      }
      message.setUuid(uuid)
      message.setConversation(conversationUuid)
      message.setText(text)
      message.setInReplyTo(replyTo)
      message.setCreationTime(Math.round(Date.now() / 1000));
      message.setAuthor(author.id + "@" + author.domain);
      message.setLanguage(window.navigator.language.split("-")[0]);
      message.setDislikesList(new Array<string>());
      message.setLikesList(new Array<string>());
      message.setReadersList([author.id + "@" + author.domain]);
      rqst.setMsg(message)

      globule.conversationService.sendMessage(rqst, {
        token: token,
        application: Model.application,
        domain: Model.domain,
        address: Model.address
      }).then((rsp: SendMessageResponse) => {
        /** Nothing to do here... */

      }).catch(errorCallback)
    }, errorCallback)
  }
}

/**
 * Here I will create the signaling server use in conjunction with each other.
 */
export class SignalingServer {

  constructor() {

  }

}