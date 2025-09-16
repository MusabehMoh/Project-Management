-- Create Teams table manually
USE [PMA]
GO

IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Teams' AND xtype='U')
BEGIN
    CREATE TABLE [dbo].[Teams](
        [Id] [int] IDENTITY(1,1) NOT NULL,
        [PrsId] [int] NOT NULL,
        [DepartmentId] [int] NOT NULL,
        [JoinDate] [datetime2](7) NOT NULL,
        [IsActive] [bit] NOT NULL,
        [CreatedBy] [int] NULL,
        [CreatedAt] [datetime2](7) NOT NULL,
        [UpdatedAt] [datetime2](7) NOT NULL,
     CONSTRAINT [PK_Teams] PRIMARY KEY CLUSTERED
    (
        [Id] ASC
    )WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
    ) ON [PRIMARY]

    -- Add foreign key constraints
    ALTER TABLE [dbo].[Teams]  WITH CHECK ADD  CONSTRAINT [FK_Teams_Departments_DepartmentId] FOREIGN KEY([DepartmentId])
    REFERENCES [dbo].[Departments] ([Id])
    ON DELETE CASCADE

    ALTER TABLE [dbo].[Teams] CHECK CONSTRAINT [FK_Teams_Departments_DepartmentId]

    ALTER TABLE [dbo].[Teams]  WITH CHECK ADD  CONSTRAINT [FK_Teams_Employees_PrsId] FOREIGN KEY([PrsId])
    REFERENCES [dbo].[Employees] ([Id])
    ON DELETE CASCADE

    ALTER TABLE [dbo].[Teams] CHECK CONSTRAINT [FK_Teams_Employees_PrsId]

    ALTER TABLE [dbo].[Teams]  WITH CHECK ADD  CONSTRAINT [FK_Teams_Users_CreatedBy] FOREIGN KEY([CreatedBy])
    REFERENCES [dbo].[Users] ([Id])

    ALTER TABLE [dbo].[Teams] CHECK CONSTRAINT [FK_Teams_Users_CreatedBy]

    -- Add default constraint for IsActive
    ALTER TABLE [dbo].[Teams] ADD CONSTRAINT [DF_Teams_IsActive] DEFAULT ((1)) FOR [IsActive]

    PRINT 'Teams table created successfully'
END
ELSE
BEGIN
    PRINT 'Teams table already exists'
END
GO