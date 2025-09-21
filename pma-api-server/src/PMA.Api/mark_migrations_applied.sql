-- Insert migration records to mark them as applied
INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
VALUES 
    ('20250915164401_InitialBaseline', '8.0.0'),
    ('20250915164702_RemoveTeamsTable', '8.0.0'),
    ('20250915164722_AddTeamsTable', '8.0.0'),
    ('20250921093944_RemoveAnalystIdsColumn', '8.0.0'),
    ('20250921095608_RemoveProjectAnalystIds', '8.0.0');