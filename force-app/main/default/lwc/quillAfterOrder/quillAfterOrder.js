import { LightningElement } from "lwc";

import getLatestOrder from "@salesforce/apex/Quill_OrderController.getLatestOrder";

export default class QuillAfterOrder extends LightningElement {
  order = {};
  orderItems = [];
  isLoading = false;

  connectedCallback() {
    this.isLoading = true;
    getLatestOrder()
      .then((data) => {
        this.order = JSON.parse(data);
        this.orderItems = this.order.OrderItems.records;
      })
      .catch((error) => {
        console.log(error.body.message);
      })
      .finally(() => {
        this.isLoading = false;
      });
  }
}
