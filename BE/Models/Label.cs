namespace BE.Models;

public class Label
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Color { get; set; } = "#64748b";
    public int BoardId { get; set; }
    
    public Board Board { get; set; } = null!;
    public ICollection<LabeledTask> LabeledTasks { get; set; } = new List<LabeledTask>();
}
