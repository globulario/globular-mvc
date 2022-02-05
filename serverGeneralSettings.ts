import { Settings } from "./Settings"
import { SettingsMenu, SettingsPanel, ComplexSetting, LinkSetting, EmailSetting, ActionSetting, ReadOnlyStringSetting, StringListSetting, StringSetting, DropdownSetting, TextAreaSetting, NumberSetting } from "./components/Settings"
import * as resource from "globular-web-client/resource/resource_pb"
import { Application } from "./Application";
import { SaveConfigRequest } from "globular-web-client/admin/admin_pb";
import { Model } from "./Model";
import { ApplicationView } from "./ApplicationView";

export class ServerGeneralSettings extends Settings {
    private config: any;
    private needSave: boolean;

    constructor(settingsMenu: SettingsMenu, settingsPanel: SettingsPanel) {
        super(settingsMenu, settingsPanel);
        //ApplicationView.displayMessage("The server will now restart...", 3000)
        // make sure the configuration is not the actual server configuration
        this.config = JSON.parse(JSON.stringify(Model.globular.config))
        delete this.config["Services"] // do not display services configuration here...

        Model.globular.eventHub.subscribe("save_settings_evt", uuid => { }, evt => {
            this.save()
        }, true)

        // Create the settings menu and panel here
        let generalSettingsMenuItem = settingsMenu.appendSettingsMenuItem("settings", "General");

        // Create General informations setting's
        let serverSettingsPage = <any>settingsPanel.appendSettingsPage("General");

        // Create general server settings ...
        let generalSettings = serverSettingsPage.appendSettings("General", "Globular Server General Settings");

        // Set the name of the server.
        let nameSetting = new StringSetting("Name", "The Globular server name")
        nameSetting.setValue(this.config.Name)
        generalSettings.addSetting(nameSetting)

        //
        nameSetting.onchange = () => {
            this.config.Name = nameSetting.getValue()
            this.needSave = true
        }

        let macSetting = new ReadOnlyStringSetting("MAC Address", "The Globular server MAC addresse")
        macSetting.setValue(this.config.Mac)
        generalSettings.addSetting(macSetting)

        let versionSetting = new ReadOnlyStringSetting("Version", "The Globular server version number")
        versionSetting.setValue(this.config.Version)
        generalSettings.addSetting(versionSetting)

        let buildSetting = new ReadOnlyStringSetting("Build", "The Globular server build number")
        buildSetting.setValue(this.config.Build)
        generalSettings.addSetting(buildSetting)

        let platformSetting = new ReadOnlyStringSetting("Platfrom", "The server operating system and architecture")
        platformSetting.setValue(this.config.Platform)
        generalSettings.addSetting(platformSetting)

        // Now the port range.
        // The user name.
        let portRangeSetting = new ComplexSetting("Grpc Port Range", "[" + this.config.PortsRange + "]")

        // Set the user setting complex content.
        let startPortSetting = new NumberSetting("from port number", "Enter the starting port number (inclusive)")
        startPortSetting.setValue(this.config.PortsRange.split("-")[0])
        portRangeSetting.addSetting(startPortSetting)

        let endPortSetting = new NumberSetting("to port number", "Enter ending port number (inclusive)")
        endPortSetting.setValue(this.config.PortsRange.split("-")[1])
        portRangeSetting.addSetting(endPortSetting)

        startPortSetting.onchange = endPortSetting.onchange = () => {
            this.config.PortsRange = startPortSetting.getValue() + "-" + endPortSetting.getValue()
            portRangeSetting.setDescription("[" + this.config.PortsRange + "]")
            this.needSave = true
        }

        generalSettings.addSetting(portRangeSetting)

        let watchForUpdateSetting = new NumberSetting("Update Delay", "Delay before watch for update in seconds")
        watchForUpdateSetting.setValue(this.config.WatchUpdateDelay)
        generalSettings.addSetting(watchForUpdateSetting)

        watchForUpdateSetting.onchange = () => {
            this.config.WatchUpdateDelay = parseInt(watchForUpdateSetting.getValue())
            this.needSave = true
        }

        let sessionTimeoutSetting = new NumberSetting("Session timeout", "The time tokens will be valid in seconds")
        sessionTimeoutSetting.setValue(this.config.SessionTimeout)
        generalSettings.addSetting(sessionTimeoutSetting)

        sessionTimeoutSetting.onchange = () => {
            this.config.SessionTimeout = parseInt(sessionTimeoutSetting.getValue())
            this.needSave = true
        }

        let webSeverSettings = serverSettingsPage.appendSettings("Web Server", "Web server http settings");

        // Set the protocol...
        let protocolSetting = new DropdownSetting("http/https", "Select the http server protocol")
        protocolSetting.setDropdownList(["http", "https"])
        protocolSetting.setValue(this.config.Protocol)
        webSeverSettings.addSetting(protocolSetting)

        protocolSetting.onchange = () => {
            this.config.Protocol = protocolSetting.getValue()
            this.needSave = true
        }

        let indexApplicationSetting = new DropdownSetting("Index Application", "The default application to display on the server")
        webSeverSettings.addSetting(indexApplicationSetting)
        Application.getAllApplicationInfo((info: any) => {
            let applications = [""]
            for (var i = 0; i < info.length; i++) {
                let app = <resource.Application>(info[i])
                applications.push(app.getName())
            }
            indexApplicationSetting.setDropdownList(applications)
        }, (err: any) => { })
        indexApplicationSetting.setValue(this.config.IndexApplication)
        indexApplicationSetting.onchange = () => {
            this.config.IndexApplication = indexApplicationSetting.getValue()
            this.needSave = true
        }

        // Now the http port...
        let httpPortSetting = new NumberSetting("http port number", "Enter the http port number")
        httpPortSetting.setValue(this.config.PortHttp)
        httpPortSetting.onchange = () => {
            this.config.PortHttp = parseInt(httpPortSetting.getValue())
            this.needSave = true
        }
        webSeverSettings.addSetting(httpPortSetting)


        let httpsPortSetting = new NumberSetting("https port number", "Enter the https port number")
        httpsPortSetting.setValue(this.config.PortHttps)
        httpsPortSetting.onchange = () => {
            this.config.PortHttps = parseInt(httpsPortSetting.getValue())
            this.needSave = true
        }
        webSeverSettings.addSetting(httpsPortSetting)

        let corsOriginsSettings_ = new ComplexSetting("Allowed Origins", "List of allowed Cross-origin")

        let corsOriginsSettings = new StringListSetting("Allowed Origins", "List of allowed Cross-origin")
        corsOriginsSettings.setValues(this.config.AllowedOrigins)
        corsOriginsSettings.onchange = () => {
            this.config.AllowedOrigins = corsOriginsSettings.getValues()
            this.needSave = true
        }
        corsOriginsSettings_.addSetting(corsOriginsSettings)
        webSeverSettings.addSetting(corsOriginsSettings_)

        let corsMethodsSettings_ = new ComplexSetting("Allowed Methods", "List of allowed Cross-method")
        let corsMethodsSettings = new StringListSetting("Allowed Methods", "List of allowed Cross-method")
        corsMethodsSettings.setValues(this.config.AllowedMethods)
        corsMethodsSettings.onchange = () => {
            this.config.AllowedMethods = corsMethodsSettings.getValues()
            this.needSave = true
        }
        corsMethodsSettings_.addSetting(corsMethodsSettings)
        webSeverSettings.addSetting(corsMethodsSettings_)

        let corsHeadersSettings_ = new ComplexSetting("Allowed Headers", "List of allowed Cross-header")
        let corsHeadersSettings = new StringListSetting("Allowed Headers", "List of allowed Cross-header")
        corsHeadersSettings.setValues(this.config.AllowedHeaders)
        corsHeadersSettings.onchange = () => {
            this.config.AllowedHeaders = corsHeadersSettings.getValues()
            this.needSave = true
        }
        corsHeadersSettings_.addSetting(corsHeadersSettings)
        webSeverSettings.addSetting(corsHeadersSettings_)

        // Now the dns informations.
        let discoveriesSettings = serverSettingsPage.appendSettings("Dicoveries", "Directories where to find new application and service packages.");
        let discoveriSettings_ = new StringListSetting("Discoveries", "")
        
        discoveriSettings_.setValues(this.config.Discoveries)
        discoveriSettings_.onchange = () => {
            this.config.Discoveries = discoveriSettings_.getValues()
            this.needSave = true
        }
        discoveriesSettings.addSetting(discoveriSettings_)

        // Now the dns informations.
        let dnsSeverSettings = serverSettingsPage.appendSettings("Domain", "Domain releated informations");

        // Set the name of the server.
        let domainSetting = new StringSetting("Domain", "The server domain name. If a Name is set the domain will be Name.Domaim")
        domainSetting.setValue(this.config.Domain)
        domainSetting.onchange = () => {
            this.config.Domain = domainSetting.getValue()
            this.needSave = true
        }
        dnsSeverSettings.addSetting(domainSetting)

        let alternateDomainSettings = new StringListSetting("Alternate Domains", "List of alternate domain for the server")
        alternateDomainSettings.setValues(this.config.AlternateDomains)
        alternateDomainSettings.onchange = () => {
            this.config.AlternateDomains = alternateDomainSettings.getValues()
            this.needSave = true
        }
        dnsSeverSettings.addSetting(domainSetting)
        dnsSeverSettings.addSetting(alternateDomainSettings)

        let dnsSettings = new StringListSetting("DNS servers", "List of dns server at least tow...")
        dnsSettings.setValues(this.config.Dns)
        dnsSettings.onchange = () => {
            this.config.Dns = dnsSettings.getValues()
            this.needSave = true
        }
        dnsSeverSettings.addSetting(dnsSettings)

        // Server certificate setting.
        let certificateSettings = serverSettingsPage.appendSettings("Certificates", "TLS certificate(s) settings");

        let certUrlSetting = new LinkSetting("Certificate", "Certificate URL")
        certUrlSetting.setValue("click to download")
        certUrlSetting.setUrl(this.config.CertURL)
        certificateSettings.addSetting(certUrlSetting)

        // Set the name of the server.
        let crtSetting = new StringSetting("Cerificate", "the certificate .crt file in the creds directory.")
        crtSetting.setValue(this.config.Certificate)
        certificateSettings.addSetting(crtSetting)

        // Empty it will force certificate regeneation...
        crtSetting.onchange = () => {
            this.config.Certificate = crtSetting.getValue()
            this.needSave = true
        }

        let crtBundleSetting = new StringSetting("Cerificate bundle", "the certificate ca bundle")
        crtBundleSetting.setValue(this.config.CertificateAuthorityBundle)
        certificateSettings.addSetting(crtBundleSetting)

        // Empty it will force certificate regeneation...
        crtBundleSetting.onchange = () => {
            this.config.CertificateAuthorityBundle = crtBundleSetting.getValue()
            this.needSave = true
        }

        let certExpirationDelaySetting = new NumberSetting("Expiration", "The number of day the certificate must be valid")
        certExpirationDelaySetting.setValue(this.config.CertExpirationDelay)
        certExpirationDelaySetting.onchange = () => {
            this.config.CertExpirationDelay = certExpirationDelaySetting.getValue()
            this.needSave = true
        }
        certificateSettings.addSetting(certExpirationDelaySetting)

        let certPasswordSetting = new StringSetting("Password", "Certificate password")
        certPasswordSetting.setValue(this.config.CertPassword)
        certPasswordSetting.onchange = () => {
            this.config.CertPassword = certPasswordSetting.getValue()
            this.needSave = true
        }
        certificateSettings.addSetting(certPasswordSetting)

        let certCountrySetting = new StringSetting("Country", "Country Codes are required when creating a Certificate Signing Request")
        certCountrySetting.setValue(this.config.Country)
        certCountrySetting.onchange = () => {
            this.config.Country = certCountrySetting.getValue()
            this.needSave = true
        }
        certificateSettings.addSetting(certCountrySetting)

        let certStateSetting = new StringSetting("State", "State Codes are required when creating a Certificate Signing Request")
        certStateSetting.setValue(this.config.State)
        certStateSetting.onchange = () => {
            this.config.State = certStateSetting.getValue()
            this.needSave = true
        }
        certificateSettings.addSetting(certStateSetting)

        let citySetting = new StringSetting("City", "City Codes are required when creating a Certificate Signing Request")
        citySetting.setValue(this.config.City)
        citySetting.onchange = () => {
            this.config.City = citySetting.getValue()
            this.needSave = true
        }
        certificateSettings.addSetting(citySetting)

        let certOrganizationSetting = new StringSetting("Organization", "Organization Codes are required when creating a Certificate Signing Request")
        certOrganizationSetting.setValue(this.config.Organization)
        certOrganizationSetting.onchange = () => {
            this.config.Organization = certOrganizationSetting.getValue()
            this.needSave = true
        }
        certificateSettings.addSetting(certOrganizationSetting)

        // Now the action.
        let renewCertificateAction = new ActionSetting("Renew", "Renew the certificate", () => {
            this.config.Certificate = ""
            this.config.CertificateAuthorityBundle = ""
            this.needSave = true
            this.save()
        })

        certificateSettings.addSetting(renewCertificateAction)

        generalSettingsMenuItem.click()
    }

    save() {
        if(!this.needSave){
            return
        }
        
        let saveRqst = new SaveConfigRequest
        saveRqst.setConfig(JSON.stringify(this.config))
        Model.globular.adminService.saveConfig(saveRqst, {
            token: localStorage.getItem("user_token"),
            application: Model.application,
            domain: Model.domain,
            address: Model.address
        }).then(() => { })
            .catch(err => {
                ApplicationView.displayMessage(err, 3000)
            })
    }
}