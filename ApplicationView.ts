import { View } from "./View";
import * as M from "materialize-css";
import "materialize-css/sass/materialize.scss";
import { Account } from "./Account";
import { ApplicationSettings, FileSettings, GroupSettings, LogSettings, RoleSettings, UserSettings } from "./Settings"
import { Model } from "./Model";
import { DockerNames } from "./components/RandomName"

// web-components.
import { Layout } from "./components/Layout";
import { Login } from "./components/Login";
import { AccountMenu } from "./components/Account";
import { NotificationMenu } from "./components/Notification";
import { OverflowMenu } from "./components/Menu";
import { ApplicationsMenu } from "./components/Applications";
import { Camera } from "./components/Camera";
import { FileExplorer, FilesMenu } from "./components/File";
import { SearchBar } from "./components/Search";
import { ContactCard, ContactsMenu } from "./components/Contact";
import { MessengerMenu, Messenger } from "./components/Messenger";
import { SettingsMenu, SettingsPanel } from "./components/Settings";
import { Application } from "./Application";

// Not directly use here but must be include anyways
import { Wizard } from "./components/Wizard";
import { SlideShow } from "./components/SlideShow";
import { ImageCropper } from "./components/Image";
import "./components/table/table.js"
import { Conversation, Invitation } from "globular-web-client/conversation/conversation_pb";
import { ConversationManager } from "./Conversation";

// This variable is there to give acces to wait and resume...
export let applicationView: ApplicationView;
const nameGenrator = new DockerNames();

// Must be imported to overide the materialyse style
import "./style.css"
import { rgbToHsl } from "./components/utility";
import { readDir, uploadFiles } from "globular-web-client/api";

/**
 * Application view made use of Web-component and Materialyse to create a basic application
 * layout that can be use as starting point to any web-application.
 */
export class ApplicationView extends View {

  private _workspace_childnodes: Array<any>;
  private _sidemenu_childnodes: Array<any>;

  private _application: Application;

  public get application(): Application {
    return this._application;
  }
  public set application(value: Application) {
    this._application = value;
  }

  /** The application view component. */
  private layout: Layout;

  /** The login panel */
  private login_: Login;

  /** The account panel */
  private accountMenu: AccountMenu;

  /** The  overflow menu*/
  private overFlowMenu: OverflowMenu;

  /** The nofitication panel */
  private notificationMenu: NotificationMenu;

  /** The applications menu */
  private applicationsMenu: ApplicationsMenu;

  /** The contact menu */
  private contactsMenu: ContactsMenu;

  /** The file menu */
  private filesMenu: FilesMenu;

  /** The messenger menu */
  private messengerMenu: MessengerMenu;

  /** Don't shoot the messenger! */
  private messenger: Messenger;

  /** The settings Menu */
  protected settingsMenu: SettingsMenu;

  /** The settings Panel */
  protected settingsPanel: SettingsPanel;

  /** The camera */
  private _camera: Camera;
  public get camera(): Camera {
    return this._camera;
  }

  /** The file explorer */
  private _fileExplorer: FileExplorer;
  public get fileExplorer(): FileExplorer {
    return this._fileExplorer;
  }

  /** The seach bar */
  private _searchBar: SearchBar;
  public get searchBar(): SearchBar {
    return this._searchBar;
  }

  /** various listener's */
  private login_event_listener: string;
  private logout_event_listener: string;
  private settings_event_listener: string;
  private save_settings_event_listener: string;


  private _isLogin: boolean;
  public get isLogin(): boolean {
    return this._isLogin;
  }
  public set isLogin(value: boolean) {
    this._isLogin = value;
  }

  private icon: any;

  /** The current displayed view... */
  protected activeView: View;

