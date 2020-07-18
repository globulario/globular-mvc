/**
 * Login/Register functionality.
 */
export class Login extends HTMLElement {
    loginBox: LoginBox;
    registerBox: RegisterBox;
    getWorkspace(): HTMLElement;
    connectedCallback(): void;
    loginDiv: HTMLElement;
    registerBtn: HTMLElement;
    loginBtn: HTMLElement;
    init(): void;
}
/**
 * Login box
 */
export class LoginBox extends HTMLElement {
    connectedCallback(): void;
}
/**
 * Register box
 */
export class RegisterBox extends HTMLElement {
    connectedCallback(): void;
}
