public class Quill_PriceBookManager {
  private class pricebookEntryDao {
    public String Id;
    public String productName;
    public Double unitPrice;
    public Double discount;
    public Boolean isPercentDiscount;

    public pricebookEntryDao(PricebookEntry pricebookEntry) {
      this.Id = pricebookEntry.Id;
      this.productName = pricebookEntry.Product2.Name;
      this.unitPrice = pricebookEntry.UnitPrice;
      this.discount = pricebookEntry.Discount__c == null
        ? pricebookEntry.Discount__c
        : 0;
      this.isPercentDiscount = pricebookEntry.Is_Percent_Discount__c;
    }
  }

  private class PricebookDao {
    public String Name;
    List<PricebookEntry> entries;

    public PricebookDao(Pricebook2 pricebook) {
      this.Name = pricebook.Name;
      this.entries = new List<PricebookEntry>();
      for (PricebookEntry entry : pricebook.PricebookEntries) {
        this.entries.add(entry);
      }
    }
  }

  @AuraEnabled
  public static string getProductsWithStandardPrices() {
    try {
      List<Product2> products = [
        SELECT
          Id,
          DisplayUrl,
          Name,
          (
            SELECT Id, UnitPrice
            FROM PricebookEntries
            WHERE Pricebook2.IsStandard = TRUE
          )
        FROM Product2
      ];
      return JSON.serialize(products);
    } catch (Exception e) {
      throw new AuraHandledException(e.getMessage());
    }
  }

  @AuraEnabled
  public static string getPricebooks() {
    try {
      final Set<Id> excluded = new Set<Id>{
        '01s7S000003D3qZQAS',
        '01s7S000003D3qaQAC',
        '01s7S000003D3qAQAS',
        '01s7S000003D3qBQAS',
        '01s7S000003D3g5QAC'
      };

      List<Pricebook2> pricebooks = [
        SELECT
          Id,
          Name,
          IsActive,
          (
            SELECT
              Id,
              UnitPrice,
              Product2.Name,
              Product2Id,
              Discount__c,
              Is_Percent_Discount__c
            FROM PricebookEntries
            ORDER BY Product2.Name
          )
        FROM Pricebook2
        WHERE IsStandard = FALSE AND Id NOT IN :excluded
      ];

      return JSON.serialize(pricebooks);
    } catch (Exception e) {
      throw new AuraHandledException(e.getMessage());
    }
  }

  @AuraEnabled
  public static string getStandardPricebook() {
    try {
      Pricebook2 standardPricebook = [
        SELECT
          Id,
          Name,
          IsActive,
          (
            SELECT Id, UnitPrice, Product2Id, Product2.Name
            FROM PricebookEntries
            ORDER BY Product2.Name
          )
        FROM Pricebook2
        WHERE IsStandard = TRUE
        LIMIT 1
      ];

      return JSON.serialize(standardPricebook);
    } catch (Exception e) {
      throw new AuraHandledException(e.getMessage());
    }
  }

  @AuraEnabled
  public static void setPricebookActive(Id pricebookId) {
    try {
      List<Pricebook2> pricebooks = [
        SELECT Id
        FROM Pricebook2
      ];

      for (Pricebook2 pricebook : pricebooks) {
        pricebook.IsActive = false;
        if (pricebook.Id == pricebookId) {
          pricebook.IsActive = true;
        }
      }

      update pricebooks;
    } catch (Exception e) {
      throw new AuraHandledException(e.getMessage());
    }
  }

  @AuraEnabled
  public static void updateStandardPricebook(Map<String, Double> newPrices) {
    try {
      List<PricebookEntry> pricebookEntries = [
        SELECT Id, UnitPrice
        FROM PricebookEntry
        WHERE Pricebook2.IsStandard = TRUE
      ];

      if (!pricebookEntries.isEmpty()) {
        for (PricebookEntry entry : pricebookEntries) {
          entry.UnitPrice = newPrices.get(entry.Id);
        }

        update pricebookEntries;
      }

      recalculateDiscountEntries();
    } catch (Exception e) {
      throw new AuraHandledException(e.getMessage());
    }
  }

