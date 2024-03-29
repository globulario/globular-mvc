import { View } from "./View";
import * as M from "materialize-css";
import "materialize-css/sass/materialize.scss";
import { Account } from "./Account";
import { ApplicationsSettings, GroupSettings, LogSettings, OrganizationSettings, PeersSettings, ResourcesPermissionsSettings, RoleSettings, UserSettings, UsersSettings, VideoSettings } from "./Settings"
import { Model } from "./Model";
import { DockerNames } from "./components/RandomName"

// web-components.
import { Layout } from "./components/Layout";
import { Login } from "./components/Login";
import { AccountMenu } from "./components/Account";
import { NotificationMenu } from "./components/Notification";
import { ApplicationsMenu } from "./components/Applications";
import { Camera } from "./components/Camera";
import { FilesMenu, FilesUploader } from "./components/File";
import { SystemInfosMenu } from "./components/SystemMonitor";
import { SearchBar, SearchResults } from "./components/Search";
import { ContactCard, ContactsMenu } from "./components/Contact";
import { MessengerMenu, Messenger } from "./components/Messenger";

import { CallsHistoryMenu } from "./components/Calls"
import { SettingsMenu, SettingsPanel, StringListSetting } from "./components/Settings";
import { Application } from "./Application";
// Not directly use here but must be include anyways
import { Wizard } from "./components/Wizard";
import { SlideShow } from "./components/SlideShow";
import { ImageCropper } from "./components/Image";
import "./components/table/table.js"
import { Conversation, Invitation } from "globular-web-client/conversation/conversation_pb";
import { ConversationManager } from "./Conversation";
import { BlogPostElement, BlogEditingMenu } from "./components/BlogPost"
import { Terminal } from "./components/Terminal"
import { Workspace } from './components/Workspace'
import { WatchingMenu } from './components/watching'
import { ContentManager } from './components/Content'
import { ShareMenu } from './components/Share'


// This variable is there to give acces to wait and resume...
const nameGenrator = new DockerNames();

// Must be imported to overide the materialyse style
import "./style.css"
import { ServerGeneralSettings } from "./serverGeneralSettings";
import { ServicesSettings } from "./ServicesSettings";
import * as getUuid from 'uuid-by-string'
import { GetBlogPostsRequest } from "globular-web-client/blog/blog_pb";

// The kind of application...
export enum ApplicationType {
  WEB, DESKTOP, MOBILE
}

/**
 * Application view made use of Web-component and Materialyse to create a basic application
 * layout that can be use as starting point to any web-application.
 */
export class ApplicationView extends View {

  private _workspace_childnodes: Array<any>;
  private _sidemenu_childnodes: Array<any>;
  private settings_event_listener: String;
  private save_settings_event_listener: String;
  private _application: Application;

  public get application(): Application {
    return this._application;
  }
  public set application(value: Application) {
    this._application = value;
  }

  /** The application type */
  private _type: ApplicationType;
  public get type(): ApplicationType {
    return this._type;
  }
  public set type(value: ApplicationType) {
    this._type = value;
  }

  /** Display upload activities */
  private static filesUploader: FilesUploader;

  /** The application view component. */
  private static layout: Layout;

  /** The application internal layout */
  private workspace_: Workspace;

  /** The login panel */
  private login_: Login;

  /** The account panel */
  private accountMenu: AccountMenu;

  /** The call history menu */
  private callsHistoryMenu: CallsHistoryMenu;

  /** The nofitication panel */
  private notificationMenu: NotificationMenu;

  /** The applications menu */
  private applicationsMenu: ApplicationsMenu;
  protected hasApplicationsMenu: boolean;

  /** The contact menu */
  private contactsMenu: ContactsMenu;

  /** The file menu */
  private filesMenu: FilesMenu;

  /** The share menu */
  private shareMenu: ShareMenu;

  /** The watching content */
  private watchingMenu: WatchingMenu;

  /** The blog editing menu */
  private blogEditingMenu: BlogEditingMenu;

