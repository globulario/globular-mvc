import { Model } from './Model';
import { readDir } from "globular-web-client/api";
import * as jwt from "jwt-decode";
import { Globular } from 'globular-web-client';

/**
 * Server side file accessor. That 
 */
export class File extends Model {
    // If the file does not really exist on the server It can be keep in that map.
    private static _local_files: any = {}

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
    private _modTime: Date;
    public get modTime(): Date {
        return this._modTime;
    }
    public set modTime(value: Date) {
        this._modTime = value;
    }

    /** The Mime type */
    private _mime: string;
    public get mime(): string {
        return this._mime;
    }
    public set mime(value: string) {
        this._mime = value;
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
        const file = new File(obj.Name, obj.Path)
        file.isDir = obj.IsDir
        file.mime = obj.Mime
        file.modTime = new Date(obj.ModTime)
        file.mode = obj.Mode
        file.size = obj.Size
        file.thumbnail = obj.Thumbnail
        file.metadata = obj.Metadata

        if (obj.Metadata) {
            if (obj.Metadata.Picture) {
                file.thumbnail = obj.Metadata.ImageUrl
            }
        }

        // Now the sub-file.
        if (file.isDir && obj.Files != null) {
            for (let o of obj.Files) {
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
            ModTime: this.modTime.toISOString(),
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
     * Static function's
     */
    static readDir(path: string, recursive: boolean, callback: (dir: File) => void, errorCallback: (err: any) => void, globule?: Globular) {
        // So here I will get the dir of the current user...
        let token = localStorage.getItem("user_token")
        let decoded = jwt(token);
        let address = (<any>decoded).address;
        if (!globule) {
            globule = Model.getGlobule(address)
        }

        let id = globule.config.Domain + "@" + path
        if (File._local_files[id] != undefined) {
            callback(File._local_files[id])
            return
        }

        readDir(globule, path, recursive, (data: any) => {
            callback(File.fromObject(data))
        }, errorCallback)
    }

}