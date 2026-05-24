using System.Text.Json;
using BE.Models;
using BE.Services;
using TaskEntity = BE.Models.Task;
using TaskKind = BE.Models.Type;
using TaskStatusEntity = BE.Models.TaskStatus;

namespace BE.Data;

public static class DbSeeder
{
    private static readonly JsonSerializerOptions UserPreferenceJsonOptions = new(JsonSerializerDefaults.Web);

    private static readonly string[] StatusKeys =
    [
        "backlog",
        "todo",
        "inProgress",
        "inReview",
        "done",
    ];

    private static readonly string[] AllCoachmarkFlows =
    [
        "board-no-active-sprint",
        "board-active-sprint",
        "list-no-active-sprint",
        "list-active-sprint",
        "staging-planning",
        "staging-active-sprint",
        "backlog-overview",
        "history-overview",
        "board-statistics-overview",
        "board-settings-overview",
        "my-tasks-overview",
        "profile-overview",
        "profile-milestones-overview",
        "projects-empty-state",
        "projects-board-list",
    ];

    private static readonly string[] BoardAndProjectCoachmarkFlows =
    [
        "projects-board-list",
        "board-no-active-sprint",
        "list-no-active-sprint",
        "staging-planning",
        "backlog-overview",
    ];

    private static readonly string[] MemberColors =
    [
        "#3b82f6",
        "#10b981",
        "#8b5cf6",
        "#f59e0b",
        "#06b6d4",
        "#ec4899",
        "#ef4444",
        "#84cc16",
    ];

    public static void Seed(AppDbContext context)
    {
        DateTime now = DateTime.UtcNow;
        string sharedSeedPassword = Environment.GetEnvironmentVariable("SEED_PASSWORD") ?? "Slaptazodis@2026";

        Dictionary<string, User> users = EnsureUsers(context, now, sharedSeedPassword);
        context.SaveChanges();

        Dictionary<string, Board> boards = EnsureBoards(context, users, now);
        context.SaveChanges();

        EnsureBoardStatuses(context, boards);
        EnsureBoardMemberships(context, users, boards);
        EnsureBoardFavorites(context, users, boards);
        EnsureBoardColumnLimits(context, boards);
        context.SaveChanges();

        Dictionary<string, Label> labels = EnsureLabels(context, boards);
        Dictionary<string, OrganizationalUnit> teams = EnsureTeams(context, users, boards, now);
        context.SaveChanges();

        Dictionary<string, TaskEntity> tasks = EnsureTasks(context, users, boards, labels, teams, now);
        EnsurePlanningPoker(context, users, boards, tasks, now);
        EnsureXpEvents(context, users, boards, tasks, now);
        EnsureMilestones(context, users, now);
        context.SaveChanges();
    }

    private static Dictionary<string, User> EnsureUsers(
        AppDbContext context,
        DateTime now,
        string sharedSeedPassword)
    {
        var result = new Dictionary<string, User>(StringComparer.OrdinalIgnoreCase);

        foreach (UserSeedSpec spec in UserSeeds)
        {
            User? user = context.Users.FirstOrDefault(item => item.Username == spec.Username);
            if (user is null)
            {
                user = new User
                {
                    Username = spec.Username,
                    PasswordHash = PasswordHasher.HashPassword(GetSeedPassword(spec.Username, sharedSeedPassword)),
                    CreatedAt = now.AddDays(-spec.CreatedDaysAgo),
                };
                context.Users.Add(user);
            }

            user.Email = spec.Email;
            user.FirstName = spec.FirstName;
            user.LastName = spec.LastName;
            user.LastLogin = spec.LastLoginDaysAgo.HasValue
                ? now.AddDays(-spec.LastLoginDaysAgo.Value)
                : null;
            user.PreferencesJson = JsonSerializer.Serialize(
                new SeedUserPreferences
                {
                    CoachmarksEnabled = spec.CoachmarksEnabled,
                    CompletedFlows = spec.CompletedCoachmarkFlows.ToList(),
                },
                UserPreferenceJsonOptions);

            result[spec.Username] = user;
        }

        return result;
    }

    private static Dictionary<string, Board> EnsureBoards(
        AppDbContext context,
        IReadOnlyDictionary<string, User> users,
        DateTime now)
    {
        var result = new Dictionary<string, Board>(StringComparer.OrdinalIgnoreCase);

        foreach (BoardSeedSpec spec in BoardSeeds)
        {
            User owner = users[spec.OwnerUsername];
            Board? board = context.Boards.FirstOrDefault(item => item.Title == spec.Title);
            if (board is null)
            {
                board = new Board
                {
                    Title = spec.Title,
                    CreatedAt = now.AddDays(-spec.CreatedDaysAgo),
                };
                context.Boards.Add(board);
            }

            board.Description = spec.Description;
            board.CreatorId = owner.Id;
            board.LogoIconKey = spec.LogoIconKey;
            board.LogoColorKey = spec.LogoColorKey;

            result[spec.Key] = board;
        }

        return result;
    }

    private static void EnsureBoardStatuses(
        AppDbContext context,
        IReadOnlyDictionary<string, Board> boards)
    {
        foreach (Board board in boards.Values)
        {
            foreach (string statusKey in StatusKeys)
            {
                bool exists = context.TaskStatuses.Any(status =>
                    status.BoardId == board.Id &&
                    status.Title == statusKey);

                if (!exists)
                {
                    context.TaskStatuses.Add(new TaskStatusEntity
                    {
                        BoardId = board.Id,
                        Title = statusKey,
                    });
                }
            }
        }
    }

    private static void EnsureBoardMemberships(
        AppDbContext context,
        IReadOnlyDictionary<string, User> users,
        IReadOnlyDictionary<string, Board> boards)
    {
        foreach (BoardSeedSpec boardSpec in BoardSeeds)
        {
            Board board = boards[boardSpec.Key];
            List<string> usernames = boardSpec.MemberUsernames
                .Prepend(boardSpec.OwnerUsername)
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .ToList();

            for (int index = 0; index < usernames.Count; index += 1)
            {
                string username = usernames[index];
                User user = users[username];
                BoardMembership? membership = context.BoardMemberships.FirstOrDefault(item =>
                    item.BoardId == board.Id &&
                    item.UserId == user.Id);

                if (membership is null)
                {
                    membership = new BoardMembership
                    {
                        BoardId = board.Id,
                        UserId = user.Id,
                    };
                    context.BoardMemberships.Add(membership);
                }

                membership.Role = username.Equals(boardSpec.OwnerUsername, StringComparison.OrdinalIgnoreCase)
                    ? BoardRole.Owner
                    : BoardRole.Member;
                membership.Color = MemberColors[index % MemberColors.Length];
            }
        }
    }

    private static void EnsureBoardFavorites(
        AppDbContext context,
        IReadOnlyDictionary<string, User> users,
        IReadOnlyDictionary<string, Board> boards)
    {
        foreach (BoardSeedSpec boardSpec in BoardSeeds)
        {
            Board board = boards[boardSpec.Key];
            foreach (string username in boardSpec.FavoriteUsernames)
            {
                User user = users[username];
                bool exists = context.BoardFavorites.Any(item =>
                    item.BoardId == board.Id &&
                    item.UserId == user.Id);

                if (!exists)
                {
                    context.BoardFavorites.Add(new BoardFavorite
                    {
                        BoardId = board.Id,
                        UserId = user.Id,
                        CreatedAt = board.CreatedAt.AddDays(1),
                    });
                }
            }
        }
    }

