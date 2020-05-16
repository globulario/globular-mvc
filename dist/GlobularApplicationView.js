import { ApplicationView } from "./components/ApplicationView";
/**
 * That class made use of the web-component applcation view.
 */
var GlobularApplicationView = /** @class */ (function () {
    function GlobularApplicationView() {
        if (document.getElementsByTagName("globular-application") != undefined) {
            this.applicationView = document.getElementsByTagName("globular-application")[0];
        }
        else {
            this.applicationView = new ApplicationView();
            document.body.appendChild(this.applicationView);
        }
    }
    return GlobularApplicationView;
}());
export { GlobularApplicationView };
//# sourceMappingURL=GlobularApplicationView.js.map