/*
    Warehouse Order & Delivery Management System
    Reports / Analytics Module
    Date: 2026-09-17

    Phase 1:
    Order Summary Report

    No database schema changes are required.

    Data sources:
        dbo.Orders
        dbo.OrderItems
        dbo.Products

    Report metrics:
        - Total Orders
        - Total Sales
        - Average Order Value
        - Status-wise Order Count
        - Status-wise Sales
        - Top 10 Products by Quantity Sold

    Logical relationships:
        Orders.Id -> OrderItems.OrderId
        OrderItems.ProductId -> Products.Id

    These relationships are used through JOIN queries.
    No physical foreign key constraints are added by this report module.
*/
