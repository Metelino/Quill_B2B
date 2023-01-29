trigger ContentDocumentLinkTrigger on ContentDocumentLink (before insert) {
    final Schema.SObjectType reviewObject = Schema.Product_Review__c.getSObjectType();
    for(ContentDocumentLink cdl : Trigger.New){
        Id relatedId = cdl.LinkedEntityId;
        Schema.SObjectType recordObject = relatedId.getsobjecttype();
        if(reviewObject == recordObject){
            cdl.Visibility = 'AllUsers';
            //cdl.ShareType = 'I';
        }
    }
}