namespace PMA.Core.Models
{
    public class UserContext
    {
        public string PrsId { get; set; } = string.Empty;
        public string UserName { get; set; } = string.Empty;
        public bool IsAuthenticated { get; set; }

        public static UserContext Anonymous => new() { IsAuthenticated = false };
    }
}
