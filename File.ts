import { generatePeerToken, getUrl, Model } from './Model';
import { readDir } from "globular-web-client/api";
import * as jwt from "jwt-decode";
import { Globular } from 'globular-web-client';
import { ApplicationView } from './ApplicationView';
import { FileInfo, GetFileInfoRequest, ReadFileRequest } from 'globular-web-client/file/file_pb';
import { Application } from './Application';
import { formatReal } from './components/utility';
import { mergeTypedArrays, uint8arrayToStringMethod } from "./Utility";

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

    // If the file is a .lnk file the lnk will contain a 
    // reference to the linked file...
    private _lnk: File;
    public get lnk(): File {
        return this._lnk;
    }
    public set lnk(value: File) {
        this._lnk = value;
    }

    // return the file domain.
    public get domain(): string {
        return this.globule.domain;
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
            let id = globule.domain + "@" + this.path
            File._local_files[id] = this
        }

    }

    /**
     * Create instance of File class from JSON object.
     * @param obj The JSON object.
     */
    static fromObject(obj: any, local?: boolean, globule?: Globular): any {
        if(obj.domain){
            globule = Model.getGlobule(obj.domain)
        }
        const file = new File(obj.name, obj.path, local, globule)
        file.isDir = obj.isDir
        file.mime = obj.mime
        file.modeTime = new Date(obj.modeTime * 1000)
        file.mode = obj.mode
        file.size = obj.size
        file.thumbnail = obj.thumbnail
        file.checksum = obj.checksum
        file._metadata = obj.metadata

        // Now the sub-file.
        if (file.isDir && obj.filesList != null) {
            for (let o of obj.filesList) {
                let g = globule
                if(o.domain){
                   g = Model.getGlobule(o.domain)
                }
                let f = <File>File.fromObject(o, local, g)
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
            isDir: this.isDir,
            mime: this.mime,
            modeTime: this.modeTime.toISOString(),
            mode: this.mode,
            name: this.name,
            path: this.path,
            size: this.size,
            domain: this.domain,
            checksum: this.checksum,
            thumbnail: this.thumbnail,
            metadata: this.metadata,
            
            files: new Array<any>()
        }

        for (let f of this.files) {
            obj.files.push(f.toObject())
        }

        return obj
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
            rqst.setThumbnailheight(thumbnailHeight)
            rqst.setThumbnailwidth(thumbnailWith)
            globule.fileService.getFileInfo(rqst, { application: Application.application, domain: globule.domain, token: token })
                .then(rsp => {
                    let f = File.fromObject(rsp.getInfo().toObject())
                    f.globule = globule;
                    callback(f);
                })
                .catch(e => {
                    errorCallback(e)
                })
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

            let id = globule.domain + "@" + path
            if (File._local_files[id] != undefined) {
                callback(File._local_files[id])
                return
            }

            readDir(globule, path, recursive, (dir: FileInfo) => {
                try {
                    let f = File.fromObject(dir.toObject(), false, globule)
                    callback(f)
                } catch (e) {
                    errorCallback(e)
                }
            }, errorCallback, 80, 80, token)
        }, errorCallback)
    }

    static readText(file: File, callback: (text: string) => void, errorCallback: (err: any) => void) {
        // Read the file...
        let url = getUrl(file.globule)

        file.path.split("/").forEach(item => {
            url += "/" + encodeURIComponent(item.trim())
        })

        // Generate peer token.
        generatePeerToken(file.globule, token => {
  
            let rqst = new ReadFileRequest
            rqst.setPath(file.path)
            let data: any = []

            let stream = file.globule.fileService.readFile(rqst, { application: Application.application, domain: file.globule.domain, token: token })
            // Here I will create a local event to be catch by the file uploader...
            stream.on("data", (rsp) => {
                data = mergeTypedArrays(data, rsp.getData());
            })

            stream.on("status", (status) => {
                if (status.code == 0) {
                    uint8arrayToStringMethod(data, (str) => {
                        callback(str);
                    });
                } else {
                    // In case of error I will return an empty array
                    errorCallback(status.details)
                }
            });

        }, errorCallback)
    }

    /**
     * Save file local copy
     */
    keepLocalyCopy(callback: () => void) {

        let globule = this.globule
        let toast = ApplicationView.displayMessage(`
        <style>
           
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
                let url = getUrl(globule)

                path.split("/").forEach(item => {
                    item = item.trim()
                    if (item.length > 0) {
                        url += "/" + encodeURIComponent(item)
                    }
                })


                const req = new XMLHttpRequest();

                // Set the values also as parameters...
                url += "?domain=" + globule.domain
                url += "&application=" + Model.application
                url += "&token=" + token

                req.open("GET", url, true);

                // Set the token to manage downlaod access.
                req.setRequestHeader("token", token);
                req.setRequestHeader("application", globule.domain);
                req.setRequestHeader("domain", globule.domain);

                req.responseType = "blob";
                req.onload = (event: any) => {
                    const blob = req.response;
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