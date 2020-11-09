export class Camera extends HTMLElement {
    _device: any;
    _camera: HTMLElement;
    _video: HTMLElement;
    _canvas: HTMLElement;
    _photo: HTMLElement;
    _openbutton: HTMLElement;
    _startbutton: HTMLElement;
    _closebutton: HTMLElement;
    _width_inupt: HTMLElement;
    _savebutton: HTMLElement;
    _deletebutton: HTMLElement;
    _camera_options: HTMLElement;
    _width: any;
    streaming: boolean;
    _stream: MediaStream;
    onsave: any;
    onsaved: any;
    set width(arg: any);
    get width(): any;
    _height: number;
    get height(): number;
    connectedCallback(): void;
    _streaming: boolean;
    takepicture(): void;
    /**
     * Clear the canvas.
     */
    clearphoto(): void;
    /**
     * When the web component is disconnect.
     */
    disconnectedCallback(): void;
}
