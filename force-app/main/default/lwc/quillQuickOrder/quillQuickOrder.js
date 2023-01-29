import { LightningElement } from 'lwc';

export default class QuillQuickOrder extends LightningElement {
    numOfInputs = 5;

    get dummyCountList(){
        const arr = []
        for(let i=0; i<this.numOfInputs; i++){
            arr.push(i);
        }
        return arr;
    }
}