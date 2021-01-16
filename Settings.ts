import { Account } from "./Account";


/**
 * 
 */
export class UserSettings {

    // The general infos settings.
    private generalSettings: any;

    // The security settings.
    private securitySettings: any;

    private account: any;

    // This is where the setting is display.
    constructor(account: Account, generalSettings: any, securitySettings: any) {
        this.account = account

        // Sections.
        this.generalSettings = generalSettings

        // Create the general info here.
        this.securitySettings = securitySettings

        this.initGeneralSettings()
        this.initSecuritySettings()

    }

    initGeneralSettings(){
        const html = `
            <div id="toto">
                TOTOTO
            </div>
        `
        let range = document.createRange()
        let fragment = range.createContextualFragment(html)
        let inviteBtn = fragment.getElementById( "toto")
        inviteBtn.onclick = ()=>{
            console.log("----> 121212")
        }

        this.generalSettings.appendChild(fragment);

    }

    initSecuritySettings(){

    }

}