  constructor() {
    super();

    // The web-component use as layout is named globular-application
    if (document.getElementsByTagName("globular-application") != undefined) {
      this.layout = <Layout>(
        document.getElementsByTagName("globular-application")[0]
      );
    } else {
      this.layout = new Layout();
      document.body.appendChild(this.layout);
    }

    // set it to false.
    this.isLogin = false;

    // Set the login box...
    this.login_ = new Login();
    this.layout.toolbar().appendChild(this.login_);

    // This contain account informations.
    this.accountMenu = new AccountMenu();

    // This contain account/application notification
    this.notificationMenu = new NotificationMenu();

    // The overflow menu is use to hide menu that dosen't fix in the visual.
    this.overFlowMenu = new OverflowMenu();

    // The applicaiton menu
    this.applicationsMenu = new ApplicationsMenu();


    // The concact menu
    this.contactsMenu = new ContactsMenu();

    // The messenger menu
    this.messengerMenu = new MessengerMenu();

    // The camera can be use to take picture.
    this._camera = new Camera();

    // The search bar to give end user the power to search almost anything...
    this._searchBar = new SearchBar();

    // That function will be call when the file is saved.
    this._camera.onsaved = (path: string, name: string) => {
      console.log("----> save success!");
      
    };

    // Now the save funciton..
    this._camera.onsave = (picture: any) => {
      // save image from the picture.
      console.log("save picture:", picture);
    };

    // The file explorer object.
    this._fileExplorer = new FileExplorer();

    // The file menu
    this.filesMenu = new FilesMenu(this._fileExplorer);

    // set the global varialbe...
    applicationView = this;
  }

