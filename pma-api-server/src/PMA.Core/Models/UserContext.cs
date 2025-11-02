namespace PMA.Core.Models
{
    public class UserContext
    {
        /// <summary>
        /// The actual Windows-authenticated user (never changes during impersonation)
        /// </summary>
        public string RealUserName { get; set; } = string.Empty;

        /// <summary>
        /// The username being impersonated (if impersonating), otherwise equals RealUserName
        /// </summary>
        public string UserName { get; set; } = string.Empty;

        /// <summary>
        /// The PRS ID of the authenticated user
        /// </summary>
        public string PrsId { get; set; } = string.Empty;

        /// <summary>
        /// Whether currently impersonating another user
        /// </summary>
        public bool IsImpersonating { get; set; }

        /// <summary>
        /// Whether the user is Windows authenticated
        /// </summary>
        public bool IsAuthenticated { get; set; }

        public static UserContext Anonymous => new() { IsAuthenticated = false };
    }
}
