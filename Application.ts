import { Model } from "./Model";
import * as resource from "globular-web-client/resource/resource_pb";
import * as authentication from "globular-web-client/authentication/authentication_pb"
//import 'source-map-support/register' // That resolve the error map and give real source name and plage in function.
import * as jwt from "jwt-decode";
import { ApplicationView } from "./ApplicationView";
import { Account } from "./Account";
import { NotificationType, Notification } from "./Notification";

import {
  UpdateOneRsp,
  DeleteOneRqst,
  CreateConnectionRqst,
  Connection,
  StoreType
} from "globular-web-client/persistence/persistence_pb";
import { v4 as uuidv4 } from "uuid";
import { mergeTypedArrays, uint8arrayToStringMethod } from "./Utility";
import { ConversationManager } from "./Conversation";
import { Conversations } from "globular-web-client/conversation/conversation_pb";
import { LogInfo, LogLevel, LogRqst, LogRsp } from "globular-web-client/log/log_pb";
import { Session, SessionState } from "./Session";

// Get the configuration from url
function getFileConfig(url: string, callback: (obj: any) => void, errorcallback: (err: any) => void) {
  var xmlhttp = new XMLHttpRequest();

  xmlhttp.onreadystatechange = function () {
    if (this.readyState == 4 && (this.status == 201 || this.status == 200)) {
      var obj = JSON.parse(this.responseText);
      callback(obj);
    } else if (this.readyState == 4) {
      errorcallback("fail to get the configuration file at url " + url + " status " + this.status)
    }
  };

  xmlhttp.open("GET", url, true);
  xmlhttp.send();
}

/**
 * That class can be use to create any other application.
 */
export class Application extends Model {
  public static uuid: string;
  public static language: string;
  private static infos: Map<string, any>;
  private contactsListener: any;

  private _appConfig: any; // contain value defines in the config.json file of the application if one is found.
  public get appConfig(): any {
    return this._appConfig;
  }

  public set appConfig(value: any) {
    this._appConfig = value;
  }

  private _name: string;

  public get name(): string {
    return this._name;
  }
  public set name(value: string) {
    this._name = value;
  }

  private _title: string;

  public get title(): string {
    return this._title;
  }

  public set title(value: string) {
    this._title = value;
  }

  // those informations are keep in mongo db.

  // The id of the application on mongodb.
  private _id: string;
  public get id(): string {
    return this._id;
  }

  public set id(value: string) {
    this._id = value;
  }

  // The path of the application on the server.
  private _path: string;
  public get path(): string {
    return this._path;
  }
  public set path(value: string) {
    this._path = value;
  }

  public account: Account;

  // Event listener's
  private login_event_listener: string;
  private register_event_listener: string;
  private logout_event_listener: string;
  private delete_notification_event_listener: string;
  private invite_contact_listener: string;
  private settings_event_listener: string;
  /**
   * Create a new application with a given name. The view
   * can be any ApplicationView or derived ApplicationView class.
   * @param name The name of the application.
   */
  constructor(name: string, title: string, view: ApplicationView) {
    super();

    // The map of contact listener.
    this.contactsListener = {}

    // set the application view in it model.
    view.application = this;

    // generate client uuid, this is use to set information about a client.
    if (localStorage.getItem("globular_client_uuid") == undefined) {
      Application.uuid = uuidv4();
      localStorage.setItem("globular_client_uuid", Application.uuid);
    } else {
      Application.uuid = localStorage.getItem("globular_client_uuid");
    }

    // The application name.
    this.name = name;
    this.title = title;
    this.view = view;

    if (document.getElementsByTagName("title").length > 0) {
      document.getElementsByTagName("title")[0].innerHTML = this.title;
      view.setTitle(this.title);
    }

  }

  /**
   * Get value from config.json file if any...
   * @param callback 
   */
  initApplicationConfig(callback: (config: any) => void, errorCallback: (err: any) => void) {
    // remove
    let url = window.location.toString()
    url = url.replace("index.html", "")
    getFileConfig(url + "config.json",
      (config: any) => {
        callback(config)
      }, errorCallback)
  }

