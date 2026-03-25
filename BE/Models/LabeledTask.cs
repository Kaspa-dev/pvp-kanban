namespace BE.Models;

public class LabeledTask
{
    public int Id { get; set; }
    public int LabelId { get; set; }
    public int TaskId { get; set; }

    public Label Label { get; set; } = null!;
    public Models.Task Task { get; set; } = null!;
}