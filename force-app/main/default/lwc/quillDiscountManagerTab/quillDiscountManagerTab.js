import { LightningElement, track } from "lwc";
import { ShowToastEvent } from "lightning/platformShowToastEvent";

import getPricebooks from "@salesforce/apex/Quill_PriceBookManager.getPricebooks";
import setPricebookActive from "@salesforce/apex/Quill_PriceBookManager.setPricebookActive";
import getStandardPricebook from "@salesforce/apex/Quill_PriceBookManager.getStandardPricebook";
import updateStandardPricebook from "@salesforce/apex/Quill_PriceBookManager.updateStandardPricebook";
import updatePricebook from "@salesforce/apex/Quill_PriceBookManager.updatePricebook";
import createNewPriceBook from "@salesforce/apex/Quill_PriceBookManager.createNewPriceBook";
import deletePricebook from "@salesforce/apex/Quill_PriceBookManager.deletePricebook";

export default class QuillDiscountManagerTab extends LightningElement {
  isLoading = false;

  @track
  pricebooks = [];
  standardPricebook;
  selectedPricebook;

  get selectedPricebookName() {
    if (this.selectedPricebook) {
      return "Selected Pricebook: " + this.selectedPricebook.Name;
    }
    return "Selected Pricebook";
  }

  async connectedCallback() {
    this.isLoading = true;

    try {
      const [pricebooks, standardPricebook] = await Promise.all([
        getPricebooks(),
        getStandardPricebook()
      ]);
      this.pricebooks = JSON.parse(pricebooks);
      this.pricebooks.forEach((pricebook) => {
        pricebook.PricebookEntries = pricebook.PricebookEntries || [];
      });
      this.standardPricebook = JSON.parse(standardPricebook);
    } catch (error) {
      console.error(error.message);
      this.showNotification("Error", error, "error");
    } finally {
      this.isLoading = false;
    }
  }

  createPricebook() {
    this.isLoading = true;
    const pricebookName = this.template.querySelector(
      '[name="pricebook-name"]'
    );

    createNewPriceBook({
      pricebookName: pricebookName.value
    })
      .then((data) => {
        this.showNotification(
          "Success",
          "Pricebook Added Successfully",
          "success"
        );
        this.pricebooks.push(JSON.parse(data));
      })
      .catch((error) => {
        this.showNotification("Error", error.body.message, "error");
      })
      .finally(() => {
        this.isLoading = false;
      });
  }

  updateStandardPrices(e) {
    this.standardPricebook = e.detail;
    const newPrices = {};
    for (let entry of this.standardPricebook.PricebookEntries.records) {
      newPrices[entry.Id] = entry.UnitPrice;
    }

    this.isLoading = true;
    updateStandardPricebook({ newPrices: newPrices })
      .then(() => {
        this.showNotification("Success", "Standard Prices Updated", "success");
        getPricebooks().then((data) => {
          this.pricebooks = JSON.parse(data);
          this.selectedPricebook = this.pricebooks.find(
            ({ Id }) => Id === this.selectedPricebook.Id
          );
        });
      })
      .catch((error) => {
        this.showNotification("Error", error.body.message, "error");
      })
      .finally(() => {
        this.isLoading = false;
      });
  }

  updateCustomPrices(e) {
    this.selectedPricebook = e.detail;
    const discounts = {};
    const isPercentDiscount = {};
    try {
      for (let entry of this.selectedPricebook.PricebookEntries.records) {
        discounts[entry.Id] = entry.Discount__c;
        isPercentDiscount[entry.Id] = entry.Is_Percent_Discount__c;
      }

      this.isLoading = true;
      updatePricebook({
        pricebookId: this.selectedPricebook.Id,
        discounts: discounts,
        isPercentDiscount: isPercentDiscount
      })
        .then(() => {
          this.showNotification("Success", "Pricebook Updated", "success");
        })
        .catch((error) => {
          this.showNotification("Error", error.body.message, "error");
        })
        .finally(() => {
          this.isLoading = false;
        });
    } catch (error) {
      console.log(error.message);
    }
  }

  delPricebook(e) {
    const pricebookId = e.currentTarget.dataset.id;
    console.log(pricebookId);
    this.isLoading = true;
    deletePricebook({
      pricebookId: pricebookId
    })
      .then(() => {
        this.showNotification("Success", "Pricebook Deleted", "success");
        this.pricebooks = this.pricebooks.filter(
          (pricebook) => pricebook.Id !== pricebookId
        );
      })
      .catch((error) => {
        this.showNotification("Error", error.body.message, "error");
      })
      .finally(() => {
        this.isLoading = false;
      });
  }

  setActivePricebook(e) {
    const pricebookId = e.currentTarget.dataset.id;
    this.isLoading = true;
    setPricebookActive({ pricebookId: pricebookId })
      .then(() => {
        this.showNotification("Success", "Pricebook set as active", "success");
        for (let i = 0; i < this.pricebooks.length; i++) {
          this.pricebooks[i].IsActive = false;
          if (this.pricebooks[i].Id === pricebookId) {
            this.pricebooks[i].IsActive = true;
          }
        }
      })
      .catch((error) => {
        console.log(error.body.message);
        this.showNotification("Error", error.body.message, "error");
      })
      .finally(() => {
        this.isLoading = false;
      });
  }

  selectPricebook(e) {
    const pricebookId = e.currentTarget.dataset.id;
    const selectedPricebook = this.pricebooks.find(
      ({ Id }) => Id === pricebookId
    );
    selectedPricebook.PricebookEntries.records =
      selectedPricebook.PricebookEntries.records.map((entry) => {
        entry.FinalPrice = entry.UnitPrice;
        return entry;
      });
    this.selectedPricebook = selectedPricebook;
    console.table(this.selectedPricebook);
    this.template.querySelector("lightning-tabset").activeTabValue = "custom";
  }

  showNotification(title, message, variant) {
    const evt = new ShowToastEvent({
      title: title,
      message: message,
      variant: variant
    });
    this.dispatchEvent(evt);
  }
}
