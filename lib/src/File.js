"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.File = exports.Thumbnail = void 0;
const Model_1 = require("./Model");
const View_1 = require("./View");
/**
 * Thumbnail can be use to scale down image or create icon a file
 * content.
 */
class Thumbnail {
    constructor(filePath, height, width) {
        this.filePath = filePath;
        this.height = height;
        this.width = width;
    }
    /**
     * Read the data from the server and initialyse dataUrl.
     * @param callback Return when dataUrl is initialysed
     * @param errorCallback Error if something wrong append.
     */
    init(callback, errorCallback) {
    }
}
exports.Thumbnail = Thumbnail;
/**
 * Server side file accessor. That
 */
class File extends Model_1.Model {
    /** The file  */
    constructor(name, path) {
        super();
        /** Here I will initialyse the ressource. */
    }
    init(callback, errorCallback) {
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
}
exports.File = File;
/**
 * The file view is use to display a file infomation.
 */
class FileView extends View_1.View {
    constructor(file) {
        super();
    }
    /**
     * Return the thumbnail of the file.
     */
    getThumbnail(height, width, callback, errorCallback) {
        let thumbnail = new Thumbnail(this.file.filePath, height, width);
        thumbnail.init(() => {
            callback(thumbnail);
        }, errorCallback);
    }
}
