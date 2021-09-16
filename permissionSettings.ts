
import { SettingsMenu, SettingsPanel} from "./components/Settings"
import { GroupSettings, RoleSettings, Settings } from "./Settings";

export class PermissionsSettings extends Settings {

    constructor(settingsMenu: SettingsMenu, settingsPanel: SettingsPanel, saveMenuItem: any) {
        super(settingsMenu, settingsPanel);
    }

    // Init the configuration interface...
    init(settingsMenu: SettingsMenu, settingsPanel: SettingsPanel, saveMenuItem: any) {
        // Create the settings menu and panel here
        settingsMenu.appendSettingsMenuItem("settings", "Permissions");

        // Create General informations setting's
        let permissionSettingsPage = <any>settingsPanel.appendSettingsPage("Permissions");

        // Manage roles
        let roleSettings = new RoleSettings(settingsMenu, settingsPanel)
        permissionSettingsPage.addSetting(roleSettings)


        // Manage groups
        let groupSettings = new GroupSettings(settingsMenu, settingsPanel)
        permissionSettingsPage.addSetting(groupSettings)

    }
}