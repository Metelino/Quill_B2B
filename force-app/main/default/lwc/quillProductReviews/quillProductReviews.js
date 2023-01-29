import { LightningElement, api} from 'lwc';

import getReviews from '@salesforce/apex/Quill_ProductReviewController.getReviews';

export default class QuillProductReviews extends LightningElement {
    @api productId;

    isLoading = false;
    reviews = [];
    filteredReviews = [];

    connectedCallback(){
        this.isLoading = true;

         getReviews({
            productId: String(this.productId)
        })
        .then(data => {
            const revs = JSON.parse(data);
            
            this.reviews = revs;
            this.filteredReviews = revs; 
        })
        .catch(error => {
            this.showQuillNotification('error', error.body.message);
        })
        .finally(() => {
            this.isLoading = false;
        })
    }

    toggleImageReviews(e){
        const checked = e.currentTarget.checked;
        if(checked){
            this.filteredReviews = this.reviews.filter(rev => rev.files.length > 0);
        }else{
            this.filteredReviews = this.reviews;
        }
    }

    showQuillNotification(variant, message){
        this.template
        .querySelector("c-quill-toast")
        .showToast(variant, message);
    }

}