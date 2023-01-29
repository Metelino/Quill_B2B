import { LightningElement } from 'lwc';

export default class QuillAccount extends LightningElement {
    refreshCases(){
        this.template.querySelector('c-quill-cases').refreshCases();
    }
}