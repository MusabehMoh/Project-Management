-- Migration: Add DesignerTaskId column to DesignRequests table
-- Date: 2025-10-29
-- Description: Adds DesignerTaskId column to track the task created for the assigned designer

USE PMA;
GO

-- Check if column doesn't exist before adding
IF NOT EXISTS (
    SELECT 1 
    FROM sys.columns 
    WHERE object_id = OBJECT_ID(N'dbo.DesignRequests') 
    AND name = 'DesignerTaskId'
)
BEGIN
    ALTER TABLE dbo.DesignRequests
    ADD DesignerTaskId INT NULL;
    
    PRINT 'DesignerTaskId column added successfully';
END
ELSE
BEGIN
    PRINT 'DesignerTaskId column already exists';
END
GO

-- Optional: Add foreign key constraint to Tasks table if desired
-- Uncomment the following if you want to enforce referential integrity
/*
IF NOT EXISTS (
    SELECT 1 
    FROM sys.foreign_keys 
    WHERE name = 'FK_DesignRequests_Tasks_DesignerTaskId'
)
BEGIN
    ALTER TABLE dbo.DesignRequests
    ADD CONSTRAINT FK_DesignRequests_Tasks_DesignerTaskId
    FOREIGN KEY (DesignerTaskId) REFERENCES dbo.Tasks(Id);
    
    PRINT 'Foreign key constraint added successfully';
END
GO
*/

-- Verify the column was added
SELECT 
    c.name AS ColumnName,
    t.name AS DataType,
    c.is_nullable AS IsNullable,
    c.max_length AS MaxLength
FROM sys.columns c
INNER JOIN sys.types t ON c.user_type_id = t.user_type_id
WHERE c.object_id = OBJECT_ID(N'dbo.DesignRequests')
AND c.name = 'DesignerTaskId';
GO
