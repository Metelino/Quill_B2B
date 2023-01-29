import { LightningElement, api } from 'lwc';
import { NavigationMixin } from 'lightning/navigation';

export default class QuillProductTile extends NavigationMixin(LightningElement) {
    @api product;
    //imgStyle = '';
    standardPrice;
    discountPrice;

    connectedCallback(){
        this.discountPrice = null;
        const prices = this.product.PricebookEntries.records;
        this.standardPrice = prices[0];
        if(prices[0].UnitPrice !== prices[1].UnitPrice){
            this.discountPrice = prices[1];
        }
        
        // if(prices[0].UnitPrice == prices[1].UnitPrice){
        //     this.price = prices[0].UnitPrice;
        //     this.discountPrice = null;
        // }
        // else if(prices[0].UnitPrice > prices[1].UnitPrice){
        //     this.price = prices[0].UnitPrice;
        //     this.discountPrice = prices[1].UnitPrice;
        // }else{
        //     this.price = prices[1].UnitPrice;
        //     this.discountPrice = prices[0].UnitPrice;
        // }
        //this.price = this.product.PricebookEntries.records[0].UnitPrice;

        // this.imgStyle = `background: url(${this.product.DisplayUrl}); 
        //     background-position: center; 
        //     background-size: 100% 100%;
        //     width: 200px; height: 200px;
        //     align-self: center;`;
        //     // margin: 1em;`;
    }

    get imgStyle(){
        return `background: url(${this.product.DisplayUrl}); 
            background-position: center; 
            background-size: 100% 100%;
            width: 200px; height: 200px;
            align-self: center;`
    }

    navigateToDetail(){
        this[NavigationMixin.Navigate]({
            type: 'comm__namedPage',
            attributes: {
                name: 'Product_Detail__c',
            },
            state: {
                productId: this.product.Id
            }
        });
    }

}