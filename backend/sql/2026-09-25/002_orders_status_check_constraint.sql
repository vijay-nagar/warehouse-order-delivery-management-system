USE [WarehouseOrderDelivery];
GO

-- Normalize any pre-existing out-of-range values before adding the CHECK
-- constraint, so this migration cannot fail on a database that already
-- has rows (defensive only; every value written by application code today
-- is already one of the listed statuses).
UPDATE dbo.Orders
SET Status = 'CREATED'
WHERE Status NOT IN (
    'CREATED', 'STOCK_RESERVED', 'PICKING', 'PICKED', 'PACKING', 'PACKED',
    'OUT_FOR_DELIVERY', 'DELIVERED', 'OUT_OF_STOCK', 'CANCELLED', 'FAILED', 'RETURNED'
);
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.check_constraints WHERE name = 'CK_Orders_Status'
)
BEGIN
    ALTER TABLE dbo.Orders WITH CHECK ADD CONSTRAINT CK_Orders_Status
    CHECK (Status IN (
        'CREATED', 'STOCK_RESERVED', 'PICKING', 'PICKED', 'PACKING', 'PACKED',
        'OUT_FOR_DELIVERY', 'DELIVERED', 'OUT_OF_STOCK', 'CANCELLED', 'FAILED', 'RETURNED'
    ));
END;
GO