    private static void EnsureBoardColumnLimits(
        AppDbContext context,
        IReadOnlyDictionary<string, Board> boards)
    {
        foreach (BoardSeedSpec boardSpec in BoardSeeds)
        {
            Board board = boards[boardSpec.Key];
            foreach (ColumnLimitSeed limitSpec in boardSpec.ColumnLimits)
            {
                BoardColumnLimit? limit = context.BoardColumnLimits.FirstOrDefault(item =>
                    item.BoardId == board.Id &&
                    item.StatusKey == limitSpec.StatusKey);

                if (limit is null)
                {
                    limit = new BoardColumnLimit
                    {
                        BoardId = board.Id,
                        StatusKey = limitSpec.StatusKey,
                    };
                    context.BoardColumnLimits.Add(limit);
                }

                limit.SoftLimit = limitSpec.SoftLimit;
                limit.HardLimit = limitSpec.HardLimit;
            }
        }
    }

    private static Dictionary<string, Label> EnsureLabels(
        AppDbContext context,
        IReadOnlyDictionary<string, Board> boards)
    {
        var result = new Dictionary<string, Label>(StringComparer.OrdinalIgnoreCase);

        foreach (LabelSeedSpec spec in LabelSeeds)
        {
            Board board = boards[spec.BoardKey];
            Label? label = context.Labels.FirstOrDefault(item =>
                item.BoardId == board.Id &&
                item.Title == spec.Title);

            if (label is null)
            {
                label = new Label
                {
                    BoardId = board.Id,
                    Title = spec.Title,
                };
                context.Labels.Add(label);
            }

            label.Color = spec.Color;
            result[BuildBoardScopedKey(board.Id, spec.Title)] = label;
        }

        return result;
    }

    private static Dictionary<string, OrganizationalUnit> EnsureTeams(
        AppDbContext context,
        IReadOnlyDictionary<string, User> users,
        IReadOnlyDictionary<string, Board> boards,
        DateTime now)
    {
        var result = new Dictionary<string, OrganizationalUnit>(StringComparer.OrdinalIgnoreCase);

        foreach (TeamSeedSpec spec in TeamSeeds)
        {
            Board board = boards[spec.BoardKey];
            User owner = users[spec.OwnerUsername];
            OrganizationalUnit? team = context.OrganizationalUnits.FirstOrDefault(item => item.Code == spec.Code);

            if (team is null)
            {
                team = new OrganizationalUnit
                {
                    Code = spec.Code,
                    CreatedAt = now.AddDays(-spec.CreatedDaysAgo),
                };
                context.OrganizationalUnits.Add(team);
            }

            team.Name = spec.Name;
            team.OwnerId = owner.Id;
            team.BoardId = board.Id;

            result[spec.Code] = team;
        }

        context.SaveChanges();

        foreach (TeamSeedSpec spec in TeamSeeds)
        {
            OrganizationalUnit team = result[spec.Code];
            List<string> usernames = spec.MemberUsernames
                .Prepend(spec.OwnerUsername)
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .ToList();

            for (int index = 0; index < usernames.Count; index += 1)
            {
                string username = usernames[index];
                User user = users[username];
                OrganizationalUnitMember? membership = context.OrganizationalUnitMembers.FirstOrDefault(item =>
                    item.OrganizationalUnitId == team.Id &&
                    item.UserId == user.Id);

                if (membership is null)
                {
                    membership = new OrganizationalUnitMember
                    {
                        OrganizationalUnitId = team.Id,
                        UserId = user.Id,
                        InvitedAt = now.AddDays(-Math.Max(1, spec.CreatedDaysAgo - index)),
                    };
                    context.OrganizationalUnitMembers.Add(membership);
                }

                membership.Role = username.Equals(spec.OwnerUsername, StringComparison.OrdinalIgnoreCase)
                    ? OuMemberRole.Admin
                    : OuMemberRole.Member;
                membership.Status = index % 4 == 3
                    ? OuMemberStatus.Invited
                    : OuMemberStatus.Active;
                membership.JoinedAt = membership.Status == OuMemberStatus.Active
                    ? membership.InvitedAt.AddDays(1)
                    : null;
            }
        }

        return result;
    }

    private static Dictionary<string, TaskEntity> EnsureTasks(
        AppDbContext context,
        IReadOnlyDictionary<string, User> users,
        IReadOnlyDictionary<string, Board> boards,
        IReadOnlyDictionary<string, Label> labels,
        IReadOnlyDictionary<string, OrganizationalUnit> teams,
        DateTime now)
    {
        var result = new Dictionary<string, TaskEntity>(StringComparer.OrdinalIgnoreCase);

        foreach (TaskSeedSpec spec in TaskSeeds)
        {
            Board board = boards[spec.BoardKey];
            TaskStatusEntity status = GetStatus(context, board.Id, spec.StatusKey);
            User reporter = users[spec.ReporterUsername];
            User? assignee = spec.AssigneeUsername is null ? null : users[spec.AssigneeUsername];
            User? concludedBy = spec.ConcludedByUsername is null ? null : users[spec.ConcludedByUsername];
            OrganizationalUnit? team = spec.TeamCode is null ? null : teams[spec.TeamCode];

            TaskEntity? task = context.Tasks.FirstOrDefault(item =>
                item.BoardId == board.Id &&
                item.Title == spec.Title);

            if (task is null)
            {
                task = new TaskEntity
                {
                    BoardId = board.Id,
                    Title = spec.Title,
                };
                context.Tasks.Add(task);
            }

            task.Description = spec.Description;
            task.StatusId = status.Id;
            task.ReporterId = reporter.Id;
            task.AssigneeId = assignee?.Id;
            task.TeamId = team?.Id;
            task.IsQueued = spec.IsQueued;
            task.ColumnPosition = spec.ColumnPosition;
            task.StoryPoints = spec.StoryPoints;
            task.Priority = spec.Priority;
            task.Type = spec.TaskType;
            task.DueDate = spec.DueInDays.HasValue ? now.Date.AddDays(spec.DueInDays.Value) : null;
            task.StatusEnteredAtUtc = now.AddDays(-spec.StatusAgeDays).AddMinutes(-spec.ColumnPosition);
            task.ConcludedAtUtc = spec.ConcludedDaysAgo.HasValue
                ? now.AddDays(-spec.ConcludedDaysAgo.Value)
                : null;
            task.ConcludedByUserId = task.ConcludedAtUtc.HasValue
                ? concludedBy?.Id ?? assignee?.Id
                : null;

            result[BuildTaskKey(spec.BoardKey, spec.Title)] = task;
        }

        context.SaveChanges();

        foreach (TaskSeedSpec spec in TaskSeeds)
        {
            Board board = boards[spec.BoardKey];
            TaskEntity task = result[BuildTaskKey(spec.BoardKey, spec.Title)];

            foreach (string labelTitle in spec.LabelTitles)
            {
                Label label = labels[BuildBoardScopedKey(board.Id, labelTitle)];
                bool exists = context.LabeledTasks.Any(item =>
                    item.LabelId == label.Id &&
                    item.TaskId == task.Id);

                if (!exists)
                {
                    context.LabeledTasks.Add(new LabeledTask
                    {
                        LabelId = label.Id,
                        TaskId = task.Id,
                    });
                }
            }

            foreach (CommentSeedSpec commentSpec in spec.Comments)
            {
                User author = users[commentSpec.AuthorUsername];
                bool exists = context.Comments.Any(item =>
                    item.TaskId == task.Id &&
                    item.Content == commentSpec.Content);

                if (!exists)
                {
                    context.Comments.Add(new Comment
                    {
                        TaskId = task.Id,
                        AuthorUserId = author.Id,
                        Content = commentSpec.Content,
                        CreatedAt = now.AddDays(-commentSpec.CreatedDaysAgo),
                    });
                }
            }
        }

        context.SaveChanges();
        return result;
    }

