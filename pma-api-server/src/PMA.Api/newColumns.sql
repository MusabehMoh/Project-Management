SELECT
p.Id,
p.ApplicationName AS ProjectName,
p.ProjectOwner,
p.OwningUnit,
p.ExpectedCompletionDate,
p.Status,
CASE p.Status
WHEN 2 THEN 'Under Study'
WHEN 3 THEN 'Under Development'
WHEN 4 THEN 'Under Testing'
ELSE 'Unknown'
END AS StatusName,
CASE p.Status
WHEN 2 THEN 'قيد الدراسة'
WHEN 3 THEN 'قيد التطوير'
WHEN 4 THEN 'قيد الاختبار' 
END AS StatusNameAr,
p.Progress,
COUNT(pr.Id) AS TotalRequirements,
SUM(CASE WHEN pr.Status >= 3 THEN 1 ELSE 0 END) AS CompletedRequirements,
CASE
WHEN COUNT(pr.Id) > 0 THEN (SUM(CASE WHEN pr.Status >= 3 THEN 1 ELSE 0 END) * 100 / COUNT(pr.Id))
ELSE 0
END AS CalculatedProgress
FROM
dbo.Projects p
LEFT JOIN
dbo.ProjectRequirements pr ON pr.ProjectId = p.Id
GROUP BY
p.Id,
p.ApplicationName,
p.ProjectOwner,
p.OwningUnit,
p.ExpectedCompletionDate,
p.Status,
p.Progress
ORDER BY
p.Status,
p.Id;