  // Must be call by the model when after it initialisation was done.
  init() {
    // Create the setting components.
    this.settingsMenu = new SettingsMenu();

    this.settingsPanel = new SettingsPanel();

    // init listener's in the layout.
    this.layout.init();
    this.login_.init();
    this.accountMenu.init();
    this.applicationsMenu.init();
    this.notificationMenu.init();
    this.filesMenu.init();

    // Logout event
    Model.eventHub.subscribe(
      "logout_event",
      (uuid: string) => {
        this.logout_event_listener = uuid;
      },
      () => {
        this.onLogout();
      },
      true
    );

    // Login event.
    Model.eventHub.subscribe(
      "login_event",
      (uuid: string) => {
        this.login_event_listener = uuid;
      },
      (account: Account) => {
        this.onLogin(account);


        // Here I will set contact menu actions.

        // On invite contact action.
        this.contactsMenu.onInviteConctact = (contact: Account) => {
          // Display the message to the user.
          ApplicationView.displayMessage(
            "<iron-icon icon='send' style='margin-right: 10px;'></iron-icon><div>Invitation was sent to " +
            contact.email +
            "</div>",
            3000
          );

          // So here I will create a notification.
          Model.eventHub.publish("invite_contact_event_", contact, true);
        };

        // On revoke contact invitation action.
        this.contactsMenu.onRevokeContact = (contact: Account) => {

          ApplicationView.displayMessage(
            "<iron-icon icon='send' style='margin-right: 10px;'></iron-icon><div>Invitation to " +
            contact.email +
            " was revoked!</div>",
            3000
          );

          Model.eventHub.publish("revoke_contact_invitation_event_", contact, true);

        }

        // On accept contact invitation
        this.contactsMenu.onAcceptContact = (contact: Account) => {
          ApplicationView.displayMessage(
            "<iron-icon icon='send' style='margin-right: 10px;'></iron-icon><div>Invitation from " +
            contact.email +
            " was accepted!</div>",
            3000
          );

          Model.eventHub.publish("accept_contact_invitation_event_", contact, true);
        }

        // Decline contact invitation
        this.contactsMenu.onDeclineContact = (contact: Account) => {
          ApplicationView.displayMessage(
            "<iron-icon icon='send' style='margin-right: 10px;'></iron-icon><div>Invitation from " +
            contact.email +
            " was declined!</div>",
            3000
          );

          Model.eventHub.publish("decline_contact_invitation_event_", contact, true);
        }

        // Delete contact.
        this.contactsMenu.onDeleteContact = (contact: Account) => {

          // Here I will ask the user for confirmation before actually delete the contact informations.
          let toast = ApplicationView.displayMessage(
            `
            <style>
              #yes-no-contact-delete-box{
                display: flex;
                flex-direction: column;
              }

              #yes-no-contact-delete-box globular-contact-card{
                padding-bottom: 10px;
              }

              #yes-no-contact-delete-box div{
                display: flex;
                font-size: 1rem;
                padding-bottom: 10px;
              }

              paper-button{
                font-size: 1rem;
                height: 32px;
              }

            </style>
            <div id="yes-no-contact-delete-box">
              <div>Your about to delete the contact</div>
              <globular-contact-card id="contact-to-delete" contact="${contact.id}"></globular-contact-card>
              <div>Is it what you want to do? </div>
              <div style="justify-content: flex-end;">
                <paper-button raised id="yes-delete-contact">Yes</paper-button>
                <paper-button raised id="no-delete-contact">No</paper-button>
              </div>
            </div>
            `,
            15000 // 15 sec...
          );

          let yesBtn = <any>document.querySelector("#yes-delete-contact")
          let noBtn = <any>document.querySelector("#no-delete-contact")

          // On yes
          yesBtn.onclick = () => {
            toast.dismiss();

            ApplicationView.displayMessage(
              "<iron-icon icon='send' style='margin-right: 10px;'></iron-icon><div>Contact " +
              contact.email +
              " was remove from your contacts!</div>",
              3000
            );

            Model.eventHub.publish("delete_contact_event_", contact, true);

          }

          noBtn.onclick = () => {
            toast.dismiss();
          }
        }



        // The contacts will be initialyse at login time only.
        this.contactsMenu.init(account);


        // Also the messenger menu
        this.messengerMenu.init(account);

        // Set the messenger.
        this.messenger = new Messenger(account);

        // Also display it inside the workspace.
        document.body.appendChild(this.messenger)


        Model.eventHub.subscribe("__create_new_conversation_event__",
          (uuid) => { },
          (evt) => {
            this.onCreateNewConversation();
          },
          true)

        Model.eventHub.subscribe("__invite_conversation_evt__",
          (uuid: string) => { },
          (evt: any) => {
            this.onInviteToConversaiton(evt);
          }, true)

        Model.eventHub.subscribe("__delete_conversation_evt__",
          (uuid: string) => { },
          (evt: any) => {
            this.onDeleteConversaiton(evt);
          }, true)
      },
      true
    );

    // Settings event
    Model.eventHub.subscribe(
      "settings_event_",
      (uuid: string) => {
        this.settings_event_listener = uuid;

      },
      () => {
        this.onSettings();
      },
      true
    );

    // Settings event
    Model.eventHub.subscribe(
      "save_settings_evt",
      (uuid: string) => {
        this.save_settings_event_listener = uuid;
      },
      (saveSetting: boolean) => {
        this.onSaveSettings(saveSetting)

      },
      true
    );

    /**
     * The resize listener.
     */
    window.addEventListener("resize", (evt: any) => {
      let w = this.layout.width();

      if (w <= 500) {
        this.overFlowMenu
          .getMenuDiv()
          .insertBefore(
            this.applicationsMenu,
            this.overFlowMenu.getMenuDiv().firstChild
          );
        this.applicationsMenu.getMenuDiv().classList.remove("bottom");
        this.applicationsMenu.getMenuDiv().classList.add("left");

        if (this.isLogin) {
          this.overFlowMenu.show();

          this.overFlowMenu.getMenuDiv().appendChild(this.filesMenu);
          this.filesMenu.getMenuDiv().classList.remove("bottom");
          this.filesMenu.getMenuDiv().classList.add("left");

          this.overFlowMenu.getMenuDiv().appendChild(this.contactsMenu);
          this.contactsMenu.getMenuDiv().classList.remove("bottom");
          this.contactsMenu.getMenuDiv().classList.add("left");

          this.overFlowMenu.getMenuDiv().appendChild(this.messengerMenu);
          this.messengerMenu.getMenuDiv().classList.remove("bottom");
          this.messengerMenu.getMenuDiv().classList.add("left");

          this.overFlowMenu.getMenuDiv().appendChild(this.notificationMenu);
          this.notificationMenu.getMenuDiv().classList.remove("bottom");
          this.notificationMenu.getMenuDiv().classList.add("left");

          this.overFlowMenu.getMenuDiv().appendChild(this.accountMenu);
          this.accountMenu.getMenuDiv().classList.remove("bottom");
          this.accountMenu.getMenuDiv().classList.add("left");
        }
      } else {
        this.layout
          .toolbar()
          .insertBefore(
            this.applicationsMenu,
            this.layout.toolbar().firstChild
          );

        this.applicationsMenu.getMenuDiv().classList.remove("left");
        this.applicationsMenu.getMenuDiv().classList.add("bottom");

        if (this.isLogin) {
          this.overFlowMenu.hide();

          this.layout.toolbar().appendChild(this.filesMenu);
          this.filesMenu.getMenuDiv().classList.remove("left");
          this.filesMenu.getMenuDiv().classList.add("bottom");

          this.layout.toolbar().appendChild(this.contactsMenu);
          this.contactsMenu.getMenuDiv().classList.remove("left");
          this.contactsMenu.getMenuDiv().classList.add("bottom");

          this.layout.toolbar().appendChild(this.messengerMenu);
          this.messengerMenu.getMenuDiv().classList.remove("left");
          this.messengerMenu.getMenuDiv().classList.add("bottom");

          this.layout.toolbar().appendChild(this.notificationMenu);
          this.notificationMenu.getMenuDiv().classList.remove("left");
          this.notificationMenu.getMenuDiv().classList.add("bottom");

          this.layout.toolbar().appendChild(this.accountMenu);
          this.accountMenu.getMenuDiv().classList.remove("left");
          this.accountMenu.getMenuDiv().classList.add("bottom");
        }
      }
    });

    window.dispatchEvent(new Event("resize"));
  }

