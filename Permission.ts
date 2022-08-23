import { Model } from './Model';
import * as rbac from "globular-web-client/rbac/rbac_pb";
import { Globular } from 'globular-web-client';

/**
 * That class is use to access Resource permission.
 */
export class PermissionManager {

    constructor() {

    }

    /**
     * Return the resource permission for a given resource.
     * @param subject The account, organization, group, peer to give permission to.
     * @param resource The resource to set
     * @param permission Can be any string, it will be drive by the interface here.
     */
    static getResourcePermission(resource: string, permission: string, type: rbac.PermissionType, successCallback: (permission: rbac.Permission) => void, errorCallback: (err: any) => void, subject?: string) {
        let rqst = new rbac.GetResourcePermissionRqst
        rqst.setPath(resource)
        rqst.setName(permission)
        rqst.setType(type)

        Model.globular.rbacService.getResourcePermission(rqst, {
            token: localStorage.getItem("user_token"),
            application: Model.application,
            domain: Model.domain,
            address: Model.address
        }).then((rsp: rbac.GetResourcePermissionRsp) => {
            successCallback(rsp.getPermission());
        }).then(errorCallback)
    }

    /**
     * Return the resource permission for a given resource.
     * @param subject The account, organization, group, peer to give permission to.
     * @param resource The resource to set
     * @param permission Can be any string, it will be drive by the interface here.
     */
    static getResourcePermissions(resource: string, successCallback: (permissions: rbac.Permissions) => void, errorCallback: (err: any) => void, globule:Globular = Model.globular) {
        let rqst = new rbac.GetResourcePermissionsRqst
        rqst.setPath(resource)
        
        globule.rbacService.getResourcePermissions(rqst, {
            token: localStorage.getItem("user_token"),
            application: Model.application,
            domain: Model.domain,
            address: Model.address
        }).then((rsp: rbac.GetResourcePermissionsRsp) => {
            successCallback(rsp.getPermissions());
        }).catch(errorCallback)
    }

    /**
     * Create/Set a permission for a resource.
     * @param subject The account, organization, group, peer to give permission to.
     * @param resource The resource to set
     * @param permission Can be any string, it will be drive by the interface here.
     */
    static setResourcePermissions(resource: string, permission: string, subject: string, successCallback: () => void, errorCallback: (err: any) => void, globule:Globular = Model.globular) {

        // first of all I will get the resource permissions
        PermissionManager.getResourcePermissions(resource,
            (permissions: rbac.Permissions) => {
                successCallback();
            },
            (err: any) => {
                if(err.message.indexOf("leveldb: not found") != -1) {
 
                }else{
                    errorCallback(err)
                }
            }, globule)
    }

    /**
     * Remove resource permissions or if permission and suject is set it will remove
     * only for a specif permission and subject.
     * @param subject The account, organization, group, peer to give permission to.
     * @param resource The resource to set
     * @param permission Can be any string, it will be drive by the interface here.
     */
    static removeResourcePermissions(resource: string, permission?: string, subject?: string) {

    }
}