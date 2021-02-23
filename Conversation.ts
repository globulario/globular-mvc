import { ReplaceOneRqst, ReplaceOneRsp } from 'globular-web-client/persistence/persistence_pb';
import {Account} from './Account'
import adapter from 'webrtc-adapter';
import { Model } from './Model';

/**
 * A message is the unit of conversation.
 */
export class Message extends Model {
    private _id: string;
    // The conversation the message is part of.
    private conversation: Conversation;
    private author: Account;
    private answerTo:Message;
    private answers: Array<Message>;
    private date: Date;

    private path: string; // message is a ressource.

    // An array of ressource reference related to this message.
    private ressources: Array<string>; // attachment, photo, file etc...

    // The like's/unlike's contain list of account id's who like the message.
    private likes: Array<string>;
    private unlikes: Array<string>;
    
    constructor(conversation: Conversation, author: Account, answerTo?: Message){
        super();

        // Set class members
        this.conversation = conversation;
        this.author = author;
        this.answerTo = answerTo;

        // List of answer.
        this.answers= new Array<Message>();
    }

    /**
     * Serialyse message into the DB.
     */
    toString(): string {
        return JSON.stringify({_id:this._id})
    }

    /**
     * Initialyse model from json object.
     * @param json The class data.
     */
    static fromString(json: string): any {
        return this.fromObject(JSON.parse(json))
    }

    /**
     * Initialyse the notification from object.
     * @param obj 
     */
    static fromObject(obj: any): any {
        // Here I will 
    }
}

export enum ConversationScope {
    Public,
    Private
}

/**
 * That class contain the code to create conversation.
 */
export class Conversation extends Model {

    private _id: string;
    private name: string;
    private scope: ConversationScope;
    private owner: Account;

    private messages: Array<Message>;

    // This is the ressource path.
    private path: string;

    // The list of participant.
    private participants: Map<string,Account>;

    // The constructor.
    constructor(_id: string, name: string, isPublic: boolean, owner: Account) {
        super();

        // Set the id and the name.
        this._id = _id;
        this.name= name;
        this.owner = owner;

        if(isPublic){
            this.scope = ConversationScope.Public;
        }else{
            this.scope = ConversationScope.Private;
        }
        
        this.participants = new Map<string,Account>();
    }

    /**
     * Serialyse conversation to DB.
     */
    toString(): string {
        return JSON.stringify({_id:this._id, name:this.name, scope:this.scope, owner:this.owner.name})
    }

    /**
     * Initialyse model from json object.
     * @param json The class data.
     */
    static fromString(json: string): any {

    }

    /**
     * Initialyse the notification from object.
     * @param obj 
     */
    static fromObject(obj: any): any {
    }

    /**
     * Save the conversation or create it...
     */
    save(successCallback: ()=>void, errorCallback:(err:any)=>void){
        
        let rqst = new ReplaceOneRqst
        let data = this.toString();
        rqst.setCollection("Conversations");
        rqst.setId("local_resource");
        rqst.setDatabase("local_resource");
        rqst.setQuery(`{"_id":"${this._id}"}`);
        rqst.setValue(data);
        rqst.setOptions(`[{"upsert": true}]`);

        // call persist data
        Model.globular.persistenceService
            .replaceOne(rqst, {
                token: localStorage.getItem("user_token"),
                application: Model.application,
                domain: Model.domain
            })
            .then((rsp: ReplaceOneRsp) => {
                // Here I will return the value with it
                Model.eventHub.publish(`create_new_conversation`, this.toString(), false)
                successCallback();
            })
            .catch(errorCallback);
    }

}