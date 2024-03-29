import { generatePeerToken, Model } from "./Model";
import * as resource from "globular-web-client/resource/resource_pb";
import * as authentication from "globular-web-client/authentication/authentication_pb"
//import 'source-map-support/register' // That resolve the error map and give real source name and plage in function.
import * as jwt from "jwt-decode";
import { ApplicationView } from "./ApplicationView";
import { Account } from "./Account";
import { NotificationType, Notification } from "./Notification";

import {
  UpdateOneRsp,
  CreateConnectionRqst,
  Connection,
  StoreType
} from "globular-web-client/persistence/persistence_pb";

import { v4 as uuidv4 } from "uuid";
import { ConversationManager } from "./Conversation";
import { Conversation } from "globular-web-client/conversation/conversation_pb";
import { LogInfo, LogLevel, LogRqst, LogRsp } from "globular-web-client/log/log_pb";
import { Session, SessionState } from "./Session";
import { File } from "./File";
import { playVideo } from "./components/Video";
import { playAudio } from "./components/Audio";
import { FileExplorer, getAudioInfo, getLocalDir, getTitleInfo, getVideoInfo } from "./components/File";
import { Audio, Title, Video } from "globular-web-client/title/title_pb";
import { Globular } from "globular-web-client";

// Get the configuration from url
function getFileConfig(url: string, callback: (obj: any) => void, errorcallback: (err: any) => void) {
  var xmlhttp = new XMLHttpRequest();
  xmlhttp.timeout = 1500

  xmlhttp.onreadystatechange = function () {
    if (this.readyState == 4 && (this.status == 201 || this.status == 200)) {
      var obj = JSON.parse(this.responseText);
      callback(obj);
    } else if (this.readyState == 4) {
      // Here no configuration was found... so I will ask the user give the 
      errorcallback("fail to get the configuration file at url " + url + " status " + this.status)
    }
  };

  url += "?domain=" + Model.domain // application is not know at this time...
  if (localStorage.getItem("user_token") != undefined) {
    url += "&token=" + localStorage.getItem("user_token")
  }

  xmlhttp.open("GET", url, true);
  xmlhttp.setRequestHeader("domain", Model.domain);

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

  public static account: Account;


  /**
   * Create a new application with a given name. The view
   * can be any ApplicationView or derived ApplicationView class.
   * @param name The name of the application.
   */
  constructor(name: string, title: string, view: ApplicationView) {
    super();

    // set the application name.
    Model.application = name;

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


    view.setTitle(title); // set the title.


    // Set the application theme...
    let theme = localStorage.getItem("globular_theme")
    if (theme != null) {
      let html = document.querySelector("html")
      html.setAttribute("theme", theme)
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
        info.setLevel(LogLevel.ERROR_MESSAGE)

        if (error == undefined) {
          return
        }

        info.setMethod(error.name + " " + error.message)
        info.setMessage(error.stack.toString())
        info.setApplication(Application.application)
        info.setOccurences(0)
        let rqst = new LogRqst
        rqst.setInfo(info)

        Model.globular.logService.log(rqst, {
          token: localStorage.getItem("user_token"),
          application: Model.application,
          domain: Model.domain,
          address: Model.address
        }).then((rsp: LogRsp) => {

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
        },
        (evt: any) => {
          // Here I will try to login the user.
          this.login(
            evt.userId,
            evt.pwd,
            (account: Account) => {
              // Here I will send a login success.
              Model.eventHub.publish("login_event", account, true);
            },
            (err: any) => {
              ApplicationView.displayMessage(err, 4000);
            }
          );
        },
        true,
        this
      );

      Model.eventHub.subscribe(
        "logout_event_",
        (uuid: string) => {
        },
        (evt: any) => {
          Application.logout();
        },
        true, this
      );
      // The register event.
      Model.eventHub.subscribe(
        "settings_event_",
        (uuid: string) => {
        },
        (evt: any) => {
          this.settings();
        },
        true, this
      );


      // The register event.
      Model.eventHub.subscribe(
        "register_event_",
        (uuid: string) => {
        },
        (evt: any) => {
          // Here I will try to login the user.
          this.register(
            evt.userId,
            evt.email,
            evt.pwd,
            evt.repwd,
            evt.domain,
            (account: Account) => {
              account.session = new Session(account, SessionState.Online)
            },
            (err: any) => {
              ApplicationView.displayMessage(err, 4000);
            }
          );
        },
        true, this
      );

      // That listener is use to keep the client up to date with the server.
      // if an accout is connect it will not restart it session automaticaly...

      Model.eventHub.subscribe(
        `update_${Application.domain}_${Application.application}_evt`,
        (uuid: string) => {
        },
        (version: string) => {

          if (Application.account == undefined) {
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
        false, this
      );


      // Invite contact event.
      Model.eventHub.subscribe(
        "send_conversation_invitation_event_",
        (uuid: string) => {
        },
        (evt: any) => {
          // Here I will try to login the user.
          this.onInviteParticipant(evt);
        },
        true, this
      );


      // Invite contact event.
      Model.eventHub.subscribe(
        "invite_contact_event_",
        (uuid: string) => {
        },
        (contact: Account) => {
          // Here I will try to login the user.
          this.onInviteContact(contact);
        },
        true, this
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
        true, this
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
        true, this
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
        true, this
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
        true, this
      );


      // Delete user notification.
      Model.eventHub.subscribe(
        "delete_notification_event_",
        (uuid: string) => {
        },
        (notification: any) => {
          notification = Notification.fromObject(notification);
          this.removeNotification(notification);
        },
        true, this
      );

      Model.eventHub.subscribe(
        "follow_link_event_",
        (uuid: string) => {
        },
        (lnk: any) => {


          let openFileExplorer = (globule: Globular, file: File, callback: (dir: File, explorer: FileExplorer) => void) => {
            // So the file is not a stream I will open the file explorer...
            // The file explorer object.
            let fileExplorer = new FileExplorer(globule);

            // Set the file explorer...
            fileExplorer.init((shared: any, public_: any) => {
              let dir = shared[file.path.split("/")[2]]
              if (dir) {
                Model.eventHub.publish("__set_dir_event__", { dir: dir, file_explorer_id: fileExplorer.id }, true)
                callback(dir, fileExplorer)
              } else {
                File.readDir(file.path, false, (dir: File) => {
                  Model.eventHub.publish("__set_dir_event__", { dir: dir, file_explorer_id: fileExplorer.id }, true)
                  callback(dir, fileExplorer)
                }, err => { }, globule)
              }

            });

            // Set the onerror callback for the component.
            fileExplorer.onerror = (err: any) => {
              return ApplicationView.displayMessage(err, 4000)
            };

            fileExplorer.onclose = () => {
              // Remove the file explorer.
              fileExplorer.parentNode.removeChild(fileExplorer)
              fileExplorer.delete() // remove all listeners.
              fileExplorer = null;
            }

            Model.eventHub.publish("_open_file_explorer_event_", fileExplorer, true)
            fileExplorer.open()
          }

          let globule = Model.getGlobule(lnk.domain)
          File.getFile(globule, lnk.path, -1, -1, (file: any) => {
            if (file.mime.startsWith("video")) {
              getTitleInfo(file, (titles: Title[]) => {
                if (titles) {
                  playVideo(file.path, () => { }, () => { }, titles[0], globule)
                } else {
                  getVideoInfo(file, (videos: Video[]) => {
                    playVideo(file.path, () => { }, () => { }, videos[0], globule)
                  })
                }
              })

            } else if (file.mime.startsWith("audio")) {
              getAudioInfo(file, (audios: Audio[]) => {
                playAudio(file.path, () => { }, () => { }, audios[0], globule)
              })

            } else if (file.mime == "inode/directory") {
              File.getFile(file.globule, file.path + "/playlist.m3u8", -1, -1, f => {
                getVideoInfo(file, (videos: Video[]) => {
                  playVideo(file.path, () => { }, () => { }, videos[0], globule)
                })
              }, err => {

                openFileExplorer(globule, file, (dir: File, explorer: FileExplorer) => { })
              })
            } else if (file.mime.startsWith("text/") || file.mime == "application/pdf" || file.mime == "application/json") {

              let path = file.path.substring(0, file.path.lastIndexOf("/"));
              File.getFile(file.globule, path, -1, -1, f => {
                openFileExplorer(file.globule, f,
                  (dir: File, explorer: FileExplorer) => {
                    /** nothing */
                    explorer.readFile(file);
                  })
              }, err => ApplicationView.displayMessage(err, 3000))
            } else if (file.mime.startsWith("image/")) {

              let path = file.path.substring(0, file.path.lastIndexOf("/"));
              File.getFile(file.globule, path, -1, -1, f => {
                openFileExplorer(file.globule, f,
                  (dir: File, explorer: FileExplorer) => {
                    /** nothing */
                    setTimeout(() => {
                      explorer.setDir(dir, () => {
                        explorer.showImage(file)
                      })

                    }, 1000)
                  })
              }, err => ApplicationView.displayMessage(err, 3000))
            } else {
              // Open the file location if no reader's are available...
              let path = file.path.substring(0, file.path.lastIndexOf("/"));
              File.getFile(file.globule, path, -1, -1, f => {
                openFileExplorer(file.globule, f,
                  (dir: File, explorer: FileExplorer) => {
                    /** nothing */
                    explorer.setDir(dir, null)
                  })
              }, err => ApplicationView.displayMessage(err, 3000))
            }
          }, err => ApplicationView.displayMessage(err, 3000))
        },
        true, this
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
        let userEmail = localStorage.getItem("user_email");
        let userName = localStorage.getItem("user_name");
        let userDomain = localStorage.getItem("user_domain");

        let userInfo = localStorage.getItem(userId);
        let userFirstName = ""
        let userLastName = ""
        let usermiddle_name = ""
        let userProfilePicture = ""
        if (userInfo) {
          let userInfo_ = JSON.parse(userInfo)
          userFirstName = userInfo_["first_name"]
          userLastName = userInfo_["last_name"]
          usermiddle_name = userInfo_["middle_name"]
          userProfilePicture = userInfo_["profile_picture"]
        }

        ApplicationView.wait(
          "<div>log in</div><div>" + userName + "</div><div>...</div>"
        );

        Application.account = new Account(userId, userEmail, userName, userDomain, userFirstName, userLastName, usermiddle_name, userProfilePicture)

        this.refreshToken(
          (account: Account) => {
            // send a refresh token event.
            // Model.eventHub.publish("refresh_token_event", account, true);

            Model.eventHub.publish("login_event", account, true);

            // When new contact is accepted.
            Model.getGlobule(Application.account.domain).eventHub.subscribe("accepted_" + account.id + "@" + account.domain + "_evt",
              (uuid) => { },
              (evt) => {
                let invitation = JSON.parse(evt);
                this.addContactListener(invitation)
              },
              false, this)

            account.session.state = SessionState.Online
            Model.publish(`__session_state_${account.id + "@" + account.domain}_change_event__`, account.session, true)

            Model.getGlobule(account.domain).eventHub.subscribe("deleted_" + account.id + "@" + account.domain + "_evt",
              (uuid) => { },
              (evt) => {
                let invitation = JSON.parse(evt);
                Model.getGlobule(account.domain).eventHub.unSubscribe(`session_state_${invitation._id}_change_event`, this.contactsListener[invitation._id])
              },
              false, this)

            // retreive the contacts
            Account.getContacts(account, `{"status":"accepted"}`, (contacts: Array<Account>) => {
              contacts.forEach(contact => {
                this.addContactListener(contact)
              })
            },
              (err: any) => {
                ApplicationView.displayMessage(err, 3000)
              })

            // Retreive conversations...
            ConversationManager.loadConversations(account,
              (conversations: Array<Conversation>) => {
                Model.eventHub.publish("__load_conversations_event__", conversations, true)
              },
              (err: any) => {
                /* this.displayMessage(err, 3000)*/
                /** no conversation found... */
              })

            // Connect to to the conversation manager.
            ConversationManager.connect((err: any) => {
              ApplicationView.displayMessage(err, 3000)
            })

            this.initNotifications();
            this.startRefreshToken();
          },
          (err: any) => {
            ApplicationView.displayMessage(err, 4000);
            ApplicationView.resume();
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
      err => {
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
    errorCallback: (err: any) => void,
    force: boolean = false
  ) {

    if (Application.infos != undefined && !force) {
      if (Application.infos.size != 0) {
        callback(Array.from(Application.infos.values()));
        return
      }
    }

    const rqst = new resource.GetApplicationsRqst();

    const stream = Model.globular.resourceService.getApplications(rqst, {
      application: Model.application.length > 0 ? Model.application : Model.globular.config.IndexApplication,
      domain: Model.domain,
      address: Model.address
    });

    let applications = new Array<resource.Application>();

    stream.on("data", (rsp: resource.GetApplicationsRsp) => {
      applications = applications.concat(rsp.getApplicationsList());
    });

    stream.on("status", (status) => {
      if (status.code === 0) {
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
          Application.infos.set(applications[i].getName(), applications[i]);
          
        }

        callback(applications);
      } else {
        errorCallback({ message: status.details });
      }
    });
  }

  /**
   * Return application infos 
   * @param id
   */
  static getApplicationInfo(id: string): resource.Application {
    // TODO manage application domain... 
    if (id.indexOf("@") != -1) {
      return Application.infos.get(id.split("@")[0]);
    }
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
    return Application.account != null;
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
        let domain = (<any>decoded).user_domain;

        // here I will save the user token and user_name in the local storage.
        localStorage.setItem("user_token", token);
        localStorage.setItem("token_expired", (<any>decoded).exp);
        localStorage.setItem("user_id", id);
        localStorage.setItem("user_name", userName);
        localStorage.setItem("user_email", email);

        // Set the account
        Account.getAccount(userName + "@" + domain, (account: Account) => {
          Application.account = account;
          initCallback(Application.account);
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
    let expireAt = parseInt(localStorage.getItem("token_expired"), 10)
    let now = Math.floor(Date.now() / 1000)
    let delay = (expireAt - now) * 1000// in second (10 second to give time to token to refresh before error)

    let __setTimeout = setTimeout(() => {
      this.refreshToken(
        (account: Account) => {
          Application.account = account;
          // remove resource...
          clearTimeout(__setTimeout);
          // go for next loop...
          this.startRefreshToken()
        },
        (err: any) => {
          // simply display the error on the view.
          ApplicationView.displayMessage(err, 4000);

          // Stop runing...
          clearTimeout(__setTimeout);
        }
      );

    }, delay - 10 * 1000); // refresh 10 sec before exipire timeout.
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
    domain: string,
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
    account.setId(name)
    account.setDomain(domain)
    rqst.setAccount(account);

    ApplicationView.wait(
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
        localStorage.setItem("user_domain", (<any>decoded).user_domain);


        let rqst = new CreateConnectionRqst
        let connectionId = name.split("@").join("_").split(".").join("_");

        let address = (<any>decoded).address;
        let domain = (<any>decoded).domain;
        let globule = Model.getGlobule(address) 
        
        // So here i will open the use database connection.
        let connection = new Connection
        connection.setId(connectionId)
        connection.setUser(connectionId)
        connection.setPassword(password)
        connection.setStore(globule.config.BackendStore)
        connection.setName(name + "_db")
        connection.setPort(globule.config.BackendPort)
        connection.setTimeout(60)
        connection.setHost(address)
        rqst.setConnection(connection)
    
        globule.persistenceService.createConnection(rqst, {
          token: localStorage.getItem("user_token"),
          application: Model.application,
          domain: domain,
          address: address
        }).then(() => {
          // Callback on login.
          Application.account = new Account(name, email, name, domain, "", "", "", "");
          Application.account.initData(
            (account: Account) => {
              // Here I will send a login success.
              Model.eventHub.publish("login_event", account, true);
              onRegister(Application.account);
              this.initNotifications();
              this.startRefreshToken();
              ApplicationView.resume();


            },
            (err: any) => {
              Model.eventHub.publish("login_event", account, true);
              onRegister(Application.account);
              this.initNotifications();
              this.startRefreshToken();
              ApplicationView.resume();
              onError(err);
            }
          );

        }).catch(err => {
          ApplicationView.resume();
          onError(err);
        })

      })
      .catch((err: any) => {
        ApplicationView.resume();
        onError(err);
      });

    return null;
  }

  // Display message when contact state change.
  addContactListener(contact: any) {
    Account.getAccount(contact._id, (account: Account) => {

      let globule = Model.getGlobule(account.domain)

      if (globule) {
        // subscribe to session event change.
        globule.eventHub.subscribe(`session_state_${account.id + "@" + account.domain}_change_event`,
          (uuid: string) => {
            this.contactsListener[contact._id] = uuid;
          },
          (evt: string) => {

            if (account.session) {
              const obj = JSON.parse(evt)
              account.session.lastStateTime = new Date(obj.lastStateTime * 1000)
              account.session.state = obj.state

              // Here I will ask the user for confirmation before actually delete the contact informations.
              let toast = <any>ApplicationView.displayMessage(
                ` <style>
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
                  <globular-contact-card contact="${account.id + "@" + account.domain}"></globular-contact-card>
                </div>`,

                5000 // 15 sec...
              )
            }

          }, false, this)

      } else {
        console.log("fail to connect to ", account.domain)
      }

    }, err => console.log(err))

  }
  /**
   * Login into the application
   * @param email
   * @param password
   */
  login(
    userId: string,
    password: string,
    onLogin: (account: Account) => void,
    onError: (err: any) => void
  ) {

    let globule = Model.globular
    if (userId.indexOf("@") != -1) {

      globule = Model.getGlobule(userId.split("@")[1])
    }


    let rqst = new authentication.AuthenticateRqst();
    rqst.setName(userId);
    rqst.setPassword(password);
    rqst.setIssuer(Model.globular.config.Mac) // The token will be issue for the current globule.

    ApplicationView.wait("<div>log in</div><div>" + userId + "</div><div>...</div>");


    globule.authenticationService
      .authenticate(rqst)
      .then((rsp: authentication.AuthenticateRsp) => {

        // Here I will set the token in the localstorage.
        let token = rsp.getToken();
        let decoded = jwt(token);
        let userName = (<any>decoded).username;
        let email = (<any>decoded).email;
        let id = (<any>decoded).id;
        let address = (<any>decoded).address;
        let userDomain = (<any>decoded).user_domain;


        // here I will save the user token and user_name in the local storage.
        localStorage.setItem("user_token", token);
        localStorage.setItem("token_expired", (<any>decoded).exp);
        localStorage.setItem("user_email", email);
        localStorage.setItem("user_name", userName);
        localStorage.setItem("user_id", id);
        localStorage.setItem("user_domain", userDomain);

        let rqst = new CreateConnectionRqst
        let connectionId = userName.split("@").join("_").split(".").join("_");


        // So here i will open the use database connection.
        let connection = new Connection
        connection.setId(connectionId)
        connection.setUser(connectionId)
        connection.setPassword(password)
        connection.setStore(globule.config.BackendStore)
        connection.setName(id + "_db")
        connection.setPort(globule.config.BackendPort)
        connection.setTimeout(60)
        connection.setHost(address)
        rqst.setConnection(connection)
        globule.persistenceService.createConnection(rqst, {
          token: token,
          application: Model.application,
          domain: Model.domain,
          address: address
        }).then(() => {
          let userInfo = localStorage.getItem(id);
          let userFirstName = ""
          let userLastName = ""
          let usermiddle_name = ""
          let userProfilePicture = ""
          if (userInfo) {
            let userInfo_ = JSON.parse(userInfo)
            userFirstName = userInfo_["first_name"]
            userLastName = userInfo_["last_name"]
            usermiddle_name = userInfo_["middle_name"]
            userProfilePicture = userInfo_["profile_picture"]
          }

          Application.account = new Account(id, email, userName, userDomain, userFirstName, userLastName, usermiddle_name, userProfilePicture);
          Account.getAccount(userId + "@" + userDomain, (account: Account) => {
            Application.account = account;

            // so here I will get the session for the account...
            Application.account.session.state = SessionState.Online;
            Application.account.session.lastStateTime = new Date()
            Application.account.session.save(() => { }, (err: any) => {
              ApplicationView.displayMessage(err, 3000)
            })

            onLogin(account);

            // When new contact is accepted.
            Model.getGlobule(Application.account.domain).eventHub.subscribe("accepted_" + account.id + "@" + account.domain + "_evt",
              (uuid) => { },
              (evt) => {
                let invitation = JSON.parse(evt);
                this.addContactListener(invitation)
              },
              false, this)

            Model.getGlobule(account.domain).eventHub.subscribe("deleted_" + account.id + "@" + account.domain + "_evt",
              (uuid) => { },
              (evt) => {
                let invitation = JSON.parse(evt);
                let domain = invitation._id.split("@")[1]
                Model.getGlobule(domain).eventHub.unSubscribe(`session_state_${invitation._id}_change_event`, this.contactsListener[invitation._id])
              },
              false, this)


            Model.eventHub.publish(`__session_state_${Application.account.id + "@" + Application.account.domain}_change_event__`, Application.account.session, true)

            // retreive the contacts
            Account.getContacts(Application.account, `{"status":"accepted"}`, (contacts: Array<Account>) => {
              contacts.forEach(contact => {
                this.addContactListener(contact)
              })
            },
              (err: any) => {
                ApplicationView.displayMessage(err, 3000)
              })

            // Retreive conversations...
            ConversationManager.loadConversations(Application.account,
              (conversations: Array<Conversation>) => {
                Model.eventHub.publish("__load_conversations_event__", conversations, true)
              },
              (err: any) => {
                /* this.displayMessage(err, 3000)*/
                /** no conversation found... */
              })

            // Connect to to the conversation manager.
            ConversationManager.connect((err: any) => {
              ApplicationView.displayMessage(err, 3000)
            })

            //ApplicationView.resume();
            this.initNotifications();
            // Start refresh as needed.
            this.startRefreshToken();
          }, (err: any) => {
            ApplicationView.resume();
            onError(err);
          })
        }).catch((err: any) => {
          console.log("fail to create the connection ", err)
        })

      })
      .catch((err) => {
        ApplicationView.resume();
        onError(err);
      });
  }

  ///////////////////////////////////////////////////////////////
  // Application close funtions.
  //////////////////////////////////////////////////////////////

  /**
   * Close the current session explicitelty.
   */
  static logout() {

    // Send local event.
    if (Application.account != undefined) {

      // refresh the page to be sure all variable are clear...
      ApplicationView.wait("bye bye " + Application.account.name + "!")

      // So here I will set the account session state to onlise.
      Application.account.session.state = SessionState.Offline;

      Model.eventHub.publish("logout_event", Application.account, true);
      Model.eventHub.publish(`__session_state_${Application.account.id + "@" + Application.account.domain}_change_event__`, Application.account.session, true)
      Model.getGlobule(Application.account.domain).eventHub.publish(`session_state_${Application.account.id + "@" + Application.account.domain}_change_event`, Application.account.session.toString(), false)

      // Set room to undefined.
      Application.account = null;
    }

    // remove token informations
    localStorage.removeItem("remember_me");
    localStorage.removeItem("user_token");
    localStorage.removeItem("user_id");
    localStorage.removeItem("user_name");
    localStorage.removeItem("user_email");
    localStorage.removeItem("token_expired");


    setTimeout(() => {
      ApplicationView.resume()
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
      address: Model.address
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
  static sendNotifications(
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
      
      if (notification.sender.length == 0) {
        notification_.setSender(Application.account.id + "@" + Application.account.domain)
      } else {
        notification_.setSender(notification.sender)
      }

      if (notification.mac.length == 0) {
        notification_.setMac(Model.getGlobule(Application.account.domain).config.Mac)
      } else {
        notification_.setMac(notification.mac)
      }
    }

    rqst.setNotification(notification_)
    let globule = Application.getGlobule(notification.recipient.split("@")[1])

    globule.resourceService
      .createNotification(rqst, {
        token: localStorage.getItem("user_token"),
        application: Model.application,
        domain: Model.domain,
        address: Model.address
      })
      .then(() => {

        // Here I will throw a network event...
        // Publish the notification
        Model.publish(
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

    let globule = Model.getGlobule(Application.account.domain)

    generatePeerToken(globule, token => {
      // So here I will get the list of notification for the given type.
      let rqst = new resource.GetNotificationsRqst

      if (type == NotificationType.Application) {
        rqst.setRecipient(Model.application)
      } else {
        rqst.setRecipient(Application.account.id)
        globule = Model.getGlobule(Application.account.domain)
      }


      let stream = globule.resourceService.getNotifications(rqst, {
        token: token,
        application: Model.application,
        domain: Model.domain,
        address: Model.address
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
            let n = new Notification(notifications[i].getMac(), notifications[i].getSender(), notifications[i].getNotificationType().valueOf(), notifications[i].getRecipient(), notifications[i].getMessage(), new Date(notifications[i].getDate() * 1000))
            n.id = notifications[i].getId();

            notifications_.push(n);
          }

          callback(notifications_)

        } else {
          // In case of error I will return an empty array
          callback([]);
        }
      });

    }, err => ApplicationView.displayMessage(err, 3000))

  }

  removeNotification(notification: Notification) {

    let rqst = new resource.DeleteNotificationRqst
    let globule = Model.globular
    if (notification.type == NotificationType.User) {
      globule = Model.getGlobule(Application.account.domain)
    }

    rqst.setId(notification.id)
    rqst.setRecipient(notification.recipient)

    globule.resourceService
      .deleteNotification(rqst, {
        token: localStorage.getItem("user_token"),
        application: Model.application,
        domain: Model.domain,
        address: Model.address
      })
      .then(() => {
        // The notification is not deleted so I will send network event to remove it from
        // the display.
        Model.publish(
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

    let participant = evt["participant"]
    let domain = participant.split("@")[1]

    // Create a user notification.
    let notification = new Notification(
      Model.getGlobule(domain).config.Mac,
      Application.account.id + "@" + Application.account.domain,
      NotificationType.User,
      evt["participant"],
      `
      <div style="display: flex; flex-direction: column;">
        <p>
          ${Application.account.name} invited you to join the conversation named ${evt["conversation"]}.
        </p>
      </div>`
    );

    // Send the notification.
    Application.sendNotifications(
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
      Model.getGlobule(contact.domain).config.Mac,
      Application.account.id + "@" + Application.account.domain,
      NotificationType.User,
      contact.id + "@" + contact.domain,
      `
      <div style="display: flex; flex-direction: column;">
        <p>
          ${Application.account.name} want to add you as contact.<br>Click the <iron-icon id="Contacts_icon" icon="social:people"></iron-icon> button to accept or decline the invitation.
        </p>
      </div>`
    );

    // Send the notification.
    Application.sendNotifications(
      notification,
      () => {
        Account.setContact(Application.account, "sent", contact, "received",
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
      Model.getGlobule(contact.domain).config.Mac,
      Application.account.id + "@" + Application.account.domain,
      NotificationType.User,
      contact.id + "@" + contact.domain,
      `
      <div style="display: flex; flex-direction: column;">
        <p>
          ${Application.account.name} accept you as contact.
          <br>Click the <iron-icon id="Contacts_icon" icon="social:people"></iron-icon> button to get more infos.
        </p>
      </div>`
    );

    // Send the notification.
    Application.sendNotifications(
      notification,
      () => {
        Account.setContact(Application.account, "accepted", contact, "accepted",
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
      Model.getGlobule(contact.domain).config.Mac,
      Application.account.id + "@" + Application.account.domain,
      NotificationType.User,
      contact.id + "@" + contact.domain,
      `
      <div style="display: flex; flex-direction: column;">
        <p>
          Unfortunately ${Application.account.name} declined your invitation.
          <br>Click the <iron-icon id="Contacts_icon" icon="social:people"></iron-icon> button to get more infos.
        </p>
      </div>`
    );

    // Send the notification.
    Application.sendNotifications(
      notification,
      () => {
        Account.setContact(Application.account, "declined", contact, "declined",
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
      Model.getGlobule(contact.domain).config.Mac,
      Application.account.id + "@" + Application.account.domain,
      NotificationType.User,
      contact.id + "@" + contact.domain,
      `
      <div style="display: flex; flex-direction: column;">
        <p>
          Unfortunately ${Application.account.name} revoke the invitation.
          <br>Click the <iron-icon id="Contacts_icon" icon="social:people"></iron-icon> button to get more infos.
        </p>
      </div>`
    );

    // Send the notification.
    Application.sendNotifications(
      notification,
      () => {
        Account.setContact(Application.account, "revoked", contact, "revoked",
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
      Model.getGlobule(contact.domain).config.Mac,
      Application.account.id + "@" + Application.account.domain,
      NotificationType.User,
      contact.id + "@" + contact.domain,
      `
      <div style="display: flex; flex-direction: column;">
        <p>
          You and ${Application.account.name} are no more in contact.
          <br>Click the <iron-icon id="Contacts_icon" icon="social:people"></iron-icon> button to get more infos.
        </p>
      </div>`
    );

    // Send the notification.
    Application.sendNotifications(
      notification,
      () => {
        Account.setContact(Application.account, "deleted", contact, "deleted",
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
