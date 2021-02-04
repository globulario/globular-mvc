
export let theme = `:host{

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
    --iron-icon-fill-color:  var(--palette-text-primary);
    --paper-input-container-focus-color:  var(--palette-primary-light);
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
  
    --dark-mode-shadow: 0 1px 3px 0 rgba(0, 0, 0, .3), 0 4px 8px 3px rgba(0, 0, 0, .15);
  }
  
  /** The dark theme. **/
  :host-context([theme="dark"]){
    --palette-primary-accent: #424242;
  
    /** Typography **/
    --palette-text-primary: #fff;
    --palette-text-secondary:rgba(255, 255, 255, 0.7);
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
  
  /* if the icon are in the toolbar */
  :host-context(#toolbar){
    --iron-icon-fill-color: var(--palette-text-accent);
  }
  
  /* if the icon are in the overflow menu */
  :host-context(#overflow_menu_div){
    --iron-icon-fill-color: var(--palette-text-primary);
  }
  
  div, span, h1, h2, h3{
    font-family: var(--font-family);
  }
  
  paper-card{
    background-color: transparent;
  }
  
  paper-button iron-icon{
    --iron-icon-fill-color: var(--palette-text-primary);
  }
  
  paper-card div{
    background-color: var(--palette-background-paper);
    color: var(--palette-text-primary);
  }
  
  ::-webkit-scrollbar
  {
    width: 8px;  /* for vertical scrollbars */
    height: 8px; /* for horizontal scrollbars */
  }
  
  ::-webkit-scrollbar-track
  {
    background: rgba(0, 0, 0, 0.1);
  }
  
  ::-webkit-scrollbar-thumb
  {
    background: rgba(0, 0, 0, 0.5);
  }
  .setting {
    display: flex;
    color: var(--cr-primary-text-color);
    align-items: center;
    padding: 15px 16px 16px 16px;
  }

  @media only screen and (max-width: 600px) {
    .setting{
      flex-direction: column;
      align-items: self-start;
      flex-basis: 0px;
    }
  }

  `;
  