  /**
   * Connect the listner's and call the initcallback.
   * @param url the backend url.
   * @param initCallback
   * @param errorCallback
   * @param configurationPort
   */
  init(
    url: string,
    initCallback: () => void,
    errorCallback: (err: any) => void
  ) {
    let init_ = () => {

      // So here I will intercept all error and log it on the server log.
      // This error will be available in the setting -> error(s)
      window.onerror = (message, source, lineno, colno, error) => {
        let info = new LogInfo
        info.setDate(Math.trunc(Date.now() / 1000))
        info.setLevel(LogLevel.ERROR_MESSAGE)
        info.setApplication(Application.application)
        info.setUserid("")
        info.setUsername("")
        if (this.account != undefined) {
          info.setUserid(this.account.id)
          info.setUsername(this.account.name)
        }

        info.setMethod(error.name + " " + error.message)
        info.setMessage(error.stack.toString())

        let rqst = new LogRqst
        rqst.setInfo(info)

        Model.globular.logService.log(rqst, {
          token: localStorage.getItem("user_token"),
          application: Model.application,
          domain: Model.domain,
        }).then((rsp: LogRsp) => {
          console.log("info was log!")
        })
          .catch((err: any) => {
            ApplicationView.displayMessage(err, 3000)
          })

      };

      // Here I will connect the listener's
      // The login event.
      Model.eventHub.subscribe(
        "login_event_",
        (uuid: string) => {
          this.login_event_listener = uuid;
        },
        (evt: any) => {
          // Here I will try to login the user.
          this.login(
            evt.userId,
            evt.pwd,
            (account: Account) => {
              // Here I will send a login success.
              console.log("login_event")
              // TODO the login will be publish later when the user data will be init
              Model.eventHub.publish("login_event", account, true);
            },
            (err: any) => {
              ApplicationView.displayMessage(err, 4000);
            }
          );
        },
        true
      );

      Model.eventHub.subscribe(
        "logout_event_",
        (uuid: string) => {
          this.logout_event_listener = uuid;
        },
        (evt: any) => {
          this.logout();
        },
        true
      );

      // The register event.
      Model.eventHub.subscribe(
        "settings_event_",
        (uuid: string) => {
          this.settings_event_listener = uuid;
        },
        (evt: any) => {
          this.settings();
        },
        true
      );

      // The register event.
      Model.eventHub.subscribe(
        "register_event_",
        (uuid: string) => {
          this.register_event_listener = uuid;
        },
        (evt: any) => {
          // Here I will try to login the user.
          this.register(
            evt.userId,
            evt.email,
            evt.pwd,
            evt.repwd,
            (data: any) => {
              console.log("--> register succeed!", data);
            },
            (err: any) => {
              ApplicationView.displayMessage(err, 4000);
            }
          );
        },
        true
      );

      // That listener is use to keep the client up to date with the server.
      // if an accout is connect it will not restart it session automaticaly...
      Model.eventHub.subscribe(
        `update_${Application.domain}_${Application.application}_evt`,
        (uuid: string) => {
          this.register_event_listener = uuid;
        },
        (version: string) => {

          if (this.account == undefined) {
            // reload the page...
            location.reload();
          } else {

            // 
            ApplicationView.displayMessage(`
            <div style="display: flex; flex-direction: column">
              <div>A new version of <span style="font-weight: 500;">
                ${Application.application}</span> (v.${version}) is available.
              </div>
              <div>
                Press <span style="font-weight: 500;">f5</span> to refresh the page.
              </div>
            </div>
            `, 10 * 1000);
          }
        },
        false
      );

      // Invite contact event.
      Model.eventHub.subscribe(
        "send_conversation_invitation_event_",
        (uuid: string) => {
          this.invite_contact_listener = uuid;
        },
        (evt: any) => {
          // Here I will try to login the user.
          this.onInviteParticipant(evt);
        },
        true
      );

      // Invite contact event.
      Model.eventHub.subscribe(
        "invite_contact_event_",
        (uuid: string) => {
          this.invite_contact_listener = uuid;
        },
        (contact: Account) => {
          // Here I will try to login the user.
          this.onInviteContact(contact);
        },
        true
      );

      // Revoke contact invitation.
      Model.eventHub.subscribe(
        "revoke_contact_invitation_event_",
        (uuid: string) => {
        },
        (contact: Account) => {
          // Here I will try to login the user.
          this.onRevokeContactInvitation(contact);
        },
        true
      );

      // Accept contact invitation
      Model.eventHub.subscribe(
        "accept_contact_invitation_event_",
        (uuid: string) => {
        },
        (contact: Account) => {
          // Here I will try to login the user.
          this.onAcceptContactInvitation(contact);
        },
        true
      );

      // Decline contact invitation
      Model.eventHub.subscribe(
        "decline_contact_invitation_event_",
        (uuid: string) => {
        },
        (contact: Account) => {
          // Here I will try to login the user.
          this.onDeclineContactInvitation(contact);
        },
        true
      );

      // Decline contact invitation
      Model.eventHub.subscribe(
        "delete_contact_event_",
        (uuid: string) => {
        },
        (contact: Account) => {
          // Here I will try to login the user.
          this.onDeleteContact(contact);
        },
        true
      );

      // Delete user notification.
      Model.eventHub.subscribe(
        "delete_notification_event_",
        (uuid: string) => {
          this.delete_notification_event_listener = uuid;
        },
        (notification: any) => {
          notification = Notification.fromObject(notification);
          this.removeNotification(notification);
        },
        true
      );

      // Get backend application infos.
      Application.getAllApplicationInfo(
        (infos: Array<any>) => {
          if (initCallback != undefined) {
            let appInfo = Application.getApplicationInfo(this.name);
            if (appInfo != undefined) {
              (<ApplicationView>this.view).setIcon(
                Application.getApplicationInfo(this.name).getIcon()
              );
              this.view.init();
            } else {
              console.log(
                "no application information found for " +
                this.name +
                " make sure your application has the correct name in your class derived from Application!"
              );
            }
            initCallback();
          }
        },
        (err: any) => {
          ApplicationView.displayMessage(err, 3000)
        }
      );

      // Connect automatically...
      let rememberMe = localStorage.getItem("remember_me");
      if (rememberMe) {
        // Here I will renew the last token...
        let userId = localStorage.getItem("user_id");
        this.view.wait(
          "<div>log in</div><div>" + userId + "</div><div>...</div>"
        );

        this.refreshToken(
          (account: Account) => {
            // send a refresh token event.
            // Model.eventHub.publish("refresh_token_event", account, true);
            Model.eventHub.publish("login_event", account, true);
            this.view.resume();

            this.startRefreshToken();
          },
          (err: any) => {
            ApplicationView.displayMessage(err, 4000);
            this.view.resume();
          }
        );
      } else {
        // simply remove invalid token and user infos.
        localStorage.removeItem("remember_me");
        localStorage.removeItem("user_token");
        localStorage.removeItem("user_id");
        localStorage.removeItem("user_name");
        localStorage.removeItem("user_email");
        localStorage.removeItem("token_expired");
      }
    }

    // Initialise the application configuration from it config.json file.
    // if no file was found the config is simply set to an empty object.
    // Config.json must contain only application setting ex backend address
    // It's preferable to store any application data into it database.
    this.initApplicationConfig((config: any) => {
      // keep the config in appConfig member.
      this.appConfig = config;
      if (this.appConfig.GlobularConfigurationAddress != undefined) {
        super.init(this.appConfig.GlobularConfigurationAddress, init_, errorCallback);
      } else {
        // use the default url here in that case.
        super.init(url, init_, errorCallback);
      }
    },
      () => {
        this.appConfig = {};
        super.init(url, init_, errorCallback);
      })

  }

