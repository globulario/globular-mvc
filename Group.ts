import { ReplaceOneRsp } from "globular-web-client/persistence/persistence_pb";
import { Model } from "./Model";
import { Account } from "./Account"
import * as resource from "globular-web-client/resource/resource_pb";
import { getAllGroups } from "globular-web-client/api";
import { Globular } from "globular-web-client";

/**
 * Represents a group that aggregates accounts.
 */
export class Group extends Model {

    // keep the map of all groups by id.
    private static groups: any;

    // The id
    private _id: string;
    public get id(): string {
        return this._id;
    }

    // the name
    private _name: string;
    public get name(): string {
        return this._name;
    }
    public set name(value: string) {
        this._name = value;
    }

    // the domain
    private _domain: string;
    public get domain(): string {
        return this._domain;
    }

    public set domain(value: string) {
        this._domain = value;
    }

    // keep the list members references.
    private members: Array<any>;

    // The model...
    constructor(id: string) {
        super();
        this._id = id;
    }

    // Initialyse the group.
    initData(initCallback: () => void, errorCallback: (err: any) => void) {

        let domain = Model.domain
        if (this._id.indexOf("@") > 0) {
            domain = this._id.split("@")[1]
            this._id = this._id.split("@")[0]
        }

        let rqst = new resource.GetGroupsRqst
        rqst.setQuery(`{"_id":"${this._id}"}`)
        let stream = Model.getGlobule(domain).resourceService.getGroups(rqst, { domain: Model.domain, address: Model.address, application: Model.application, token: localStorage.getItem("user_token") })
        let groups_ = new Array<resource.Group>();

        stream.on("data", (rsp) => {
            groups_ = groups_.concat(rsp.getGroupsList())
        });

        stream.on("status", (status) => {
            if (status.code == 0) {
                let obj = groups_[0]
                this.fromObject(obj)

                // keep in the local map.
                Group.groups[this._id] = this

                // Here I will connect local event to react with interface element...
                initCallback()
            } else {
                errorCallback(status.details)
            }
        })
    }

    // Retreive the list of all groups from all register peers.
    static getGroups(callback: (groups: Array<Group>) => void, errorCallback: (err: any) => void) {
        let groups_ = new Array<Group>()
        let connections = Model.getGlobules()

        let _getGroups_ = () => {
            let globule = connections.pop()

            if (globule != undefined) {
                if (connections.length == 0) {
                    Group._getGroups(globule, (groups: Array<Group>) => {
                        for (var i = 0; i < groups.length; i++) {
                            let g = groups[i]
                            if (groups_.filter(g_ => { return g.id == g_.id && g.domain == g_.domain; }).length == 0) {
                                groups_.push(g)
                            }
                        }
                        callback(groups_)
                    }, errorCallback)
                } else {
                    Group._getGroups(globule, (groups: Array<Group>) => {
                        for (var i = 0; i < groups.length; i++) {
                            let g = groups[i]
                            if (groups_.filter(g_ => { return g.id == g_.id && g.domain == g_.domain; }).length == 0) {
                                groups_.push(g)
                            }
                        }
                        _getGroups_() // get the account from the next globule.
                    }, errorCallback)
                }
            }else{
                callback(groups_)
            }
        }

        // get account from all register peers.
        _getGroups_()
    }

    // Return the list of all groups.
    static _getGroups(globule: Globular, callback: (callback: Group[]) => void, errorCallback: (err: any) => void) {
        let groups = new Array<Group>();
        getAllGroups(globule, groups_ => {
            groups_.forEach(g => {
                let g_ = new Group(g.getId())
                g_.fromObject(g)
                groups.push(g_)
                callback(groups)
            })

        }, errorCallback);
    }

    // Retreive a given group.
    static getGroup(id: string, successCallback: (g: Group) => void, errorCallback: (err: any) => void) {
        if (Group.groups == undefined) {
            Group.groups = {};
        }
        if (Group.groups[id] != null) {
            successCallback(Group.groups[id])
        }

        // Here I will get the group.
        let g = new Group(id);

        g.initData(() => {
            Group.groups[id] = g;
            successCallback(g)
        }, errorCallback)

    }

    // Save the group.
    save(successCallback: (g: Group) => void, errorCallback: (err: any) => void) {

        let domain = Model.domain
        if (this._id.indexOf("@") > 0) {
            domain = this._id.split("@")[1]
            this._id = this._id.split("@")[0]
        }

        let rqst = new resource.UpdateGroupRqst
        rqst.setGroupid(this._id)
        let data = this.toString();
        rqst.setValues(data)


        Model.getGlobule(domain).resourceService.updateGroup(rqst, {
            token: localStorage.getItem("user_token"),
            application: Model.application,
            domain: Model.domain,
            address: Model.address
        })
            .then((rsp: ReplaceOneRsp) => {
                // Here I will return the value with it
                Model.publish(`update_group_${this._id}_data_evt`, data, false)
                successCallback(this);
            })
            .catch((err: any) => {
                errorCallback(err);
            });

    }

    // Return the list of members as Account objects.
    getMembers(successCallback: (members: Array<Account>) => void, errorCallback: () => void) {
        let members = new Array<Account>();
        if (this.members.length == 0) {
            successCallback([])
            return
        }

        // Initi the group.
        let setAccount_ = (index: number) => {
            if (index < this.members.length) {
                let memberId = this.members[index]
                Account.getAccount(memberId, (a: Account) => {
                    members.push(a)
                    index++
                    setAccount_(index);

                }, errorCallback)
            } else {
                successCallback(members);
            }
        }

        // start the recursion.
        let index = 0;
        setAccount_(index)
    }

    // Return true if an account if member of a given group.
    hasMember(account: Account): boolean {
        this.members.forEach((m: any) => {
            if (m == account.id + "@" + account.domain) {
                return true;
            }
        })
        return false;
    }

    // Stringnify to save into db.
    toString(): string {
        // return the basic infomration to be store in the database.
        return `{"_id":"${this._id}", "name":"${this.name}", "members":${JSON.stringify(this.members)}}`
    }

    // Initialyse it from object.
    fromObject(obj: any) {
        if (obj != undefined) {
            this._id = obj.getId();
            this.name = obj.getName();
            this.domain = obj.getDomain();
            this.members = obj.getMembersList();
        }
    }

}
