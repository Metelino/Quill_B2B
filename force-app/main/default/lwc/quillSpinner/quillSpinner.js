import { LightningElement, api } from "lwc";

export default class QuillSpinner extends LightningElement {
  @api position;
  style;

  connectedCallback() {
    let position;
    if (this.position) {
      position = this.position;
    } else {
      position = "fixed";
    }
    this.style = `
            top:0px; 
            bottom:0px; 
            left:0px; 
            right:0px; 
            position: ${position}; 
            backdrop-filter: 
            blur(8px); 
            z-index: 1000;
        `;
  }
}