  /**
   * Return the list of all applicaitons informations.
   * @param callback
   * @param errorCallback
   */
  static getAllApplicationInfo(
    callback: (infos: Array<any>) => void,
    errorCallback: (err: any) => void
  ) {

    if (Application.infos != undefined) {
      if (Application.infos.size != 0) {
        callback(Array.from(Application.infos.values()));
        return
      }
    }

    
    console.log("-----> get application infos")
    const rqst = new resource.GetApplicationsRqst();

    const stream = Model.globular.resourceService.getApplications(rqst, {
      application: Model.application.length > 0 ? Model.application : Model.globular.config.IndexApplication,
      domain: Model.domain,
    });

    let applications = new Array<resource.Application>();

    stream.on("data", (rsp: resource.GetApplicationsRsp) => {
      applications = applications.concat(rsp.getApplicationsList());
    });

    stream.on("status", (status) => {
      if (status.code === 0) {
        console.log("applications info received!")
        Application.infos = new Map<string, resource.Application>();
        for (var i = 0; i < applications.length; i++) {
          // Keep application info up to date.
          Application.eventHub.subscribe(`update_application_${applications[i].getId()}_settings_evt`,
            (uuid: string) => {

            },
            (__application_info__: string) => {
              // Set the icon...
              let info = JSON.parse(__application_info__)

              Application.infos.set(applications[i].getId(), info);
            }, false)

          Application.infos.set(applications[i].getId(), applications[i]);
        }

        callback(applications);
      } else {
        console.log("applications info error!")
        errorCallback({ message: status.details });
      }
    });
  }

