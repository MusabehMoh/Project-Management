-- Performance optimization indexes for ProjectRequirements
-- Run this script to improve query performance

-- Index for ProjectId filtering (most common query pattern)
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_ProjectRequirements_ProjectId_CreatedAt')
BEGIN
    CREATE NONCLUSTERED INDEX [IX_ProjectRequirements_ProjectId_CreatedAt] 
    ON [dbo].[ProjectRequirements] ([ProjectId] ASC, [CreatedAt] DESC)
    INCLUDE ([Id], [Name], [Description], [Status], [Priority], [Type], [CreatedBy], [SentBy], [AssignedAnalyst])
END

-- Index for Status filtering (used in approval requests and other status-based queries)
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_ProjectRequirements_Status_CreatedAt')
BEGIN
    CREATE NONCLUSTERED INDEX [IX_ProjectRequirements_Status_CreatedAt] 
    ON [dbo].[ProjectRequirements] ([Status] ASC, [CreatedAt] DESC)
    INCLUDE ([Id], [ProjectId], [Name], [Priority])
END

-- Index for SentBy filtering (for sender-based queries)
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_ProjectRequirements_SentBy')
BEGIN
    CREATE NONCLUSTERED INDEX [IX_ProjectRequirements_SentBy] 
    ON [dbo].[ProjectRequirements] ([SentBy] ASC)
    WHERE [SentBy] IS NOT NULL
END

-- Index for AssignedAnalyst filtering
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_ProjectRequirements_AssignedAnalyst')
BEGIN
    CREATE NONCLUSTERED INDEX [IX_ProjectRequirements_AssignedAnalyst] 
    ON [dbo].[ProjectRequirements] ([AssignedAnalyst] ASC)
    WHERE [AssignedAnalyst] IS NOT NULL
END

-- Index for attachment queries (to speed up metadata loading)
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_ProjectRequirementAttachments_ProjectRequirementId_UploadedAt')
BEGIN
    CREATE NONCLUSTERED INDEX [IX_ProjectRequirementAttachments_ProjectRequirementId_UploadedAt] 
    ON [dbo].[ProjectRequirementAttachments] ([ProjectRequirementId] ASC, [UploadedAt] DESC)
    INCLUDE ([Id], [FileName], [OriginalName], [FileSize], [ContentType])
END

-- Composite index for complex filtering queries
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_ProjectRequirements_ProjectId_Status_Priority')
BEGIN
    CREATE NONCLUSTERED INDEX [IX_ProjectRequirements_ProjectId_Status_Priority] 
    ON [dbo].[ProjectRequirements] ([ProjectId] ASC, [Status] ASC, [Priority] ASC)
    INCLUDE ([CreatedAt], [Name], [Description])
END

PRINT 'Performance indexes created successfully.'