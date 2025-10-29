-- Migration: Add Notes column to Tasks table
-- Date: 2025-10-29
-- Description: Adds Notes column to Tasks table for task comments and additional information

USE PMA;
GO

-- Check if column doesn't exist before adding
IF NOT EXISTS (
    SELECT 1 
    FROM sys.columns 
    WHERE object_id = OBJECT_ID(N'dbo.Tasks') 
    AND name = 'Notes'
)
BEGIN
    ALTER TABLE dbo.Tasks
    ADD Notes NVARCHAR(MAX) NULL;
    
    PRINT 'Notes column added successfully';
END
ELSE
BEGIN
    PRINT 'Notes column already exists';
END
GO

-- Verify the column was added
SELECT 
    c.name AS ColumnName,
    t.name AS DataType,
    c.is_nullable AS IsNullable,
    c.max_length AS MaxLength
FROM sys.columns c
INNER JOIN sys.types t ON c.user_type_id = t.user_type_id
WHERE c.object_id = OBJECT_ID(N'dbo.Tasks')
AND c.name = 'Notes';
GO
