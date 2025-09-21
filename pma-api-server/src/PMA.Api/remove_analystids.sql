-- Remove AnalystIds column from Projects table if it exists
IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[Projects]') AND name = 'AnalystIds')
BEGIN
    DECLARE @var0 sysname;
    SELECT @var0 = [d].[name]
    FROM [sys].[default_constraints] [d]
    INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
    WHERE ([d].[parent_object_id] = OBJECT_ID(N'[Projects]') AND [c].[name] = N'AnalystIds');
    
    IF @var0 IS NOT NULL 
        EXEC(N'ALTER TABLE [Projects] DROP CONSTRAINT [' + @var0 + '];');
    
    ALTER TABLE [Projects] DROP COLUMN [AnalystIds];
    PRINT 'AnalystIds column removed from Projects table';
END
ELSE
BEGIN
    PRINT 'AnalystIds column does not exist in Projects table';
END