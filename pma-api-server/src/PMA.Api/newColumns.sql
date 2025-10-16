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
ADD CreatedBy NVARCHAR(300)
ALTER TABLE [Projects]
DROP COLUMN Analysts 

--EXEC sp_rename 'Users.IsVisible', 'IsActive', 'COLUMN';