  /**
   * Return application infos.
   * @param id
   */
  static getApplicationInfo(id: string): resource.Application {
    return Application.infos.get(id);
  }

  /**
   * Return partial information only.
   */
  toString(): string {
    let obj = { name: this.name, title: this.title, icon: "" };
    return JSON.stringify(obj);
  }

  /////////////////////////////////////////////////////
  // Account releated functionality.
  /////////////////////////////////////////////////////

  /**
   * Display true if a session is open.
   */
  public get isLogged(): boolean {
    return this.account != null;
  }

  /**
   * Refresh the token and open a new session if the token is valid.
   */
  private refreshToken(
    initCallback: (account: Account) => void,
    onError: (err: any) => void
  ) {
    let rqst = new authentication.RefreshTokenRqst();
    let existingToken = localStorage.getItem("user_token");
    if (existingToken == undefined) {
      onError("No token found to be refresh!");
      return;
    }
    if (existingToken.length == 0) {
      onError("Invalid token found!");
      localStorage.removeItem("user_token");
      return;
    }

    rqst.setToken(existingToken);

    Model.globular.authenticationService
      .refreshToken(rqst)
      .then((rsp: authentication.RefreshTokenRsp) => {
        // Refresh the token at session timeout
        let token = rsp.getToken();

        let decoded = jwt(token);
        let id = (<any>decoded).id;
        let userName = (<any>decoded).username;
        let email = (<any>decoded).email;

        // here I will save the user token and user_name in the local storage.
        localStorage.setItem("user_token", token);
        localStorage.setItem("token_expired", (<any>decoded).exp);
        localStorage.setItem("user_id", id);
        localStorage.setItem("user_name", userName);
        localStorage.setItem("user_email", email);

        // Set the account
        Account.getAccount(userName, (account: Account) => {
          this.account = account;
          initCallback(this.account);
        }, onError);

      })
      .catch((err) => {
        // remove old information in that case.
        localStorage.removeItem("user_token");
        localStorage.removeItem("user_id");
        localStorage.removeItem("user_name");
        localStorage.removeItem("user_email");
        localStorage.removeItem("token_expired");
        localStorage.removeItem("remember_me");
        ApplicationView.displayMessage(err, 3000)
        onError(err);
      });
  }

  /**
   * Refresh the token to keep it usable.
   */
  private startRefreshToken() {
    this.initNotifications();

    let __setInterval = setInterval(() => {

      let isExpired =
        parseInt(localStorage.getItem("token_expired"), 10) - 5 <
        Math.floor(Date.now() / 1000);
      if (isExpired) {
        console.log("need to refresh token")
        this.refreshToken(
          (account: Account) => {
            this.account = account;
          },
          (err: any) => {
            // simply display the error on the view.
            ApplicationView.displayMessage(err, 4000);
            // Stop runing...
            clearInterval(__setInterval);
          }
        );
      }
    }, 1000);
  }

  /**
   * Register a new account with the application.
   * @param name The account name
   * @param email The account email
   * @param password The account password
   */
  register(
    name: string,
    email: string,
    password: string,
    confirmPassord: string,
    onRegister: (account: Account) => void,
    onError: (err: any) => void
  ): Account {
    // Create the register request.
    let rqst = new resource.RegisterAccountRqst();
    rqst.setConfirmPassword(confirmPassord);

    let account = new resource.Account();
    account.setPassword(password);
    account.setEmail(email);
    account.setName(name);
    rqst.setAccount(account);

    this.view.wait(
      "<div>register account </div><div>" + name + "</div><div>...</div>"
    );
    // Register a new account.
    Model.globular.resourceService
      .registerAccount(rqst)
      .then((rsp: resource.RegisterAccountRsp) => {
        // Here I will set the token in the localstorage.
        let token = rsp.getResult();
        let decoded = jwt(token);

        // here I will save the user token and user_name in the local storage.
        localStorage.setItem("user_token", token);
        localStorage.setItem("user_id", (<any>decoded).id);
        localStorage.setItem("user_name", (<any>decoded).username);
        localStorage.setItem("token_expired", (<any>decoded).exp);
        localStorage.setItem("user_email", (<any>decoded).email);

        // Callback on login.
        this.account = new Account(name, email, name);

        this.account.initData(
          (account: Account) => {
            this.view.resume();
            onRegister(this.account);
          },
          (err: any) => {
            onRegister(this.account);
            this.view.resume();
            onError(err);
          }
        );


        this.startRefreshToken();
      })
      .catch((err: any) => {
        this.view.resume();
        onError(err);
      });

    return null;
  }