  ///////////////////////////////////////////////////////////////////////////////////////
  // Application action's
  ///////////////////////////////////////////////////////////////////////////////////////

  /**
   * Free resource here.
   */
  close() {
    // Disconnect event listener's
    Model.eventHub.unSubscribe("login_event", this.login_event_listener);
    Model.eventHub.unSubscribe("logout_event", this.logout_event_listener);
    super.close();
  }

  /**
   * Clear the workspace.
   */
  clear() {
    this.clearWorkspace();
    if (this.activeView != null) {
      this.activeView.hide();
    }
  }

  /**
   * Refresh various component.
   */
  update() { }

  /**
   * The title of the application
   * @param title The title.
   */
  setTitle(title: string) {
    this.layout.title().innerHTML = "<span>" + title + "</span>";
  }

  hideHeader() {
    this.layout.hideHeader();
  }

  showHeader() {
    this.layout.showHeader();
  }

  setIcon(imgUrl: string) {
    let icon = document.createElement("img");
    icon.id = "application_icon";

    icon.src = imgUrl;
    icon.style.height = "24px";
    icon.style.width = "24px";
    icon.style.marginRight = "10px";
    icon.style.marginLeft = "10px";

    let title = this.layout.title();
    title.style.display = "flex";

    title.insertBefore(icon, title.firstChild);
    this.icon = icon;
  }

  /**
   * The icon
   */
  getIcon() {
    return this.icon;
  }

  /**
   * Try to extract error message from input object.
   * @param err Can be a string or object, in case of object I will test if the object contain a field named 'message'
   */
  private static getErrorMessage(err: any) {
    try {
      let errObj = err;
      if (typeof err === "string" || err instanceof String) {
        errObj = JSON.parse(<string>err);
      } else if (errObj.message != undefined) {
        errObj = JSON.parse(errObj.message);
      }

      if (errObj.ErrorMsg != undefined) {
        return errObj.ErrorMsg;
      } else {
        return err;
      }
    } catch {
      if (err.message != undefined) {
        return err.message;
      }
      return err;
    }
  }

