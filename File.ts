import { generatePeerToken, Model } from './Model';
import { readDir } from "globular-web-client/api";
import * as jwt from "jwt-decode";
import { Globular } from 'globular-web-client';
import { ApplicationView } from './ApplicationView';
import { getTheme } from './components/Theme';
import { FileInfo, GetFileInfoRequest } from 'globular-web-client/file/file_pb';
import { Application } from './Application';
import { formatReal } from './components/utility';

/**
 * Server side file accessor. That 
 */
export class File extends Model {

    // Must be implemented by the application level.
    public static saveLocal: (f: File, b: Blob) => void

    // Test if a local copy exist for the file.
    public static hasLocal: (path: String, callback: (exists: boolean) => void) => void;

    // Remove the local file copy
    public static removeLocal: (path: String, callback: () => void) => void;

    // If the file does not really exist on the server It can be keep in that map.
    private static _local_files: any = {}

    private globule: Globular;

    // return the file domain.
    public get domain(): string {
        return this.globule.config.Domain;
    }

    private _metadata: any = {};
    public get metadata(): any {
        return this._metadata;
    }
    public set metadata(value: any) {
        this._metadata = value;
    }

    /** A file image preview */
    private _thumbnail: string
    public get thumbnail(): string {
        return this._thumbnail;
    }
    public set thumbnail(value: string) {
        this._thumbnail = value;
    }

    /** The file path */
    private _path: string;
    public get path(): string {
        return this._path;
    }
    public set path(value: string) {
        this._path = value;
    }

    /** The name */
    private _name: string;
    public get name(): string {
        return this._name;
    }
    public set name(value: string) {
        this._name = value;
    }

    /** The size */
    private _size: number;
    public get size(): number {
        return this._size;
    }
    public set size(value: number) {
        this._size = value;
    }

    /** The Mode */
    private _mode: number;
    public get mode(): number {
        return this._mode;
    }
    public set mode(value: number) {
        this._mode = value;
    }

    /** The mode time */
    private _modeTime: Date;
    public get modeTime(): Date {
        return this._modeTime;
    }
    public set modeTime(value: Date) {
        this._modeTime = value;
    }

    /** The Mime type */
    private _mime: string;
    public get mime(): string {
        return this._mime;
    }
    public set mime(value: string) {
        this._mime = value;
    }

    /** The file checksum */
    private _checksum: string;
    public get checksum(): string {
        return this._checksum;
    }
    public set checksum(value: string) {
        this._checksum = value;
    }

    /** is dir */
    private _isDir: boolean;
    public get isDir(): boolean {
        return this._isDir;
    }
    public set isDir(value: boolean) {
        this._isDir = value;
    }

    private _files: File[];
    public get files(): File[] {
        return this._files;
    }
    public set files(value: File[]) {
        this._files = value;
    }


    /** The file  */
    constructor(name: string, path: string, local: boolean = false, globule = Model.globular) {
        super();

        // keep track of the origine
        this.globule = globule;

        this._name = name;
        this._path = path.split("//").join("/");

        /** Here I will initialyse the resource. */
        this.files = new Array<File>();

        if (local) {
            let id = globule.config.Domain + "@" + this.path
            File._local_files[id] = this
        }

    }

    /**
     * Create instance of File class from JSON object.
     * @param obj The JSON object.
     */
    static fromObject(obj: any): any {
        const file = new File(obj.name, obj.path)
        file.isDir = obj.isDir
        file.mime = obj.mime
        file.modeTime = new Date(obj.modeTime*1000)
        file.mode = obj.mode
        file.size = obj.size
        file.thumbnail = obj.thumbnail
        file.checksum = obj.checksum

        // Now the sub-file.
        if (file.isDir && obj.filesList != null) {
            for (let o of obj.filesList) {
                let f = <File>File.fromObject(o)
                file.files.push(f)
            }
        }

        return file
    }

    /**
     * Create instance of File from string.
     * @param str 
     */
    static fromString(str: string): any {
        let file = File.fromObject(JSON.parse(str))
        return file
    }

    /**
     * Set back the file to JSON object.
     */
    toObject(): any {
        let obj = {
            IsDir: this.isDir,
            Mime: this.mime,
            modeTime: this.modeTime.toISOString(),
            Mode: this.mode,
            Name: this.name,
            Path: this.path,
            Size: this.size,
            Thumbnail: this.thumbnail,
            Files: new Array<any>()
        }

        for (let f of this.files) {
            obj.Files.push(f.toObject())
        }
    }

    /**
     * Stringnify a file.
     */
    toString(): string {
        let obj = this.toObject()
        return JSON.stringify(obj)
    }

    /**
     * Return the file path.
     */
    get filePath(): string {
        if (this.name == "") {
            return "/"
        }
        return this.path + "/" + this.name
    }

    /**
     * Retrun the file from a given path.
     * @param globule 
     * @param path 
     * @param callback 
     * @param errorCallback 
     */
    static getFile(globule: Globular, path: string, thumbnailWith: number, thumbnailHeight: number, callback: (f: File) => void, errorCallback: (err: string) => void) {

        generatePeerToken(globule, token => {

            let rqst = new GetFileInfoRequest()
            rqst.setPath(path)
            rqst.setThumnailheight(thumbnailHeight)
            rqst.setThumnailwidth(thumbnailWith)
            globule.fileService.getFileInfo(rqst, { application: Application.application, domain: globule.config.Domain, token: token })
                .then(rsp => {
                    let f = File.fromObject(rsp.getInfo().toObject())
                    callback(f);

                })
                .catch(e => {
                    console.log(`failt to get file ${path} info with error:`, e)
                    errorCallback(e)})
        }, errorCallback)
    }