  // Display message when contact state change.
  addContactListener(contact: any) {

    Model.eventHub.subscribe(`session_state_${contact._id}_change_event`,
      (uuid: string) => {
        this.contactsListener[contact._id] = uuid;
      },
      (evt: string) => {
        Account.getAccount(contact._id, (account: Account) => {
          const obj = JSON.parse(evt)
          account.session.lastStateTime = new Date(obj.lastStateTime * 1000)
          account.session.state = obj.state

          // Here I will ask the user for confirmation before actually delete the contact informations.
          let toast = <any>ApplicationView.displayMessage(
            `
          <style>
            #contact-session-info-box{
              display: flex;
              flex-direction: column;
            }

            #contact-session-info-box globular-contact-card{
              padding-bottom: 10px;
            }

            #contact-session-info-box div{
              display: flex;
              font-size: 1.2rem;
              padding-bottom: 10px;
            }
          </style>
          <div id="contact-session-info-box">
            <div>Session state change... </div>
            <globular-contact-card contact="${contact._id}"></globular-contact-card>
          </div>
          `,
            5000 // 15 sec...
          );
        }, (err: any) => { })


      }, false)
  }
  /**
   * Login into the application
   * @param email
   * @param password
   */
  login(
    email: string,
    password: string,
    onLogin: (account: Account) => void,
    onError: (err: any) => void
  ) {
    let rqst = new authentication.AuthenticateRqst();
    rqst.setName(email);
    rqst.setPassword(password);
    this.view.wait("<div>log in</div><div>" + email + "</div><div>...</div>");

    Model.globular.authenticationService
      .authenticate(rqst)
      .then((rsp: authentication.AuthenticateRsp) => {

        // Here I will set the token in the localstorage.
        let token = rsp.getToken();
        let decoded = jwt(token);
        let userName = (<any>decoded).username;
        let email = (<any>decoded).email;
        let id = (<any>decoded).id;

        // here I will save the user token and user_name in the local storage.
        localStorage.setItem("user_token", token);
        localStorage.setItem("token_expired", (<any>decoded).exp);
        localStorage.setItem("user_email", email);
        localStorage.setItem("user_name", userName);
        localStorage.setItem("user_id", id);

        let rqst = new CreateConnectionRqst
        let connectionId = userName.split("@").join("_").split(".").join("_");

        // So here i will open the use database connection.
        let connection = new Connection
        connection.setId(connectionId)
        connection.setUser(id)
        connection.setPassword(password)
        connection.setStore(StoreType.MONGO)
        connection.setName(id + "_db")
        connection.setPort(27017)
        connection.setTimeout(60)
        connection.setHost(Application.domain)

        rqst.setConnection(connection)
        Model.globular.persistenceService.createConnection(rqst, {
          token: localStorage.getItem("user_token"),
          application: Model.application,
          domain: Model.domain
        }).then(() => {

          Account.getAccount(id, (account: Account) => {
            this.account = account;

            // so here I will get the session for the account...
            this.account.session.state = SessionState.Online;
            this.account.session.lastStateTime = new Date()
            this.account.session.save(() => { }, (err: any) => {
              ApplicationView.displayMessage(err, 3000)
            })

            onLogin(account);

            // When new contact is accepted.
            Model.eventHub.subscribe("accepted_" + account.id + "_evt",
              (uuid) => { },
              (evt) => {
                let invitation = JSON.parse(evt);
                this.addContactListener(invitation)
              },
              false)

            Model.eventHub.subscribe("deleted_" + account.id + "_evt",
              (uuid) => { },
              (evt) => {
                let invitation = JSON.parse(evt);
                Model.eventHub.unSubscribe(`session_state_${invitation._id}_change_event`, this.contactsListener[invitation._id])
              },
              false)


            Model.eventHub.publish(`__session_state_${this.account.id}_change_event__`, this.account.session, true)

            // retreive the contacts
            Account.getContacts(this.account, `{"status":"accepted"}`, (contacts: Array<Account>) => {
              contacts.forEach(contact => {
                this.addContactListener(contact)
              })
            },
              (err: any) => {
                ApplicationView.displayMessage(err, 3000)
              })

            // Retreive conversations...
            ConversationManager.loadConversation(this.account,
              (conversations: Conversations) => {
                Model.eventHub.publish("__load_conversations_event__", conversations.getConversationsList(), true)
              },
              (err: any) => {
                /* this.displayMessage(err, 3000)*/
                /** no conversation found... */
              })

            // Connect to to the conversation manager.
            ConversationManager.connect(
              () => {
                /* Nothing to do here **/
              }, (err: any) => {
                ApplicationView.displayMessage(err, 3000)
              })

            this.view.resume();

            // Start refresh as needed.
            this.startRefreshToken();



          }, (err: any) => {
            this.view.resume();
            onError(err);
          })
        }).catch((err: any) => {
          console.log(err)
        })



      })
      .catch((err) => {
        this.view.resume();
        onError(err);
      });
  }

