import { LightningElement } from 'lwc';

import QUILL_WOOD from '@salesforce/resourceUrl/quill_wood';

export default class QuillFooter extends LightningElement {
    backgroundStyle;

    connectedCallback(){
        this.backgroundStyle = `
            background: url(${QUILL_WOOD});
            opacity: 0.75;
            width: 100%; 
            padding: 1em 15vw;
        `
    }
}