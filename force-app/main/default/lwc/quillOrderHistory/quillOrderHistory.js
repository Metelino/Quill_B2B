import { LightningElement, track } from "lwc";
import { NavigationMixin } from "lightning/navigation";

import getUserOrders from "@salesforce/apex/Quill_OrderController.getUserOrders";
import createCase from "@salesforce/apex/Quill_OrderController.createCase";

export default class QuillOrderHistory extends NavigationMixin(
  LightningElement
) {
  orders = [];
  isLoading = false;
  isModalLoading = false;

  @track
  caseOrder;

  async connectedCallback() {
    this.isLoading = true;
    try {
      const orders = await getUserOrders();
      this.orders = JSON.parse(orders);
    } catch (error) {
      console.log(error.message);
    } finally {
      this.isLoading = false;
    }
  }

  navigateToDetail(e) {
    const productId = e.currentTarget.dataset.id;
    this[NavigationMixin.Navigate]({
      type: "comm__namedPage",
      attributes: {
        name: "Product_Detail__c"
      },
      state: {
        productId: productId
      }
    });
  }

  openCaseModal(e) {
    const orderId = e.target.dataset.id;
    const caseOrder = this.orders.find(({ Id }) => Id === orderId);
    const productOptions = [];

    for (let prod of caseOrder.OrderItems.records) {
      productOptions.push({
        label: prod.Product2.Name,
        value: prod.Product2.Id
      });
    }

    caseOrder.productOptions = productOptions;
    this.caseOrder = caseOrder;
  }

  caseFormChange(event) {
    this.caseOrder[event.target.name] = event.target.value;
  }

  get isSaveOrderDisabled() {
    return !this.caseOrder.subject || !this.caseOrder.description;
  }

  placeCase() {
    this.isLoading = true;

    const newCase = {
      Subject: this.caseOrder.subject,
      Description: this.caseOrder.description,
      ProductId: this.caseOrder.product,
      Order__c: this.caseOrder.Id
    };

    createCase({
      newCase: newCase
    })
      .then(() => {
        //const newCase = JSON.parse(data);
        this.caseOrder = null;
        this.showQuillNotification("success", "Case Has Been Placed");
        this.dispatchEvent(new CustomEvent("refresh"));
      })
      .catch((error) => {
        this.showQuillNotification("error", error.body.message);
      })
      .finally(() => {
        this.isLoading = false;
      });
  }

  closeCaseModal() {
    this.caseOrder = null;
  }

  showQuillNotification(variant, message) {
    this.template.querySelector("c-quill-toast").showToast(variant, message);
  }
}
