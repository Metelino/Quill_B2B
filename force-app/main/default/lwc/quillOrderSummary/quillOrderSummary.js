import { LightningElement, wire } from 'lwc';
import { NavigationMixin } from 'lightning/navigation';

import makeOrder from '@salesforce/apex/Quill_OrderController.makeOrder';

import { publish, MessageContext } from 'lightning/messageService';
import cartChannel from '@salesforce/messageChannel/QuillCartUpdateChannel__c';

export default class QuillOrderSummary extends NavigationMixin(LightningElement) {
    products;
    totalPrice;
    isLoading = false;
    doesShowSummary = false;
    isConfirmed = false;
    isRecurringOrder = false;

    @wire(MessageContext) 
    messageContext;

    connectedCallback(){
        this.getStoredProducts();
    }

    get productsList(){
        let prodList = [...Object.values(this.products)];
        this.totalPrice = 0;

        prodList = prodList.map((item => {
            const newItem = {...item};
            const price = item.product.PricebookEntries.records[0].UnitPrice;
            newItem.price = price
            newItem.total = Math.ceil(price * item.amount * 100) / 100;
            this.totalPrice += newItem.total;
            return newItem;
        }))
        this.totalPrice = Math.ceil(this.totalPrice * 100) / 100;
        return prodList;
    }

    getStoredProducts(){
        const products = JSON.parse(localStorage.getItem('products'));
        if(!products){
            this.products = {};
        }else{
            this.products = products;
        }
        console.log(products);
    }

    setRecurringOrder(e){
        this.isRecurringOrder = e.target.checked;
    }

    makeNewOrder(){
        const productAmountMap = {};
        for(let key of Object.keys(this.products)){
            productAmountMap[key] = this.products[key].amount;
        }

        this.isLoading = true;
        makeOrder({
            products : productAmountMap,
            isRecurringOrder: this.isRecurringOrder
        })
        .then(() => {
            console.log('Order Made');
            localStorage.setItem('products', '{}');
            publish(this.messageContext, cartChannel, {});
            this.isConfirmed = true;

            //this.navigateToAfterOrder();
        })
        .catch(err => {
            console.log(err.body.message);
        })
        .finally(() => {
            this.isLoading = false;
        })
    }

    closeSummary(){
        this.doesShowSummary = false;
    }

    showSummary(){
        this.doesShowSummary = true;
    }

    navigateToAccount(){
        this[NavigationMixin.GenerateUrl]({
            type: 'comm__namedPage',
            attributes: {
                name: 'order_history__c',
            }
        })
        .then((url) => {
            window.location.replace(url);
            window.location.reload();
        });
    }

    // navigateToAfterOrder(){
    //     this[NavigationMixin.GenerateUrl]({
    //         type: 'comm__namedPage',
    //         attributes: {
    //             name: 'after_order__c',
    //         }
    //     })
    //     .then((url) => {
    //         window.location.replace(url);
    //         window.location.reload();
    //     });
    // }
}