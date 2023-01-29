import { LightningElement, wire } from 'lwc';
import { CurrentPageReference } from 'lightning/navigation';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { publish, MessageContext } from 'lightning/messageService';

import getProductDetail from '@salesforce/apex/Quill_ProductsController.getProductDetail';
import getProductImages from '@salesforce/apex/Quill_ProductImagesController.getProductImages';
import cartChannel from '@salesforce/messageChannel/QuillCartUpdateChannel__c';

export default class QuillProductDetail extends LightningElement {
    productId;
    isLoading = false;
    product = {};
    price;
    images = [];
    currentImage;
    isProductInStorage = true;

    @wire(MessageContext) 
    messageContext;

    @wire(CurrentPageReference)
    currentPageReference;

    connectedCallback() {
        this.productId = this.currentPageReference.state.productId;

        const products = JSON.parse(localStorage.getItem('products'));
        this.isProductInStorage = this.productId in products; 

        let getImages = getProductImages({
            productId: this.productId
        });
        let getDetail = getProductDetail({
            productId: this.productId
        });

        this.isLoading = true;
        Promise.all([getImages, getDetail])
        .then(data => {
            let images = JSON.parse(data[0]);
            this.product = JSON.parse(data[1]);
            this.price = this.product.PricebookEntries.records[0].UnitPrice;
            this.currentImage = this.product.DisplayUrl;
            images = images.map(image => ({
                ...image, 
                imageStyle : `
                background: url(${image.ContentDownloadUrl});
                background-position: center; 
                background-size: 100% 100%;
                width: 100px; height: 100px;
                `}));
            this.images = images;
        })
        .catch(e => {
            this.showNotification('Error', e.body.message, 'error');
        })
        .finally(() => {
            this.isLoading = false;
        })
    }

    get showImages(){
        return this.images.length >= 1;
    }

    showNotification(title, message, variant) {
        const evt = new ShowToastEvent({
            title: title,
            message: message,
            variant: variant,
        });
        this.dispatchEvent(evt);
        console.log("INSIDE TOAST");
    }

    showQuillNotification(variant, message){
        this.template
        .querySelector("c-quill-toast")
        .showToast(variant, message);
    }

    setPrimaryImage(e){
        const imageUrl = e.currentTarget.dataset.imageUrl;
        this.currentImage = imageUrl;
    }

    addProductToStorage(){
        let products = JSON.parse(localStorage.getItem('products'));

        if(!products){
            products = {};
        }

        if(this.productId in products){
            this.showQuillNotification('info', "Product Is Already In Cart");
            return;
        }

        products[this.product.Id] = {amount: 1, product: this.product};
        localStorage.setItem('products', JSON.stringify(products));
        this.isProductInStorage = true;
        this.updateCart();
        this.showQuillNotification('success', "Product Has Been Added To Cart");
    }

    updateCart(){
        publish(this.messageContext, cartChannel, {});
    }
}