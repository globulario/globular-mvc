
export let theme = `
  :host {
    --toolbar-height: 64px;
    --searchbox-height: 44px;
    /** Material design (default theme is light)  */
    /** colors **/
    --palette-primary-accent: #1976d2;
    /** Primary **/
    --palette-primary-light: #4791db;
    --palette-primary-main: #1976d2;
    --palette-primary-dark: #115293;
    /** Secondary **/
    --palette-secondary-light: #e33371;
    --palette-secondary-main: #dc004e;
    --palette-secondary-dark: #9a0036;
    /** Error **/
    --palette-error-light: #ffb74d;
    --palette-error-main: #ff9800;
    --palette-error-dark: #f57c00;
    /** Error **/
    --palette-error-light: #ffb74d;
    --palette-error-main: #ff9800;
    --palette-error-dark: #f57c00;
    /** Info **/
    --palette-warning-light: #64b5f6;
    --palette-warning-main: #2196f3;
    --palette-warning-dark: #1976d2;
    /** Success **/
    --palette-success-light: #81c784;
    --palette-success-main: #4caf50;
    --palette-success-dark: #388e3c;
    /** Typography **/
    --palette-text-primary: rgba(0, 0, 0, 0.87);
    --palette-text-secondary: rgba(0, 0, 0, 0.54);
    --palette-text-disabled: rgba(0, 0, 0, 0.38);
    --palette-text-accent: #fff;
    /** Buttons **/
    --palette-action-active: rgba(0, 0, 0, 0.54);
    --palette-action-disabled: rgba(0, 0, 0, 0.26);
    --palette-action-hover: rgba(0, 0, 0, 0.04);
    --palette-action-disabledBackground: rgba(0, 0, 0, 0.12);
    --palette-action-selected: rgba(0, 0, 0, 0.08);
    /** Background **/
    --palette-background-default: #fafafa;
    --palette-background-paper: #fff;

    /** Divider **/
    --palette-divider: rgba(0, 0, 0, 0.12);

    /** webcomponents colors **/
    --paper-icon-button-ink-color: var(--palette-text-primary);

    --iron-icon-fill-color: var(--palette-text-primary);
    --paper-input-container-focus-color: var(--palette-primary-light);
    --paper-input-container-input-color: var(--palette-text-primary);
    --paper-checkbox-unchecked-background-color: var(--palette-action-disabled);
    --paper-checkbox-unchecked-color: var(--palette-action-disabled);
    --paper-checkbox-unchecked-ink-color: var(--palette-action-disabled);

    /**/
    --paper-checkbox-checkmark-color: var(--palette-text-accent);
    --paper-checkbox-label-color: rgb(195, 195, 195));
    --paper-checkbox-checked-color: var(--palette-primary-main);
    --paper-checkbox-checked-ink-color: var(--palette-primary-main);
    --paper-checkbox-label-checked-color: var(--palette-text-primary);
    --paper-checkbox-error-color: var(--palette-error-main);


    --paper-radio-button-checked-color: var(--palette-text-accent);
    --paper-radio-button-checked-ink-color: var(--palette-text-accent);
    --paper-radio-button-unchecked-color: var(--palette-action-disabled);
    --paper-radio-button-unchecked-ink-color: var(--palette-action-disabled);
    --paper-radio-button-label-color: var(--palette-primary-main);


    --dark-mode-shadow: 0 1px 3px 0 rgba(0, 0, 0, .3), 0 4px 8px 3px rgba(0, 0, 0, .15);
  }

  /** The dark theme. **/
  :host-context([theme="dark"]) {
    --palette-primary-accent: #424242;
    /** Typography **/
    --palette-text-primary: #fff;
    --palette-text-secondary: rgba(255, 255, 255, 0.7);
    --palette-text-disabled: rgba(255, 255, 255, 0.5);
    --palette-text-accent: #fafafa;
    /** Buttons **/
    --palette-action-active: #fff;
    --palette-action-disabled: rgba(255, 255, 255, 0.3);
    --palette-action-hover: rgba(255, 255, 255, 0.08);
    --palette-action-disabledBackground: rgba(255, 255, 255, 0.12);
    --palette-action-selected: rgba(255, 255, 255, 0.16);
    /** Background **/
    --palette-background-default: #303030;
    --palette-background-paper: #424242;
    /** Divider **/
    --palette-divider: rgba(255, 255, 255, 0.12);
  }
  
  :host-context(globular-login-box, globular-register-box){
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
  }

  :host-context(#toolbar) {
    --iron-icon-fill-color: var(--palette-text-accent);
  }

  :host-context(#overflow_menu_div) {
    --iron-icon-fill-color: var(--palette-text-primary);
  }

  div,span,h1,h2,h3 {
    font-family: var(--font-family);
  }

  paper-tabs {
    /* custom CSS property */
    --paper-tabs-selection-bar-color: var(--palette-primary-main);
  }

  paper-tabs {
    /* custom CSS property */
    --paper-tabs-selection-bar-color: var(--palette-primary-main);
  }

  paper-toggle-button {
    --paper-toggle-button-checked-button-color: var(--palette-primary-main);
    --paper-toggle-button-checked-bar-color:  var(--palette-primary-main);
    --paper-toggle-button-checked-ink-color: var(--palette-primary-main);
    --paper-toggle-button-unchecked-button-color: var(--palette-action-disabled);
    --paper-toggle-button-unchecked-bar-color:  var(--palette-action-disabled);
    --paper-toggle-button-unchecked-ink-color: var(--palette-action-disabled);
    --paper-toggle-button-label-color: var(--palette-action-disabled);
  }

  paper-radio-button {
    --paper-radio-button-checked-color: var(--palette-primary-main);
    --paper-radio-button-checked-ink-color: var(--palette-primary-main);
    --paper-radio-button-unchecked-color: var(--palette-action-disabled);
    --paper-radio-button-unchecked-ink-color: var(--palette-action-disabled);
    --paper-radio-button-label-color: var(--palette-action-disabled);
  }

  paper-radio-button[checked]{
    --paper-radio-button-label-color: var(--palette-text-accent);
  }

  paper-card {
    background-color: transparent;
    font-size: 1rem;
    text-align: left;
  }

  paper-button {
    font-size: 1rem;
  }

  paper-button iron-icon {
    --iron-icon-fill-color: var(--palette-text-primary);
  }

  paper-card .card-content{
    background-color: var(--palette-background-paper);
    color: var(--palette-text-primary);
  }

  ::-webkit-scrollbar {
    width: 8px;
    /* for vertical scrollbars */
    height: 8px;
    /* for horizontal scrollbars */
  }

  ::-webkit-scrollbar-track {
    background: rgba(0, 0, 0, 0.1);
  }

  ::-webkit-scrollbar-thumb {
    background: rgba(0, 0, 0, 0.5);
  }

  .setting {
    display: flex;
    color: var(--cr-primary-text-color);
    align-items: center;
    padding: 15px 16px 16px 16px;
  }


  .card-title {
    position: absolute;
    top: -40px;
    font-size: 1.25rem;
    text-transform: uppercase;
    color: var(--cr-primary-text-color);
    font-weight: 400;
    letter-spacing: .25px;
    margin-bottom: 12px;
    margin-top: var(--cr-section-vertical-margin);
    outline: none;
    padding-bottom: 4px;
    padding-top: 8px;
    background-color: var(--palette-background-default);
  }

  .card-actions {
    display: flex;
    justify-content: flex-end;
    align-items: center;
    font-size: 1rem;
  }

  .card-subtitle {
    padding: 48px;
    letter-spacing: .01428571em;
    font-family: Roboto, Arial, sans-serif;
    font-size: .875rem;
    font-weight: 400;
    line-height: 1.25rem;
    hyphens: auto;
    word-break: break-word;
    word-wrap: break-word;
    color: var(--cr-primary-text-color);
    flex-grow: 1;
  }

  /** Table element **/
  /** Simple table style **/
  table-element{
      /** Set max heigth to display the scroll**/
      max-height: 500px;
  
      /** Border */
      border-bottom: 1px solid var(--palette-divider);
      border-right: 1px solid var(--palette-divider);
  }
  
  .table-item{
      text-align: center;
      vertical-align: middle;
  }
  
  table-header-cell-element{
    border-right: 1px solid var(--palette-text-accent);
  }
  
  table-header-cell-element:last-child{
    border-right:none;
  }
  
  table-header-element{
      background-color: var(--palette-primary-accent);
      color: var(--palette-text-accent);
      font-size: 1rem;
  }
  
  table-header-cell-element{
      padding: 5px 10px 5px 10px;
      font-weight: 500;
      font-size: 1.1rem;
  }
  
  dropdown-menu-element{
    font-size: 1rem;
  }
  
  /** Sample style example. **/
  
  /** Tiles are grids **/
  .table-tile{
      /** Align item in table **/
      justify-items: center;
      align-items: center;
      border-left: 1px solid var(--palette-divider);
  }
  
  /** The cell container **/
  .table-item{
      width: 100%;
      height: 100%;
      padding: 0px;
      margin: 0px;
      font-size: 1rem;
  }
  
  
  /** The cell value div **/
  .table-item-value {
      
      border-right: 1px solid var(--palette-divider);
      border-top: 1px solid var(--palette-divider);
      /** Text align center and at middle by default **/
      text-align: center;
      vertical-align: middle;
      display: table-cell;
      height: 100%;
  }
  
  .inner-triangle{
      border-left: 10px solid transparent;
      border-right: 10px solid var(--palette-primary-accent);
      border-bottom: 10px solid transparent;
      height: 0;
      width: 0;
      position: absolute;
      right: 0px;
  }
  
  .inner-triangle:hover{
      cursor: pointer;
  }

  app-drawer-layout{
    --background:var(--palette-background-default);
  }

  emoji-picker {
    width: 400px;
    height: 300px;

    --background:var(--palette-background-default);
    --button-hover-background:var(--palette-background-paper);
    --border-color: var(--palette-background-paper);
    --input-border-color: var(--palette-background-paper);
    --input-font-color: var(--palette-text-primary);
    --indicator-color: var(--palette-primary-main);
    --input-border-radius: 2xp;
    --category-font-color:var(--palette-text-primary);
  }

`