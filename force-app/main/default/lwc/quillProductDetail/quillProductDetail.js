import { LightningElement, wire } from 'lwc';
import { CurrentPageReference } from 'lightning/navigation';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

import getProductDetail from '@salesforce/apex/Quill_ProductsController.getProductDetail';
import getProductImages from '@salesforce/apex/Quill_ProductImagesController.getProductImages';

export default class QuillProductDetail extends LightningElement {
    productId;
    isLoading = false;
    product = {};
    price;
    images = [];
    currentImage;

    @wire(CurrentPageReference)
    currentPageReference;

    connectedCallback() {
        // this.productId = this.getQueryProductId();
        this.productId = this.currentPageReference.state.productId;
        console.log(this.productId);

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
            for(let image of images){
                console.log(image.Id);
            }
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
        return this.images.length > 1;
    }

    showNotification(title, message, variant) {
        const evt = new ShowToastEvent({
            title: title,
            message: message,
            variant: variant
        });
        this.dispatchEvent(evt);
    }

    setPrimaryImage(e){
        const imageUrl = e.currentTarget.dataset.imageUrl;
        this.currentImage = imageUrl;
    }

    // getQueryProductId() {
    //     let params;
    //     let search = location.search.substring(1);

    //     if (search) {
    //         params = JSON.parse('{"' + search.replace(/&/g, '","').replace(/=/g, '":"') + '"}', (key, value) => {
    //             return key === "" ? value : decodeURIComponent(value)
    //         });
    //     }

    //     return params[0];
    // }
}