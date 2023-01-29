public without sharing class Quill_ProductsController {
    @AuraEnabled
    public static String getAllProducts(){
        try {
            List<Product2> products = [
                    SELECT Id, DisplayUrl, Name, 
                            (
                                    SELECT Id, UnitPrice 
                                    FROM PricebookEntries 
                                    WHERE Pricebook2.IsActive = TRUE
                            )
                    FROM Product2
                    WHERE IsActive = TRUE
            ];

            return JSON.serialize(products);
        } catch (Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
    }

    private static String getProductQuery(String searchText, List<String> families, String orderBy) {
        searchText = String.isBlank(searchText) ? '%' : '%' + searchText + '%';

        String query = 'SELECT Id, DisplayUrl, Name, Family, ' + 
                ' (SELECT UnitPrice, Discount__c, Is_Percent_Discount__c ' + 
                ' FROM PricebookEntries ' +  
                ' WHERE Pricebook2.IsActive = True OR Pricebook2.IsStandard = True ' + 
                ' ORDER BY Pricebook2.IsStandard DESC) ' + 
                ' FROM Product2 ' +
                ' WHERE IsActive = True ' + 
                ' AND (Name LIKE \'' + searchText + 
                '\' OR ProductCode LIKE \''+ searchText + 
                '\' OR Family LIKE \'' + searchText + '\')';

        if(!families.isEmpty()){
            String familiesString = '(\'' + String.join(families, '\',\'') + '\')';
            query += ' AND Family IN ' + familiesString;
        }

        if(!String.isBlank(orderBy)){
            query += 'ORDER BY ' + orderBy;
        }
        
        return query;
    }

    @AuraEnabled
    public static string getFilteredProducts(
            String searchText, 
            List<String> families, 
            String minPrice, 
            String maxPrice,
            String orderBy){
        try {
            String query = Quill_ProductsController.getProductQuery(searchText, families, orderBy);
            List<Product2> products = Database.query(query);
            
            Double minP, maxP;
            minP = String.isBlank(minPrice) ? 0 : Double.valueOf(minPrice);
            maxP = String.isBlank(maxPrice) ? 10000 : Double.valueOf(maxPrice);
            
            for(Integer i=products.size()-1; i>=0; i--){
                List<PricebookEntry> entries = products[i].PricebookEntries;
                Double productPrice = entries[0].UnitPrice < entries[1].UnitPrice
                        ? entries[0].UnitPrice
                        : entries[1].UnitPrice;
                
                if(productPrice <= minP || productPrice > maxP){
                    products.remove(i);
                }
            }

            return JSON.serialize(products);
        } catch (Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
    }

    @AuraEnabled
    public static String getProductFamilies(){
        try {
            Schema.DescribeFieldResult fieldResult = Product2.Family.getDescribe();
            List<Schema.PicklistEntry> families = fieldResult.getPicklistValues();
            for(Integer i=0; i<families.size(); i++){
                if(families[i].label == 'None'){
                    families.remove(i);
                    break;
                }
            }

            return JSON.serialize(families);
        } catch (Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
    }

    @AuraEnabled
    public static String getProductDetail(Id productId){
        try {
            Product2 product = [
                    SELECT Id, DisplayUrl, Name, Description, ProductCode,
                            (
                                    SELECT UnitPrice 
                                    FROM PricebookEntries 
                                    WHERE Pricebook2.IsActive = TRUE
                            )
                    FROM Product2
                    WHERE Id = :productId
                    LIMIT 1
            ];

            return JSON.serialize(product);
        } catch (Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
    } 
}
