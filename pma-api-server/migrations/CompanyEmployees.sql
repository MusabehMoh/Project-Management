USE [PMA]
GO

/****** Object:  Table [dbo].[CompanyEmployees]    Script Date: 11/5/2025 11:15:17 AM ******/
SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO

CREATE TABLE [dbo].[CompanyEmployees](
	[Id] [int] NOT NULL,
	[UserName] [nvarchar](500) NULL,
	[MilitaryNumber] [int] NULL,
	[FullName] [nvarchar](500) NULL,
	[GradeName] [nvarchar](500) NULL,
	[CreatedBy] [nvarchar](500) NULL,
	[UpdatedBy] [nvarchar](500) NULL,
	[CreatedAt] [datetime2](7) NULL,
	[UpdatedAt] [datetime2](7) NULL,
 CONSTRAINT [PK_CompanyEmployees] PRIMARY KEY CLUSTERED 
(
	[Id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO


