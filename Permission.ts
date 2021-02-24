import { Model } from './Model';
import * as rbac from "globular-web-client/rbac/rbac_pb";

/**
 * That class is use to access Ressource permission.
 */
export class PermissionManager {

    constructor() {

    }

    /**
     * Return the ressource permission for a given ressource.
     * @param subject The account, organization, group, peer to give permission to.
     * @param ressource The ressource to set
     * @param permission Can be any string, it will be drive by the interface here.
     */
    static getRessourcePermission(ressource: string, permission: string, type: rbac.PermissionType, successCallback: (permission: rbac.Permission) => void, errorCallback: (err: any) => void, subject?: string) {
        let rqst = new rbac.GetResourcePermissionRqst
        rqst.setName(permission)
        rqst.setType(type)

        Model.globular.rbacService.getResourcePermission(rqst, {
            token: localStorage.getItem("user_token"),
            application: Model.application,
            domain: Model.domain,
        }).then((rsp: rbac.GetResourcePermissionRsp) => {
            successCallback(rsp.getPermission());
        }).then(errorCallback)
    }

    /**
     * Return the ressource permission for a given ressource.
     * @param subject The account, organization, group, peer to give permission to.
     * @param ressource The ressource to set
     * @param permission Can be any string, it will be drive by the interface here.
     */
    static getRessourcePermissions(ressource: string, successCallback: (permissions: rbac.Permissions) => void, errorCallback: (err: any) => void) {
        let rqst = new rbac.GetResourcePermissionsRqst
        rqst.setPath(ressource)

        Model.globular.rbacService.getResourcePermissions(rqst, {
            token: localStorage.getItem("user_token"),
            application: Model.application,
            domain: Model.domain,
        }).then((rsp: rbac.GetResourcePermissionsRsp) => {
            successCallback(rsp.getPermissions());
        }).catch(errorCallback)
    }

    /**
     * Create/Set a permission for a ressource.
     * @param subject The account, organization, group, peer to give permission to.
     * @param ressource The ressource to set
     * @param permission Can be any string, it will be drive by the interface here.
     */
    static setRessourcePermissions(ressource: string, permission: string, subject: string, successCallback: () => void, errorCallback: (err: any) => void) {

        // first of all I will get the ressource permissions
        PermissionManager.getRessourcePermissions(ressource,
            (permissions: rbac.Permissions) => {
                console.log(permissions)
                successCallback();
            },
            (err: any) => {
                if(err.message.indexOf("leveldb: not found") != -1) {
                    console.log("=========> 158")
                    
                }else{
                    errorCallback(err)
                }
            })
    }

    /**
     * Remove ressource permissions or if permission and suject is set it will remove
     * only for a specif permission and subject.
     * @param subject The account, organization, group, peer to give permission to.
     * @param ressource The ressource to set
     * @param permission Can be any string, it will be drive by the interface here.
     */
    static removeRessourcePermissions(ressource: string, permission?: string, subject?: string) {

    }
}