    private static void EnsurePlanningPoker(
        AppDbContext context,
        IReadOnlyDictionary<string, User> users,
        IReadOnlyDictionary<string, Board> boards,
        IReadOnlyDictionary<string, TaskEntity> tasks,
        DateTime now)
    {
        const string joinToken = "demo-lietuviskas-planavimas";
        Board board = boards["vilnius"];
        User host = users["jonas.kazlauskas"];

        PlanningPokerSession? session = context.PlanningPokerSessions.FirstOrDefault(item => item.JoinToken == joinToken);
        if (session is null)
        {
            session = new PlanningPokerSession
            {
                JoinToken = joinToken,
                CreatedAtUtc = now.AddDays(-1),
            };
            context.PlanningPokerSessions.Add(session);
        }

        session.BoardId = board.Id;
        session.HostUserId = host.Id;
        session.Status = "active";
        session.UpdatedAtUtc = now.AddMinutes(-15);
        context.SaveChanges();

        TaskEntity activeTask = tasks[BuildTaskKey("vilnius", "Įvertinti savitarnos krepšelio klaidą")];
        TaskEntity revealedTask = tasks[BuildTaskKey("vilnius", "Patikrinti prieinamumo klaviatūra srautą")];
        TaskEntity queuedTask = tasks[BuildTaskKey("vilnius", "Paruošti mokėjimų priminimų eskizą")];

        PlanningPokerSessionTask activeSessionTask = EnsurePlanningPokerTask(
            context,
            session,
            activeTask,
            position: 0,
            roundState: "voting",
            recommendedStoryPoints: null);
        PlanningPokerSessionTask revealedSessionTask = EnsurePlanningPokerTask(
            context,
            session,
            revealedTask,
            position: 1,
            roundState: "revealed",
            recommendedStoryPoints: 5);
        EnsurePlanningPokerTask(
            context,
            session,
            queuedTask,
            position: 2,
            roundState: "voting",
            recommendedStoryPoints: null);
        context.SaveChanges();

        session.ActiveSessionTaskId = activeSessionTask.Id;

        PlanningPokerParticipant hostParticipant = EnsurePlanningPokerParticipant(
            context,
            session,
            host,
            "Jonas Kazlauskas",
            "demo-jonas-planavimo-kortos",
            isHost: true);
        PlanningPokerParticipant rutaParticipant = EnsurePlanningPokerParticipant(
            context,
            session,
            users["ruta.petrauskaite"],
            "Rūta Petrauskaitė",
            "demo-ruta-planavimo-kortos",
            isHost: false);
        PlanningPokerParticipant mantasParticipant = EnsurePlanningPokerParticipant(
            context,
            session,
            users["mantas.vaitkus"],
            "Mantas Vaitkus",
            "demo-mantas-planavimo-kortos",
            isHost: false);
        PlanningPokerParticipant agneParticipant = EnsurePlanningPokerParticipant(
            context,
            session,
            users["agne.urbonaite"],
            "Agnė Urbonaitė",
            "demo-agne-planavimo-kortos",
            isHost: false);
        context.SaveChanges();

        EnsurePlanningPokerVote(context, revealedSessionTask, hostParticipant, 5, now.AddHours(-20));
        EnsurePlanningPokerVote(context, revealedSessionTask, rutaParticipant, 5, now.AddHours(-20).AddMinutes(2));
        EnsurePlanningPokerVote(context, revealedSessionTask, mantasParticipant, 8, now.AddHours(-20).AddMinutes(3));
        EnsurePlanningPokerVote(context, revealedSessionTask, agneParticipant, 5, now.AddHours(-20).AddMinutes(4));
        EnsurePlanningPokerVote(context, activeSessionTask, hostParticipant, 3, now.AddMinutes(-12));
        EnsurePlanningPokerVote(context, activeSessionTask, rutaParticipant, 5, now.AddMinutes(-10));
    }

    private static PlanningPokerSessionTask EnsurePlanningPokerTask(
        AppDbContext context,
        PlanningPokerSession session,
        TaskEntity task,
        int position,
        string roundState,
        int? recommendedStoryPoints)
    {
        PlanningPokerSessionTask? sessionTask = context.PlanningPokerSessionTasks.FirstOrDefault(item =>
            item.SessionId == session.Id &&
            item.TaskId == task.Id);

        if (sessionTask is null)
        {
            sessionTask = new PlanningPokerSessionTask
            {
                SessionId = session.Id,
                TaskId = task.Id,
            };
            context.PlanningPokerSessionTasks.Add(sessionTask);
        }

        sessionTask.Position = position;
        sessionTask.RoundState = roundState;
        sessionTask.RecommendedStoryPoints = recommendedStoryPoints;

        return sessionTask;
    }

    private static PlanningPokerParticipant EnsurePlanningPokerParticipant(
        AppDbContext context,
        PlanningPokerSession session,
        User user,
        string displayName,
        string participantToken,
        bool isHost)
    {
        PlanningPokerParticipant? participant = context.PlanningPokerParticipants.FirstOrDefault(item =>
            item.SessionId == session.Id &&
            item.UserId == user.Id);

        if (participant is null)
        {
            participant = new PlanningPokerParticipant
            {
                SessionId = session.Id,
                UserId = user.Id,
            };
            context.PlanningPokerParticipants.Add(participant);
        }

        participant.DisplayName = displayName;
        participant.ParticipantToken = participantToken;
        participant.IsHost = isHost;
        participant.IsGuest = false;
        participant.LastSeenAtUtc = DateTime.UtcNow.AddMinutes(isHost ? -2 : -8);

        return participant;
    }

    private static void EnsurePlanningPokerVote(
        AppDbContext context,
        PlanningPokerSessionTask sessionTask,
        PlanningPokerParticipant participant,
        int cardValue,
        DateTime submittedAtUtc)
    {
        PlanningPokerVote? vote = context.PlanningPokerVotes.FirstOrDefault(item =>
            item.SessionTaskId == sessionTask.Id &&
            item.ParticipantId == participant.Id);

        if (vote is null)
        {
            vote = new PlanningPokerVote
            {
                SessionTaskId = sessionTask.Id,
                ParticipantId = participant.Id,
            };
            context.PlanningPokerVotes.Add(vote);
        }

        vote.CardValue = cardValue;
        vote.SubmittedAtUtc = submittedAtUtc;
    }

    private static void EnsureXpEvents(
        AppDbContext context,
        IReadOnlyDictionary<string, User> users,
        IReadOnlyDictionary<string, Board> boards,
        IReadOnlyDictionary<string, TaskEntity> tasks,
        DateTime now)
    {
        foreach (XpProfileSeedSpec profile in XpProfiles)
        {
            User user = users[profile.Username];
            Board board = boards[profile.BoardKey];
            TaskEntity? sourceTask = profile.TaskTitle is null
                ? null
                : tasks[BuildTaskKey(profile.BoardKey, profile.TaskTitle)];

            for (int index = 0; index < profile.Amounts.Length; index += 1)
            {
                string awardKey = $"seed-xp:{profile.Username}:{index + 1:D2}";
                XpEvent? xpEvent = context.XpEvents.FirstOrDefault(item => item.AwardKey == awardKey);
                if (xpEvent is null)
                {
                    xpEvent = new XpEvent
                    {
                        AwardKey = awardKey,
                    };
                    context.XpEvents.Add(xpEvent);
                }

                xpEvent.UserId = user.Id;
                xpEvent.BoardId = board.Id;
                xpEvent.TaskId = sourceTask?.Id;
                xpEvent.Type = (index % 4) switch
                {
                    1 => "TASK_COMPLETED_EARLY",
                    2 => "TASK_COMPLETED_PRIORITY_HIGH",
                    3 => "TASK_COMPLETED_PRIORITY_CRITICAL",
                    _ => "TASK_COMPLETED",
                };
                xpEvent.XpAmount = profile.Amounts[index];
                xpEvent.ReversesXpEventId = null;
                xpEvent.CreatedAtUtc = now.AddDays(-profile.FirstEventDaysAgo + index);
                xpEvent.SourceSnapshotJson = JsonSerializer.Serialize(new
                {
                    saltinis = "Lietuviški demonstraciniai duomenys",
                    lenta = board.Title,
                    uzduotis = sourceTask?.Title,
                });
            }
        }
    }

