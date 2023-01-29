trigger ProductTrigger on Product2 (after insert) {
    Pricebook2 standardPricebook = [
        SELECT Id
        FROM Pricebook2
        WHERE IsStandard = TRUE
        LIMIT 1
    ];

    List<Pricebook2> pricebooks = [
        SELECT Id
        FROM Pricebook2
        WHERE IsStandard = FALSE
    ];

    List<PricebookEntry> standardEntries = new List<PricebookEntry>();
    for(Product2 product : Trigger.New){
        PricebookEntry entry = new PricebookEntry(
            Pricebook2Id = standardPricebook.Id,
            Product2Id = product.Id,
            UnitPrice = 0
        );
        standardEntries.add(entry);
    }

    insert standardEntries;

    List<PricebookEntry> customEntries = new List<PricebookEntry>();
    for(Product2 product : Trigger.New){
        for(Pricebook2 pricebook : pricebooks){
            PricebookEntry entry = new PricebookEntry(
                Pricebook2Id = pricebook.Id,
                Product2Id = product.Id,
                UnitPrice = 0
            );
            customEntries.add(entry);
        }
    }

    insert customEntries;
}