  /**
   * Display a message to the user.
   * @param msg The message to display in toast!
   */
  public static displayMessage(msg: any, duration: number) {
    return M.toast({
      html: this.getErrorMessage(msg),
      displayLength: duration,
    });
  }

  // Block user input
  wait(msg: string = "wait ...") {
    this.layout.wait(msg);
  }

  // Resume user input.
  resume() {
    this.layout.resume();
  }

  //////////////////////////////////////////////////////////////////////////////////////////
  // Event listener's
  //////////////////////////////////////////////////////////////////////////////////////////

  /**
   * Login event handler
   * @param accountId The id of the user
   */
  onLogin(account: Account) {
    this.isLogin = true;

    /** implement it as needed */
    if (this.login_.parentNode != null) {
      this.login_.parentNode.removeChild(this.login_);
    }

    this.layout.toolbar().appendChild(this.notificationMenu);
    this.layout.toolbar().appendChild(this.accountMenu);

    // Append the over flow menu.
    this.layout.toolbar().appendChild(this.overFlowMenu);

    this.overFlowMenu.hide(); // not show it at first.
    this.accountMenu.setAccount(account);

    this.settingsPanel.innerHTML = ""; // remove the content of the setting panel.
    this.settingsPanel.clear(); // clear various stuff...
    this.settingsMenu.clear();


    // Create the settings menu and panel here
    let userSettings = new UserSettings(account, this.settingsMenu, this.settingsPanel);

    // The application settings...
    let applicationSettings = new ApplicationSettings(this.application, this.settingsMenu, this.settingsPanel);

    // Manage roles
    let roleSettings = new RoleSettings(this.settingsMenu, this.settingsPanel)

    // Manage groups
    let groupSettings = new GroupSettings(this.settingsMenu, this.settingsPanel)

    // The file settings
    let fileSettings = new FileSettings(this.settingsMenu, this.settingsPanel);

    // The logs
    let logs = new LogSettings(this.settingsMenu, this.settingsPanel);

    // Set the file explorer...
    this.fileExplorer.setRoot("/users/" + account.name)
    this._fileExplorer.init();

    // Set the onerror callback for the component.
    this._fileExplorer.onerror = (err: any) => {
      ApplicationView.displayMessage(err, 4000)
    };

    window.dispatchEvent(new Event("resize"));
  }

  /**
   * Logout event handler
   * @param accountId
   */
  onLogout() {
    this.isLogin = false;

    this.overFlowMenu.hide(); // not show it at first.

    /** implement it as needed */
    this.layout.toolbar().appendChild(this.login_);

    // Remove notification menu and account.
    this.accountMenu.parentNode.removeChild(this.notificationMenu);
    this.accountMenu.parentNode.removeChild(this.accountMenu);

    this.clearWorkspace();
    this.clearSideMenu();

    // Close the messenger
    this.messenger.parentNode.removeChild(this.messenger)

    window.dispatchEvent(new Event("resize"));
  }

  onSettings() {
    if (this.getWorkspace().childNodes.length > 0) {
      if (this.getWorkspace().childNodes[0].nodeName == "GLOBULAR-SETTINGS-PANEL") {
        return
      }
    }

    this._sidemenu_childnodes = new Array<any>();
    this._workspace_childnodes = new Array<any>();

    // Keep the content of the workspace.
    while (this.getWorkspace().childNodes.length > 0) {
      let node = this.getWorkspace().childNodes[this.getWorkspace().childNodes.length - 1]
      this._workspace_childnodes.push(node)
      this.getWorkspace().removeChild(node)
    }

    // Keep the content of the side menu
    while (this.getSideMenu().childNodes.length > 0) {
      let node = this.getSideMenu().childNodes[this.getSideMenu().childNodes.length - 1]
      this._sidemenu_childnodes.push(node)
      this.getSideMenu().removeChild(node)
    }

    this.getSideMenu().appendChild(this.settingsMenu);
    this.getWorkspace().appendChild(this.settingsPanel);

  }

