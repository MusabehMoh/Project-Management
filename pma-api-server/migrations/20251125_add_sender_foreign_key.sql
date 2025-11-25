  ALTER TABLE [ProjectRequirements]
ADD SentBy INT


  SET IDENTITY_INSERT [dbo].[Lookups] ON
  INSERT [dbo].[Lookups] ([Id], [Code], [Value], [Name], [NameAr], [Order], [IsActive], [CreatedAt], [UpdatedAt]) VALUES (26, N'RequirementStatus', 9, N'ReturnedToAnalyst', N'معاد إلى المحلل', 9, 1, NULL, NULL)
    INSERT [dbo].[Lookups] ([Id], [Code], [Value], [Name], [NameAr], [Order], [IsActive], [CreatedAt], [UpdatedAt]) VALUES (27, N'RequirementStatus', 10, N'ReturnedToAnalyst', N'معاد إلى المدير', 10, 1, NULL, NULL)
	SET IDENTITY_INSERT [dbo].[Lookups] OFF