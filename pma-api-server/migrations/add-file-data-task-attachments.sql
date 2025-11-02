-- Migration: Add FileData column and remove FilePath from TaskAttachments
-- Date: 2025-11-02
-- Description: Store task attachment file binary data in database instead of file system

-- Step 1: Add new FileData column (VARBINARY(MAX) for large files)
ALTER TABLE TaskAttachments
ADD FileData VARBINARY(MAX) NULL;

-- Step 2: Drop the FilePath column
ALTER TABLE TaskAttachments
DROP COLUMN FilePath;

-- Step 3: Make FileData NOT NULL
ALTER TABLE TaskAttachments
ALTER COLUMN FileData VARBINARY(MAX) NOT NULL;

-- Step 4: Add index for better query performance if it doesn't exist
IF NOT EXISTS (
    SELECT 1 FROM sys.indexes 
    WHERE name = 'IX_TaskAttachments_TaskId'
    AND object_id = OBJECT_ID('TaskAttachments')
)
BEGIN
    CREATE INDEX IX_TaskAttachments_TaskId 
    ON TaskAttachments(TaskId);
END;


ALTER TABLE ChangeItems
ALTER COLUMN OldValue NVARCHAR(MAX);

ALTER TABLE ChangeItems
ALTER COLUMN NewValue NVARCHAR(MAX);