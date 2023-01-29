trigger ContentVersionTrigger on ContentVersion (after insert) {
    List<ContentVersionShare> fileShares = new List<ContentVersionShare>();

    CollaborationGroup cg = [
        SELECT Id 
        FROM Group 
        WHERE Name='Quill File Sharing'
        LIMIT 1
    ];
    for(ContentVersion cv : Trigger.New){
        ContentVersionShare newShare = new ContentVersionShare();
        newShare.ParentId = cv.Id;
        newShare.UserOrGroupId = cg.Id;
        newShare.AccessLevel = 'edit';

        fileShares.add(newShare);
    }

    insert fileShares;
}