  ///////////////////////////////////////////////////////////////
  // Application close funtions.
  //////////////////////////////////////////////////////////////

  /**
   * Close the current session explicitelty.
   */
  logout() {
    // Send local event.
    Model.eventHub.publish("logout_event", this.account, true);

    // So here I will set the account session state to onlise.
    this.account.session.state = SessionState.Offline;

    Model.eventHub.publish(`__session_state_${this.account.id}_change_event__`, this.account.session, true)

    // Set room to undefined.
    this.account = null;

    // remove token informations
    localStorage.removeItem("remember_me");
    localStorage.removeItem("user_token");
    localStorage.removeItem("user_id");
    localStorage.removeItem("user_name");
    localStorage.removeItem("user_email");
    localStorage.removeItem("token_expired");

    // refresh the page to be sure all variable are clear...
    this.view.wait("Wait until the application reload...")
    setTimeout(() => {
      window.location.reload();
    }, 1000)

  }

  /**
   * Exit application.
   */
  exit() {
    // Close the view.
    if (this.view != undefined) {
      this.view.close();
    }

    // Close the listener's
    Model.eventHub.unSubscribe("login_event_", this.login_event_listener);
    Model.eventHub.unSubscribe("logout_event_", this.logout_event_listener);
    Model.eventHub.unSubscribe("register_event_", this.register_event_listener);
    Model.eventHub.unSubscribe(
      "invite_contact_event_",
      this.invite_contact_listener
    );

    Model.eventHub.unSubscribe(
      "delete_notification_event_",
      this.delete_notification_event_listener
    );

    // remove token informations
    localStorage.removeItem("remember_me");
    localStorage.removeItem("user_token");
    localStorage.removeItem("user_id");
    localStorage.removeItem("user_name");
    localStorage.removeItem("user_email");
    localStorage.removeItem("token_expired");
  }

  /**
   * Settings application.
   */
  settings() {

  }

  /**
   * That function must be use to update application information store
   * in level db in local_ressource table.
   * @param id 
   * @param info 
   */
  static saveApplicationInfo(id: string, info: any, successCallback: (infos: any) => void, errorCallback: (err: any) => void) {
    if (Object.keys(info).length == 0) {
      errorCallback("Nothing has change!")
      return;
    }
    let info_ = Application.infos.get(id)
    let value = ""
    let i = 0;
    for (var field in info) {
      const v = info[field]
      if (typeof v === 'string' || v instanceof String) {
        value += `"${field}":"${v}"`
      } else {
        value += `"${field}":${v}`
      }

      i++
      if (i < Object.keys(info).length) {
        value += ", "
      }
      info_[field] = info[field]
    }

    value = `{"$set":{${value}}}`

    // Get the actual value and set values from info.
    const rqst = new resource.UpdateApplicationRqst
    rqst.setApplicationid(id)
    rqst.setValues(value)
    Model.globular.resourceService.updateApplication(rqst, {
      token: localStorage.getItem("user_token"),
      application: Model.application,
      domain: Model.domain,
    }).then((rsp: UpdateOneRsp) => {
      successCallback(info_);
    }).catch(errorCallback)
  }


  ///////////////////////////////////////////////////////////////////////////////////////////
  // Notifications
  ///////////////////////////////////////////////////////////////////////////////////////////

  /**
   * Initialyse the user and application notifications
   */
  private initNotifications() {
    // Initialyse application notifications.
    this.getNotifications(
      NotificationType.Application,
      (notifications: Array<Notification>) => {
        Model.eventHub.publish(
          "set_application_notifications_event",
          notifications,
          true
        );
      },
      (err: any) => {
        ApplicationView.displayMessage(err, 4000);
      }
    );

    this.getNotifications(
      NotificationType.User,
      (notifications: Array<Notification>) => {
        Model.eventHub.publish(
          "set_user_notifications_event",
          notifications,
          true
        );
      },
      (err: any) => {
        ApplicationView.displayMessage(err, 4000);
      }
    );
  }

