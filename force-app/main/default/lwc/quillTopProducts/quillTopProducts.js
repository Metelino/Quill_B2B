import { LightningElement } from "lwc";

import getTopProducts from "@salesforce/apex/Quill_TopProductsController.getTopProducts";

export default class QuillTopProducts extends LightningElement {
  isLoading = false;
  products;

  connectedCallback() {
    this.isLoading = true;
    getTopProducts({})
      .then((data) => {
        this.products = JSON.parse(data);
      })
      .catch((error) => {
        console.log(error.body.message);
      })
      .finally(() => {
        this.isLoading = false;
      });
  }
}
