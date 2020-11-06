import { Model } from './Model';
/**
 * Server side file accessor. That
 */
export declare class File extends Model {
    /** A file image preview */
    private _thumbnail;
    get thumbnail(): string;
    set thumbnail(value: string);
    /** The file path */
    private _path;
    get path(): string;
    set path(value: string);
    /** The name */
    private _name;
    get name(): string;
    set name(value: string);
    /** The size */
    private _size;
    get size(): number;
    set size(value: number);
    /** The Mode */
    private _mode;
    get mode(): number;
    set mode(value: number);
    /** The mode time */
    private _modTime;
    get modTime(): Date;
    set modTime(value: Date);
    /** The Mime type */
    private _mime;
    get mime(): string;
    set mime(value: string);
    /** is dir */
    private _isDir;
    get isDir(): boolean;
    set isDir(value: boolean);
    private _files;
    get files(): File[];
    set files(value: File[]);
    /** The file  */
    constructor(name: string, path: string);
    /**
     * Create instance of File class from JSON object.
     * @param obj The JSON object.
     */
    static fromObject(obj: any): any;
    /**
     * Create instance of File from string.
     * @param str
     */
    static fromString(str: string): any;
    /**
     * Set back the file to JSON object.
     */
    toObject(): any;
    /**
     * Stringnify a file.
     */
    toString(): string;
    /**
     * Return the file path.
     */
    get filePath(): string;
    /**
     * Static function's
     */
    static readDir(path: string, callback: (dir: File) => void, errorCallback: (err: any) => void): void;
}