    private static void EnsureMilestones(
        AppDbContext context,
        IReadOnlyDictionary<string, User> users,
        DateTime now)
    {
        foreach (MilestoneProgressSeedSpec progress in MilestoneProgressSeeds)
        {
            User user = users[progress.Username];
            EnsureMilestoneEvents(context, user.Id, progress.Username, "task-completed", progress.TaskCompletions, now);
            EnsureMilestoneEvents(context, user.Id, progress.Username, "board-created", progress.BoardsCreated, now);
            EnsureMilestoneEvents(context, user.Id, progress.Username, "board-member-invited", progress.BoardMembersInvited, now);
            EnsureMilestoneEvents(context, user.Id, progress.Username, "comment-created", progress.CommentsAuthored, now);
            EnsureMilestoneEvents(context, user.Id, progress.Username, "planning-poker-session-created", progress.PlanningPokerSessionsCreated, now);

            foreach (MilestoneDefinitionSeedSpec definition in MilestoneDefinitions)
            {
                int progressValue = definition.EventType switch
                {
                    "task-completed" => progress.TaskCompletions,
                    "board-created" => progress.BoardsCreated,
                    "board-member-invited" => progress.BoardMembersInvited,
                    "comment-created" => progress.CommentsAuthored,
                    "planning-poker-session-created" => progress.PlanningPokerSessionsCreated,
                    _ => 0,
                };

                if (progressValue < definition.TargetValue)
                {
                    continue;
                }

                UserMilestone? milestone = context.UserMilestones.FirstOrDefault(item =>
                    item.UserId == user.Id &&
                    item.MilestoneKey == definition.Key);

                if (milestone is null)
                {
                    milestone = new UserMilestone
                    {
                        UserId = user.Id,
                        MilestoneKey = definition.Key,
                        UnlockedAtUtc = now.AddDays(-Math.Max(1, definition.SortOrder / 10)),
                    };
                    context.UserMilestones.Add(milestone);
                }

                milestone.ProgressValue = Math.Max(milestone.ProgressValue, progressValue);
            }
        }
    }

    private static void EnsureMilestoneEvents(
        AppDbContext context,
        int userId,
        string username,
        string eventType,
        int count,
        DateTime now)
    {
        for (int index = 1; index <= count; index += 1)
        {
            string eventKey = $"seed:{username}:{eventType}:{index:D2}";
            UserMilestoneEvent? milestoneEvent = context.UserMilestoneEvents.FirstOrDefault(item =>
                item.EventType == eventType &&
                item.EventKey == eventKey);

            if (milestoneEvent is null)
            {
                milestoneEvent = new UserMilestoneEvent
                {
                    EventType = eventType,
                    EventKey = eventKey,
                };
                context.UserMilestoneEvents.Add(milestoneEvent);
            }

            milestoneEvent.UserId = userId;
            milestoneEvent.CreatedAtUtc = now.AddDays(-Math.Max(1, count - index + 1));
        }
    }

    private static TaskStatusEntity GetStatus(AppDbContext context, int boardId, string statusKey)
    {
        TaskStatusEntity? status = context.TaskStatuses.FirstOrDefault(item =>
            item.BoardId == boardId &&
            item.Title == statusKey);

        return status ?? throw new InvalidOperationException($"Missing seeded status '{statusKey}' for board {boardId}.");
    }

    private static string GetSeedPassword(string username, string sharedSeedPassword)
    {
        string normalizedUsername = new(username
            .Select(character => char.IsLetterOrDigit(character) ? char.ToUpperInvariant(character) : '_')
            .ToArray());
        return Environment.GetEnvironmentVariable($"SEED_PASSWORD_{normalizedUsername}") ?? sharedSeedPassword;
    }

    private static string BuildBoardScopedKey(int boardId, string value)
    {
        return $"{boardId}\u001f{value}";
    }

    private static string BuildTaskKey(string boardKey, string title)
    {
        return $"{boardKey}\u001f{title}";
    }

    private static readonly UserSeedSpec[] UserSeeds =
    [
        new(
            "jonas.kazlauskas",
            "jonas.kazlauskas@example.com",
            "Jonas",
            "Kazlauskas",
            CreatedDaysAgo: 95,
            LastLoginDaysAgo: 0,
            CoachmarksEnabled: true,
            CompletedCoachmarkFlows: AllCoachmarkFlows),
        new(
            "ruta.petrauskaite",
            "ruta.petrauskaite@example.com",
            "Rūta",
            "Petrauskaitė",
            CreatedDaysAgo: 88,
            LastLoginDaysAgo: 1,
            CoachmarksEnabled: true,
            CompletedCoachmarkFlows: BoardAndProjectCoachmarkFlows),
        new(
            "mantas.vaitkus",
            "mantas.vaitkus@example.com",
            "Mantas",
            "Vaitkus",
            CreatedDaysAgo: 79,
            LastLoginDaysAgo: 2,
            CoachmarksEnabled: true,
            CompletedCoachmarkFlows: []),
        new(
            "agne.urbonaite",
            "agne.urbonaite@example.com",
            "Agnė",
            "Urbonaitė",
            CreatedDaysAgo: 65,
            LastLoginDaysAgo: 6,
            CoachmarksEnabled: false,
            CompletedCoachmarkFlows: []),
        new(
            "tomas.jankauskas",
            "tomas.jankauskas@example.com",
            "Tomas",
            "Jankauskas",
            CreatedDaysAgo: 54,
            LastLoginDaysAgo: 4,
            CoachmarksEnabled: true,
            CompletedCoachmarkFlows: ["my-tasks-overview", "profile-overview"]),
        new(
            "ieva.paulauskaite",
            "ieva.paulauskaite@example.com",
            "Ieva",
            "Paulauskaitė",
            CreatedDaysAgo: 42,
            LastLoginDaysAgo: 12,
            CoachmarksEnabled: true,
            CompletedCoachmarkFlows: ["projects-empty-state"]),
        new(
            "saulius.balciunas",
            "saulius.balciunas@example.com",
            "Saulius",
            "Balčiūnas",
            CreatedDaysAgo: 130,
            LastLoginDaysAgo: 0,
            CoachmarksEnabled: true,
            CompletedCoachmarkFlows: AllCoachmarkFlows),
        new(
            "monika.zukauskaite",
            "monika.zukauskaite@example.com",
            "Monika",
            "Žukauskaitė",
            CreatedDaysAgo: 24,
            LastLoginDaysAgo: null,
            CoachmarksEnabled: true,
            CompletedCoachmarkFlows: []),
    ];