  /**
   * Send application notifications.
   * @param notification The notification can contain html text.
   */
  sendNotifications(
    notification: Notification,
    callback: () => void,
    onError: (err: any) => void
  ) {
    // first of all I will save the notificaiton.
    let rqst = new resource.CreateNotificationRqst

    // init the notification infos.
    let notification_ = new resource.Notification
    notification_.setId(notification.id)
    notification_.setDate(Math.floor(notification.date.getTime() / 1000))
    notification_.setMessage(notification.text)
    notification_.setRecipient(notification.recipient)
    if (notification.type == NotificationType.Application) {
      notification_.setSender(Model.application)
      notification_.setNotificationType(resource.NotificationType.APPLICATION_NOTIFICATION)
    } else {
      notification_.setNotificationType(resource.NotificationType.USER_NOTIFICATION)
      notification_.setSender(this.account.id)
    }

    rqst.setNotification(notification_)

    Model.globular.resourceService
      .createNotification(rqst, {
        token: localStorage.getItem("user_token"),
        application: Model.application,
        domain: Model.domain,
      })
      .then(() => {
        // Here I will throw a network event...
        Model.eventHub.publish(
          notification.recipient + "_notification_event",
          notification.toString(),
          false
        );
        if (callback != undefined) {
          callback();
        }
      })
      .catch((err: any) => {
        onError(err);
      });
  }

  /**
   *  Retreive the list of nofitications
   * @param callback The success callback with the list of notifications.
   * @param errorCallback The error callback with the error message.
   */
  getNotifications(
    type: NotificationType,
    callback: (notifications: Array<Notification>) => void,
    errorCallback: (err: any) => void
  ) {

    // So here I will get the list of notification for the given type.
    let rqst = new resource.GetNotificationsRqst

    if (type == NotificationType.Application) {
      rqst.setRecipient(Model.application)
    } else {
      rqst.setRecipient(this.account.id)
    }

    let stream = Model.globular.resourceService.getNotifications(rqst, {
      token: localStorage.getItem("user_token"),
      application: Model.application,
      domain: Model.domain,
    });

    let notifications = new Array<resource.Notification>();

    stream.on("data", (rsp: resource.GetNotificationsRsp) => {
      notifications = notifications.concat(rsp.getNotificationsList())
    });

    stream.on("status", (status) => {
      if (status.code == 0) {
        let notifications_ = new Array<Notification>();
        for (var i = 0; i < notifications.length; i++) {
          // Here I will convert the notification from resource object to 
          // my own Notification type.
          let n = new Notification(notifications[i].getSender(), notifications[i].getNotificationType().valueOf(), notifications[i].getRecipient(), notifications[i].getMessage(), new Date(notifications[i].getDate() * 1000))
          n.id = notifications[i].getId();

          notifications_.push(n);
        }

        callback(notifications_)

      } else {
        // In case of error I will return an empty array
        callback([]);
      }
    });
  }

  removeNotification(notification: Notification) {

    let rqst = new resource.DeleteNotificationRqst

    rqst.setId(notification.id)
    rqst.setRecipient(notification.recipient)

    Model.globular.resourceService
      .deleteNotification(rqst, {
        token: localStorage.getItem("user_token"),
        application: Model.application,
        domain: Model.domain,
      })
      .then(() => {
        // The notification is not deleted so I will send network event to remove it from
        // the display.
        Model.eventHub.publish(
          notification.id + "_delete_notification_event",
          notification.toString(),
          false
        );
      })
      .catch((err: any) => {
        ApplicationView.displayMessage(err, 4000);
      });
  }

  /**
   * Remove all notification.
   */
  clearNotifications(type: NotificationType) {

  }

  ///////////////////////////////////////////////////////////////////
  // Invite to a conversation.
  ///////////////////////////////////////////////////////////////////
  onInviteParticipant(evt: any) {
    // Create a user notification.
    let notification = new Notification(
      this.account.id,
      NotificationType.User,
      evt["participant"],
      `
      <div style="display: flex; flex-direction: column;">
        <p>
          ${this.account.name} invited you to join the conversation named ${evt["conversation"]}.
        </p>
      </div>`
    );

    // Send the notification.
    this.sendNotifications(
      notification,
      () => {
        /** nothing special here... */
      },
      (err: any) => {
        ApplicationView.displayMessage(err, 3000);
      }
    );
  }


  ///////////////////////////////////////////////////////////////////
  // Contacts.
  ///////////////////////////////////////////////////////////////////

