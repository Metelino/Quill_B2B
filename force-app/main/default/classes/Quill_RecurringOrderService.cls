global class Quill_RecurringOrderService implements Schedulable {
  private List<Order> getRecurringOrders() {
    List<Order> recurringOrders = [
      SELECT Id
      FROM Order
      WHERE Is_Recurring_Order__c = TRUE AND Is_Recurring_Order_Active__c = TRUE
    ];

    Set<Id> recurringOrderIds = new Set<Id>();
    for (Order order : recurringOrders) {
      recurringOrderIds.add(order.Id);
    }

    return [
      SELECT
        Id,
        Parent_Order__c,
        AccountId,
        CustomerAuthorizedById,
        Pricebook2Id,
        ContractId
      FROM ORDER
      WHERE
        (Id IN :recurringOrderIds
        OR Parent_Order__c IN :recurringOrderIds)
        AND EndDate = TODAY
    ];
  }

  private List<OrderItem> getRecurringOrderItems() {
    List<Order> recurringOrders = [
      SELECT Id
      FROM Order
      WHERE Is_Recurring_Order__c = TRUE AND Is_Recurring_Order_Active__c = TRUE
    ];

    Set<Id> recurringOrderIds = new Set<Id>();
    for (Order order : recurringOrders) {
      recurringOrderIds.add(order.Id);
    }

    return [
      SELECT OrderId, Product2Id, Quantity, UnitPrice, PricebookEntryId
      FROM OrderItem
      WHERE OrderId IN :recurringOrderIds
    ];
  }

  private void createNextOrders() {
    final Date TODAY = Date.today();

    List<Order> newRecurringOrders = new List<Order>();
    List<OrderItem> newRecurringItems = new List<OrderItem>();

    List<Order> recurringOrders = getRecurringOrders();
    List<OrderItem> recurringItems = getRecurringOrderItems();

    for (Order order : recurringOrders) {
      Order newOrder = order.clone(false, true, false, false);

      newOrder.EffectiveDate = TODAY;
      newOrder.EndDate = TODAY.addDays(30);

      if (order.Parent_Order__c == null) {
        newOrder.Parent_Order__c = order.Id;
      } else {
        newOrder.Parent_Order__c = order.Parent_Order__c;
      }

      newRecurringOrders.add(newOrder);
    }

    insert newRecurringOrders;

    for (Order order : newRecurringOrders) {
      Id parentId = order.Parent_Order__c;
      for (OrderItem oi : recurringItems) {
        if (oi.OrderId == parentId) {
          OrderItem newItem = oi.clone(false, true, false, false);
          newItem.OrderId = order.Id;
          newRecurringItems.add(newItem);
        }
      }
    }

    insert newRecurringItems;
  }

  global void execute(SchedulableContext SC) {
    createNextOrders();
  }
}