    private static readonly BoardSeedSpec[] BoardSeeds =
    [
        new(
            Key: "vilnius",
            Title: "Vilniaus produkto komanda",
            Description: "Pagrindinė savitarnos produkto lenta su aktyvia kūrimo eiga, klientų tyrimais ir planavimo pokeriu.",
            OwnerUsername: "jonas.kazlauskas",
            MemberUsernames: ["ruta.petrauskaite", "mantas.vaitkus", "agne.urbonaite", "tomas.jankauskas"],
            FavoriteUsernames: ["jonas.kazlauskas", "ruta.petrauskaite", "mantas.vaitkus"],
            LogoIconKey: "rocket",
            LogoColorKey: "blue",
            CreatedDaysAgo: 92,
            ColumnLimits:
            [
                new("todo", 8, 12),
                new("inProgress", 4, 6),
                new("inReview", 3, 5),
                new("done", 20, 20),
            ]),
        new(
            Key: "kaunas",
            Title: "Kauno platformos darbai",
            Description: "Techninės platformos, saugumo, API ir našumo darbų lenta su griežtesniais WIP limitais.",
            OwnerUsername: "saulius.balciunas",
            MemberUsernames: ["mantas.vaitkus", "tomas.jankauskas", "ieva.paulauskaite"],
            FavoriteUsernames: ["saulius.balciunas", "tomas.jankauskas"],
            LogoIconKey: "code2",
            LogoColorKey: "emerald",
            CreatedDaysAgo: 78,
            ColumnLimits:
            [
                new("todo", 4, 6),
                new("inProgress", 2, 3),
                new("inReview", 2, 3),
                new("done", 8, 10),
            ]),
        new(
            Key: "klaipeda",
            Title: "Klaipėdos klientų portalas",
            Description: "Klientų portalo patirties, mobiliųjų ekranų ir turinio kokybės darbai.",
            OwnerUsername: "ruta.petrauskaite",
            MemberUsernames: ["jonas.kazlauskas", "agne.urbonaite", "monika.zukauskaite", "ieva.paulauskaite"],
            FavoriteUsernames: ["ruta.petrauskaite", "agne.urbonaite", "monika.zukauskaite"],
            LogoIconKey: "palette",
            LogoColorKey: "rose",
            CreatedDaysAgo: 61,
            ColumnLimits:
            [
                new("todo", null, 14),
                new("inProgress", 8, 12),
                new("inReview", 6, 10),
                new("done", 18, 20),
            ]),
        new(
            Key: "analitika",
            Title: "Duomenų analitikos iniciatyvos",
            Description: "Ataskaitų, vadovybės rodiklių ir eksperimentų lenta su dalinai pritaikytais stulpelių limitais.",
            OwnerUsername: "ieva.paulauskaite",
            MemberUsernames: ["saulius.balciunas", "jonas.kazlauskas", "monika.zukauskaite"],
            FavoriteUsernames: ["ieva.paulauskaite", "saulius.balciunas"],
            LogoIconKey: "chartNoAxesColumn",
            LogoColorKey: "violet",
            CreatedDaysAgo: 47,
            ColumnLimits:
            [
                new("todo", 6, 9),
                new("inProgress", null, 8),
                new("done", 15, 20),
            ]),
    ];

    private static readonly LabelSeedSpec[] LabelSeeds =
    [
        new("vilnius", "Skubu", "#ef4444"),
        new("vilnius", "Klaida", "#f97316"),
        new("vilnius", "UX", "#8b5cf6"),
        new("vilnius", "API", "#06b6d4"),
        new("vilnius", "Prieiga", "#10b981"),
        new("vilnius", "Tyrimas", "#64748b"),
        new("kaunas", "Infra", "#0f766e"),
        new("kaunas", "Saugumas", "#dc2626"),
        new("kaunas", "Našumas", "#16a34a"),
        new("kaunas", "Duomenys", "#2563eb"),
        new("kaunas", "API", "#0891b2"),
        new("kaunas", "Kokybė", "#9333ea"),
        new("klaipeda", "Klientai", "#e11d48"),
        new("klaipeda", "Mobilu", "#0284c7"),
        new("klaipeda", "Mokėjimai", "#ca8a04"),
        new("klaipeda", "Klaida", "#f97316"),
        new("klaipeda", "Turinys", "#7c3aed"),
        new("klaipeda", "Skubu", "#dc2626"),
        new("klaipeda", "Kokybė", "#4f46e5"),
        new("analitika", "Ataskaita", "#2563eb"),
        new("analitika", "Duomenys", "#0d9488"),
        new("analitika", "Eksperimentas", "#9333ea"),
        new("analitika", "Vadovybė", "#be123c"),
        new("analitika", "Integracija", "#ea580c"),
        new("analitika", "Kokybė", "#4f46e5"),
    ];

    private static readonly TeamSeedSpec[] TeamSeeds =
    [
        new("VPK-PROD", "Produkto branduolys", "vilnius", "jonas.kazlauskas", ["ruta.petrauskaite", "mantas.vaitkus"], 90),
        new("VPK-UX", "Patirties grupė", "vilnius", "ruta.petrauskaite", ["agne.urbonaite", "tomas.jankauskas"], 84),
        new("KPF-CORE", "Platformos palaikymas", "kaunas", "saulius.balciunas", ["mantas.vaitkus", "tomas.jankauskas"], 75),
        new("KKP-CX", "Klientų patirtis", "klaipeda", "ruta.petrauskaite", ["agne.urbonaite", "monika.zukauskaite"], 58),
        new("DAI-BI", "Analitikos grupė", "analitika", "ieva.paulauskaite", ["saulius.balciunas", "monika.zukauskaite"], 44),
    ];