  onSaveSettings(saveSetting: boolean) {
    this.settingsMenu.parentNode.removeChild(this.settingsMenu)
    this.settingsPanel.parentNode.removeChild(this.settingsPanel)
    if (saveSetting) {

    } else {

    }

    // restore the workspace
    for (var i = 0; i < this._workspace_childnodes.length; i++) {
      let node = this._workspace_childnodes[i]
      this.getWorkspace().appendChild(node)
      console.log(node)
    }


    // restore the side menu
    for (var i = 0; i < this._sidemenu_childnodes.length; i++) {
      this.getSideMenu().appendChild(this._sidemenu_childnodes[i])
    }

  }


  showCamera(onclose: () => void, onsave: (picture: any) => void) {

    // Here I will create a non-selectable div and put camera in center of it...
    document.body.style.position = "relative"
    let modal = document.createElement("div")
    modal.style.position = "fixed"
    modal.style.top = "0px"
    modal.style.bottom = "0px"
    modal.style.left = "0px"
    modal.style.right = "0px"
    modal.style.zIndex = "10000";
    modal.style.background = "rgba(0.0, 0.0, 0.0, .85)"

    document.body.appendChild(modal)
    this.camera.onclose = () => {
      this.camera.parentNode.removeChild(this.camera)
      modal.parentNode.removeChild(modal)
      if (onclose != null) {
        onclose()
      }
    }

    modal.appendChild(this.camera)

    this.camera.onsave = onsave

    this.camera.open();
  }

  showFilebrowser(path:string, onclose:()=>void){

    document.body.style.position = "relative"
    let modal = document.createElement("div")
    modal.style.position = "fixed"
    modal.style.top = "0px"
    modal.style.bottom = "0px"
    modal.style.left = "0px"
    modal.style.right = "0px"
    modal.style.zIndex = "10000";
    modal.style.background = "rgba(0.0, 0.0, 0.0, .85)"
    document.body.appendChild(modal)

    let fileExplorer = new FileExplorer
    fileExplorer.setRoot(path)
    fileExplorer.init()
    fileExplorer.open(modal)

    fileExplorer.onclose = ()=>{
      fileExplorer.parentNode.removeChild(fileExplorer)
      modal.parentNode.removeChild(modal)
    }

    return fileExplorer
  }

  ///////////////////////////////////////////////////////////////////////////////////////////
  // Conversations
  ///////////////////////////////////////////////////////////////////////////////////////////
  onCreateNewConversation() {

    if (document.getElementById("new-conversation-box")) {
      return;
    }

    const name = nameGenrator.getRandomName(false);

    // Display the box if not already displayed...
    let toast = ApplicationView.displayMessage(
      `
      <style>
        new-conversation-box{
          display: flex;
          flex-direction: column;
        }

        #new-conversation-box .title{
          font-size: 1.1rem;
          font-weight: 400;
        }

        #new-conversation-box .actions{
          display: flex;
          justify-content: flex-end;
        }

        #new-conversation-box paper-button{
          height: 35px;
          font-size: .85rem;
        }

        paper-input{
          flex-grow: 1; 
          min-width:350px;
        }

      </style>
      <div id="new-conversation-box">
        <span class="title">New Conversation...</span>
        <paper-input id="conversation-name-input" type="text" label="Name" tabindex="0" aria-disabled="false"></paper-input>
        <paper-input id="conversation-keywords-input" type="text" label="Keyword (comma separated)" tabindex="1" aria-disabled="false"></paper-input>
        
        <div class="actions">
          <paper-button id="create-new-conversation-btn">Create</paper-button>
          <paper-button id="cancel-create-new-conversation-btn">Cancel</paper-button>
        </div>
      </div>
      `,
      1000 * 60 * 15// 15 minutes...
    );

    let nameInput = <any>document.getElementById("conversation-name-input")
    nameInput.value = name;
    setTimeout(() => {
      nameInput.focus()
      nameInput.inputElement.inputElement.select()
    }, 100)

    let cancelBtn = document.getElementById("cancel-create-new-conversation-btn")
    cancelBtn.onclick = () => {
      toast.dismiss();
    }

    let createBtn = document.getElementById("create-new-conversation-btn")
    createBtn.onclick = () => {
      let language = window.navigator.language.split("-")[0]
      let keywordsInput = <any>document.getElementById("conversation-keywords-input")
      let keywords = new Array<string>();
      if (keywordsInput.value != undefined) {
        keywordsInput.value.split(",").forEach((keyword: string) => {
          keywords.push(keyword.trim())
        })
      }

      ConversationManager.createConversation(nameInput.value, keywords, language,
        (conversation) => {
          /** Publish a new conversation event. */
          Model.eventHub.publish("__new_conversation_event__", conversation, true)
          toast.dismiss();
        },
        (err: any) => {
          ApplicationView.displayMessage(err, 3000)
        })
      toast.dismiss();
    }
  }

