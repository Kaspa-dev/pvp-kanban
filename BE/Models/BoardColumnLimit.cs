namespace BE.Models;

public class BoardColumnLimit
{
    public int BoardId { get; set; }
    public string StatusKey { get; set; } = string.Empty;
    public int? SoftLimit { get; set; }
    public int? HardLimit { get; set; }

    public Board Board { get; set; } = null!;
}
