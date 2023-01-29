public without sharing class Quill_ProductReviewController {
    @AuraEnabled
    public static String getReviews(Id productId){
        Id userId = UserInfo.getUserId();
        List<Product_Review__c> revs = [
                SELECT Review_Text__c, Owner.Name, Product__c, CreatedDate
                FROM Product_Review__c
                WHERE Product__c = :productId
                        AND OwnerId <> :userId
        ];

        if(revs.isEmpty()){
            return '[]';
        }else{
            List<Map<String, Object>> reviews = new List<Map<String, Object>>();
            for(Product_Review__c rev : revs){
                Map<String, Object> review = new Map<String, Object>();
                review.put('review', rev);
                review.put('files', getReviewFiles(rev.Id));
                reviews.add(review);
            }
            
            return JSON.serialize(reviews);
        }
    }

    @AuraEnabled
    public static String getUserReview(Id productId){
        Id userId = UserInfo.getUserId();
        List<Product_Review__c> rev = [
                SELECT Id, Review_Text__c, Owner.Name, Product__c
                FROM Product_Review__c
                WHERE Product__c = :productId
                        AND OwnerId = :userId
                LIMIT 1
        ];
        
        if(rev.isEmpty()){
            return 'null';
        }

        Map<String, Object> review = new Map<String, Object>();
        review.put('review', rev[0]);
        review.put('files', getReviewFiles(rev[0].Id));

        return JSON.serialize(review);
    }

    @AuraEnabled
    public static String updateReview(Product_Review__c newReview, List<Map<String, String>> filesData){
        try{
            upsert newReview;

            if(!filesData.isEmpty()){
                uploadReviewFiles(filesData, newReview.Id);
            }

            return getUserReview(newReview.Product__c);
        }catch(Exception e){
            throw new AuraHandledException(e.getMessage());
        }
    }

    @AuraEnabled
    public static string uploadReviewFiles(List<Map<String, String>> filesData, Id reviewId){
        try {

            List<ContentVersion> cvs = [
                    SELECT ContentDocumentId
                    FROM ContentVersion
                    WHERE FirstPublishLocationId = :reviewId
            ];

            List<Id> documentIds = new List<Id>();
            for(ContentVersion cv : cvs){
                documentIds.add(cv.ContentDocumentId);
            }

            Database.delete(documentIds);
            
            cvs = new List<ContentVersion>();
            for(Integer i=0; i<filesData.size(); i++){
                String data = filesData[i].get('base64');
                String name = filesData[i].get('fileName');

                ContentVersion cv = new ContentVersion();
                cv.Title = name;
                cv.PathOnClient = '/' + name;
                cv.FirstPublishLocationId = reviewId;
                cv.VersionData = EncodingUtil.base64Decode(data);
                //cv.IsMajorVersion = true;
                cvs.add(cv);
            }

            insert cvs;

            List<ContentDistribution> cds = new List<ContentDistribution>();
            for(ContentVersion cv : cvs){
                ContentDistribution cd = new ContentDistribution(
                    PreferencesAllowViewInBrowser = true,
                    ContentVersionId = cv.Id,
                    name = cv.Title
                );

                cds.add(cd);
            }

            insert cds;
            
            Set<String> contentDownloadUrls = new Set<String>();
            for(ContentDistribution cd : cds){
                contentDownloadUrls.add(cd.ContentDownloadUrl);
            }

            return JSON.serialize(contentDownloadUrls);

        } catch (Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
    }

    @AuraEnabled
    public static void deleteReview(Id reviewId){
        List<ContentVersion> cvs = [
                SELECT ContentDocumentId
                FROM ContentVersion
                WHERE FirstPublishLocationId = :reviewId
        ];

        List<Id> documentIds = new List<Id>();
        for(ContentVersion cv : cvs){
            documentIds.add(cv.ContentDocumentId);
        }

        Database.delete(documentIds);
        Database.delete(reviewId);
    }

    private static Set<String> getReviewFiles(Id reviewId){
        List<ContentDocumentLink> cdls = [
                SELECT ContentDocumentId
                FROM ContentDocumentLink
                WHERE LinkedEntityId = :reviewId
        ];

        Set<Id> linkedDocumentIds = new Set<Id>();
        for(ContentDocumentLink cd : cdls){
            linkedDocumentIds.add(cd.ContentDocumentId);
        }

        List<ContentDocument> contentDocuments = [
                SELECT LatestPublishedVersionId
                FROM ContentDocument
                WHERE Id in :linkedDocumentIds
        ];

        Set<Id> latestContentVersions = new Set<Id>();
        for(ContentDocument cd : contentDocuments){
            latestContentVersions.add(cd.LatestPublishedVersionId);
        }

        List<ContentDistribution> cds = [
                SELECT ContentDownloadUrl
                FROM ContentDistribution
                WHERE ContentVersionId IN :latestContentVersions
        ];

        Set<String> fileUrls = new Set<String>();
        for(ContentDistribution cd : cds){
            fileUrls.add(cd.ContentDownloadUrl);
        }

        return fileUrls;
    }
}