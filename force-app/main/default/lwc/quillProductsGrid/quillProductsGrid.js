import { LightningElement, wire } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { CurrentPageReference } from 'lightning/navigation';

import {
    subscribe,
    unsubscribe,
    APPLICATION_SCOPE,
    MessageContext
} from 'lightning/messageService';
import navbarChannel from '@salesforce/messageChannel/QuillNavbarChannel__c';

// import getAllProducts from '@salesforce/apex/Quill_ProductsController.getAllProducts';
import getProductFamilies from '@salesforce/apex/Quill_ProductsController.getProductFamilies';
import getFilteredProducts from '@salesforce/apex/Quill_ProductsController.getFilteredProducts';

export default class QuillProductsGrid extends LightningElement {
    searchText = '';
    subscription = null;
    products = [];
    isLoading = false;
    categories = [];

    @wire(CurrentPageReference)
    currentPageReference;

    @wire(MessageContext)
    messageContext;

    connectedCallback(){
        this.subscribeToMessageChannel();
        this.searchText = this.currentPageReference.state.searchText;

        this.isLoading = true;
        let getProducts = getFilteredProducts({
            searchText: this.searchText,
            families: []
        });
        let getFamilies = getProductFamilies();

        Promise.all(
            [getProducts, getFamilies]
        )
        .then(data => {
            this.products = JSON.parse(data[0]);
            this.categories = JSON.parse(data[1]);
        })
        .catch(error => {
            this.showNotification('Error', error.body.message, 'warning');
        })
        .finally(() => {
            this.isLoading = false;
        })
        
    }

    disconnectedCallback() {
        this.unsubscribeToMessageChannel();
    }

    subscribeToMessageChannel() {
        if (!this.subscription) {
            this.subscription = subscribe(
                this.messageContext,
                navbarChannel,
                (message) => {
                    this.searchText = message.searchText
                    this.filterProducts();
                },
                { scope: APPLICATION_SCOPE }
            );
        }
    }

    unsubscribeToMessageChannel() {
        unsubscribe(this.subscription);
        this.subscription = null;
    }

    showNotification(title, message, variant) {
        const evt = new ShowToastEvent({
            title: title,
            message: message,
            variant: variant
        });
        this.dispatchEvent(evt);
    }

    filterProducts(e){
        console.log(this.searchText);
        const inputs = this.template.querySelector('form').elements;
        //let inputs = e.currentTarget.elements;
        let pickedCategories = [];
        console.log(inputs);
        for(let cat of inputs){
            if(cat.checked){
                pickedCategories.push(cat.value);
            }
        }

        this.isLoading = true;
        getFilteredProducts({
            searchText: this.searchText,
            families: pickedCategories
        })
        .then(data => {
            this.products = JSON.parse(data);
        })
        .catch(error => {
            this.showNotification('Error', error.body.message, 'warning');
        })
        .finally(() => {
            this.isLoading = false;
        })

    }

    get searchedText(){
        if(this.searchText){
            return this.searchText
        }
        return 'Not Specified';
    }
}