    /**
     * Static function's
     */
    static readDir(path: string, recursive: boolean, callback: (dir: File) => void, errorCallback: (err: any) => void, globule?: Globular) {
        // So here I will get the dir of the current user...
        //let token = localStorage.getItem("user_token")
        generatePeerToken(globule, token => {

            let decoded = jwt(token);
            let address = (<any>decoded).address;
            if (!globule) {
                globule = Model.getGlobule(address)
            }

            path = path.replace(globule.config.DataPath + "/files/", "/")

            let id = globule.config.Domain + "@" + path
            if (File._local_files[id] != undefined) {
                callback(File._local_files[id])
                return
            }

            console.log("read dir ", path)
            // 
            readDir(globule, path, recursive, (dir: FileInfo) => {
                callback(File.fromObject(dir.toObject()))
            }, errorCallback, 80, 80, token)
        }, errorCallback)
    }

    /**
     * Save file local copy
     */
    keepLocalyCopy(callback: () => void) {

        let globule = this.globule
        let toast = ApplicationView.displayMessage(`
        <style>
            ${getTheme()}
        </style>
        <div id="create-file-local-copy">
            <div>Your about to create a local copy of file </div>
            <span style="font-style: italic;" id="file-path"></span>
            <div style="display: flex; flex-direction: column; justify-content: center;">
                <img style="width: 185.31px; align-self: center; padding-top: 10px; padding-bottom: 15px;" id="thumbnail"> </img>
            </div>
            <div>Is that what you want to do? </div>
            <div style="display: flex; justify-content: flex-end;">
                <paper-button id="ok-button">Ok</paper-button>
                <paper-button id="cancel-button">Cancel</paper-button>
            </div>
        </div>
        `, 60 * 1000)


        let cancelBtn = <any>(toast.el.querySelector("#cancel-button"))
        cancelBtn.onclick = () => {
            toast.dismiss();
        }

        let thumbnailImg = <any>(toast.el.querySelector("#thumbnail"))
        thumbnailImg.src = this.thumbnail

        toast.el.querySelector("#file-path").innerHTML = this.name

        let okBtn = <any>(toast.el.querySelector("#ok-button"))
        okBtn.onclick = () => {

            // simply download the file.
            generatePeerToken(globule, (token: string) => {
                let path = this.path
                let url = globule.config.Protocol + "://" + globule.config.Domain

                if (globule.config.Protocol == "https") {
                    if (globule.config.PortHttps != 443)
                        url += ":" + globule.config.PortHttps
                } else {
                    if (globule.config.PortHttps != 80)
                        url += ":" + globule.config.PortHttp
                }

                path.split("/").forEach(item => {
                    item = item.trim()
                    if (item.length > 0) {
                        url += "/" + encodeURIComponent(item)
                    }
                })

                url += "?application=" + Model.application
                if (localStorage.getItem("user_token") != undefined) {
                    url += "&token=" + localStorage.getItem("user_token")
                }


                const req = new XMLHttpRequest();

                // Set the values also as parameters...
                url += "?domain=" + globule.config.Domain
                url += "&application=" + Model.application
                if (localStorage.getItem("user_token") != undefined) {
                    url += "&token=" + localStorage.getItem("user_token")
                }

                req.open("GET", url, true);

                // Set the token to manage downlaod access.
                req.setRequestHeader("token", token);
                req.setRequestHeader("application", globule.config.Domain);
                req.setRequestHeader("domain", globule.config.Domain);

                req.responseType = "blob";
                req.onload = (event: any) => {
                    const blob = req.response;

                    console.log("blob was download! ", blob.size)
                    if (File.saveLocal) {
                        File.saveLocal(this, blob)
                        callback()
                    }

                };

                req.send();

            }, err => ApplicationView.displayMessage(err, 3000))

            toast.dismiss();
        }
    }

    /**
     * remove file local copy
     */
    removeLocalCopy(callback: () => void) {

        let toast = ApplicationView.displayMessage(`
        <style>
            ${getTheme()}
        </style>
        <div id="create-file-local-copy">
            <div>Your about to remove a local copy of file </div>
            <span style="font-style: italic;" id="file-path"></span>
            <div style="display: flex; flex-direction: column; justify-content: center;">
                <img style="width: 185.31px; align-self: center; padding-top: 10px; padding-bottom: 15px;" id="thumbnail"> </img>
            </div>
            <div>Is that what you want to do? </div>
            <div style="display: flex; justify-content: flex-end;">
                <paper-button id="ok-button">Ok</paper-button>
                <paper-button id="cancel-button">Cancel</paper-button>
            </div>
        </div>
        `, 60 * 1000)


        let cancelBtn = <any>(toast.el.querySelector("#cancel-button"))
        cancelBtn.onclick = () => {
            toast.dismiss();
        }

        let thumbnailImg = <any>(toast.el.querySelector("#thumbnail"))
        thumbnailImg.src = this.thumbnail

        toast.el.querySelector("#file-path").innerHTML = this.name

        let okBtn = <any>(toast.el.querySelector("#ok-button"))
        okBtn.onclick = () => {
            if (File.removeLocal) {
                File.removeLocal(this.path, () => {
                    ApplicationView.displayMessage(`local copy of ${this.path} was removed`, 3000)
                    callback()
                })
            }
            toast.dismiss();
        }
    }

}