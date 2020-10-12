import { Model } from './Model';
import { readDir } from "globular-web-client/api";

/**
 * Server side file accessor. That 
 */
export class File extends Model {

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
    constructor(name: string, path: string) {
        super();

        this._name = name;
        this._path = path.split("//").join("/");

        /** Here I will initialyse the ressource. */
        this.files = new Array<File>();

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
        
        for(let f of this.files){
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
    static readDir(path: string, callback: (dir: File) => void, errorCallback: (err: any) => void) {
        readDir(Model.globular, path, (data: any) => {
            callback(File.fromObject(data))
        }, errorCallback)
    }
}