  /**
   * Invite to conversation.
   * @param converstion 
   */
  onInviteToConversaiton(conversation: Conversation) {
    let toast = ApplicationView.displayMessage(
      `
      <style>
        #invite-conversation-participants{
          display: flex;
          flex-direction: column;
        }

        invite-conversation-participants #yes-no-contact-delete-box globular-contact-card{
          padding-bottom: 10px;
        }

        #invite-conversation-participants div{
          display: flex;
          font-size: 1rem;
          padding-bottom: 10px;
        }

        paper-button{
          font-size: .85rem;
          height: 32px;
        }

      </style>
      <div id="invite-conversation-participants">
        <div>Select contact you want to invite to ${conversation.getName()}</div>
        <globular-autocomplete type="email" label="Search" id="invite-conversation-participants-invite_contact_input" width="${355}" style="flex-grow: 1;"></globular-autocomplete>
        <div style="justify-content: flex-end;">
          <paper-button id="invite-conversation-participants-cancel-btn">Cancel</paper-button>
        </div>
      </div>
      `,
      60 * 1000 * 5 // 5 minutes sec...
    );

    let inviteContactInput = <any>document.querySelector("#invite-conversation-participants-invite_contact_input")
    inviteContactInput.focus();

    let findAccountByEmail = (email: string) => {
      Account.getAccounts(`{"email":{"$regex": "${email}", "$options": "im"}}`, (accounts) => {
        // set the getValues function that will return the list to be use as filter.
        accounts = accounts.filter((obj: Account) => {
          // remove participant already in the conversation and the current account.
          let index = conversation.getParticipantsList().indexOf(obj.id);
          return obj.id !== this.application.account.id && index == -1;
        });

        inviteContactInput.setValues(accounts)
      }, (err) => {
        ApplicationView.displayMessage(err, 3000)
      })
    }

    inviteContactInput.onkeyup = () => {
      let val = inviteContactInput.getValue();
      if (val.length > 3) {
        findAccountByEmail(val)
      } else {
        inviteContactInput.clear()
      }
    }

    inviteContactInput.displayValue = (contact: Account) => {
      let card = new ContactCard(this.application.account, contact);
      card.setInviteButton((a: Account) => {
        ConversationManager.sendConversationInvitation(conversation.getUuid(), conversation.getName(), this.application.account.id, a.id,
          () => {
            Model.eventHub.publish("send_conversation_invitation_event_", { participant: a.name, conversation: conversation.getName() }, true)
          },
          (err: any) => {
            ApplicationView.displayMessage(err, 3000)
          })
        // So here I will create a 
        toast.dismiss();
      })
      return card
    }

    let cancelBtn = <any>document.querySelector("#invite-conversation-participants-cancel-btn")

    cancelBtn.onclick = () => {
      toast.dismiss();
    }
  }

