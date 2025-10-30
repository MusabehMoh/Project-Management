

ALTER TABLE DesignRequests
ADD DesignerTaskId INT

 ALTER TABLE Timelines
DROP CONSTRAINT FK_Timelines_ProjectRequirements_ProjectRequirementId;

ALTER TABLE [dbo].[Timelines]  WITH CHECK ADD  CONSTRAINT [FK_Timelines_ProjectRequirements_ProjectRequirementId] FOREIGN KEY([ProjectRequirementId])
REFERENCES [dbo].[ProjectRequirements] ([Id])
GO

ALTER TABLE [dbo].[Timelines] CHECK CONSTRAINT [FK_Timelines_ProjectRequirements_ProjectRequirementId]
GO

 
    ALTER TABLE [Projects]
DROP COLUMN [ProjectOwner]
  ALTER TABLE [Projects]
DROP COLUMN [AlternativeOwner]
  ALTER TABLE [Projects]
DROP COLUMN [OwningUnit]
