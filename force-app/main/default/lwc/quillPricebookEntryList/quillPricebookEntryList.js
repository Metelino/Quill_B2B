import { LightningElement, api } from 'lwc';

export default class QuillPricebookEntryList extends LightningElement {
    @api
    customPricebook

    setDiscountTypeForAll(e){
        const checked = e.currentTarget.checked;
        this.customPricebook.PricebookEntries.records.forEach((entry)=> {
            entry.Is_Percent_Discount__c = checked;
        });

        const event = new Event('change');
        const inputs = this.template.querySelectorAll('table[data-selected] tbody input[type="checkbox"]');
        inputs.forEach(input => {
            input.checked = checked;
            input.dispatchEvent(event);
        })   
    }

    setDiscountValueForAll(e){
        if(e.key === 'Enter'){
            const value = e.currentTarget.value;
            this.customPricebook.PricebookEntries.records.forEach((entry)=> {
                entry.Discount__c = value;
            });

            const event = new Event('change');
            const inputs = this.template.querySelectorAll('table[data-selected] tbody input[type="number"]');
            inputs.forEach(input => {
                input.value = value;
                input.dispatchEvent(event);
            })
        }
    }

    changeDiscountType(e){
        const entryId = e.currentTarget.dataset.id;
        const input = e.currentTarget.parentNode.parentNode.querySelector('input[type="number"]');
        
        const entry = this.customPricebook.PricebookEntries.records.find(({ Id }) => Id === entryId);
        entry.Is_Percent_Discount__c = e.currentTarget.checked;
        
        const standardPrice = this.standardPricebook.PricebookEntries.records.find(
            ({ Product2Id }) => Product2Id === entry.Product2Id
        ).UnitPrice;

        const value = parseFloat(input.value);
        if(entry.Is_Percent_Discount__c && value >= 100){
            entry.Discount__c = 99.99;
            input.value = 99.99;
        }else if(value > standardPrice){
            entry.Discount__c = standardPrice - 0.01;
            input.value = standardPrice - 0.01;
        }

        this.recalculatePrice(entry, standardPrice);
    }

    changeDiscountValue(e){
        const entryId = e.currentTarget.dataset.id;
        let value = parseFloat(e.currentTarget.value);

        const entry = this.customPricebook.PricebookEntries.records.find(({ Id }) => Id === entryId);
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

        entry.Discount__c = value;
        e.currentTarget.value = value;

        this.recalculatePrice(entry, standardPrice);
    }

    recalculatePrice(entry, standardPrice){
        if(entry.Is_Percent_Discount__c){
           entry.FinalPrice = 
                (1 - entry.Discount__c / 100) * standardPrice;
        }else{
            entry.FinalPrice = 
                standardPrice - entry.Discount__c;
        }
        entry.FinalPrice = Math.ceil(entry.FinalPrice * 100) / 100;
    }

    updateCustomPricebook(){
        this.dispatchEvent(new CustomEvent('updatecustom'));
    }

    updateStandardPricebook(){
        this.dispatchEvent(new CustomEvent('updatestandard'));
    }
}