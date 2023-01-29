import { LightningElement, track } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

import getPricebooks from '@salesforce/apex/Quill_PriceBookManager.getPricebooks';
import setPricebookActive from '@salesforce/apex/Quill_PriceBookManager.setPricebookActive';
import getStandardPricebook from '@salesforce/apex/Quill_PriceBookManager.getStandardPricebook';
import updateStandardPricebook from '@salesforce/apex/Quill_PriceBookManager.updateStandardPricebook';
import updatePricebook from '@salesforce/apex/Quill_PriceBookManager.updatePricebook';
import createNewPriceBook from '@salesforce/apex/Quill_PriceBookManager.createNewPriceBook';
import deletePricebook from '@salesforce/apex/Quill_PriceBookManager.deletePricebook';

export default class QuillDiscountManagerTab extends LightningElement {
    isLoading = false;

    @track
    pricebooks = [];
    standardPricebook;
    selectedPricebook;

    get selectedPricebookName(){
        if(this.selectedPricebook){
            return 'Selected Pricebook: ' + this.selectedPricebook.Name;
        }
        return 'Selected Pricebook';
    }
    
    async connectedCallback(){
        this.isLoading = true;
        
        try{
            const [pricebooks, standardPricebook] = await Promise.all([getPricebooks(), getStandardPricebook()]);
            this.pricebooks = JSON.parse(pricebooks);
            this.pricebooks.forEach(pricebook => {pricebook.PricebookEntries = pricebook.PricebookEntries || []});
            this.standardPricebook = JSON.parse(standardPricebook);
        }catch(error){
            console.error(error.message);
            this.showNotification('Error', error, 'error');
        }finally{
            this.isLoading = false;
        }

    }

    // reloadPricebooks(){
    //     this.isLoading = true;
    //     getPricebooks()
    //     .then(data => {
    //         this.pricebooks = JSON.parse(data);
    //     })
    //     .finally(() => {
    //         this.isLoading = false;
    //     })
    // }

    // changeStandardPrice(e){
    //     const entryId = e.currentTarget.dataset.id;
    //     let value = e.currentTarget.value;
    //     if(value < 0){
    //         value = 0.01;
    //     }
    //     this.standardPricebook.PricebookEntries.records.find(({ Id }) => Id === entryId)
    //         .UnitPrice = e.currentTarget.value;
    // }

    // setDiscountTypeForAll(e){
    //     const checked = e.currentTarget.checked;
    //     this.selectedPricebook.PricebookEntries.records.forEach((entry)=> {
    //         entry.Is_Percent_Discount__c = checked;
    //     });

    //     const event = new Event('change');
    //     const inputs = this.template.querySelectorAll('table[data-selected] tbody input[type="checkbox"]');
    //     inputs.forEach(input => {
    //         input.checked = checked;
    //         input.dispatchEvent(event);
    //     })   
    // }

    // setDiscountValueForAll(e){
    //     if(e.key === 'Enter'){
    //         const value = e.currentTarget.value;
    //         this.selectedPricebook.PricebookEntries.records.forEach((entry)=> {
    //             entry.Discount__c = value;
    //         });

    //         const event = new Event('change');
    //         const inputs = this.template.querySelectorAll('table[data-selected] tbody input[type="number"]');
    //         inputs.forEach(input => {
    //             input.value = value;
    //             input.dispatchEvent(event);
    //         })
    //     }
    // }

    // changeDiscountType(e){
    //     const entryId = e.currentTarget.dataset.id;
    //     const input = e.currentTarget.parentNode.parentNode.querySelector('input[type="number"]');
        
    //     const entry = this.selectedPricebook.PricebookEntries.records.find(({ Id }) => Id === entryId);
    //     entry.Is_Percent_Discount__c = e.currentTarget.checked;
        
    //     const standardPrice = this.standardPricebook.PricebookEntries.records.find(
    //         ({ Product2Id }) => Product2Id === entry.Product2Id
    //     ).UnitPrice;

    //     const value = parseFloat(input.value);
    //     if(entry.Is_Percent_Discount__c && value >= 100){
    //         entry.Discount__c = 99.99;
    //         input.value = 99.99;
    //     }else if(value > standardPrice){
    //         entry.Discount__c = standardPrice - 0.01;
    //         input.value = standardPrice - 0.01;
    //     }

    //     this.recalculatePrice(entry, standardPrice);
    // }

    // changeDiscountValue(e){
    //     const entryId = e.currentTarget.dataset.id;
    //     let value = parseFloat(e.currentTarget.value);

    //     const entry = this.selectedPricebook.PricebookEntries.records.find(({ Id }) => Id === entryId);
    //     const standardPrice = this.standardPricebook.PricebookEntries.records.find(
    //         ({ Product2Id }) => Product2Id === entry.Product2Id
    //     ).UnitPrice;

