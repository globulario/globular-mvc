var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
import { Application } from "./Application";
import * as GlobularWebClient from "globular-web-client";
import { GetConfigRequest } from "globular-web-client/lib/admin/admin_pb";
import { GlobularApplicationView } from "./GlobularApplicationView";
var GlobularApplication = /** @class */ (function (_super) {
    __extends(GlobularApplication, _super);
    function GlobularApplication(name) {
        // Set the application name.
        return _super.call(this, name) || this;
    }
    /**
     * Connect with the backend and get the initial configuration.
     * @param initCallback On success callback
     * @param errorCallback On error callback
     * @param adminPort The admin service port
     * @param adminProxy The admin service proxy
     */
    GlobularApplication.prototype.init = function (initCallback, errorCallback, adminPort, adminProxy) {
        var _this = this;
        if (adminPort === void 0) { adminPort = 10001; }
        if (adminProxy === void 0) { adminProxy = 10002; }
        this.config = {
            Protocol: window.location.protocol.replace(":", ""),
            Domain: window.location.hostname,
            PortHttp: parseInt(window.location.port),
            AdminPort: adminPort,
            AdminProxy: adminProxy,
            Services: {} // empty for start.
        };
        // init the globular object from the configuration retreived.
        GlobularApplication.globular = new GlobularWebClient.Globular(this.config);
        // init the event hub from the object retreive.
        GlobularApplication.eventHub = new GlobularWebClient.EventHub(GlobularApplication.globular.eventService);
        // So here I will initilyse the server connection.
        var globular = new GlobularWebClient.Globular(this.config);
        var rqst = new GetConfigRequest();
        if (globular.adminService !== undefined) {
            globular.adminService.getConfig(rqst, {
                domain: this.domain
            }).then(function (rsp) {
                // set back config with all it values.
                _this.config = JSON.parse(rsp.getResult());
                _this.view = new GlobularApplicationView();
                // Call init callback.
                initCallback();
            }).catch(function (err) {
            });
        }
        // Call the init callback function.
        initCallback();
    };
    return GlobularApplication;
}(Application));
export { GlobularApplication };
//# sourceMappingURL=GlobularApplication.js.map