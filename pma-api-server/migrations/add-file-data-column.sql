-- Migration: Add FileData column and remove FilePath from ProjectRequirementAttachments
-- Date: 2025-11-02
-- Description: Store file binary data in database instead of file system

-- Step 1: Add new FileData column (VARBINARY(MAX) for large files)
ALTER TABLE ProjectRequirementAttachments
ADD FileData VARBINARY(MAX) NULL;

-- Step 2: Drop the FilePath column
ALTER TABLE ProjectRequirementAttachments
DROP COLUMN FilePath;

-- Step 3: Make FileData NOT NULL
ALTER TABLE ProjectRequirementAttachments
ALTER COLUMN FileData VARBINARY(MAX) NOT NULL;

-- Step 4: Add index for better query performance if it doesn't exist
IF NOT EXISTS (
    SELECT 1 FROM sys.indexes 
    WHERE name = 'IX_ProjectRequirementAttachments_ProjectRequirementId'
    AND object_id = OBJECT_ID('ProjectRequirementAttachments')
)
BEGIN
    CREATE INDEX IX_ProjectRequirementAttachments_ProjectRequirementId 
    ON ProjectRequirementAttachments(ProjectRequirementId);
END;