  @AuraEnabled
  public static string createNewPriceBook(String pricebookName) {
    try {
      Pricebook2 standardPricebook = [
        SELECT
          Id,
          (
            SELECT Id, UnitPrice, Product2Id
            FROM PricebookEntries
          )
        FROM Pricebook2
        WHERE IsStandard = TRUE
        LIMIT 1
      ];

      Pricebook2 newPricebook = new Pricebook2(Name = pricebookName);
      insert newPricebook;

      List<PricebookEntry> entries = new List<PricebookEntry>();
      for (PricebookEntry standardEntry : standardPricebook.PricebookEntries) {
        PricebookEntry newEntry = new PricebookEntry(
          Pricebook2Id = newPricebook.Id,
          Product2Id = standardEntry.product2Id,
          UnitPrice = standardEntry.UnitPrice,
          Is_Percent_Discount__c = true,
          Discount__c = 0
        );

        entries.add(newEntry);
      }

      insert entries;

      Pricebook2 addedPricebook = [
        SELECT
          Id,
          Name,
          (
            SELECT
              Id,
              UnitPrice,
              Product2.Name,
              Discount__c,
              Is_Percent_Discount__c
            FROM PricebookEntries
          )
        FROM Pricebook2
        WHERE Id = :newPricebook.Id
        LIMIT 1
      ];

      return JSON.serialize(addedPricebook);
    } catch (Exception e) {
      System.debug(e.getMessage());
      throw new AuraHandledException(e.getMessage());
    }
  }

  @AuraEnabled
  public static void updatePricebook(
    String pricebookId,
    Map<String, Double> discounts,
    Map<String, Boolean> isPercentDiscount
  ) {
    try {
      List<PricebookEntry> standardEntries = [
        SELECT Id, UnitPrice, Product2Id
        FROM PricebookEntry
        WHERE Pricebook2.IsStandard = TRUE
      ];
      Map<String, Double> standardPrices = new Map<String, Double>();
      for (PricebookEntry entry : standardEntries) {
        standardPrices.put(entry.Product2Id, entry.UnitPrice);
      }

      List<PricebookEntry> entries = [
        SELECT Id, UnitPrice, Discount__c, Is_Percent_Discount__c, Product2Id
        FROM PricebookEntry
        WHERE Pricebook2Id = :pricebookId
      ];
      for (Integer i = 0; i < entries.size(); i++) {
        PricebookEntry entry = entries[i];
        entry.Discount__c = discounts.get(entry.Id);
        entry.Is_Percent_Discount__c = isPercentDiscount.get(entry.Id);

        Decimal price;
        if (isPercentDiscount.get(entry.Id)) {
          price =
            standardPrices.get(entry.Product2Id) *
            (1 - entry.Discount__c / 100);
        } else {
          price = standardPrices.get(entry.Product2Id) - entry.Discount__c;
        }

        price = price.setScale(2);
        entry.UnitPrice = price;
      }

      update entries;
    } catch (Exception e) {
      System.debug(e.getMessage());
      throw new AuraHandledException(e.getMessage());
    }
  }

  public static void recalculateDiscountEntries() {
    List<PricebookEntry> standardEntries = [
      SELECT Id, UnitPrice, Product2Id
      FROM PricebookEntry
      WHERE Pricebook2.IsStandard = TRUE
    ];

    Map<String, Double> standardPrices = new Map<String, Double>();
    for (PricebookEntry entry : standardEntries) {
      standardPrices.put(entry.Product2Id, entry.UnitPrice);
    }

    List<PricebookEntry> discountEntries = [
      SELECT Id, UnitPrice, Product2Id, Is_Percent_Discount__c, Discount__c
      FROM PricebookEntry
      WHERE Pricebook2.IsStandard = FALSE
    ];

    for (PricebookEntry entry : discountEntries) {
      Decimal price;
      if (entry.Is_Percent_Discount__c) {
        price =
          standardPrices.get(entry.Product2Id) * (1 - entry.Discount__c / 100);
      } else {
        price = standardPrices.get(entry.Product2Id) - entry.Discount__c;
      }

      price = price.setScale(2);
      entry.UnitPrice = price;
    }

    update discountEntries;
  }

  @AuraEnabled
  public static void deletePricebook(String pricebookId) {
    try {
      Database.delete(pricebookId);
    } catch (Exception e) {
      throw new AuraHandledException(e.getMessage());
    }
  }
}
