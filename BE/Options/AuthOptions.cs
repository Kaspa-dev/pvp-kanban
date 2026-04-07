namespace BE.Options;

public sealed class AuthOptions
{
    public const string SectionName = "Auth";

    public string Issuer { get; set; } = "pvp-be";
    public string Audience { get; set; } = "pvp-fe";
    public string SigningKey { get; set; } = string.Empty;
    public int AccessTokenMinutes { get; set; } = 15;
    public int RefreshTokenDays { get; set; } = 7;
    public string RefreshTokenCookieName { get; set; } = "pvp_refresh_token";
}
