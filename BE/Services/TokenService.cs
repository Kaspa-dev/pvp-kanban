using BE.Models;
using BE.Options;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;

namespace BE.Services;

public interface ITokenService
{
    TokenResult CreateAccessToken(User user);
    string GenerateRefreshToken();
    string HashRefreshToken(string refreshToken);
}

public sealed record TokenResult(string AccessToken, DateTime ExpiresAtUtc);

public sealed class TokenService(IOptions<AuthOptions> authOptions) : ITokenService
{
    private readonly AuthOptions _authOptions = authOptions.Value;

    public TokenResult CreateAccessToken(User user)
    {
        var expiresAtUtc = DateTime.UtcNow.AddMinutes(_authOptions.AccessTokenMinutes);
        var signingKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_authOptions.SigningKey));
        var credentials = new SigningCredentials(signingKey, SecurityAlgorithms.HmacSha256);

        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
            new(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new(JwtRegisteredClaimNames.Email, user.Email),
            new(ClaimTypes.Email, user.Email),
            new(ClaimTypes.Name, $"{user.FirstName} {user.LastName}".Trim()),
            new("username", user.Username),
            new("displayName", $"{user.FirstName} {user.LastName}".Trim()),
        };

        var token = new JwtSecurityToken(
            issuer: _authOptions.Issuer,
            audience: _authOptions.Audience,
            claims: claims,
            notBefore: DateTime.UtcNow,
            expires: expiresAtUtc,
            signingCredentials: credentials);

        return new TokenResult(new JwtSecurityTokenHandler().WriteToken(token), expiresAtUtc);
    }

    public string GenerateRefreshToken()
    {
        return Convert.ToHexString(RandomNumberGenerator.GetBytes(64));
    }

    public string HashRefreshToken(string refreshToken)
    {
        byte[] tokenBytes = Encoding.UTF8.GetBytes(refreshToken);
        byte[] hashBytes = SHA256.HashData(tokenBytes);
        return Convert.ToHexString(hashBytes);
    }
}