    private static readonly TaskSeedSpec[] TaskSeeds =
    [
        new(
            "vilnius",
            "Aprašyti naują komandų paiešką",
            "Paruošti trumpą vartotojų scenarijų rinkinį ir paieškos laukų taisykles.",
            "backlog",
            IsQueued: false,
            ColumnPosition: 0,
            ReporterUsername: "ruta.petrauskaite",
            AssigneeUsername: null,
            TeamCode: "VPK-PROD",
            LabelTitles: ["Tyrimas", "UX"],
            StoryPoints: null,
            DueInDays: 12,
            StatusAgeDays: 9,
            ConcludedDaysAgo: null,
            ConcludedByUsername: null,
            Priority: null,
            TaskType: TaskKind.Spike,
            Comments:
            [
                new("ruta.petrauskaite", "Reikia surinkti tris paieškos pavyzdžius iš klientų skambučių.", 8),
            ]),
        new(
            "vilnius",
            "Įvertinti savitarnos krepšelio klaidą",
            "Planavimo pokeriui paruošta klaida, kai krepšelis neatnaujina sumos po nuolaidos.",
            "backlog",
            IsQueued: true,
            ColumnPosition: 0,
            ReporterUsername: "jonas.kazlauskas",
            AssigneeUsername: "mantas.vaitkus",
            TeamCode: "VPK-PROD",
            LabelTitles: ["Klaida", "Skubu"],
            StoryPoints: null,
            DueInDays: 5,
            StatusAgeDays: 3,
            ConcludedDaysAgo: null,
            ConcludedByUsername: null,
            Priority: Priority.Critical,
            TaskType: TaskKind.Bug,
            Comments:
            [
                new("jonas.kazlauskas", "Klaida matoma tik kai taikomas rankinis nuolaidos kodas.", 2),
                new("mantas.vaitkus", "Reikės patikrinti ir krepšelio perskaičiavimo įvykį.", 1),
            ]),
        new(
            "vilnius",
            "Patikrinti prieinamumo klaviatūra srautą",
            "Įvertinti pagrindinį užsakymo srautą be pelės ir pažymėti kliūtis.",
            "backlog",
            IsQueued: true,
            ColumnPosition: 1,
            ReporterUsername: "agne.urbonaite",
            AssigneeUsername: "agne.urbonaite",
            TeamCode: "VPK-UX",
            LabelTitles: ["Prieiga", "UX"],
            StoryPoints: null,
            DueInDays: 8,
            StatusAgeDays: 4,
            ConcludedDaysAgo: null,
            ConcludedByUsername: null,
            Priority: Priority.High,
            TaskType: TaskKind.Task,
            Comments:
            [
                new("agne.urbonaite", "Sąrašą papildysiu po pirmo perėjimo per ekranus.", 3),
            ]),
        new(
            "vilnius",
            "Paruošti mokėjimų priminimų eskizą",
            "Sukurti pirmą eskizą, kaip klientas matys artėjantį mokėjimo terminą.",
            "backlog",
            IsQueued: true,
            ColumnPosition: 2,
            ReporterUsername: "ruta.petrauskaite",
            AssigneeUsername: null,
            TeamCode: "VPK-UX",
            LabelTitles: ["UX"],
            StoryPoints: null,
            DueInDays: 16,
            StatusAgeDays: 2,
            ConcludedDaysAgo: null,
            ConcludedByUsername: null,
            Priority: Priority.Medium,
            TaskType: TaskKind.Feature,
            Comments: []),
        new(
            "vilnius",
            "Suderinti išleidimo aprašą",
            "Parengti trumpą versijos aprašą klientų aptarnavimo komandai.",
            "todo",
            IsQueued: false,
            ColumnPosition: 0,
            ReporterUsername: "jonas.kazlauskas",
            AssigneeUsername: "ruta.petrauskaite",
            TeamCode: "VPK-PROD",
            LabelTitles: ["Tyrimas"],
            StoryPoints: 2,
            DueInDays: 3,
            StatusAgeDays: 1,
            ConcludedDaysAgo: null,
            ConcludedByUsername: null,
            Priority: Priority.Low,
            TaskType: TaskKind.Task,
            Comments: []),
        new(
            "vilnius",
            "Įdiegti profilio pasiekimų peržiūrą",
            "Sujungti profilio kortelę su pasiekimų santrauka ir paskutiniais ženkleliais.",
            "inProgress",
            IsQueued: false,
            ColumnPosition: 0,
            ReporterUsername: "jonas.kazlauskas",
            AssigneeUsername: "tomas.jankauskas",
            TeamCode: "VPK-PROD",
            LabelTitles: ["API", "UX"],
            StoryPoints: 5,
            DueInDays: 6,
            StatusAgeDays: 5,
            ConcludedDaysAgo: null,
            ConcludedByUsername: null,
            Priority: Priority.High,
            TaskType: TaskKind.Story,
            Comments:
            [
                new("tomas.jankauskas", "API atsakymas jau aiškus, liko sutvarkyti tuščios būsenos tekstą.", 2),
            ]),
        new(
            "vilnius",
            "Peržiūrėti filtrų tekstus",
            "Patikrinti, ar filtrų pavadinimai vienodai vartojami lentos ir mano užduočių puslapiuose.",
            "inReview",
            IsQueued: false,
            ColumnPosition: 0,
            ReporterUsername: "ruta.petrauskaite",
            AssigneeUsername: "agne.urbonaite",
            TeamCode: "VPK-UX",
            LabelTitles: ["UX"],
            StoryPoints: 3,
            DueInDays: 1,
            StatusAgeDays: 2,
            ConcludedDaysAgo: null,
            ConcludedByUsername: null,
            Priority: Priority.Medium,
            TaskType: TaskKind.Task,
            Comments: []),
        new(
            "vilnius",
            "Užbaigti pirmą pagalbos juostos versiją",
            "Pirmoji pagalbos juostos versija paruošta demonstracijai, bet dar neperkelta į istoriją.",
            "done",
            IsQueued: false,
            ColumnPosition: 0,
            ReporterUsername: "jonas.kazlauskas",
            AssigneeUsername: "mantas.vaitkus",
            TeamCode: "VPK-PROD",
            LabelTitles: ["Prieiga"],
            StoryPoints: 8,
            DueInDays: -1,
            StatusAgeDays: 1,
            ConcludedDaysAgo: null,
            ConcludedByUsername: null,
            Priority: Priority.High,
            TaskType: TaskKind.Feature,
            Comments: []),
        new(
            "vilnius",
            "Archyvuoti seną kvietimų srautą",
            "Senas kvietimų srautas pakeistas nauju komandų valdymu.",
            "done",
            IsQueued: false,
            ColumnPosition: 1,
            ReporterUsername: "jonas.kazlauskas",
            AssigneeUsername: "ruta.petrauskaite",
            TeamCode: "VPK-PROD",
            LabelTitles: ["API"],
            StoryPoints: 5,
            DueInDays: -12,
            StatusAgeDays: 14,
            ConcludedDaysAgo: 9,
            ConcludedByUsername: "ruta.petrauskaite",
            Priority: Priority.Medium,
            TaskType: TaskKind.Story,
            Comments: []),
        new(
            "kaunas",
            "Atnaujinti pranešimų eilės stebėjimą",
            "Papildyti stebėjimą eilės ilgiu, klaidų dalimi ir vėlavimo rodikliais.",
            "backlog",
            IsQueued: false,
            ColumnPosition: 0,
            ReporterUsername: "saulius.balciunas",
            AssigneeUsername: null,
            TeamCode: "KPF-CORE",
            LabelTitles: ["Infra", "Našumas"],
            StoryPoints: 13,
            DueInDays: 18,
            StatusAgeDays: 11,
            ConcludedDaysAgo: null,
            ConcludedByUsername: null,
            Priority: Priority.High,
            TaskType: TaskKind.Epic,
            Comments: []),
        new(
            "kaunas",
            "Įtraukti API raktų rotaciją",
            "Sukurti raktų rotacijos patikrą ir įspėjimą prieš galiojimo pabaigą.",
            "backlog",
            IsQueued: true,
            ColumnPosition: 0,
            ReporterUsername: "mantas.vaitkus",
            AssigneeUsername: "saulius.balciunas",
            TeamCode: "KPF-CORE",
            LabelTitles: ["Saugumas", "API"],
            StoryPoints: null,
            DueInDays: 7,
            StatusAgeDays: 4,
            ConcludedDaysAgo: null,
            ConcludedByUsername: null,
            Priority: Priority.Critical,
            TaskType: TaskKind.Feature,
            Comments:
            [
                new("saulius.balciunas", "Rotacijos langas turi būti matomas platformos suvestinėje.", 2),
            ]),
        new(
            "kaunas",
            "Sumažinti ataskaitų užklausų laiką",
            "Peržiūrėti lėčiausias užklausas ir pridėti trūkstamus indeksus.",
            "todo",
            IsQueued: false,
            ColumnPosition: 0,
            ReporterUsername: "ieva.paulauskaite",
            AssigneeUsername: "mantas.vaitkus",
            TeamCode: "KPF-CORE",
            LabelTitles: ["Duomenys", "Našumas"],
            StoryPoints: 8,
            DueInDays: 9,
            StatusAgeDays: 6,
            ConcludedDaysAgo: null,
            ConcludedByUsername: null,
            Priority: Priority.High,
            TaskType: TaskKind.Task,
            Comments: []),
        new(
            "kaunas",
            "Sutvarkyti klaidų žurnalo maskavimą",
            "Paslėpti jautrius laukus platformos klaidų žurnaluose.",
            "inProgress",
            IsQueued: false,
            ColumnPosition: 0,
            ReporterUsername: "saulius.balciunas",
            AssigneeUsername: "tomas.jankauskas",
            TeamCode: "KPF-CORE",
            LabelTitles: ["Saugumas", "Kokybė"],
            StoryPoints: 5,
            DueInDays: 2,
            StatusAgeDays: 7,
            ConcludedDaysAgo: null,
            ConcludedByUsername: null,
            Priority: Priority.Critical,
            TaskType: TaskKind.Bug,
            Comments: []),
        new(
            "kaunas",
            "Patikrinti migracijų paleidimą",
            "Peržiūrėti vietinės aplinkos migracijų paleidimą ir parašyti trumpą atmintinę komandai.",
            "inReview",
            IsQueued: false,
            ColumnPosition: 0,
            ReporterUsername: "mantas.vaitkus",
            AssigneeUsername: "saulius.balciunas",
            TeamCode: "KPF-CORE",
            LabelTitles: ["Kokybė"],
            StoryPoints: 3,
            DueInDays: 0,
            StatusAgeDays: 1,
            ConcludedDaysAgo: null,
            ConcludedByUsername: null,
            Priority: Priority.Medium,
            TaskType: TaskKind.Task,
            Comments: []),
        new(
            "kaunas",
            "Užbaigti sveikatos patikros galinį tašką",
            "Platformos sveikatos patikra paruošta naudoti stebėjimo sistemoje.",
            "done",
            IsQueued: false,
            ColumnPosition: 0,
            ReporterUsername: "saulius.balciunas",
            AssigneeUsername: "mantas.vaitkus",
            TeamCode: "KPF-CORE",
            LabelTitles: ["Infra"],
            StoryPoints: 3,
            DueInDays: -4,
            StatusAgeDays: 5,
            ConcludedDaysAgo: 3,
            ConcludedByUsername: "mantas.vaitkus",
            Priority: Priority.Low,
            TaskType: TaskKind.Task,
            Comments: []),
        new(
            "klaipeda",
            "Parengti portalo pradžios ekraną",
            "Sukurti aiškesnę pradžios ekrano struktūrą naujiems klientams.",
            "backlog",
            IsQueued: false,
            ColumnPosition: 0,
            ReporterUsername: "ruta.petrauskaite",
            AssigneeUsername: "monika.zukauskaite",
            TeamCode: "KKP-CX",
            LabelTitles: ["Klientai", "Turinys"],
            StoryPoints: 8,
            DueInDays: 21,
            StatusAgeDays: 10,
            ConcludedDaysAgo: null,
            ConcludedByUsername: null,
            Priority: Priority.Medium,
            TaskType: TaskKind.Feature,
            Comments: []),
        new(
            "klaipeda",
            "Ištaisyti prisijungimo per mobilų klaidą",
            "Kai kurie klientai lieka tame pačiame ekrane po sėkmingo prisijungimo telefonu.",
            "backlog",
            IsQueued: true,
            ColumnPosition: 0,
            ReporterUsername: "agne.urbonaite",
            AssigneeUsername: "jonas.kazlauskas",
            TeamCode: "KKP-CX",
            LabelTitles: ["Mobilu", "Klaida", "Skubu"],
            StoryPoints: null,
            DueInDays: 4,
            StatusAgeDays: 2,
            ConcludedDaysAgo: null,
            ConcludedByUsername: null,
            Priority: Priority.Critical,
            TaskType: TaskKind.Bug,
            Comments: []),
        new(
            "klaipeda",
            "Perrašyti pagalbos centro tekstus",
            "Sutrumpinti dažniausiai skaitomus pagalbos centro atsakymus.",
            "todo",
            IsQueued: false,
            ColumnPosition: 0,
            ReporterUsername: "monika.zukauskaite",
            AssigneeUsername: "monika.zukauskaite",
            TeamCode: "KKP-CX",
            LabelTitles: ["Turinys", "Klientai"],
            StoryPoints: 3,
            DueInDays: 11,
            StatusAgeDays: 4,
            ConcludedDaysAgo: null,
            ConcludedByUsername: null,
            Priority: Priority.Low,
            TaskType: TaskKind.Task,
            Comments: []),
        new(
            "klaipeda",
            "Pridėti mokėjimo kortelės būseną",
            "Rodyti klientui, kada kortelės patvirtinimas dar laukia banko atsakymo.",
            "inProgress",
            IsQueued: false,
            ColumnPosition: 0,
            ReporterUsername: "ruta.petrauskaite",
            AssigneeUsername: "ieva.paulauskaite",
            TeamCode: "KKP-CX",
            LabelTitles: ["Mokėjimai", "Klientai"],
            StoryPoints: 5,
            DueInDays: 6,
            StatusAgeDays: 8,
            ConcludedDaysAgo: null,
            ConcludedByUsername: null,
            Priority: Priority.High,
            TaskType: TaskKind.Story,
            Comments: []),
        new(
            "klaipeda",
            "Peržiūrėti pranešimų toną",
            "Įsitikinti, kad klaidų pranešimai trumpi ir aiškūs.",
            "inReview",
            IsQueued: false,
            ColumnPosition: 0,
            ReporterUsername: "agne.urbonaite",
            AssigneeUsername: "ruta.petrauskaite",
            TeamCode: "KKP-CX",
            LabelTitles: ["Turinys", "Kokybė"],
            StoryPoints: 2,
            DueInDays: 2,
            StatusAgeDays: 1,
            ConcludedDaysAgo: null,
            ConcludedByUsername: null,
            Priority: Priority.Medium,
            TaskType: TaskKind.Task,
            Comments: []),
        new(
            "klaipeda",
            "Užbaigti naują kontaktų formą",
            "Nauja kontaktų forma veikia ir laukia perkėlimo į istoriją.",
            "done",
            IsQueued: false,
            ColumnPosition: 0,
            ReporterUsername: "ruta.petrauskaite",
            AssigneeUsername: "agne.urbonaite",
            TeamCode: "KKP-CX",
            LabelTitles: ["Klientai"],
            StoryPoints: 5,
            DueInDays: -2,
            StatusAgeDays: 2,
            ConcludedDaysAgo: null,
            ConcludedByUsername: null,
            Priority: Priority.High,
            TaskType: TaskKind.Feature,
            Comments: []),
        new(
            "klaipeda",
            "Archyvuoti seną mobilų meniu",
            "Senas mobilus meniu pakeistas trumpesne navigacija.",
            "done",
            IsQueued: false,
            ColumnPosition: 1,
            ReporterUsername: "agne.urbonaite",
            AssigneeUsername: "monika.zukauskaite",
            TeamCode: "KKP-CX",
            LabelTitles: ["Mobilu"],
            StoryPoints: 3,
            DueInDays: -15,
            StatusAgeDays: 16,
            ConcludedDaysAgo: 12,
            ConcludedByUsername: "monika.zukauskaite",
            Priority: Priority.Medium,
            TaskType: TaskKind.Task,
            Comments: []),
        new(
            "analitika",
            "Sudaryti vadovybės rodiklių sąrašą",
            "Sutarti dėl pirmų penkių rodiklių, kurie bus matomi vadovybės suvestinėje.",
            "backlog",
            IsQueued: false,
            ColumnPosition: 0,
            ReporterUsername: "ieva.paulauskaite",
            AssigneeUsername: "saulius.balciunas",
            TeamCode: "DAI-BI",
            LabelTitles: ["Vadovybė", "Ataskaita"],
            StoryPoints: 5,
            DueInDays: 13,
            StatusAgeDays: 7,
            ConcludedDaysAgo: null,
            ConcludedByUsername: null,
            Priority: Priority.High,
            TaskType: TaskKind.Story,
            Comments: []),
        new(
            "analitika",
            "Paruošti eksperimentų rezultatų lentelę",
            "Sukurti suvestinę, kurioje matosi aktyvūs eksperimentai ir jų poveikis.",
            "backlog",
            IsQueued: true,
            ColumnPosition: 0,
            ReporterUsername: "ieva.paulauskaite",
            AssigneeUsername: "monika.zukauskaite",
            TeamCode: "DAI-BI",
            LabelTitles: ["Eksperimentas", "Duomenys"],
            StoryPoints: null,
            DueInDays: 10,
            StatusAgeDays: 3,
            ConcludedDaysAgo: null,
            ConcludedByUsername: null,
            Priority: Priority.Medium,
            TaskType: TaskKind.Feature,
            Comments: []),
        new(
            "analitika",
            "Sujungti pardavimų duomenų šaltinį",
            "Prijungti pardavimų šaltinį prie bendros ataskaitų saugyklos.",
            "todo",
            IsQueued: false,
            ColumnPosition: 0,
            ReporterUsername: "saulius.balciunas",
            AssigneeUsername: "saulius.balciunas",
            TeamCode: "DAI-BI",
            LabelTitles: ["Integracija", "Duomenys"],
            StoryPoints: 8,
            DueInDays: 14,
            StatusAgeDays: 5,
            ConcludedDaysAgo: null,
            ConcludedByUsername: null,
            Priority: Priority.Critical,
            TaskType: TaskKind.Epic,
            Comments: []),
        new(
            "analitika",
            "Valyti pasikartojančius klientų įrašus",
            "Pašalinti dublikatus iš demonstracinio klientų duomenų rinkinio.",
            "inProgress",
            IsQueued: false,
            ColumnPosition: 0,
            ReporterUsername: "ieva.paulauskaite",
            AssigneeUsername: "ieva.paulauskaite",
            TeamCode: "DAI-BI",
            LabelTitles: ["Duomenys", "Kokybė"],
            StoryPoints: 3,
            DueInDays: 5,
            StatusAgeDays: 9,
            ConcludedDaysAgo: null,
            ConcludedByUsername: null,
            Priority: Priority.Medium,
            TaskType: TaskKind.Task,
            Comments:
            [
                new("ieva.paulauskaite", "Pirmas taisyklių rinkinys jau rastas, liko patikrinti kraštinius atvejus.", 3),
            ]),
        new(
            "analitika",
            "Patikrinti metrikų pavadinimus",
            "Peržiūrėti, ar rodiklių pavadinimai sutampa su vadovybės žodynu.",
            "inReview",
            IsQueued: false,
            ColumnPosition: 0,
            ReporterUsername: "monika.zukauskaite",
            AssigneeUsername: "jonas.kazlauskas",
            TeamCode: "DAI-BI",
            LabelTitles: ["Vadovybė", "Kokybė"],
            StoryPoints: 2,
            DueInDays: 1,
            StatusAgeDays: 1,
            ConcludedDaysAgo: null,
            ConcludedByUsername: null,
            Priority: Priority.Low,
            TaskType: TaskKind.Task,
            Comments: []),
        new(
            "analitika",
            "Užbaigti savaitinės ataskaitos eksportą",
            "Savaitinės ataskaitos eksportas jau paruoštas naudotojų bandymui.",
            "done",
            IsQueued: false,
            ColumnPosition: 0,
            ReporterUsername: "ieva.paulauskaite",
            AssigneeUsername: "saulius.balciunas",
            TeamCode: "DAI-BI",
            LabelTitles: ["Ataskaita"],
            StoryPoints: 5,
            DueInDays: -3,
            StatusAgeDays: 3,
            ConcludedDaysAgo: 2,
            ConcludedByUsername: "saulius.balciunas",
            Priority: Priority.High,
            TaskType: TaskKind.Feature,
            Comments: []),
    ];

