public without sharing class Quill_TopProductsController {

    // @AuraEnabled
    // public static String getTopProducts(){
    //     try {
    //         Report report = [
    //             SELECT Id,DeveloperName FROM Report 
    //             WHERE DeveloperName = 'Quill_Products_Order_Count_3Om'
    //             LIMIT 1
    //         ];

    //         Reports.reportResults results = Reports.ReportManager.runReport(report.Id, true);
    //         Reports.Dimension dim = results.getGroupingsDown();
    //         List<Reports.GroupingValue> groupingVals = dim.getGroupings();
    //         System.debug(groupingVals);

    //         Map<String, Integer> productOrderCounts = new map<String, Integer>();
            
    //         for(Integer i=0; i<5; i++){
    //             String factMapKey = groupingVals[i].getKey() + '!T';
    //             Reports.ReportFactWithDetails factDetails =
    //                 (Reports.ReportFactWithDetails)results.getFactMap().get(factMapKey);

    //             Reports.SummaryValue sumVal = factDetails.getAggregates()[0];
    //             System.debug('Summary Value: ' + sumVal.getLabel());
    //             productOrderCounts.put(groupingVals[i].getLabel(), Integer.valueOf(sumVal.getLabel()));
    //         }   
            
    //         Set<String> productNames = productOrderCounts.keySet();
    //         List<Product2> products = [
    //             SELECT Id, DisplayUrl, Name, 
    //                 (   
    //                     SELECT Id, UnitPrice 
    //                     FROM PricebookEntries 
    //                     WHERE Pricebook2.IsActive = True 
    //                         OR Pricebook2.IsStandard = True
    //                 )
    //             FROM Product2
    //             WHERE Name IN :productNames
    //         ];

    //         return JSON.serialize(products);

    //     } catch (Exception e) {
    //         throw new AuraHandledException(e.getMessage());
    //     }
    // }

    @AuraEnabled
    public static String getTopProducts(){
        try {
            AggregateResult[] topProducts = [
                    SELECT Product2Id, Count(Id) productCounts
                    FROM OrderItem
                    GROUP BY Product2Id
                    ORDER BY Count(Id) DESC
                    LIMIT 5
            ];

            Set<Id> topProductIds = new Set<Id>();
            for(AggregateResult result: topProducts){
                Id productId = (Id)result.get('Product2Id');
                topProductIds.add(productId);
            }
            
            List<Product2> products = [
                    SELECT Id, DisplayUrl, Name, Family,
                    (   
                            SELECT Id, UnitPrice, Discount__c, Is_Percent_Discount__c 
                            FROM PricebookEntries 
                            WHERE Pricebook2.IsActive = TRUE 
                                    OR Pricebook2.IsStandard = TRUE
                            ORDER BY Pricebook2.IsStandard DESC
                    )
                    FROM Product2
                    WHERE Id IN :topProductIds
            ];

            return JSON.serialize(products);
        } catch (Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
    }
}