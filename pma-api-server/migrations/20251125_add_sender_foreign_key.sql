  ALTER TABLE [ProjectRequirements]
ADD SentBy INT


  SET IDENTITY_INSERT [dbo].[Lookups] ON
  INSERT [dbo].[Lookups] ([Id], [Code], [Value], [Name], [NameAr], [Order], [IsActive], [CreatedAt], [UpdatedAt]) VALUES (26, N'RequirementStatus', 9, N'ReturnedToAnalyst', N'معاد إلى المحلل', 9, 1, NULL, NULL)
    INSERT [dbo].[Lookups] ([Id], [Code], [Value], [Name], [NameAr], [Order], [IsActive], [CreatedAt], [UpdatedAt]) VALUES (27, N'RequirementStatus', 10, N'ReturnedToManager', N'معاد إلى المدير', 10, 1, NULL, NULL)
	SET IDENTITY_INSERT [dbo].[Lookups] OFF

    update [Lookups] set NameAr= N'عادي' where id=13
  update [Lookups] set NameAr= N'عاجل' where id=14
  update [Lookups] set NameAr= N'عاجل جدا' where id=15
  update [Lookups] set NameAr= N'فوري' where id=16 