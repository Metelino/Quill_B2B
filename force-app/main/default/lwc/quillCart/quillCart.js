import { LightningElement, wire, track } from "lwc";
import { NavigationMixin, CurrentPageReference } from "lightning/navigation";

import {
  MessageContext,
  subscribe,
  unsubscribe,
  APPLICATION_SCOPE
} from "lightning/messageService";

import cartChannel from "@salesforce/messageChannel/QuillCartUpdateChannel__c";

export default class QuillCart extends NavigationMixin(LightningElement) {
  @track
  products;

  @wire(CurrentPageReference)
  currentPageReference;

  @wire(MessageContext)
  messageContext;

  subscription = null;
  totalPrice;
  isCartExpanded = false;

  connectedCallback() {
    this.getStoredProducts();
    this.subscribeToCartChannel();
  }

  disconnectedCallback() {
    this.unsubscribeToCartChannel();
  }

  subscribeToCartChannel() {
    if (!this.subscription) {
      this.subscription = subscribe(
        this.messageContext,
        cartChannel,
        () => {
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

  getStoredProducts() {
    const products = JSON.parse(localStorage.getItem("products"));
    if (!products) {
      this.products = {};
    } else {
      this.products = products;
    }
    console.log(products);
  }

  get isCartDisabled() {
    return this.currentPageReference.attributes.name === "order_summary__c";
  }

  get productsList() {
    let prodList = [...Object.values(this.products)];
    this.totalPrice = 0;

    prodList = prodList.map((item) => {
      const newItem = { ...item };
      const price = item.product.PricebookEntries.records[0].UnitPrice;
      newItem.price = price;
      newItem.total = Math.ceil(price * item.amount * 100) / 100;
      this.totalPrice += newItem.total;
      return newItem;
    });
    this.totalPrice = Math.ceil(this.totalPrice * 100) / 100;
    return prodList;
  }

  toggleCart() {
    this.isCartExpanded = !this.isCartExpanded;
  }

  collapseCart() {
    this.isCartExpanded = false;
  }

  saturateInput(value) {
    if (value < 0) return 0;
    if (value > 1000) return 1000;
    return value;
  }

  incrementItemAmount(e) {
    const productId = e.currentTarget.dataset.productId;
    console.log(e.currentTarget.parentElement);
    this.products[productId].amount = this.saturateInput(
      this.products[productId].amount + 1
    );
    localStorage.setItem("products", JSON.stringify(this.products));
  }

  decrementItemAmount(e) {
    const productId = e.currentTarget.dataset.productId;
    this.products[productId].amount = this.saturateInput(
      this.products[productId].amount - 1
    );
    localStorage.setItem("products", JSON.stringify(this.products));
  }

  updateItemAmount(e) {
    const amount = this.saturateInput(e.currentTarget.value);
    const productId = e.currentTarget.dataset.productId;
    this.products[productId].amount = amount;
    e.currentTarget.value = amount;
    localStorage.setItem("products", JSON.stringify(this.products));
  }

  deleteItem(e) {
    const productId = e.currentTarget.dataset.productId;
    delete this.products[productId];
    localStorage.setItem("products", JSON.stringify(this.products));
  }

  navigateToCheckout(searchText) {
    this.isCartExpanded = false;
    this[NavigationMixin.Navigate]({
      type: "comm__namedPage",
      attributes: {
        name: "order_summary__c"
      },
      state: {
        searchText: searchText
      }
    });
  }
}
