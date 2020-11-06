"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.File = void 0;
const Model_1 = require("./Model");
const api_1 = require("globular-web-client/api");
/**
 * Server side file accessor. That
 */
class File extends Model_1.Model {
    /** The file  */
    constructor(name, path) {
        super();
        this._name = name;
        this._path = path.split("//").join("/");
        /** Here I will initialyse the ressource. */
        this.files = new Array();
    }
    get thumbnail() {
        return this._thumbnail;
    }
    set thumbnail(value) {
        this._thumbnail = value;
    }
    get path() {
        return this._path;
    }
    set path(value) {
        this._path = value;
    }
    get name() {
        return this._name;
    }
    set name(value) {
        this._name = value;
    }
    get size() {
        return this._size;
    }
    set size(value) {
        this._size = value;
    }
    get mode() {
        return this._mode;
    }
    set mode(value) {
        this._mode = value;
    }
    get modTime() {
        return this._modTime;
    }
    set modTime(value) {
        this._modTime = value;
    }
    get mime() {
        return this._mime;
    }
    set mime(value) {
        this._mime = value;
    }
    get isDir() {
        return this._isDir;
    }
    set isDir(value) {
        this._isDir = value;
    }
    get files() {
        return this._files;
    }
    set files(value) {
        this._files = value;
    }
    /**
     * Create instance of File class from JSON object.
     * @param obj The JSON object.
     */
    static fromObject(obj) {
        const file = new File(obj.Name, obj.Path);
        file.isDir = obj.IsDir;
        file.mime = obj.Mime;
        file.modTime = new Date(obj.ModTime);
        file.mode = obj.Mode;
        file.size = obj.Size;
        file.thumbnail = obj.Thumbnail;
        // Now the sub-file.
        if (file.isDir && obj.Files != null) {
            for (let o of obj.Files) {
                let f = File.fromObject(o);
                file.files.push(f);
            }
        }
        return file;
    }
    /**
     * Create instance of File from string.
     * @param str
     */
    static fromString(str) {
        let file = File.fromObject(JSON.parse(str));
        return file;
    }
    /**
     * Set back the file to JSON object.
     */
    toObject() {
        let obj = {
            IsDir: this.isDir,
            Mime: this.mime,
            ModTime: this.modTime.toISOString(),
            Mode: this.mode,
            Name: this.name,
            Path: this.path,
            Size: this.size,
            Thumbnail: this.thumbnail,
            Files: new Array()
        };
        for (let f of this.files) {
            obj.Files.push(f.toObject());
        }
    }
    /**
     * Stringnify a file.
     */
    toString() {
        let obj = this.toObject();
        return JSON.stringify(obj);
    }
    /**
     * Return the file path.
     */
    get filePath() {
        if (this.name == "") {
            return "/";
        }
        return this.path + "/" + this.name;
    }
    /**
     * Static function's
     */
    static readDir(path, callback, errorCallback) {
        api_1.readDir(Model_1.Model.globular, path, (data) => {
            callback(File.fromObject(data));
        }, errorCallback);
    }
}
exports.File = File;
