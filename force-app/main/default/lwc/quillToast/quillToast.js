import { LightningElement, api, track } from "lwc";

export default class QuillToast extends LightningElement {
  @track toastList = [];
  @track toastId = 0;
  @api timeout;
  @api sticky;

  @api
  showToast(type, message) {
    let toast = {
      type: type,
      headerMessage: type,
      message: message,
      id: this.toastId,
      iconName: "utility:" + type,
      headerClass: "slds-notify slds-notify_toast slds-theme_" + type
    };
    this.toastId = this.toastId + 1;
    this.toastList.push(toast);

    if (this.sticky === "false") {
      // eslint-disable-next-line @lwc/lwc/no-async-operation
      setTimeout(() => {
        this.closeModal();
      }, 3000);
    }
  }

  closeModal() {
    let index = this.toastId - 1;
    if (index !== -1) {
      this.toastList.splice(index, 1);
      this.toastId = this.toastId - 1;
    }
  }

  handleClose(event) {
    let index = event.target.dataset.index;
    if (index !== -1) {
      this.toastList.splice(index, 1);
      this.toastId = this.toastId - 1;
    }
  }
}
