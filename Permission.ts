import { Model } from './Model';
import * as rbac from "globular-web-client/rbac/rbac_pb";
import { Globular } from 'globular-web-client';
import { RbacServiceClient } from 'globular-web-client/rbac/rbac_grpc_web_pb';
import { ApplicationView } from './ApplicationView';

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
     * Remove resource permissions for a given resource
     * @param path The resource to set
     */
    static deleteResourcePermissions(path: string, callback:()=>void, errorCallback: (err:any)=>void, globule:Globular = Model.globular) {
        let rqst = new rbac.DeleteResourcePermissionsRqst
        rqst.setPath(path)

        globule.rbacService.deleteResourcePermissions(rqst,  {
            token: localStorage.getItem("user_token"),
            application: Model.application,
            domain: Model.domain,
            address: Model.address
        }).then(rsp=>{
            callback()
        }).catch(err=>errorCallback(err))
    }

    /**
     * Validate access to a given resource.
     * @param path 
     * @param permission 
     * @param subject 
     * @param type 
     * @param globule 
     */
    static validateAccess(path: string, permission: string, subject: string, type:rbac.SubjectType, callback:()=>void, errorCallback: (err:any)=>void, globule:Globular = Model.globular){
        // validate access.
        let rqst = new rbac.ValidateAccessRqst
        rqst.setPath(path)
        rqst.setPermission(permission)
        rqst.setSubject(subject)
        rqst.setType(type)

        globule.rbacService.validateAccess(rqst,  {
            token: localStorage.getItem("user_token"),
            application: Model.application,
            domain: Model.domain,
            address: Model.address
        }).then(rsp=>{
            callback()
        }).catch(err=>errorCallback(err))
    }

    /**
     * Set the resource owner.
     * @param path The path of the resource (can be a simple id or uuid)
     * @param resourceType The resource type, file, application, webpage etc...
     * @param subject The user id, application, group or organization...
     * @param subjectType The type of subject
     * @param callback The is whe
     * @param globule The globule where the resource will be validate.
     */
    static addResourceOwner(path:string, resourceType: string, subject: string, subjectType:rbac.SubjectType, callback:()=>void, errorCallback: (err:any)=>void, globule:Globular = Model.globular){
        let rqst = new rbac.AddResourceOwnerRqst
        rqst.setType(subjectType)
        rqst.setPath(path)
        rqst.setResourcetype(resourceType)
        rqst.setSubject(subject)

        globule.rbacService.addResourceOwner(rqst,  {
            token: localStorage.getItem("user_token"),
            application: Model.application,
            domain: Model.domain,
            address: Model.address
        }).then(rsp=>{
            callback()
        }).catch(err=>errorCallback(err))
    }
}