    private static readonly XpProfileSeedSpec[] XpProfiles =
    [
        new("jonas.kazlauskas", "vilnius", "Archyvuoti seną kvietimų srautą", [420, 360, 240, 180], 35),
        new("ruta.petrauskaite", "vilnius", "Archyvuoti seną kvietimų srautą", [260, 180, 120], 28),
        new("mantas.vaitkus", "kaunas", "Užbaigti sveikatos patikros galinį tašką", [700, 520, 430, 310, 180], 40),
        new("agne.urbonaite", "klaipeda", "Užbaigti naują kontaktų formą", [80, 45], 14),
        new("tomas.jankauskas", "kaunas", "Patikrinti migracijų paleidimą", [220, 190, 140], 18),
        new("ieva.paulauskaite", "analitika", "Užbaigti savaitinės ataskaitos eksportą", [460, 390, 260], 31),
        new("saulius.balciunas", "analitika", "Užbaigti savaitinės ataskaitos eksportą", [900, 760, 620, 410, 300], 45),
        new("monika.zukauskaite", "klaipeda", "Archyvuoti seną mobilų meniu", [30], 6),
    ];

    private static readonly MilestoneProgressSeedSpec[] MilestoneProgressSeeds =
    [
        new("jonas.kazlauskas", TaskCompletions: 28, BoardsCreated: 2, BoardMembersInvited: 7, CommentsAuthored: 12, PlanningPokerSessionsCreated: 3),
        new("ruta.petrauskaite", TaskCompletions: 12, BoardsCreated: 1, BoardMembersInvited: 5, CommentsAuthored: 26, PlanningPokerSessionsCreated: 1),
        new("mantas.vaitkus", TaskCompletions: 51, BoardsCreated: 0, BoardMembersInvited: 0, CommentsAuthored: 8, PlanningPokerSessionsCreated: 0),
        new("agne.urbonaite", TaskCompletions: 3, BoardsCreated: 0, BoardMembersInvited: 1, CommentsAuthored: 2, PlanningPokerSessionsCreated: 0),
        new("tomas.jankauskas", TaskCompletions: 10, BoardsCreated: 0, BoardMembersInvited: 0, CommentsAuthored: 1, PlanningPokerSessionsCreated: 0),
        new("ieva.paulauskaite", TaskCompletions: 18, BoardsCreated: 1, BoardMembersInvited: 2, CommentsAuthored: 5, PlanningPokerSessionsCreated: 1),
        new("saulius.balciunas", TaskCompletions: 56, BoardsCreated: 5, BoardMembersInvited: 8, CommentsAuthored: 31, PlanningPokerSessionsCreated: 5),
        new("monika.zukauskaite", TaskCompletions: 1, BoardsCreated: 0, BoardMembersInvited: 0, CommentsAuthored: 0, PlanningPokerSessionsCreated: 0),
    ];

