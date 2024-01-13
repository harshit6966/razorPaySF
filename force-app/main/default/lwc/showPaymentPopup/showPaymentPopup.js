import { LightningElement, track, api, wire } from 'lwc';
import { getRecord } from 'lightning/uiRecordApi';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import sendPaymentLink from '@salesforce/apex/PaymentUtility.sendPaymentLink';
import createPaymentRequest from '@salesforce/apex/PaymentUtility.createPaymentRequest';
import getStringBody from '@salesforce/apex/PaymentUtility.getStringBody';
import getPaymentDetails from '@salesforce/apex/PaymentUtility.getPaymentDetails';
import { getRecordNotifyChange } from 'lightning/uiRecordApi';

const FIELDS = [
    'Contact.Name',
    'Contact.Title',
    'Contact.Phone',
    'Contact.Email',
];

export default class ShowPaymentPopup extends LightningElement {
    @api recordId;

    @wire(getRecord, { recordId: '$recordId', fields: FIELDS })
    contact;

    @track isModalOpen = false;
    @track
    amount

    handleChange(event){
        this.amount = event.target.value;
    }

    get name(){
        return this.contact.data.fields.Name.value;
    }

    get title(){
        return this.contact.data.fields.Title.value;
    }

    get phone(){
        return this.contact.data.fields.Phone.value;
    }

    get email(){
        return this.contact.data.fields.Email.value;
    }

    openModal(){
        this.isModalOpen = true;
    }
    closeModal(){
        this.isModalOpen = false;
    }

    submitDetails(){
        this.isModalOpen = false;
        this.handleSubmit();
    }

    handleSubmit(){
        createPaymentRequest({ amount: this.amount, contactId: this.recordId }).then((response) =>{
            this.sendPaymentLink(response.Id);
        }).catch((error)=>{
            alert('record created error'+error);
        })
    }

    sendPaymentLink(referenceId){
        getRecordNotifyChange([{ recordId: referenceId }]);
        this.getPaymentDetails(referenceId);
    }

    getPaymentDetails(referenceId){
        getPaymentDetails({referenceId:referenceId}).then((paymentDetails) =>{
            console.log("paymentDetails "+JSON.stringify(paymentDetails));
            this.generateRequestBody(paymentDetails);
        }).catch((error)=>{
            alert('Error in getting the payment details'+error);
        })
    }

    generateRequestBody(paymentDetails){
        getStringBody({}).then((response) =>{
            console.log("Request string "+JSON.stringify(response));
            let reqeustObject=JSON.parse(response);

            reqeustObject.amount=paymentDetails.Amount__c*100;
            reqeustObject.reference_id=paymentDetails.Id;
            reqeustObject.customer.Name=paymentDetails.Customer__r.Name;
            reqeustObject.customer.email=paymentDetails.Customer__r.Email;
            reqeustObject.customer.contact=paymentDetails.Customer__r.Phone;

            sendPaymentLink({reqeustString:JSON.stringify(requestObject)}).then((response) =>{
                console.log('link sent successfully '+JSON.stringify(response));
                this.ShowToast('Success','Link sent successfully on the contact email and phone','success');
            }).catch((error) =>{
                alert('error');
            })
        
        }).catch((error) =>{
            alert('error'+error);
        })
    }

    showToast(title,message,variant){
        const event = new ShowToastEvent({
            title: title,
            message: message,
            variant: variant,
            mode: 'dismissable'
        });
        this.dispatchEvent(event);
    }
}