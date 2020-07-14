export class Camera extends HTMLElement {
    _camera: HTMLElement;
    _video: HTMLElement;
    _canvas: HTMLElement;
    _photo: HTMLElement;
    _openbutton: HTMLElement;
    _startbutton: HTMLElement;
    _closebutton: HTMLElement;
    _width_inupt: HTMLElement;
    _width: any;
    _height: number;
    streaming: boolean;
    _stream: MediaStream;
    set width(arg: any);
    get width(): any;
    get height(): number;
    connectedCallback(): void;
    _streaming: boolean;
    takepicture(): void;
    /**
     * Clear the canvas.
     */
    clearphoto(): void;
    disconnectedCallback(): void;
}
