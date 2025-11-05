USE [PMA]
GO

/****** Object:  View [dbo].[MawaredEmployees]    Script Date: 11/5/2025 11:14:33 AM ******/
SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO

CREATE VIEW [dbo].[MawaredEmployees]
AS
SELECT 
    Id,
    UserName,
    FullName,
    ISNULL(MilitaryNumber, '') AS MilitaryNumber,
    ISNULL(GradeName, '') AS GradeName,
    StatusId
FROM 
    [dbo].[MawaredEmployees1]

UNION ALL

SELECT 
    Id,
    UserName,
    FullName,
    ISNULL(CAST(MilitaryNumber AS NVARCHAR(MAX)), '') AS MilitaryNumber,
    ISNULL(GradeName, '') AS GradeName,
    1 AS StatusId
FROM 
    [dbo].[CompanyEmployees]
GO


