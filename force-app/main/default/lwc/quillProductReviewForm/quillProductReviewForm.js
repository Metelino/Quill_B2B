import { LightningElement, track, api } from 'lwc';

import getUserReview from '@salesforce/apex/Quill_ProductReviewController.getUserReview';
import updateReview from '@salesforce/apex/Quill_ProductReviewController.updateReview';
import deleteReview from '@salesforce/apex/Quill_ProductReviewController.deleteReview';


export default class QuillProductReviewForm extends LightningElement {
    @api productId;
    isLoading = false;
    @track userReview;
    @track newFiles;
    newUserReview = {};
    editDisabled = true;
    submitDisabled = true;

    connectedCallback(){
        this.isLoading = true;

        getUserReview({
            productId: String(this.productId)
        })
        .then(data => {
            const userRev = JSON.parse(data);
            
            this.userReview = userRev;
            if(this.userReview){
                this.newUserReview = userRev.review;
            }else{
                this.newUserReview = {};
            }
            
        })
        .catch(error => {
            this.showQuillNotification('error', error.body.message);
        })
        .finally(() => {
            this.isLoading = false;
        })
    }

    get displayUserReview(){
        return this.userReview && this.editDisabled;
    }

    setReviewText(e){
        this.newUserReview.Review_Text__c = e.target.value;
        if(this.newUserReview.Review_Text__c){
            this.submitDisabled = false;
        }else{
            this.submitDisabled = true;
        }
    }

    toggleEditor(){
        if(!this.editDisabled){
            this.updateRev();
        }else{
            this.editDisabled = false;
        }
        
        this.submitDisabled = true;
    }

    cancelReview(){
        this.editDisabled = true;
        if(this.userReview){
            this.newUserReview = JSON.parse(JSON.stringify(this.userReview.review));
        }else{
            this.newUserReview = {};
        }
    }

    async updateRev(){
        this.isLoading = true;
        let newReview;

        if(this.newUserReview.Id){
            newReview = {
                Product__c : this.productId,
                Id: this.newUserReview.Id,
                Review_Text__c: this.newUserReview.Review_Text__c
            }
        }else{
            newReview = {
                Product__c : this.productId,
                Review_Text__c: this.newUserReview.Review_Text__c
            }
        }

        try{
            const userReview = await updateReview({
                newReview : newReview,
                filesData : this.newFiles
            });
            this.userReview = JSON.parse(userReview);
            this.newUserReview = JSON.parse(JSON.stringify(this.userReview.review));
            
        }catch(error){
            console.log(error.body.message);
            this.showQuillNotification('error', error.body.message);
        }finally{
            this.editDisabled = true;
            this.isLoading = false;
        }

    }

    deleteRev(){
        this.isLoading = true;
        if(this.userReview){
            deleteReview({
                reviewId: this.userReview.review.Id
            })
            .then(() => {
                this.userReview = null;
                this.newUserReview = {};
                this.showQuillNotification('success', 'Review Has Been Deleted');
            })
            .catch(error => {
                this.showQuillNotification('error', error.body.message);
            })
            .finally(() => {
                this.isLoading = false;
            })
        }
    }

    handleNewFiles(e){
        console.log('Number Of Files: ' + e.target.files.length);
        if(e.target.files.length > 0) {
            this.newFiles = [];
            for(let file of e.target.files){
                const reader = new FileReader();
                reader.onload = () => {
                    let base64 = reader.result.split(',')[1];
                    this.newFiles.push({
                        'url': 'data:image/png;base64, ' + base64,
                        'fileName': file.name,
                        'base64': base64
                    });
                    console.log(this.newFiles);
                }
                
                reader.readAsDataURL(file);
            }  
            this.submitDisabled = false;
        }
    }

    showQuillNotification(variant, message){
        this.template
        .querySelector("c-quill-toast")
        .showToast(variant, message);
    }
}