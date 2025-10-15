ALTER TABLE Teams
ADD UserName NVARCHAR(300),
 
    FullName NVARCHAR(300);

ALTER TABLE Teams
ALTER COLUMN PrsId INT NULL;

ALTER TABLE Projects
ALTER COLUMN AlternativeOwner nvarchar(100) NULL;
--EXEC sp_rename 'Users.IsVisible', 'IsActive', 'COLUMN';
