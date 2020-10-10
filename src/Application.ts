import { Model } from './Model';
import * as ressource from "globular-web-client/lib/ressource/ressource_pb";
import * as jwt from "jwt-decode";
import { ApplicationView } from "./ApplicationView";
import { Account } from "./Account";
import { NotificationType, Notification } from './Notification';
import {
  InsertOneRqst,
  FindRqst,
  FindResp,
  DeleteOneRqst
} from "globular-web-client/lib/persistence/persistencepb/persistence_pb";
import { v4 as uuidv4 } from "uuid";

/**
 * That class can be use to create any other application.
 */
export class Application extends Model {
  
  public static uuid: string;
  public static language: string;
  private static infos:Map<string, any>;

  protected name: string;
  protected title: string;
  protected account: Account;
  

  // Event listener's
  private login_event_listener: string;
  private register_event_listener: string;
  private logout_event_listener: string;
  private update_profile_picture_listener: string;
  private delete_notification_event_listener: string;

  /**
   * Create a new application with a given name. The view
   * can be any ApplicationView or derived ApplicationView class.
   * @param name The name of the application.
   */
  constructor(name: string, title: string, view: ApplicationView) {
    super();

    // generate client uuid, this is use to set information about a client.
    if (localStorage.getItem("globular_client_uuid") == undefined) {
      Application.uuid = uuidv4();
      localStorage.setItem("globular_client_uuid", Application.uuid);
    } else {
      Application.uuid = localStorage.getItem("globular_client_uuid");
    }

    // The application name.
    this.name = name;
    Model.application = this.name; // set the application in model.
    this.view = view;

    if (document.getElementsByTagName("title").length > 0) {
      document.getElementsByTagName("title")[0].innerHTML = title;
      view.setTitle(title);
    }
  }