  /** The messenger menu */
  private messengerMenu: MessengerMenu;

  /** Don't shoot the messenger! */
  private messenger: Messenger;

  /** The settings Menu */
  protected settingsMenu: SettingsMenu;

  /** The system infos menu */
  private systemInfosMenu: SystemInfosMenu;

  /** The settings Panel */
  protected settingsPanel: SettingsPanel;

  /** Keep title content between login and logout... */
  private _title_: any;

  /** The content editor... */
  private contentManager: ContentManager;

  /** The type of application... */

  /** The camera */
  private _camera: Camera;
  public get camera(): Camera {
    return this._camera;
  }

  /** The search bar */
  private _searchBar: SearchBar;
  public get searchBar(): SearchBar {
    return this._searchBar;
  }

  /** The search result panel */
  private _searchResults: SearchResults
  public get searchResults(): SearchResults {
    return this._searchResults;
  }

  /** various listener's */
  private login_event_listener: string;
  private logout_event_listener: string;


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

    // document.oncontextmenu = function() {return false;};

    // The web-component use as layout is named globular-application
    if (document.getElementsByTagName("globular-application") != undefined) {
      ApplicationView.layout = <Layout>(
        document.getElementsByTagName("globular-application")[0]
      );
    } else {
      ApplicationView.layout = new Layout();
      document.body.appendChild(ApplicationView.layout);
    }

    // set it to false.
    this.isLogin = false;

    // Set the login box...
    this.login_ = new Login();
    ApplicationView.layout.toolbar().appendChild(this.login_);

    // This contain account informations.
    this.accountMenu = new AccountMenu();

    // This contain account/application notification
    this.notificationMenu = new NotificationMenu();

    // The applicaiton menu
    this.hasApplicationsMenu = false; // set to true if needed in the futur, console is the only one application at this time.
    this.applicationsMenu = new ApplicationsMenu();

    // The concact menu
    this.contactsMenu = new ContactsMenu();

    // The messenger menu
    this.messengerMenu = new MessengerMenu();

    // the call history menu
    this.callsHistoryMenu = new CallsHistoryMenu();

    // The camera can be use to take picture.
    this._camera = new Camera();

    // The search bar to give end user the power to search almost anything...
    this._searchBar = new SearchBar();

    // The application layout 
    this.workspace_ = new Workspace()

    // Now the save funciton..
    this._camera.onsaveimage = (picture: any) => {
      // save image from the picture.
    };

    this._camera.onsavevideo = (video: any) => {
      // save image from the picture.
    };

    // The watching menu.
    this.watchingMenu = new WatchingMenu();

    // The blog editing menu...
    this.blogEditingMenu = new BlogEditingMenu();

    // The system infos menu
    this.systemInfosMenu = new SystemInfosMenu();


    // Set the close action for both blog edit and continue watching...
    this.systemInfosMenu.onclose = this.blogEditingMenu.onclose = this.watchingMenu.onclose = () => {

      // restore the workspace
      this.restoreContent();
    }

    // The content creator.
    this.contentManager = new ContentManager();


    // The file menu
    this.filesMenu = new FilesMenu();

    // The share menu.
    this.shareMenu = new ShareMenu();


    // Init file upload event listener...
    ApplicationView.filesUploader = new FilesUploader()

