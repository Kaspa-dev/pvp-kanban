using BE.Data;
using BE.DTOs;
using BE.Models;
using BE.Options;
using BE.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using System.Security.Claims;

namespace BE.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController(
    AppDbContext context,
    ITokenService tokenService,
    IOptions<AuthOptions> authOptions) : ControllerBase
{
    private readonly AppDbContext _context = context;
    private readonly ITokenService _tokenService = tokenService;
    private readonly AuthOptions _authOptions = authOptions.Value;

    [HttpPost("register")]
    public async Task<ActionResult<AuthResponseDto>> Register(RegisterRequestDto request, CancellationToken cancellationToken)
    {
        string email = request.Email.Trim().ToLowerInvariant();
        string username = request.Username.Trim();
        string firstName = request.FirstName.Trim();
        string lastName = request.LastName.Trim();

        string? validationError = ValidateRegistration(email, username, firstName, lastName, request.Password);
        if (validationError is not null)
        {
            return BadRequest(new AuthErrorDto { Message = validationError });
        }

        if (await _context.Users.AnyAsync(user => user.Email == email, cancellationToken))
        {
            return Conflict(new AuthErrorDto { Message = "Email is already registered." });
        }

        if (await _context.Users.AnyAsync(user => user.Username == username, cancellationToken))
        {
            return Conflict(new AuthErrorDto { Message = "Username is already taken." });
        }

        var user = new User
        {
            Email = email,
            Username = username,
            FirstName = firstName,
            LastName = lastName,
            PasswordHash = PasswordHasher.HashPassword(request.Password),
            CreatedAt = DateTime.UtcNow,
            LastLogin = DateTime.UtcNow,
        };

        _context.Users.Add(user);

        string refreshToken = _tokenService.GenerateRefreshToken();
        _context.RefreshTokens.Add(CreateRefreshTokenEntity(user, refreshToken));

        await _context.SaveChangesAsync(cancellationToken);

        var tokenResult = _tokenService.CreateAccessToken(user);
        AppendRefreshTokenCookie(refreshToken);

        return Ok(CreateAuthResponse(user, tokenResult));
    }

    [HttpPost("login")]
    public async Task<ActionResult<AuthResponseDto>> Login(LoginRequestDto request, CancellationToken cancellationToken)
    {
        string email = request.Email.Trim().ToLowerInvariant();
        if (string.IsNullOrWhiteSpace(email) || string.IsNullOrWhiteSpace(request.Password))
        {
            return BadRequest(new AuthErrorDto { Message = "Email and password are required." });
        }

        var user = await _context.Users.SingleOrDefaultAsync(candidate => candidate.Email == email, cancellationToken);
        if (user is null || !PasswordHasher.VerifyPassword(request.Password, user.PasswordHash))
        {
            return Unauthorized(new AuthErrorDto { Message = "Invalid email or password." });
        }

        user.LastLogin = DateTime.UtcNow;

        string refreshToken = _tokenService.GenerateRefreshToken();
        _context.RefreshTokens.Add(CreateRefreshTokenEntity(user, refreshToken));
        await _context.SaveChangesAsync(cancellationToken);

        var tokenResult = _tokenService.CreateAccessToken(user);
        AppendRefreshTokenCookie(refreshToken);

        return Ok(CreateAuthResponse(user, tokenResult));
    }

    [HttpPost("refresh")]
    public async Task<ActionResult<AuthResponseDto>> Refresh(CancellationToken cancellationToken)
    {
        string? refreshToken = GetRefreshTokenFromCookie();
        if (string.IsNullOrWhiteSpace(refreshToken))
        {
            ClearRefreshTokenCookie();
            return Unauthorized(new AuthErrorDto { Message = "Refresh token is missing." });
        }

        string refreshTokenHash = _tokenService.HashRefreshToken(refreshToken);
        var existingToken = await _context.RefreshTokens
            .Include(token => token.User)
            .SingleOrDefaultAsync(token => token.TokenHash == refreshTokenHash, cancellationToken);

        if (existingToken is null || existingToken.RevokedAtUtc is not null || existingToken.ExpiresAtUtc <= DateTime.UtcNow)
        {
            ClearRefreshTokenCookie();
            return Unauthorized(new AuthErrorDto { Message = "Refresh token is invalid or expired." });
        }

        existingToken.RevokedAtUtc = DateTime.UtcNow;

        string replacementToken = _tokenService.GenerateRefreshToken();
        string replacementTokenHash = _tokenService.HashRefreshToken(replacementToken);
        existingToken.ReplacedByTokenHash = replacementTokenHash;

        _context.RefreshTokens.Add(new RefreshToken
        {
            UserId = existingToken.UserId,
            TokenHash = replacementTokenHash,
            CreatedAtUtc = DateTime.UtcNow,
            ExpiresAtUtc = DateTime.UtcNow.AddDays(_authOptions.RefreshTokenDays),
        });

        existingToken.User.LastLogin = DateTime.UtcNow;
        await _context.SaveChangesAsync(cancellationToken);

        var tokenResult = _tokenService.CreateAccessToken(existingToken.User);
        AppendRefreshTokenCookie(replacementToken);

        return Ok(CreateAuthResponse(existingToken.User, tokenResult));
    }

    [Authorize]
    [HttpGet("me")]
    public async Task<ActionResult<AuthUserDto>> Me(CancellationToken cancellationToken)
    {
        if (!TryGetCurrentUserId(out int userId))
        {
            return Unauthorized();
        }

        var user = await _context.Users.SingleOrDefaultAsync(candidate => candidate.Id == userId, cancellationToken);
        return user is null ? Unauthorized() : Ok(ToAuthUserDto(user));
    }

    [HttpPost("logout")]
    public async Task<IActionResult> Logout(CancellationToken cancellationToken)
    {
        string? refreshToken = GetRefreshTokenFromCookie();
        if (!string.IsNullOrWhiteSpace(refreshToken))
        {
            string refreshTokenHash = _tokenService.HashRefreshToken(refreshToken);
            var existingToken = await _context.RefreshTokens
                .SingleOrDefaultAsync(token => token.TokenHash == refreshTokenHash, cancellationToken);

            if (existingToken is not null && existingToken.RevokedAtUtc is null)
            {
                existingToken.RevokedAtUtc = DateTime.UtcNow;
                await _context.SaveChangesAsync(cancellationToken);
            }
        }

        ClearRefreshTokenCookie();
        return NoContent();
    }

    private static string? ValidateRegistration(string email, string username, string firstName, string lastName, string password)
    {
        if (string.IsNullOrWhiteSpace(email))
        {
            return "Email is required.";
        }

        if (string.IsNullOrWhiteSpace(username))
        {
            return "Username is required.";
        }

        if (string.IsNullOrWhiteSpace(firstName) || string.IsNullOrWhiteSpace(lastName))
        {
            return "First name and last name are required.";
        }

        if (password.Length < 8)
        {
            return "Password must be at least 8 characters long.";
        }

        return null;
    }

    private RefreshToken CreateRefreshTokenEntity(User user, string refreshToken)
    {
        return new RefreshToken
        {
            User = user,
            TokenHash = _tokenService.HashRefreshToken(refreshToken),
            CreatedAtUtc = DateTime.UtcNow,
            ExpiresAtUtc = DateTime.UtcNow.AddDays(_authOptions.RefreshTokenDays),
        };
    }

    private AuthResponseDto CreateAuthResponse(User user, TokenResult tokenResult)
    {
        return new AuthResponseDto
        {
            AccessToken = tokenResult.AccessToken,
            ExpiresAtUtc = tokenResult.ExpiresAtUtc,
            User = ToAuthUserDto(user),
        };
    }

    private static AuthUserDto ToAuthUserDto(User user)
    {
        return new AuthUserDto
        {
            Id = user.Id,
            Email = user.Email,
            Username = user.Username,
            FirstName = user.FirstName,
            LastName = user.LastName,
            DisplayName = $"{user.FirstName} {user.LastName}".Trim(),
        };
    }

    private string? GetRefreshTokenFromCookie()
    {
        return Request.Cookies.TryGetValue(_authOptions.RefreshTokenCookieName, out string? token)
            ? token
            : null;
    }

    private void AppendRefreshTokenCookie(string refreshToken)
    {
        Response.Cookies.Append(_authOptions.RefreshTokenCookieName, refreshToken, new CookieOptions
        {
            HttpOnly = true,
            SameSite = SameSiteMode.Lax,
            Secure = Request.IsHttps,
            Expires = DateTimeOffset.UtcNow.AddDays(_authOptions.RefreshTokenDays),
            Path = "/api/auth",
        });
    }

    private void ClearRefreshTokenCookie()
    {
        Response.Cookies.Delete(_authOptions.RefreshTokenCookieName, new CookieOptions
        {
            Path = "/api/auth",
            SameSite = SameSiteMode.Lax,
            Secure = Request.IsHttps,
        });
    }

    private bool TryGetCurrentUserId(out int userId)
    {
        userId = 0;
        string? value =
            User.FindFirstValue(ClaimTypes.NameIdentifier) ??
            User.FindFirstValue(ClaimTypes.Sid) ??
            User.FindFirstValue("sub");

        return int.TryParse(value, out userId);
    }
}
