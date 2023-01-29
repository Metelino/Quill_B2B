import { LightningElement, wire, track } from 'lwc';
import { 
    publish, 
    MessageContext ,
    subscribe,
    unsubscribe,
    APPLICATION_SCOPE
} from 'lightning/messageService';
import navbarChannel from '@salesforce/messageChannel/QuillNavbarChannel__c';
import cartChannel from '@salesforce/messageChannel/QuillCartUpdateChannel__c';
import { NavigationMixin, CurrentPageReference } from 'lightning/navigation';

import QUILL_LOGO from '@salesforce/resourceUrl/quill_logo';

import basePath from "@salesforce/community/basePath";

export default class QuillNavbar extends NavigationMixin(LightningElement) {
    subscription = null;
    brandUrl;

    @track
    storedProducts = {};

    @wire(CurrentPageReference) 
    currentPageReference

    @wire(MessageContext) 
    messageContext;

    get logoutUrl(){
        const sitePrefix = basePath.replace(/\/s$/i, "quillofficearticles");
        return sitePrefix + "/secur/logout.jsp";
    }

    get productsUrl(){
        const sitePrefix = basePath.replace(/\/s$/i, "quillofficearticles");
        return sitePrefix + "/products";
    }

    connectedCallback(){
        this.brandUrl = QUILL_LOGO;
    }

    subscribeToCartChannel() {
        if (!this.subscription) {
            this.subscription = subscribe(
                this.messageContext,
                cartChannel,
                (message) => {
                    this.getStoredProducts();
                },
                { scope: APPLICATION_SCOPE }
            );
        }
    }

    unsubscribeToCartChannel() {
        unsubscribe(this.subscription);
        this.subscription = null;
    }

    searchProducts(e){
        if(e.key === 'Enter'){
            const searchText = e.currentTarget.value;
            if(this.currentPageReference.attributes.name === 'products__c'){
                const payload = {searchText : searchText}
                publish(this.messageContext, navbarChannel, payload);
            }else{
                this.navigateToProducts(searchText);
            }
        }
    }

    navigateToProducts(searchText){
        this[NavigationMixin.Navigate]({
            type: 'comm__namedPage',
            attributes: {
                name: 'products__c',
            },
            state: {
                searchText: searchText
            }
        });
    }

    navigateToOrderHistory(){
        this[NavigationMixin.Navigate]({
            type: 'comm__namedPage',
            attributes: {
                name: 'order_history__c',
            }
        });
    }
}