    this._sidemenu_childnodes = new Array<any>();
    this._workspace_childnodes = new Array<any>();
  }

  hideApplicationsMenu() {
    this.hasApplicationsMenu = false;
    if (this.applicationsMenu.parentNode)
      this.applicationsMenu.parentNode.removeChild(this.applicationsMenu)
  }

  hideContent() {

    if (this._workspace_childnodes.length != 0) {
      this._sidemenu_childnodes = new Array<any>();
      this._workspace_childnodes = new Array<any>();
    }


    // Keep the content of the workspace.
    let i = this.getWorkspace().childNodes.length
    while (i > 0) {
      let node = this.getWorkspace().childNodes[this.getWorkspace().childNodes.length - 1]
      if (!node.classList.contains("draggable")) {
        if (node.tagName != "GLOBULAR-WEB-PAGE") {
          this._workspace_childnodes.push(node)
        }
        this.getWorkspace().removeChild(node)
      }
      i--
    }

    // I will also remove the search filter...
    let searchFacetFilters = document.getElementsByTagName("globular-facet-search-filter")
    for (var index = 0; index < searchFacetFilters.length; index++) {
      let parentNode = searchFacetFilters[index].parentNode
      if (parentNode) {
        parentNode.removeChild(searchFacetFilters[index])
      }
    }

  }

  restoreContent() {
    let mediaWatching = null
    let blogPosts = null
    let searchResults = null
    this.getWorkspace().innerHTML = ""

    for (var i = 0; i < this._workspace_childnodes.length; i++) {
      let node = this._workspace_childnodes[i]
      if (node.tagName != "GLOBULAR-WEB-PAGE" && node.tagName != "GLOBULAR-MEDIA-WATCHING" && node.tagName != "GLOBULAR-BLOG-POSTS" && node.tagName != "GLOBULAR-SEARCH-RESULTS") {
        this.getWorkspace().appendChild(node)
      } else if (node.tagName == "GLOBULAR-MEDIA-WATCHING") {
        mediaWatching = node
      } else if (node.tagName == "GLOBULAR-BLOG-POSTS") {
        blogPosts = node
      } else if (node.tagName == "GLOBULAR-SEARCH-RESULTS") {
        searchResults = node
      }
    }

    if (mediaWatching) {
      this.getWorkspace().appendChild(mediaWatching)
    } else if (blogPosts) {
      this.getWorkspace().appendChild(blogPosts)
    } else if (searchResults) {
      this.getWorkspace().appendChild(searchResults)
    } else {
      // set the active webpage...
      let lnks = document.getElementsByTagName("globular-page-link")
      for (var i = 0; i < lnks.length; i++) {
        let lnk = <any>lnks[i]
        if (lnk.active) {
          this.getWorkspace().appendChild(lnk.webPage)
          break
        }
      }
    }

    this._sidemenu_childnodes = new Array<any>();
    this._workspace_childnodes = new Array<any>();
  }

  // Must be call by the model when after it initialisation was done.
  init() {
    // Create the setting components.
    this.settingsMenu = new SettingsMenu();

    this.settingsPanel = new SettingsPanel();
    this.settingsPanel.id = "globular-setting-panel"

    // init listener's in the layout.
    ApplicationView.layout.init();


    this.login_.init();
    this.accountMenu.init();
    this.applicationsMenu.init();
    this.contentManager.init();
    ApplicationView.layout.navigation().appendChild(this.contentManager)

    if (!this.contentManager.hasContent()) {
      ApplicationView.layout.hideSideBar()
    }

    // Set the current webpage...
    Model.eventHub.subscribe("_set_web_page_",
      uuid => { },
      page => {

        // remove actual nodes
        this.hideContent()

        // Append the watching component...
        this.getWorkspace().appendChild(page);

      }, true)

    // Logout event
    Model.eventHub.subscribe(
      "logout_event",
      (uuid: string) => {
        this.logout_event_listener = uuid;
      },
      () => {
        this.onLogout();
      },
      true, this
    );

    // Login event.
    Model.eventHub.subscribe(
      "login_event",
      (uuid: string) => {
        this.login_event_listener = uuid;
      },
      (account: Account) => {

        // set the account
        Application.account = account;

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
                padding-bottom: 10px;
              }

            </style>
            <div id="yes-no-contact-delete-box">
              <div>Your about to delete the contact</div>
              <globular-contact-card id="contact-to-delete" contact="${contact.id + "@" + contact.domain}"></globular-contact-card>
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

        // Init the call history.
        this.callsHistoryMenu.init(account);

        // Set the messenger.
        this.messenger = new Messenger(account);

        // Display the conversation manager.
        Model.eventHub.subscribe(`__join_conversation_evt__`,
          (uuid) => {

          },
          (evt) => {
            // Append the messenger in the workspace div and not the workspace component.
            document.getElementById("workspace").appendChild(this.messenger)
            this.messenger.style.zIndex = "1000"

          }, true)

        Model.eventHub.subscribe("__create_new_conversation_event__",
          (uuid) => { },
          (evt) => {
            this.onCreateNewConversation();
          },
          true, this)

        Model.eventHub.subscribe("__invite_conversation_evt__",
          (uuid: string) => { },
          (evt: any) => {
            this.onInviteToConversaiton(evt);
          }, true, this)

        Model.eventHub.subscribe("__delete_conversation_evt__",
          (uuid: string) => { },
          (evt: any) => {
            this.onDeleteConversaiton(evt);
          }, true, this)
      },
      true, this
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
      true, this
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
      true, this
    );

    Model.eventHub.subscribe("_display_blog_event_", uuid => { }, b => {

      let displayBlog = () => {
        let blog = this.getWorkspace().querySelector(`#_${b.blogPost.getUuid()}`)
        if (blog == null) {
          blog = new BlogPostElement(b.blogPost, b.globule)
        }

        this.hideContent()


        // Generate the blog display and set in the list.
        blog.read(() => {
          blog.onclose = () => {

            // remove the blog
            if (blog.parentNode != undefined) {
              blog.parentNode.removeChild(blog)
            }


            // restore the workspace
            this.restoreContent()

          }
          this.getWorkspace().appendChild(blog)
        })
      }

      if (b.blogPost.getText().length > 0) {
        displayBlog()
      } else {
        let rqst = new GetBlogPostsRequest
        let id = b.blogPost.getUuid()
        rqst.setUuidsList([id])

        let token = localStorage.getItem("user_token")
        let globule = b.globule
        let stream = globule.blogService.getBlogPosts(rqst, { application: Application.application, domain: globule.domain, token: token })

        stream.on("data", (rsp: any) => {
          b.blogPost = rsp.getBlogPost()
        });

        stream.on("status", (status: any) => {
          if (status.code == 0) {
            Model.eventHub.publish("_hide_search_results_", null, true)
            displayBlog()
          } else {
            ApplicationView.displayMessage(status.details, 3000)
          }
        })
      }

    }, true)

    // Display user watching content...
    Model.eventHub.subscribe("_display_workspace_content_event_",
      uuid => { },
      evt => {

        if (evt.parentNode == this.getWorkspace()) {
          return // already the parent.
        }

        // remove actual nodes
        this.hideContent()


        // Append the watching component...
        this.getWorkspace().appendChild(evt);

      }, true)


    Model.eventHub.subscribe("_open_file_explorer_event_",
      uuid => { },
      explorer => {
        // Append the watching component...
        ApplicationView.layout.workspace().appendChild(explorer);
        explorer.style.zIndex = 1000;

      }, true)


    Model.eventHub.subscribe("_display_blogs_event_",
      uuid => { },
      evt => {

        // remove actual nodes
        this.hideContent()


        // Append the watching component...
        this.getWorkspace().appendChild(evt);

      }, true)

    // Search result event...
    Model.eventHub.subscribe("_display_search_results_",
      uuid => { },
      evt => {

        if (this._searchResults != undefined) {
          if (this.getWorkspace().querySelectorAll("globular-search-results").length == 1) {
            return
          }
        }


        this.hideContent()

        // The logout event.

        // The search result panel where the result will be displayed.
        if (this._searchResults == null) {
          console.log("search result is null")
          this._searchResults = new SearchResults()
        }

        this.getWorkspace().appendChild(this._searchResults);

      }, true)

    Model.eventHub.subscribe("_hide_search_results_",
      uuid => { },
      evt => {

        // hide all the side bar...
        let facetFilters = ApplicationView.layout.sideMenu().getElementsByTagName("globular-facet-search-filter")
        for (var i = 0; i < facetFilters.length; i++) {
          let f = <any>facetFilters[i]
          f.style.display = "none"
        }

        // The search results
        if (this._searchBar != undefined) {
          if (this._searchResults) {
            if (this._searchResults.parentNode != undefined) {
              this._searchResults.parentNode.removeChild(this._searchResults)
            }
          }
        }

        // restore the workspace
        this.restoreContent()

      }, true)

    /**
     * The resize listener.
     */
    window.addEventListener("resize", (evt: any) => {
      if (!ApplicationView) {
        return;
      }

      let w = ApplicationView.layout.width();

      // TODO try to set it in the css propertie instead...
      if (w < 700) {

        if (this.hasApplicationsMenu) {
          this.getSideMenu()
            .insertBefore(
              this.applicationsMenu,
              this.getSideMenu().firstChild
            );

          this.applicationsMenu.shrink()
        }

        // Append the content manager.
        this.getSideMenu().appendChild(this.contentManager);
        this.contentManager.setVertical()

        if (this.contentManager.hasContent()) {
          ApplicationView.layout.showSideBar()
        }

        if (this.isLogin) {

          ApplicationView.layout.showSideBar()
          
          this.getSideMenu().appendChild(this.blogEditingMenu);
          this.blogEditingMenu.shrink()

          this.getSideMenu().appendChild(this.watchingMenu);
          this.watchingMenu.shrink()

          this.getSideMenu().appendChild(this.shareMenu);
          this.shareMenu.shrink()

          this.getSideMenu().appendChild(this.filesMenu);
          this.filesMenu.shrink()

          this.getSideMenu().appendChild(ApplicationView.filesUploader);
          ApplicationView.filesUploader.shrink()

          this.getSideMenu().appendChild(this.contactsMenu);
          this.contactsMenu.shrink()

          this.getSideMenu().appendChild(this.callsHistoryMenu);
          this.callsHistoryMenu.shrink()

          this.getSideMenu().appendChild(this.messengerMenu);
          this.messengerMenu.shrink()

          this.getSideMenu().appendChild(this.notificationMenu);
          this.notificationMenu.shrink()

          this.getSideMenu().appendChild(this.systemInfosMenu);
          this.systemInfosMenu.shrink()

          this.getSideMenu().appendChild(this.accountMenu);
          this.accountMenu.shrink()
        }
      } else {
        if (this.hasApplicationsMenu) {
          ApplicationView.layout
            .toolbar()
            .insertBefore(
              this.applicationsMenu,
              ApplicationView.layout.toolbar().firstChild
            );

          this.applicationsMenu.expand()
        }

        // set back to the navigation div.
        ApplicationView.layout.navigation().appendChild(this.contentManager);
        this.contentManager.setHorizontal()

        if (this.isLogin) {

          // set back menu item to toolbar...
          ApplicationView.layout.toolbar().appendChild(this.systemInfosMenu);
          this.systemInfosMenu.expand()

          ApplicationView.layout.toolbar().appendChild(this.blogEditingMenu);
          this.blogEditingMenu.expand()

          ApplicationView.layout.toolbar().appendChild(this.watchingMenu);
          this.watchingMenu.expand()

          ApplicationView.layout.toolbar().appendChild(this.shareMenu);
          this.shareMenu.expand()

          ApplicationView.layout.toolbar().appendChild(this.filesMenu);
          this.filesMenu.expand()

          ApplicationView.layout.toolbar().appendChild(ApplicationView.filesUploader);
          ApplicationView.filesUploader.expand()

          ApplicationView.layout.toolbar().appendChild(this.contactsMenu);
          this.contactsMenu.expand()

          ApplicationView.layout.toolbar().appendChild(this.callsHistoryMenu);
          this.callsHistoryMenu.expand()

          ApplicationView.layout.toolbar().appendChild(this.messengerMenu);
          this.messengerMenu.expand()

          ApplicationView.layout.toolbar().appendChild(this.notificationMenu);
          this.notificationMenu.expand()

          ApplicationView.layout.toolbar().appendChild(this.accountMenu);
          this.accountMenu.expand()
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
    ApplicationView.layout.title().innerHTML = "<span>" + title + "</span>";
  }

  hideHeader() {
    ApplicationView.layout.hideHeader();
  }

  showHeader() {
    ApplicationView.layout.showHeader();
  }

  setIcon(imgUrl: string) {
    let icon = document.createElement("img");
    icon.src = imgUrl;
    let title = <any>ApplicationView.layout.title();
    title.style.display = "flex";
    title.insertBefore(icon, title.firstChild);
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

    let uuid = "_" + getUuid(JSON.stringify(msg))

    // Not print the same message more than once at time...
    if (document.querySelector("#" + uuid) != undefined) {
      return;
    }

    let t = M.toast({
      html: this.getErrorMessage(msg),
      displayLength: duration,
    });

    t.el.id = uuid

    document.getElementById(uuid).classList.add("popup")

    return t
  }

  // Block user input
  static wait(msg: string = "wait ...") {
    ApplicationView.layout.wait(msg);
  }

  // Resume user input.
  static resume() {
    ApplicationView.layout.resume();
  }

  //////////////////////////////////////////////////////////////////////////////////////////
  // Event listener's
  //////////////////////////////////////////////////////////////////////////////////////////

  /**
   * Login event handler
   * @param accountId The id of the user
   */
  onLogin(account: Account) {
    // Do nothing if it's already login...
    if (this.isLogin == true) {
      return
    }


    // Test if the user can edit the website...
    this.contentManager.setEditMode()

    /** implement it as needed */
    if (this.login_.parentNode != null) {
      this.login_.parentNode.removeChild(this.login_);
    }

    ApplicationView.layout.title().innerHTML = "";
    ApplicationView.layout.title().appendChild(this._searchBar);

    ApplicationView.layout.toolbar().appendChild(this.notificationMenu);
    ApplicationView.layout.toolbar().appendChild(this.accountMenu);

    this.accountMenu.setAccount(account);

    this.settingsPanel.innerHTML = ""; // remove the content of the setting panel.
    this.settingsPanel.clear(); // clear various stuff...
    this.settingsMenu.clear();


    // Create the settings menu and panel here
    let userSettings = new UserSettings(account, this.settingsMenu, this.settingsPanel);

    // Manage server settings
    let serverGeneralSettings = new ServerGeneralSettings(this.settingsMenu, this.settingsPanel);

    // Manage applications
    let applicationsSettings = new ApplicationsSettings(this.settingsMenu, this.settingsPanel)

    // Manage services settings.
    let servicesSettings = new ServicesSettings(this.settingsMenu, this.settingsPanel);

    // Manage services settings.
    let videoSettings = new VideoSettings(this.settingsMenu, this.settingsPanel);

    // The accounts settings
    let usersSettings = new UsersSettings(this.settingsMenu, this.settingsPanel);

    // Manage peers
    let peersSettings = new PeersSettings(this.settingsMenu, this.settingsPanel)

    // Manage organizations
    let organizationsSettings = new OrganizationSettings(this.settingsMenu, this.settingsPanel)

    // Manage roles
    let roleSettings = new RoleSettings(this.settingsMenu, this.settingsPanel)

    // Manage groups
    let groupSettings = new GroupSettings(this.settingsMenu, this.settingsPanel)

    // Manage resources permissions
    let resourcesPermissions = new ResourcesPermissionsSettings(this.settingsMenu, this.settingsPanel)

    // The logs
    let logs = new LogSettings(this.settingsMenu, this.settingsPanel);

    this._title_ = ApplicationView.layout.title().innerHTML;
    ApplicationView.layout.title().innerHTML = ""
    ApplicationView.layout.title().appendChild(this._searchBar)

    // set menu...
    this.notificationMenu.init();
    this.filesMenu.init();
    this.shareMenu.init(account);
    this.systemInfosMenu.init();
    this.watchingMenu.init();
    this.blogEditingMenu.init();

    // Init the file uploader.
    ApplicationView.filesUploader.init();

    this.isLogin = true;

    // create the workspace...
    this.getWorkspace()

    window.dispatchEvent(new Event("resize"));
  }

  /**
   * Logout event handler
   * @param accountId
   */
  onLogout() {
    this.isLogin = false;


    /** Remove it from the body */
    ApplicationView.filesUploader.parentNode.removeChild(ApplicationView.filesUploader)

    /** implement it as needed */
    ApplicationView.layout.toolbar().appendChild(this.login_);
    ApplicationView.layout.title().removeChild(this._searchBar);

    this.accountMenu.parentNode.removeChild(this.notificationMenu);
    this.accountMenu.parentNode.removeChild(this.accountMenu);

    this.clearWorkspace();
    this.clearSideMenu();

    // Close the messenger
    if (this.messenger.parentNode != null) {
      this.messenger.parentNode.removeChild(this.messenger)
    }

    // set back the title.
    if (this._searchBar.parentNode != null) {
      this._searchBar.parentNode.removeChild(this._searchBar)
    }
    ApplicationView.layout.title().innerHTML = this._title_

    window.dispatchEvent(new Event("resize"));
  }

  onSettings() {
    if (this.getWorkspace().childNodes.length > 0) {
      if (this.getWorkspace().childNodes[0].id == "globular-setting-panel") {
        return
      }
    }

    this.hideContent()

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
    this.restoreContent()

    // restore the side menu
    for (var i = 0; i < this._sidemenu_childnodes.length; i++) {
      this.getSideMenu().appendChild(this._sidemenu_childnodes[i])
    }

  }


  showCamera(onclose: () => void, onsaveimage: (picture: any) => void, onsavevideo: (video: any) => void) {

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

    this.camera.onsaveimage = onsaveimage
    this.camera.onsavevideo = onsavevideo

    this.camera.open();
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
   * @param conversation 
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
          return obj.id !== Application.account.id && index == -1;
        });

        inviteContactInput.setValues(accounts)
      }, (err) => {
        ApplicationView.displayMessage(err, 3000)
      })
    }

    inviteContactInput.onkeyup = () => {
      let val = inviteContactInput.getValue();
      if (val.length >= 2) {
        findAccountByEmail(val)
      } else {
        inviteContactInput.clear()
      }
    }

    inviteContactInput.displayValue = (contact: Account) => {
      let card = new ContactCard(Application.account, contact);

      card.setInviteButton((a: Account) => {
        ConversationManager.sendConversationInvitation(conversation, Application.account.id + "@" + Application.account.domain, a.id + "@" + a.domain,
          () => {
            Model.eventHub.publish("send_conversation_invitation_event_", { participant: a.id + "@" + a.domain, conversation: conversation.getName() }, true)
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

      ConversationManager.deleteConversation(conversation, () => {
        toast.dismiss();
        // Publish the list of participant with the account removed from it.
        let participants = conversation.getParticipantsList()
        participants.splice(participants.indexOf(Application.account.id + "@" + Application.account.domain), 1)
        Model.getGlobule(conversation.getMac()).eventHub.publish(`leave_conversation_${conversation.getUuid()}_evt`, JSON.stringify({ "conversationUuid": conversation.getUuid(), "participants": participants, "participant": Application.account.id + "@" + Application.account.domain }), false)
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
    if (this.workspace_.parentElement == null) {
      ApplicationView.layout.workspace().appendChild(this.workspace_)
    }
    return this.workspace_;
  }

  /**
   * Clear the workspace.
   */
  clearWorkspace(): void {
    this.getWorkspace().innerHTML = "";
    ApplicationView.layout.clearWorkspace();

  }

  /**
   * The side menu that contain application actions.
   */
  getSideMenu(): any {
    let sideMenu = ApplicationView.layout.sideMenu();
    return sideMenu;
  }

  /**
   * Clear the side menu
   */
  clearSideMenu(): void {
    ApplicationView.layout.clearSideMenu();
  }

  // In case of application view
  setView(view: View) {
    this.activeView = view;
  }

  hideSideMenu() {
    (<any>ApplicationView.layout.appDrawer).toggle();
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
