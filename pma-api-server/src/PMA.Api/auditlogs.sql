 CREATE TABLE [dbo].[ChangeGroups] (
    [Id] INT IDENTITY(1,1) PRIMARY KEY,
    [EntityType] NVARCHAR(100) NOT NULL,      -- e.g., 'Task', 'ProjectRequirement'
    [EntityId] INT NOT NULL,                  -- ID of the record changed
    [ChangedBy] NVARCHAR(300) NOT NULL,       -- User or employee name/id
    [ChangedAt] DATETIME2(7) NOT NULL DEFAULT SYSUTCDATETIME()
);
CREATE TABLE [dbo].[ChangeItems] (
    [Id] INT IDENTITY(1,1) PRIMARY KEY,
    [ChangeGroupId] INT NOT NULL,
    [FieldName] NVARCHAR(200) NOT NULL,       -- e.g., 'StatusId', 'AssignedAnalyst'
    [OldValue] NVARCHAR(255) NULL,
    [NewValue] NVARCHAR(255) NULL,
    FOREIGN KEY ([ChangeGroupId]) REFERENCES [dbo].[ChangeGroups]([Id]) ON DELETE CASCADE
);
