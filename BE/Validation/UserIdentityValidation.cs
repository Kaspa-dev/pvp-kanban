namespace BE.Validation;

public static class UserIdentityValidation
{
    public const int UsernameMinLength = 3;
    public const int UsernameMaxLength = 32;
    public const int NameMaxLength = 32;

    public static string? ValidateUsername(string username)
    {
        if (string.IsNullOrWhiteSpace(username))
        {
            return "Username is required.";
        }

        if (username.Length < UsernameMinLength)
        {
            return $"Username must be at least {UsernameMinLength} characters long.";
        }

        if (username.Length > UsernameMaxLength)
        {
            return $"Username can be up to {UsernameMaxLength} characters.";
        }

        return null;
    }

    public static string? ValidateFirstName(string firstName)
    {
        if (string.IsNullOrWhiteSpace(firstName))
        {
            return "First name is required.";
        }

        if (firstName.Length > NameMaxLength)
        {
            return $"First name can be up to {NameMaxLength} characters.";
        }

        return null;
    }

    public static string? ValidateLastName(string lastName)
    {
        if (string.IsNullOrWhiteSpace(lastName))
        {
            return "Last name is required.";
        }

        if (lastName.Length > NameMaxLength)
        {
            return $"Last name can be up to {NameMaxLength} characters.";
        }

        return null;
    }
}
