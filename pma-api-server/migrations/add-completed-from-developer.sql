-- Migration: Add CompletedFromDeveloper column to Tasks table
-- Date: 2025-10-29
-- Description: Adds CompletedFromDeveloper column to track if task was completed without designer assistance

USE PMA;
GO

-- Check if column doesn't exist before adding
IF NOT EXISTS (
    SELECT 1 
    FROM sys.columns 
    WHERE object_id = OBJECT_ID(N'dbo.Tasks') 
    AND name = 'CompletedFromDeveloper'
)
BEGIN
    ALTER TABLE dbo.Tasks
    ADD CompletedFromDeveloper BIT NULL DEFAULT 0;
    
    PRINT 'CompletedFromDeveloper column added successfully';
END
ELSE
BEGIN
    PRINT 'CompletedFromDeveloper column already exists';
END
GO

-- Update existing records to have default value
UPDATE dbo.Tasks
SET CompletedFromDeveloper = 0
WHERE CompletedFromDeveloper IS NULL;
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
AND c.name = 'CompletedFromDeveloper';
GO
