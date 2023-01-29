import { LightningElement, api, track} from 'lwc';

export default class QuillPricebookCustom extends LightningElement {
    @track
    pricebook;
    @track
    standardPricebook;

    @api
    get customBook(){
        return this.pricebook;
    }

    set customBook(value){
        this.setAttribute('customBook', value);
        this.pricebook = value ? 
            JSON.parse(JSON.stringify(value)) :
        null;
    }

    @api
    get standardBook(){
        return this.standardPricebook;
    }

    set standardBook(value){
        this.setAttribute('standardBook', value);
        this.standardPricebook = value ? 
            JSON.parse(JSON.stringify(value)) :
            null;
    }

    setDiscountTypeForAll(e){
        const checked = e.currentTarget.checked;
        // this.pricebook.PricebookEntries.records.forEach((entry)=> {
        //     entry.Is_Percent_Discount__c = checked;
        // });

        const event = new CustomEvent('change');
        const inputs = this.template.querySelectorAll('table[data-selected] tbody input[type="checkbox"]');
        inputs.forEach(input => {
            input.checked = checked;
            input.dispatchEvent(event);
        })   
    }

    setDiscountValueForAll(e){
        if(e.key === 'Enter'){
            const value = e.currentTarget.value;
            this.pricebook.PricebookEntries.records.forEach((entry)=> {
                entry.Discount__c = value;
            });

            const event = new CustomEvent('change');
            const inputs = this.template.querySelectorAll('table[data-selected] tbody input[type="number"]');
            inputs.forEach(input => {
                input.value = value;
                input.dispatchEvent(event);
            })
        }
    }

    roundValue(val){
        return Math.ceil(val * 100) / 100;
    }

    changeDiscountType(e){
        const entryId = e.currentTarget.dataset.id;
        const input = e.currentTarget.parentNode.parentNode.querySelector('input[type="number"]');
        
        const entry = this.pricebook.PricebookEntries.records.find(({ Id }) => Id === entryId);
        entry.Is_Percent_Discount__c = e.currentTarget.checked;
        
        const standardPrice = this.standardPricebook.PricebookEntries.records.find(
            ({ Product2Id }) => Product2Id === entry.Product2Id
        ).UnitPrice;

        let value = parseFloat(input.value);
        if(entry.Is_Percent_Discount__c && value >= 100){
            value = 99.99;
            // entry.Discount__c = 99.99;
            // input.value = 99.99;
        }else if(value >= standardPrice){
            value = standardPrice - 0.01;
            //entry.Discount__c = standardPrice - 0.01;
            //input.value = this.roundValue(standardPrice - 0.01)
        }

        entry.Discount__c = value.toFixed(2);
        this.recalculatePrice(entry, standardPrice);
    }

    changeDiscountValue(e){
        const entryId = e.currentTarget.dataset.id;
        let value = parseFloat(e.currentTarget.value);

        const entry = this.pricebook.PricebookEntries.records.find(({ Id }) => Id === entryId);
        const standardPrice = this.standardPricebook.PricebookEntries.records.find(
            ({ Product2Id }) => Product2Id === entry.Product2Id
        ).UnitPrice;

        if(!value){
            value = 0;
        }else if(value < 0){
            value = 0;
        }else if(entry.Is_Percent_Discount__c && value >= 100){
            value = 99.99;
        }else if(!entry.Is_Percent_Discount__c && value >= standardPrice){
            value = standardPrice - 0.01;
        }

        entry.Discount__c = value.toFixed(2);

        this.recalculatePrice(entry, standardPrice);
    }

    recalculatePrice(entry, standardPrice){
        if(entry.Is_Percent_Discount__c){
           entry.UnitPrice = 
                (1 - entry.Discount__c / 100) * standardPrice;
        }else{
            entry.UnitPrice = 
                standardPrice - entry.Discount__c;
        }
        //entry.UnitPrice = Math.ceil(entry.UnitPrice * 100) / 100;
        entry.UnitPrice = (entry.UnitPrice).toFixed(2);
        console.log(entry.UnitPrice);
    }

    updatePricebook(){
        this.dispatchEvent(new CustomEvent('updatepricebook', {'detail': this.pricebook}));
    }
}