    private static readonly MilestoneDefinitionSeedSpec[] MilestoneDefinitions =
    [
        new("first-task-completed", "task-completed", 1, 10),
        new("tasks-completed-10", "task-completed", 10, 20),
        new("tasks-completed-25", "task-completed", 25, 30),
        new("tasks-completed-50", "task-completed", 50, 40),
        new("first-board-created", "board-created", 1, 50),
        new("boards-created-5", "board-created", 5, 60),
        new("first-member-invited", "board-member-invited", 1, 70),
        new("members-invited-5", "board-member-invited", 5, 80),
        new("first-comment-posted", "comment-created", 1, 90),
        new("comments-posted-25", "comment-created", 25, 100),
        new("first-planning-poker-session-created", "planning-poker-session-created", 1, 110),
        new("planning-poker-sessions-created-5", "planning-poker-session-created", 5, 120),
    ];

    private sealed class SeedUserPreferences
    {
        public bool CoachmarksEnabled { get; set; } = true;
        public List<string> CompletedFlows { get; set; } = new();
    }

    private sealed record UserSeedSpec(
        string Username,
        string Email,
        string FirstName,
        string LastName,
        int CreatedDaysAgo,
        int? LastLoginDaysAgo,
        bool CoachmarksEnabled,
        string[] CompletedCoachmarkFlows);

    private sealed record BoardSeedSpec(
        string Key,
        string Title,
        string Description,
        string OwnerUsername,
        string[] MemberUsernames,
        string[] FavoriteUsernames,
        string LogoIconKey,
        string LogoColorKey,
        int CreatedDaysAgo,
        ColumnLimitSeed[] ColumnLimits);

    private sealed record ColumnLimitSeed(
        string StatusKey,
        int? SoftLimit,
        int? HardLimit);

    private sealed record LabelSeedSpec(
        string BoardKey,
        string Title,
        string Color);

    private sealed record TeamSeedSpec(
        string Code,
        string Name,
        string BoardKey,
        string OwnerUsername,
        string[] MemberUsernames,
        int CreatedDaysAgo);

    private sealed record TaskSeedSpec(
        string BoardKey,
        string Title,
        string Description,
        string StatusKey,
        bool IsQueued,
        int ColumnPosition,
        string ReporterUsername,
        string? AssigneeUsername,
        string? TeamCode,
        string[] LabelTitles,
        int? StoryPoints,
        int? DueInDays,
        int StatusAgeDays,
        int? ConcludedDaysAgo,
        string? ConcludedByUsername,
        Priority? Priority,
        TaskKind? TaskType,
        CommentSeedSpec[] Comments);

    private sealed record CommentSeedSpec(
        string AuthorUsername,
        string Content,
        int CreatedDaysAgo);

    private sealed record XpProfileSeedSpec(
        string Username,
        string BoardKey,
        string? TaskTitle,
        int[] Amounts,
        int FirstEventDaysAgo);

    private sealed record MilestoneProgressSeedSpec(
        string Username,
        int TaskCompletions,
        int BoardsCreated,
        int BoardMembersInvited,
        int CommentsAuthored,
        int PlanningPokerSessionsCreated);

    private sealed record MilestoneDefinitionSeedSpec(
        string Key,
        string EventType,
        int TargetValue,
        int SortOrder);
}
