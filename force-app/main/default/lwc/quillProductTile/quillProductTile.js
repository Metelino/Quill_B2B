import { LightningElement, api } from 'lwc';
import { NavigationMixin } from 'lightning/navigation';

export default class QuillProductTile extends NavigationMixin(LightningElement) {
    @api product;
    imgStyle = '';
    price;

    renderedCallback(){
        this.price = this.product.PricebookEntries.records[0].UnitPrice;
        this.imgStyle = `background: url(${this.product.DisplayUrl}); 
        background-position: center; 
        background-size: 100% 100%;
        width: 200px; height: 200px;
        margin: 1em;`
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