BEGIN TRANSACTION;
GO

DECLARE @var0 sysname;
SELECT @var0 = [d].[name]
FROM [sys].[default_constraints] [d]
INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
WHERE ([d].[parent_object_id] = OBJECT_ID(N'[Projects]') AND [c].[name] = N'AnalystIds');
IF @var0 IS NOT NULL EXEC(N'ALTER TABLE [Projects] DROP CONSTRAINT [' + @var0 + '];');
ALTER TABLE [Projects] DROP COLUMN [AnalystIds];
GO

DECLARE @var1 sysname;
SELECT @var1 = [d].[name]
FROM [sys].[default_constraints] [d]
INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
WHERE ([d].[parent_object_id] = OBJECT_ID(N'[Lookups]') AND [c].[name] = N'Color');
IF @var1 IS NOT NULL EXEC(N'ALTER TABLE [Lookups] DROP CONSTRAINT [' + @var1 + '];');
ALTER TABLE [Lookups] DROP COLUMN [Color];
GO

DECLARE @var2 sysname;
SELECT @var2 = [d].[name]
FROM [sys].[default_constraints] [d]
INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
WHERE ([d].[parent_object_id] = OBJECT_ID(N'[Lookups]') AND [c].[name] = N'CreatedAt');
IF @var2 IS NOT NULL EXEC(N'ALTER TABLE [Lookups] DROP CONSTRAINT [' + @var2 + '];');
ALTER TABLE [Lookups] DROP COLUMN [CreatedAt];
GO

DECLARE @var3 sysname;
SELECT @var3 = [d].[name]
FROM [sys].[default_constraints] [d]
INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
WHERE ([d].[parent_object_id] = OBJECT_ID(N'[Lookups]') AND [c].[name] = N'Order');
IF @var3 IS NOT NULL EXEC(N'ALTER TABLE [Lookups] DROP CONSTRAINT [' + @var3 + '];');
ALTER TABLE [Lookups] DROP COLUMN [Order];
GO

DECLARE @var4 sysname;
SELECT @var4 = [d].[name]
FROM [sys].[default_constraints] [d]
INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
WHERE ([d].[parent_object_id] = OBJECT_ID(N'[Lookups]') AND [c].[name] = N'UpdatedAt');
IF @var4 IS NOT NULL EXEC(N'ALTER TABLE [Lookups] DROP CONSTRAINT [' + @var4 + '];');
ALTER TABLE [Lookups] DROP COLUMN [UpdatedAt];
GO

EXEC sp_rename N'[Lookups].[Label]', N'Name', N'COLUMN';
GO

EXEC sp_rename N'[Lookups].[Category]', N'Code', N'COLUMN';
GO

ALTER TABLE [Units] ADD [Code] nvarchar(20) NOT NULL DEFAULT N'';
GO

ALTER TABLE [Units] ADD [Level] int NOT NULL DEFAULT 0;
GO

ALTER TABLE [Units] ADD [ParentId] int NULL;
GO

ALTER TABLE [Units] ADD [Path] nvarchar(500) NOT NULL DEFAULT N'';
GO

DECLARE @var5 sysname;
SELECT @var5 = [d].[name]
FROM [sys].[default_constraints] [d]
INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
WHERE ([d].[parent_object_id] = OBJECT_ID(N'[Lookups]') AND [c].[name] = N'Value');
IF @var5 IS NOT NULL EXEC(N'ALTER TABLE [Lookups] DROP CONSTRAINT [' + @var5 + '];');
ALTER TABLE [Lookups] ALTER COLUMN [Value] int NOT NULL;
GO

ALTER TABLE [Lookups] ADD [NameAr] nvarchar(100) NULL;
GO

CREATE TABLE [ProjectAnalysts] (
    [Id] int NOT NULL IDENTITY,
    [ProjectId] int NOT NULL,
    [AnalystId] int NOT NULL,
    CONSTRAINT [PK_ProjectAnalysts] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_ProjectAnalysts_Employees_AnalystId] FOREIGN KEY ([AnalystId]) REFERENCES [Employees] ([Id]) ON DELETE CASCADE,
    CONSTRAINT [FK_ProjectAnalysts_Projects_ProjectId] FOREIGN KEY ([ProjectId]) REFERENCES [Projects] ([Id]) ON DELETE CASCADE
);
GO

CREATE INDEX [IX_Units_ParentId] ON [Units] ([ParentId]);
GO

CREATE INDEX [IX_ProjectAnalysts_AnalystId] ON [ProjectAnalysts] ([AnalystId]);
GO

CREATE INDEX [IX_ProjectAnalysts_ProjectId] ON [ProjectAnalysts] ([ProjectId]);
GO

ALTER TABLE [Units] ADD CONSTRAINT [FK_Units_Units_ParentId] FOREIGN KEY ([ParentId]) REFERENCES [Units] ([Id]);
GO

INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
VALUES (N'20250921093944_RemoveAnalystIdsColumn', N'8.0.0');
GO

COMMIT;
GO

