import { LightningElement, api} from 'lwc';

export default class QuillPricebookStandard extends LightningElement {
    pricebook;

    @api
    get standardBook(){
        return this.pricebook;
    }

    set standardBook(value){
        this.setAttribute('standardPricebook', value);
        this.pricebook = value ? 
            JSON.parse(JSON.stringify(value)) :
            null;
    }

    changeStandardPrice(e){
        const entryId = e.currentTarget.dataset.id;
        let value = e.currentTarget.value;
        if(value < 0){
            value = 0.01;
        }
        this.pricebook.PricebookEntries.records.find(({ Id }) => Id === entryId)
            .UnitPrice = e.currentTarget.value;
    }

    updatePricebook(){
        this.dispatchEvent(new CustomEvent('updatepricebook', {'detail': this.pricebook}));
    }
}