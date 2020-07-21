import { Model } from "./Model";
import { FileRessource } from "./Ressource";
import { View } from "./View";



/**
 * Thumbnail can be use to scale down image or create icon a file 
 * content.
 */
export class Thumbnail {
    /** The file path */
    private filePath: string;

    /** The data url it cantain the image of the file type. */
    private dataUrl: string;

    /** The image height */
    private height: number;

    /** The image width */
    private width: number;

    constructor(filePath: string, height: number, width: number){
        this.filePath = filePath;
        this.height = height;
        this.width = width;
    }

    /**
     * Read the data from the server and initialyse dataUrl.
     * @param callback Return when dataUrl is initialysed
     * @param errorCallback Error if something wrong append.
     */
    init(callback:()=>void, errorCallback: (err:any)=>void){

    }


}

/**
 * Server side file accessor. That 
 */
export class File extends Model{

    /** The ressource */
    private ressource: FileRessource;

    /** The file path */
    private path: string;

    /** The name */
    private name: string;

    /** The file  */
    constructor(name:string, path:string){
        super();

        /** Here I will initialyse the ressource. */
        
    }

    /**
     * Return the file path.
     */
    get filePath() : string{
        if(this.name == ""){
            return "/"
        }

        return this.path + "/" + this.name
    }

}

/**
 * The file view is use to display a file infomation.
 */
class FileView extends View{

    private file: File;

    constructor(file: File){
        super()
    }

    /**
     * Return the thumbnail of the file.
     */
    getThumbnail(height: number, width: number, callback:(thumbnail: Thumbnail)=>{}, errorCallback:(err:any)=>void){
        let thumbnail = new Thumbnail(this.file.filePath, height, width)
        thumbnail.init(()=>{
            callback(thumbnail)
        }, errorCallback)
    }
}

