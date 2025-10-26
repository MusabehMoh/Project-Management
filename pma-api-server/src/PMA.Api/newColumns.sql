ALTER TABLE Teams
ADD UserName NVARCHAR(300),
 
    FullName NVARCHAR(300);

ALTER TABLE Teams
ALTER COLUMN PrsId INT NULL;

ALTER TABLE Projects
ALTER COLUMN AlternativeOwner nvarchar(100) NULL;

ALTER TABLE [Projects]
DROP COLUMN Budget 


  ALTER TABLE [Projects]
ADD CreatedBy NVARCHAR(300)

  ALTER TABLE [Projects]
ADD UpdatedBy NVARCHAR(300)


ALTER TABLE [Projects]

DROP COLUMN Analysts 

EXEC sp_rename 'Users.IsVisible', 'IsActive', 'COLUMN';

ALTER TABLE Projects
ADD ResponsibleUnitManagerId INT NULL;

update Lookups set Name = N'Under Analysis' , NameAr = N'قيد التحليل' where id = 2

update Lookups set NameAr = N'عاجلة' where id = 16


CREATE TABLE [dbo].[ProjectRequirementStatusHistory](
    [Id] [int] IDENTITY(1,1) NOT NULL,
    [RequirementId] [int] NOT NULL,
    [FromStatus] [int] NOT NULL,
    [ToStatus] [int] NOT NULL,
    [CreatedBy] [int] NOT NULL,
    [CreatedAt] [datetime2](7) NOT NULL,
    [Reason] [nvarchar](500) NULL,
    CONSTRAINT [PK_ProjectRequirementStatusHistory] PRIMARY KEY CLUSTERED ([Id] ASC),
    CONSTRAINT [FK_StatusHistory_Requirements] 
        FOREIGN KEY([RequirementId]) 
        REFERENCES [dbo].[ProjectRequirements]([Id])
);

CREATE NONCLUSTERED INDEX IX_StatusHistory_RequirementId 
ON [dbo].[ProjectRequirementStatusHistory]([RequirementId], [CreatedAt] DESC);

USE [PMA]
GO
SET IDENTITY_INSERT [dbo].[Lookups] ON 
GO
 
INSERT [dbo].[Lookups] ([Id], [Code], [Value], [Name], [NameAr], [Order], [IsActive], [CreatedAt], [UpdatedAt]) VALUES (25, N'RequirementStatus', 7, N'Postponded', N'مؤجلة', 7, 1, NULL, NULL)
GO
SET IDENTITY_INSERT [dbo].[Lookups] OFF
GO

 USE [PMA]
GO

/****** Object:  Table [dbo].[TaskAttachments]    Script Date: 10/26/2025 8:06:25 PM ******/
SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO

CREATE TABLE [dbo].[TaskAttachments](
	[Id] [int] IDENTITY(1,1) NOT NULL,
	[FileName] [nvarchar](255) NOT NULL,
	[OriginalName] [nvarchar](255) NOT NULL,
	[FilePath] [nvarchar](500) NULL,
	[FileSize] [bigint] NOT NULL,
	[ContentType] [nvarchar](100) NULL,
	[UploadedAt] [datetime2](7) NOT NULL,
	[CreatedBy] [nvarchar](150) NULL,
	[TaskId] [int] NULL,
 CONSTRAINT [PK_TaskAttachments] PRIMARY KEY CLUSTERED 
(
	[Id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO

ALTER TABLE [dbo].[TaskAttachments]  WITH CHECK ADD  CONSTRAINT [FK_TaskAttachments_Tasks] FOREIGN KEY([TaskId])
REFERENCES [dbo].[Tasks] ([Id])
GO

ALTER TABLE [dbo].[TaskAttachments] CHECK CONSTRAINT [FK_TaskAttachments_Tasks]
GO




