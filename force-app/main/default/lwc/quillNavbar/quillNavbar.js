import { LightningElement } from 'lwc';

import QUILL_LOGO from '@salesforce/resourceUrl/quill_logo';

export default class QuillNavbar extends LightningElement {
    brandUrl;

    connectedCallback(){
        this.brandUrl = QUILL_LOGO;
    }
}