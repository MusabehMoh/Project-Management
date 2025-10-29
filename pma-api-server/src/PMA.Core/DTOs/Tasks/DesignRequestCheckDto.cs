namespace PMA.Core.DTOs;

public class DesignRequestCheckDto
{
    public bool HasDesignRequest { get; set; }
    public int? DesignRequestId { get; set; }
    public bool HasDesignerTask { get; set; }
    public int? DesignerTaskId { get; set; }
}