    //     if(!value){
    //         value = 0;
    //     }else if(value < 0){
    //         value = 0;
    //     }else if(entry.Is_Percent_Discount__c && value >= 100){
    //         value = 99.99;
    //     }else if(!entry.Is_Percent_Discount__c && value >= standardPrice){
    //         value = standardPrice - 0.01;
    //     }

    //     entry.Discount__c = value;
    //     e.currentTarget.value = value;

    //     this.recalculatePrice(entry, standardPrice);
    // }

    // recalculatePrice(entry, standardPrice){
    //     if(entry.Is_Percent_Discount__c){
    //        entry.FinalPrice = 
    //             (1 - entry.Discount__c / 100) * standardPrice;
    //     }else{
    //         entry.FinalPrice = 
    //             standardPrice - entry.Discount__c;
    //     }
    //     entry.FinalPrice = Math.ceil(entry.FinalPrice * 100) / 100;
    // }

    // clearSelectedPricebook(){
    //     this.selectedPricebook = null;
    // }

    createPricebook(){
        this.isLoading = true;
        const pricebookName = this.template.querySelector('[name="pricebook-name"]');

        createNewPriceBook({
            pricebookName: pricebookName.value
        })
        .then((data) => {
            this.showNotification("Success", "Pricebook Added Successfully", 'success');
            this.pricebooks.push(JSON.parse(data));
        })
        .catch(error => {
            this.showNotification("Error", error.body.message, 'error');
        })
        .finally(()=>{
            this.isLoading = false;
        })
    }

    updateStandardPrices(e){
        this.standardPricebook = e.detail;
        const newPrices = {};
        for(let entry of this.standardPricebook.PricebookEntries.records){
            newPrices[entry.Id] = entry.UnitPrice;
        }

        this.isLoading = true;
        updateStandardPricebook({newPrices : newPrices})
        .then(() => {
            this.showNotification("Success", 'Standard Prices Updated', 'success');
            getPricebooks()
            .then(data => {
                this.pricebooks = JSON.parse(data);
                this.selectedPricebook = this.pricebooks.find(({Id}) => Id === this.selectedPricebook.Id);
            })
        })
        .catch(error => {
            this.showNotification("Error", error.body.message, 'error');
        })
        .finally(() => {
            this.isLoading = false;
        })
    }

    updateCustomPrices(e){
        this.selectedPricebook = e.detail;
        const discounts = {};
        const isPercentDiscount = {};
        try{
            for(let entry of this.selectedPricebook.PricebookEntries.records){
                discounts[entry.Id] = entry.Discount__c;
                isPercentDiscount[entry.Id] = entry.Is_Percent_Discount__c;
            }

            this.isLoading = true;
            updatePricebook({
                pricebookId : this.selectedPricebook.Id,
                discounts : discounts,
                isPercentDiscount : isPercentDiscount
            })
            .then(() => {
                this.showNotification("Success", 'Pricebook Updated', 'success');
            })
            .catch(error => {
                this.showNotification("Error", error.body.message, 'error');
            })
            .finally(() => {
                this.isLoading = false;
            })
        }catch(error){
            console.log(error.message);
        } 
    }

    delPricebook(e){
        const pricebookId = e.currentTarget.dataset.id;
        console.log(pricebookId);
        this.isLoading = true;
        deletePricebook({
            pricebookId: pricebookId
        })
        .then(() => {
            this.showNotification('Success', 'Pricebook Deleted', 'success');
            this.pricebooks = this.pricebooks.filter((pricebook) => pricebook.Id !== pricebookId);
        })
        .catch(error => {
            this.showNotification('Error', error.body.message, 'error');
        })
        .finally(() => {
            this.isLoading = false;
        })
    }

    setActivePricebook(e){
        const pricebookId = e.currentTarget.dataset.id;
        this.isLoading = true;
        setPricebookActive({pricebookId : pricebookId})
        .then(() => {
            this.showNotification('Success', 'Pricebook set as active', 'success');
            for(let i=0; i<this.pricebooks.length; i++){
                this.pricebooks[i].IsActive = false;
                if(this.pricebooks[i].Id === pricebookId){
                    this.pricebooks[i].IsActive = true;
                }
            }
        })
        .catch(error => {
            console.log(error.body.message);
            this.showNotification('Error', error.body.message, 'error');
        })
        .finally(() => {
            this.isLoading = false;
        })
    }

    selectPricebook(e){
        const pricebookId = e.currentTarget.dataset.id;
        const selectedPricebook = this.pricebooks.find(({ Id }) => Id === pricebookId);
        selectedPricebook.PricebookEntries.records = 
        selectedPricebook.PricebookEntries.records.map(entry => {
            entry.FinalPrice = entry.UnitPrice;
            return entry;
        })
        this.selectedPricebook = selectedPricebook;
        console.table(this.selectedPricebook);
        this.template.querySelector('lightning-tabset').activeTabValue = 'custom';
    }

    showNotification(title, message, variant) {
        const evt = new ShowToastEvent({
            title: title,
            message: message,
            variant: variant,
        });
        this.dispatchEvent(evt);
    }
}