  /**
   * Connect the listner's and call the initcallback.
   * @param initCallback
   * @param errorCallback
   * @param adminPort
   * @param adminProxy
   */
  init(
    initCallback: () => void,
    errorCallback: (err: any) => void,
    adminPort: number = 10002,
    adminProxy: number = 10003
  ) {
    super.init(
      () => {
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
                console.log("--> login succeed!", account);
                // Here I will send a login success.
                Model.eventHub.publish("login_event", account, true);
              },
              (err: any) => {
                this.view.displayMessage(err, 4000);
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
                this.view.displayMessage(err, 4000);
              }
            );
          },
          true
        );

        // The update profile picuture event.
        Model.eventHub.subscribe(
          "update_profile_picture_event_",
          (uuid: string) => {
            this.update_profile_picture_listener = uuid;
          },
          (dataUrl: string) => {
            // Here I will try to login the user.
            this.account.changeProfilImage(
              dataUrl,
              () => {
                /** Nothing here. */
              },
              (err: any) => {
                this.view.displayMessage(err, 3000);
              }
            );
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
            notification = Notification.fromObject(notification)
            let rqst = new DeleteOneRqst();
            let db = this.account.id + "_db";
            rqst.setId(db);
            rqst.setDatabase(db);
            rqst.setCollection("Notifications");
            rqst.setQuery(`{"_id":"${notification.id}"}`);
            Model.globular.persistenceService
              .deleteOne(rqst, {
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
                this.view.displayMessage(err, 4000);
              });
          },
          true
        );

        // Get backend application infos.
        Application.getAllApplicationInfo((infos:Array<any>)=>{
          if (initCallback != undefined) {
            (<ApplicationView>this.view).setIcon(Application.getApplicationInfo(this.name).icon)
            this.view.init()
            initCallback();
          }
        }, (err:any)=>{console.log(err)})

        // Connect automatically...
        let rememberMe = localStorage.getItem("remember_me");
        if (rememberMe) {
          // Here I will renew the last token...
          let userId = localStorage.getItem("user_name");
          this.view.wait(
            "<div>log in</div><div>" + userId + "</div><div>...</div>"
          );

          this.refreshToken(
            (account: Account) => {
              // send a login event.
              Model.eventHub.publish("login_event", account, true);
              this.view.resume();
              this.startRefreshToken();
            },
            (err: any) => {
              this.view.displayMessage(err, 4000);
              this.view.resume();
            }
          );
        } else {
          // simply remove invalid token and user infos.
          localStorage.removeItem("remember_me");
          localStorage.removeItem("user_token");
          localStorage.removeItem("user_name");
          localStorage.removeItem("user_email");
          localStorage.removeItem("token_expired");
        }
      },
      errorCallback,
      adminPort,
      adminProxy
    );
  }

  /**
   * Return the list of all applicaitons informations.
   * @param callback 
   * @param errorCallback 
   */
  static getAllApplicationInfo(callback:(infos:Array<any>)=>void, errorCallback:(err:any)=>void){
    let rqst = new ressource.GetAllApplicationsInfoRqst
    
    Model.globular.ressourceService.getAllApplicationsInfo(rqst, {})
    .then((rsp:ressource.GetAllApplicationsInfoRsp)=>{
      let infos = JSON.parse(rsp.getResult())
      Application.infos = new Map<string, any>();
      for(var i=0; i < infos.length; i++){
        Application.infos.set(infos[i]._id, infos[i]);
      }
      callback(infos)
    })
    .catch(errorCallback)
  }

  /**
   * Return application infos.
   * @param id 
   */
  static getApplicationInfo(id: string): any{
    return Application.infos.get(id)
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
   * Refresh the token and open a new session if the token is valid.
   */
  private refreshToken(
    initCallback: (account: Account) => void,
    onError: (err: any) => void
  ) {
    let rqst = new ressource.RefreshTokenRqst();
    rqst.setToken(localStorage.getItem("user_token"));

    Model.globular.ressourceService
      .refreshToken(rqst)
      .then((rsp: ressource.RefreshTokenRsp) => {
        // Refresh the token at session timeout
        let token = rsp.getToken();
        let decoded = jwt(token);
        let userName = (<any>decoded).username;
        let email = (<any>decoded).email;

        // here I will save the user token and user_name in the local storage.
        localStorage.setItem("user_token", token);
        localStorage.setItem("token_expired", (<any>decoded).exp);
        localStorage.setItem("user_name", userName);
        localStorage.setItem("user_email", email);

        // Set the account
        this.account = new Account(userName, email);

        // Set the account infos...
        this.account.initData(initCallback, (err: any) => {
          localStorage.removeItem("remember_me");
          localStorage.removeItem("user_token");
          localStorage.removeItem("user_name");
          localStorage.removeItem("user_email");
          localStorage.removeItem("token_expired");
          onError(err);
        });
      })
      .catch((err) => {
        // remove old information in that case.
        localStorage.removeItem("remember_me");
        localStorage.removeItem("user_token");
        localStorage.removeItem("user_name");
        localStorage.removeItem("user_email");
        localStorage.removeItem("token_expired");
        onError(err);
      });
  }

  /**
   * Refresh the token to keep it usable.
   */
  private startRefreshToken() {
    this.initNotifications();
    setInterval(() => {
      let isExpired =
        parseInt(localStorage.getItem("token_expired"), 10) <
        Math.floor(Date.now() / 1000);
      if (isExpired) {
        this.refreshToken(
          (account: Account) => {
            this.account = account;
          },
          (err: any) => {
            // simply display the error on the view.
            this.view.displayMessage(err, 4000);
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
    let rqst = new ressource.RegisterAccountRqst();
    rqst.setPassword(password);
    rqst.setConfirmPassword(confirmPassord);

    let account = new ressource.Account();
    account.setEmail(email);
    account.setName(name);
    rqst.setAccount(account);

    this.view.wait(
      "<div>register account </div><div>" + name + "</div><div>...</div>"
    );
    // Register a new account.
    Model.globular.ressourceService
      .registerAccount(rqst)
      .then((rsp: ressource.RegisterAccountRsp) => {
        // Here I will set the token in the localstorage.
        let token = rsp.getResult();
        let decoded = jwt(token);

        // here I will save the user token and user_name in the local storage.
        localStorage.setItem("user_token", token);
        localStorage.setItem("user_name", (<any>decoded).username);
        localStorage.setItem("token_expired", (<any>decoded).exp);
        localStorage.setItem("user_email", (<any>decoded).email);

        // Callback on login.
        this.account = new Account(name, email);
        this.account.initData(
          (account: Account) => {
            Model.eventHub.publish("login_event", account, false);
            this.view.resume();
            onRegister(this.account);
          },
          (err: any) => {
            Model.eventHub.publish("login_event", this.account, false);
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
    let rqst = new ressource.AuthenticateRqst();
    rqst.setName(email);
    rqst.setPassword(password);
    this.view.wait("<div>log in</div><div>" + email + "</div><div>...</div>");

    Model.globular.ressourceService
      .authenticate(rqst)
      .then((rsp: ressource.AuthenticateRsp) => {
        // Here I will set the token in the localstorage.
        let token = rsp.getToken();
        let decoded = jwt(token);
        let userName = (<any>decoded).username;
        let email = (<any>decoded).email;

        // here I will save the user token and user_name in the local storage.
        localStorage.setItem("user_token", token);
        localStorage.setItem("token_expired", (<any>decoded).exp);
        localStorage.setItem("user_email", email);
        localStorage.setItem("user_name", userName);

        this.account = new Account(userName, email);

        // Start refresh as needed.
        this.startRefreshToken();

        // Init the user data...
        this.account.initData(
          (account: Account) => {
            Model.eventHub.publish("login_event", account, false);
            onLogin(account);
            this.view.resume();
            // Now I will set the application and user notification.
          },
          (err: any) => {
            Model.eventHub.publish("login_event", this.account, false);
            onLogin(this.account);
            this.view.resume();
            onError(err);
          }
        );
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

    // Set room to undefined.
    this.account = undefined;

    // remove token informations
    localStorage.removeItem("remember_me");
    localStorage.removeItem("user_token");
    localStorage.removeItem("user_name");
    localStorage.removeItem("user_email");
    localStorage.removeItem("token_expired");
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
      "update_profile_picture_event_",
      this.update_profile_picture_listener
    );
    Model.eventHub.unSubscribe(
      "delete_notification_event_",
      this.delete_notification_event_listener
    );

    // remove token informations
    localStorage.removeItem("remember_me");
    localStorage.removeItem("user_token");
    localStorage.removeItem("user_name");
    localStorage.removeItem("user_email");
    localStorage.removeItem("token_expired");
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
        this.view.displayMessage(err, 4000);
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
        this.view.displayMessage(err, 4000);
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
    let db: string;
    if (notification.type == NotificationType.Application) {
      db = Model.application + "_db";
      console.log(Application.getApplicationInfo(this.name))
      notification.sender = JSON.stringify(Application.getApplicationInfo(this.name))
    } else {
      db = this.account.id + "_db";
      // attach account informations.
      notification.sender = this.account.toString();
    }

    // Insert the notification in the db.
    let rqst = new InsertOneRqst();
    rqst.setId(db);
    rqst.setDatabase(db);
    rqst.setCollection("Notifications");

    rqst.setJsonstr(notification.toString());

    // Save the nofiction on the server.
    Model.globular.persistenceService
      .insertOne(rqst, {
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
    let db: string;
    let query: string;

    if (type == NotificationType.Application) {
      db = Model.application + "_db";
      query = `{"_recipient":"${Model.application}"}`;
    } else {
      db = this.account.id + "_db";
      query = `{"_recipient":"${this.account.id}"}`;
    }

    // Insert the notification in the db.
    let rqst = new FindRqst();
    rqst.setId(db);
    rqst.setDatabase(db);
    rqst.setCollection("Notifications");

    rqst.setQuery(query);

    let stream = Model.globular.persistenceService.find(rqst, {
      token: localStorage.getItem("user_token"),
      application: Model.application,
      domain: Model.domain,
    });

    let notifications = new Array<Notification>();
    stream.on("data", (rsp: FindResp) => {
      let data = JSON.parse(rsp.getJsonstr());
      for (let i = 0; i < data.length; i++) {
        let n = Notification.fromObject(data[i]);
        notifications.push(n);
      }
    });

    stream.on("status", (status) => {
      if (status.code != 0) {
        console.log(status.details);
        errorCallback(status.details);
      } else {
        callback(notifications);
      }
    });
  }

  removeNotification(notification: Notification) {}

  /**
   * Remove all notification.
   */
  clearNotifications(type: NotificationType) {}
}
