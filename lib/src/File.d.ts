import { Model } from "./Model";
/**
 * Thumbnail can be use to scale down image or create icon a file
 * content.
 */
export declare class Thumbnail {
    /** The file path */
    private filePath;
    /** The data url it cantain the image of the file type. */
    private dataUrl;
    /** The image height */
    private height;
    /** The image width */
    private width;
    constructor(filePath: string, height: number, width: number);
    /**
     * Read the data from the server and initialyse dataUrl.
     * @param callback Return when dataUrl is initialysed
     * @param errorCallback Error if something wrong append.
     */
    init(callback: () => void, errorCallback: (err: any) => void): void;
}
/**
 * Server side file accessor. That
 */
export declare class File extends Model {
    /** The ressource */
    private ressource;
    /** The file path */
    private path;
    /** The name */
    private name;
    /** The file  */
    constructor(name: string, path: string);
    init(callback: () => void, errorCallback: (err: any) => void): void;
    /**
     * Return the file path.
     */
    get filePath(): string;
}
