public with sharing class Quill_ProductsController {

    @AuraEnabled
    public static String getAllProducts(){
        try {
            List<Product2> products = [
                SELECT Id, DisplayUrl, Name, (Select UnitPrice From PricebookEntries Where Pricebook2.IsStandard = True)
                FROM Product2
                WHERE IsActive = True
            ];
            return JSON.serialize(products);
        } catch (Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
    }

    @AuraEnabled
    public static string getFilteredProducts(String searchText, List<String> families){
        try {
            List<Product2> products;
            if(String.isBlank(searchText)){
                searchText = '%';
            }else{
                searchText = '%' + searchText + '%';
            }

            if(families.isEmpty()){
                products = [
                    SELECT Id, DisplayUrl, Name, (Select UnitPrice From PricebookEntries Where Pricebook2.IsStandard = True)
                    FROM Product2
                    WHERE IsActive = True
                    AND Name LIKE :searchText
                ];
            }else{
                products = [
                    SELECT Id, DisplayUrl, Name, (Select UnitPrice From PricebookEntries Where Pricebook2.IsStandard = True)
                    FROM Product2
                    WHERE IsActive = True
                    AND Family IN :families
                    AND Name LIKE :searchText
                ];
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
                    (Select UnitPrice From PricebookEntries Where Pricebook2.IsStandard = True)
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