  /**
   * Delete a conversation.
   * @param conversation 
   */
  onDeleteConversaiton(conversation: Conversation) {
    let toast = ApplicationView.displayMessage(
      `
      <style>
        #yes-no-contact-delete-box{
          display: flex;
          flex-direction: column;
        }

        #yes-no-contact-delete-box globular-contact-card{
          padding-bottom: 10px;
        }

        #yes-no-contact-delete-box div{
          display: flex;
          font-size: 1rem;
          padding-bottom: 10px;
        }

        paper-button{
          font-size: .85rem;
          height: 32px;
        }

      </style>
      <div id="yes-no-contact-delete-box">
        <div>Your about to delete the conversation ${conversation.getName()}</div>
        <div>Is it what you want to do? </div>
        <div style="justify-content: flex-end;">
          <paper-button id="yes-delete-contact">Yes</paper-button>
          <paper-button id="no-delete-contact">No</paper-button>
        </div>
      </div>
      `,
      15000 // 15 sec...
    );

    let yesBtn = <any>document.querySelector("#yes-delete-contact")
    let noBtn = <any>document.querySelector("#no-delete-contact")

    // On yes
    yesBtn.onclick = () => {

      ConversationManager.deleteConversation(conversation.getUuid(), this.application.account.id, () => {
        toast.dismiss();
        // Publish the list of participant with the account removed from it.
        let participants = conversation.getParticipantsList()
        participants.splice(participants.indexOf(this.application.account.id), 1)
        Model.eventHub.publish(`leave_conversation_${conversation.getUuid()}_evt`, JSON.stringify(participants), false)
        ApplicationView.displayMessage(
          "<iron-icon icon='communication:message' style='margin-right: 10px;'></iron-icon><div>Conversation named " +
          conversation.getName() +
          " was deleted!</div>",
          3000
        );
      }, (err) => {
        ApplicationView.displayMessage(err, 3000)
        toast.dismiss();
      })

    }

    noBtn.onclick = () => {
      toast.dismiss();
    }
  }

  //////////////////////////////////////////////////////////////////////////////////////////
  // Gui function's
  //////////////////////////////////////////////////////////////////////////////////////////

  /**
   * The workspace div where the application draw it content.
   */
  getWorkspace(): any {
    return this.layout.workspace();
  }

  /**
   * Clear the workspace.
   */
  clearWorkspace(): void {
    this.layout.clearWorkspace();
  }

  /**
   * The side menu that contain application actions.
   */
  getSideMenu(): any {
    let sideMenu = this.layout.sideMenu();
    return sideMenu;
  }

  /**
   * Clear the side menu
   */
  clearSideMenu(): void {
    this.layout.clearSideMenu();
  }

  // In case of application view
  setView(view: View) {
    this.activeView = view;
  }

  hideSideMenu() {
    (<any>this.layout.appDrawer).toggle();
  }

  /**
   * Create a side menu button div.
   */
  createSideMenuButton(id: string, text: string, icon: string): any {
    let html = `
        <style>
            .side_menu_btn{
                display: flex;
                position: relative;
                align-items: center;
                font-family: Roboto,RobotoDraft,Helvetica,Arial,sans-serif;
                font-size: 1rem;
                letter-spacing: .2px;
                color: #202124;
                text-shadow: none;
            }

            .side_menu_btn:hover{
                cursor: pointer;
            }

        </style>
        <div id="${id}" class="side_menu_btn">
            <paper-ripple recenters></paper-ripple>
            <paper-icon-button id="${id}_close_btn" icon="${icon}"></paper-icon-button>
            <span style="flex-grow: 1;">${text}</span>
        </div>
        `;

    let range = document.createRange();
    this.getSideMenu().insertBefore(
      range.createContextualFragment(html),
      this.getSideMenu().firstChild
    );

    return document.getElementById(id);
  }
}
