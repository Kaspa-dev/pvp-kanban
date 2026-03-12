namespace BE.Models;

public class Sprint
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public int BoardId { get; set; } = null!;

    public Board Board { get; set; } = null!;
    public ICollection<Models.Task> Tasks { get; set; } = new List<Models.Task>();

}