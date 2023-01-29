import { LightningElement, track } from 'lwc';
import { NavigationMixin } from 'lightning/navigation';

import getUserRecurringOrders from '@salesforce/apex/Quill_OrderController.getUserRecurringOrders';
import cancelRecurringOrder from '@salesforce/apex/Quill_OrderController.cancelRecurringOrder';

export default class QuillRecurringOrders extends NavigationMixin(LightningElement) {
    isLoading = false;
    @track
    recurringOrders = [];
    isModalShown = false;
    recurringOrderId;
    
    async connectedCallback(){
        this.isLoading = true;
        try{
            const recurringOrders = await getUserRecurringOrders();
            this.recurringOrders = JSON.parse(recurringOrders);
        }catch(error){
            console.log(error.body.message);
        }finally{
            this.isLoading = false;
        }
    }

    cancelRecurringOrder(e){
        this.isLoading = true;
        cancelRecurringOrder({
            orderId: this.recurringOrderId
        })
        .then(() => {
            const order = this.recurringOrders.find(
                ({Id}) => Id === this.recurringOrderId
            );
            console.log(order);
            try{
                order.Is_Recurring_Order_Active__c = false;
            }catch(error){
                console.log(e.message);
            }
            
            this.showQuillNotification('success', 'Subscription Cancelled Successfully');
        })
        .catch((error) => {
            console.log('Nie dziala:' + error.body.message);
            this.showQuillNotification('error', error.body.message);
        })
        .finally(() => {
            this.isLoading = false;
            this.isModalShown = false;
        })
    }

    showModal(e){
        this.recurringOrderId = e.currentTarget.dataset.id;
        console.log(e.currentTarget.dataset.id);
        this.isModalShown = true;
    }

    closeModal(){
        this.isModalShown = false;
    }

    showQuillNotification(variant, message){
        this.template
        .querySelector("c-quill-toast")
        .showToast(variant, message);
    }
    
}