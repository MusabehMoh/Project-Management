USE [PMA]
GO

/****** Object:  Table [dbo].[DesignRequests]    Script Date: 10/7/2025 2:46:31 PM ******/
SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO

CREATE TABLE [dbo].[DesignRequests](
	[Id] [int] IDENTITY(1,1) NOT NULL,
	[TaskId] [int] NULL,
	[Notes] [nvarchar](max) NULL,
	[AssignedToPrsId] [int] NULL,
	[Status] [int] NULL,
	[DueDate] [datetime2](7) NULL,
	[CreatedAt] [datetime2](7) NULL,
	[UpdatedAt] [datetime2](7) NULL,
 CONSTRAINT [PK_DesignRequests] PRIMARY KEY CLUSTERED 
(
	[Id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO


USE [PMA]
GO

/****** Object:  Table [dbo].[TaskStatusHistory]    Script Date: 10/7/2025 2:46:42 PM ******/
SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO

CREATE TABLE [dbo].[TaskStatusHistory](
	[Id] [int] IDENTITY(1,1) NOT NULL,
	[TaskId] [int] NULL,
	[OldStatus] [int] NULL,
	[NewStatus] [int] NULL,
	[ChangedByPrsId] [int] NULL,
	[Comment] [nvarchar](max) NULL,
	[UpdatedAt] [datetime2](7) NULL,
 CONSTRAINT [PK_TaskStatusHistory] PRIMARY KEY CLUSTERED 
(
	[Id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO

ALTER TABLE [dbo].[TaskStatusHistory]  WITH CHECK ADD  CONSTRAINT [FK_TaskStatusHistory_Tasks] FOREIGN KEY([TaskId])
REFERENCES [dbo].[Tasks] ([Id])
GO

ALTER TABLE [dbo].[TaskStatusHistory] CHECK CONSTRAINT [FK_TaskStatusHistory_Tasks]
GO


