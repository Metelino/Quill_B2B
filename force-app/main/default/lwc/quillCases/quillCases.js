import { LightningElement, api } from 'lwc';

import getUserCases from '@salesforce/apex/Quill_OrderController.getUserCases';

export default class QuillCases extends LightningElement {
    isLoading = false;
    cases = [];

    async connectedCallback(){
        this.isLoading = true;
        try{
            const cases = await getUserCases();
            this.cases = JSON.parse(cases);
            this.cases.forEach(c => {c.CaseComments = c.CaseComments || []});
        }catch(error){
            console.log(error.body.message);
            this.showQuillNotification('error', error.body.message);
        }finally{
            this.isLoading = false;
        }
    }

    showQuillNotification(variant, message){
        this.template
        .querySelector("c-quill-toast")
        .showToast(variant, message);
    }

    @api
    refreshCases(){
        this.connectedCallback();
    }
}