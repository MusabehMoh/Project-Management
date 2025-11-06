
 delete   FROM [PMA].[dbo].[RoleActions] where ActionId in(1,2,3,4,44,45,46,47,48,49) and RoleId=4 

 delete from UserActions  where ActionId in(44,45,46,47,48,49) and UserId in(select UserId from UserRoles where RoleId=4) 