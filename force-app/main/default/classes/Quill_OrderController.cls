public without sharing class Quill_OrderController {

    @AuraEnabled
    public static void makeOrder(Map<Id, Integer> products, Boolean isRecurringOrder){
        try {
            Map<String, Id> userInfo = getUserInfo();

            Pricebook2 pricebook = [
                    SELECT Id
                    FROM Pricebook2
                    WHERE IsActive = TRUE
                    LIMIT 1
            ];

            Contract contract = new Contract(
                AccountId = userInfo.get('AccountId'),
                CustomerSignedId = userInfo.get('ContactId'),
                CustomerSignedDate = date.today(),
                StartDate=date.today()
            );
            insert contract;
            
            Order newOrder = new Order(
                Is_Recurring_Order__c = (isRecurringOrder != null) && isRecurringOrder,
                Is_Recurring_Order_Active__c = true,
                ContractId = contract.Id,
                Pricebook2Id = pricebook.Id,
                AccountId = userInfo.get('AccountId'),
                CustomerAuthorizedById = userInfo.get('ContactId'),
                EffectiveDate = date.today(),
                Status = 'Draft',
                EndDate  = date.today()+30
            );
            insert newOrder;

            Set<Id> productIds = products.keySet();
            List<Product2> productsList = [
                    SELECT Id, 
                            (
                                    SELECT Id, UnitPrice 
                                    FROM PricebookEntries 
                                    WHERE Pricebook2.IsStandard = TRUE
                            )
                    FROM Product2
                    WHERE IsActive = TRUE
                            AND Id IN :productIds
            ];

            List<OrderItem> orderItems = new List<OrderItem>();
            for(Product2 product : productsList){
                Integer amount = products.get(product.Id);
                OrderItem oi = new OrderItem(
                    OrderId = newOrder.Id,
                    Product2Id = product.Id,
                    Quantity = amount,
                    UnitPrice  = product.PricebookEntries[0].UnitPrice,
                    PricebookEntryId = product.PricebookEntries[0].Id
                );
                orderItems.add(oi);
            }
            insert orderItems;

        } catch (Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
    }

    @AuraEnabled
    public static string getLatestOrder(){
        try {
            Id userId = UserInfo.getUserId();
            Order order = [
                    SELECT Id, TotalAmount, EffectiveDate,
                            (
                                    SELECT Id, UnitPrice, TotalPrice, Product2.Name, Product2.DisplayUrl, Quantity 
                                    FROM OrderItems
                            )
                    FROM Order
                    WHERE OwnerId = :userId
                    ORDER BY CreatedDate DESC 
                    LIMIT 1
            ];
            
            return JSON.serialize(order);
        } catch (Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
    }

    @AuraEnabled
    public static string getUserOrders(){
        try {
            Id userId = UserInfo.getUserId();
            List<Order> orders = [
                    SELECT Id, TotalAmount, Status, EffectiveDate, Contract.Status, OrderNumber, 
                            (
                                    SELECT Id, UnitPrice, Product2Id, Product2.Name, Product2.DisplayUrl, Quantity 
                                    FROM OrderItems
                            )
                    FROM Order
                    WHERE OwnerId = :userId
                            AND Is_Recurring_Order__c = FALSE
                    ORDER BY CreatedDate DESC 
            ];

            return JSON.serialize(orders);
        } catch (Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
    }

    @AuraEnabled
    public static string getUserRecurringOrders(){
        try {
            Id userId = UserInfo.getUserId();
            List<Order> orders = [
                    SELECT Id, TotalAmount, Status, EffectiveDate, EndDate, Contract.Status, OrderNumber, 
                            Is_Recurring_Order_Active__c, 
                            (
                                    SELECT Id, UnitPrice, Product2Id, Product2.Name, Product2.DisplayUrl, Quantity 
                                    FROM OrderItems
                            ), 
                            (
                                    SELECT Id, EffectiveDate, EndDate, Status, OrderNumber 
                                    FROM Orders__r
                            )
                    FROM Order
                    WHERE OwnerId = :userId
                            AND Is_Recurring_Order__c = TRUE
                    ORDER BY CreatedDate DESC 
            ];

            return JSON.serialize(orders);
        } catch (Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
    }

    @AuraEnabled
    public static void cancelRecurringOrder(Id orderId){
        try {
            Order order = [
                    SELECT Id
                    FROM Order
                    WHERE Id = :orderId
                    LIMIT 1
            ];

            order.Is_Recurring_Order_Active__c = false;
            update order;
        } catch (Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
    }

    @AuraEnabled
    public static string getAccountOrders(){
        try {
            Map<String, Id> userInfo = getUserInfo();
            List<Order> orders = [
                    SELECT Id, TotalAmount, Status, EffectiveDate, Contract.Status, OrderNumber, 
                            (
                                    SELECT Id, UnitPrice, Product2.Name, Product2.Id, Product2.DisplayUrl, Quantity 
                                    FROM OrderItems
                            )
                    FROM Order
                    WHERE AccountId = :userInfo.get('AccountId')
                    ORDER BY CreatedDate DESC 
            ];

            return JSON.serialize(orders);
        } catch (Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
    }

    @AuraEnabled
    public static string createCase(Case newCase){
        try {
            Map<String, Id> userInfo = getUserInfo();
            newCase.AccountId = userInfo.get('AccountId');
            newCase.ContactId = userInfo.get('ContactId');
            newCase.Origin = 'Web';

            insert newCase;

            Case insertedCase = [
                    SELECT Id, CaseNumber, Description, Subject, Status, Comments, CreatedDate, IsClosed, IsStopped, 
                            Order__r.OrderNumber,
                            (
                                    SELECT Id, CommentBody 
                                    FROM CaseComments 
                                    ORDER BY CreatedDate
                            )
                    FROM Case
                    WHERE OwnerId = :userInfo.get('UserId')
                    ORDER BY CreatedDate DESC
                    LIMIT 1
            ];

            return JSON.serialize(insertedCase);
        } catch (Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
    }

    @AuraEnabled
    public static string getUserCases(){
        try {
            Id userId = UserInfo.getUserId();
            List<Case> cases = [
                    SELECT Id, CaseNumber, Description, Subject, Status, Comments, CreatedDate, IsClosed, IsStopped,  
                            Order__r.OrderNumber, Order__c,
                            (
                                    SELECT Id, CommentBody, CreatedDate 
                                    FROM CaseComments 
                                    ORDER BY CreatedDate DESC
                            )
                    FROM Case
                    WHERE OwnerId = :userId
                    ORDER BY CreatedDate DESC
            ];
            return JSON.serialize(cases);
        } catch (Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
    }

    private static Map<String, Id> getUserInfo(){
        final Id userId = UserInfo.getUserId();
        User user = [
                SELECT ContactId
                FROM User
                WHERE Id = :userId
        ];

        Contact userContact;
        try{
            userContact = [
                    SELECT AccountId
                    FROM Contact
                    WHERE Id = :user.ContactId
                    LIMIT 1
            ];
        }catch(Exception e){
            throw new HandledException('User isn\'t related to any Contact');
        }

        if(String.isBlank(userContact.AccountId)){
            throw new HandledException('User isn\'t related to any Account');
        }
        
        return new Map<String, Id>{
            'UserId' => userId,
            'ContactId' => user.ContactId, 
            'AccountId' => userContact.AccountId};
    }

}