  // Invite a new contact.
  onInviteContact(contact: Account) {
    // Create a user notification.
    let notification = new Notification(
      this.account.id,
      NotificationType.User,
      contact.name,
      `
      <div style="display: flex; flex-direction: column;">
        <p>
          ${this.account.name} want to add you as contact.<br>Click the <iron-icon id="Contacts_icon" icon="social:people" style="--iron-icon-fill-color: var(--palette-primary-main);"></iron-icon> button to accept or decline the invitation.
        </p>
      </div>`
    );

    // Send the notification.
    this.sendNotifications(
      notification,
      () => {
        Account.setContact(this.account, "sent", contact, "received",
          () => {
            // this.displayMessage(, 3000)
          }, (err: any) => {
            ApplicationView.displayMessage(err, 3000)
          })
      },
      (err: any) => {
        ApplicationView.displayMessage(err, 3000);
      }
    );
  }

  // Accept contact.
  onAcceptContactInvitation(contact: Account) {
    // Create a user notification.
    let notification = new Notification(
      this.account.id,
      NotificationType.User,
      contact.name,
      `
      <div style="display: flex; flex-direction: column;">
        <p>
          ${this.account.name} accept you as contact.
          <br>Click the <iron-icon id="Contacts_icon" icon="social:people" style="--iron-icon-fill-color: var(--palette-primary-main);"></iron-icon> button to get more infos.
        </p>
      </div>`
    );

    // Send the notification.
    this.sendNotifications(
      notification,
      () => {
        Account.setContact(this.account, "accepted", contact, "accepted",
          () => {
            // this.displayMessage(, 3000)
          }, (err: any) => {
            ApplicationView.displayMessage(err, 3000)
          })
      },
      (err: any) => {
        ApplicationView.displayMessage(err, 3000);
      }
    );
  }

  // Decline contact invitation.
  onDeclineContactInvitation(contact: Account) {
    let notification = new Notification(
      this.account.id,
      NotificationType.User,
      contact.name,
      `
      <div style="display: flex; flex-direction: column;">
        <p>
          Unfortunately ${this.account.name} declined your invitation.
          <br>Click the <iron-icon id="Contacts_icon" icon="social:people" style="--iron-icon-fill-color: var(--palette-primary-main);"></iron-icon> button to get more infos.
        </p>
      </div>`
    );

    // Send the notification.
    this.sendNotifications(
      notification,
      () => {
        Account.setContact(this.account, "declined", contact, "declined",
          () => {
            // this.displayMessage(, 3000)
          }, (err: any) => {
            ApplicationView.displayMessage(err, 3000)
          })
      },
      (err: any) => {
        ApplicationView.displayMessage(err, 3000);
      }
    );
  }

  // Revoke contact invitation.
  onRevokeContactInvitation(contact: Account) {
    let notification = new Notification(
      this.account.id,
      NotificationType.User,
      contact.name,
      `
      <div style="display: flex; flex-direction: column;">
        <p>
          Unfortunately ${this.account.name} revoke the invitation.
          <br>Click the <iron-icon id="Contacts_icon" icon="social:people" style="--iron-icon-fill-color: var(--palette-primary-main);"></iron-icon> button to get more infos.
        </p>
      </div>`
    );

    // Send the notification.
    this.sendNotifications(
      notification,
      () => {
        Account.setContact(this.account, "revoked", contact, "revoked",
          () => {
            // this.displayMessage(, 3000)
          }, (err: any) => {
            ApplicationView.displayMessage(err, 3000)
          })
      },
      (err: any) => {
        ApplicationView.displayMessage(err, 3000);
      }
    );
  }

  // Delete contact invitation.
  onDeleteContact(contact: Account) {
    let notification = new Notification(
      this.account.id,
      NotificationType.User,
      contact.name,
      `
      <div style="display: flex; flex-direction: column;">
        <p>
          You and ${this.account.name} are no more in contact.
          <br>Click the <iron-icon id="Contacts_icon" icon="social:people" style="--iron-icon-fill-color: var(--palette-primary-main);"></iron-icon> button to get more infos.
        </p>
      </div>`
    );

    // Send the notification.
    this.sendNotifications(
      notification,
      () => {
        Account.setContact(this.account, "deleted", contact, "deleted",
          () => {
            // this.displayMessage(, 3000)
          }, (err: any) => {
            ApplicationView.displayMessage(err, 3000)
          })
      },
      (err: any) => {
        ApplicationView.displayMessage(err, 3000);
      }
    );
  }
}
