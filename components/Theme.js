
let theme = `
  :host {
    --toolbar-height: 64px;
    --searchbox-height: 44px;
    /** Material design (default theme is light)  */
    /** colors **/
    --palette-primary-accent: #fff;
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
    --palette-text-accent: rgba(0, 0, 0, 1);
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
    --palette-primary-accent: #252525;
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
  
  paper-radio-button[checked]{
    --paper-radio-button-label-color: var(--palette-text-accent);
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
    color: var(--palette-text-primary);
    --paper-tab-ink: var(--palette-action-disabled);
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
    border-radius: 2px;
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
    padding-left: 8px;
  }

  .card-actions {
    display: flex;
    justify-content: flex-end;
    align-items: center;
    font-size: 1rem;
    border-color: var(--palette-divider);
    background-color: var(--palette-background-paper);
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

  .blog-post-editor-div, .blog-post-reader-div{
    background-color: var(--palette-background-paper);
    color: var(--palette-text-primary);
  }

  .no-select {
    user-select: none;
  }

  #search-bar iron-icon {
    --iron-icon-width: 36px;
  }

  #title img {
    height: 24px;
    margin-right: 10px;
    margin-left: 10px;
  }

  paper-button{
    font-size: 1rem;
  }

  paper-tooltip {
    --paper-tooltip: {
      font-size: 1rem;
    }
  }

`

let theme_mobile = `

/** Mobile specific display **/
iron-icon, paper-icon-button, paper-button, .menu-btn, .side_menu_btn, .application_icon{
    width: 48px;
    height: 48px;
}

#title img {
  height: 48px;
  width: 48px;
}

paper-button{
  font-size: 1.8rem;
}

paper-tooltip {
  --paper-tooltip: {
    font-size: 1rem;
  }
}


`
// Append the mobile check function into the window object.
window.mobileCheck = function () {
  let check = false;
  (function (a) { if (/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(a) || /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0, 4))) check = true; })(navigator.userAgent || navigator.vendor || window.opera);
  return check;
};

// Return the theme...
export let getTheme = () => {
  if (!window.mobileCheck()) {
    return theme
  }

  // append 
  return theme + theme_mobile
}