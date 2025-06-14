package services

import (
	"fmt"
	"webservices/src/model"
	"webservices/src/pkg/common"
	"webservices/src/pkg/logger"
	"webservices/src/repo"
	"webservices/src/types"

	"github.com/zishang520/socket.io/v2/socket"
	"gorm.io/datatypes"
)

type NotificationService struct {
	*baseService
	userRepo        *repo.UserRepository
	issueRepo       *repo.IssueRepository
	projectRepo     *repo.ProjectRepository
	commentRepo     *repo.CommentRepository
	notifRepo       *repo.NotificationRepository
	userProjectRepo *repo.UserProjectRepository
}

func NewNotificationService(
	io *socket.Server,
	userRepo *repo.UserRepository,
	projectRepo *repo.ProjectRepository,
	issueRepo *repo.IssueRepository,
	commentRepo *repo.CommentRepository,
	notifRepo *repo.NotificationRepository,
	userProjectRepo *repo.UserProjectRepository,
) *NotificationService {
	return &NotificationService{
		baseService:     newBaseService(io),
		userRepo:        userRepo,
		projectRepo:     projectRepo,
		issueRepo:       issueRepo,
		commentRepo:     commentRepo,
		notifRepo:       notifRepo,
		userProjectRepo: userProjectRepo,
	}
}

func (s *NotificationService) GetByUser(userID string) ([]model.Notification, error) {
	return s.notifRepo.GetByUserID(userID)
}

func (s *NotificationService) Read(ID string) error {
	return s.notifRepo.Read(ID)
}

func (s *NotificationService) ReadAll(userID string) error {
	return s.notifRepo.ReadByUserID(userID)
}

func (s *NotificationService) PushIssue(user *model.User, issue *model.Issue, isNew bool) {
	project := user.Project
	settings := project.Setting

	notificationType := types.NotificationSystem
	if issue.AssigneeID != nil {
		notificationType = types.NotificationTask
	}

	var title, message string

	if issue.Status == types.IssueStatusDone {
		title = fmt.Sprintf("✅ Completed: %s", issue.Title)
		message = fmt.Sprintf(
			`Great work! %s marked this issue as completed: "%s"`,
			user.Name,
			issue.Title,
		)
	} else if isNew {
		title = fmt.Sprintf("📌 New Task: %s", issue.Title)
		message = fmt.Sprintf(
			`You've been assigned to a new task in project %s: "%s" Priority: %s. Click to view details`,
			project.Name,
			issue.Title,
			issue.Priority,
		)
	} else {
		title = fmt.Sprintf("🔄 Updated: %s", issue.Title)
		message = fmt.Sprintf(`The issue "%s" was updated: Click to see changes`, issue.Title)
	}

	action := "updated"
	if isNew {
		action = "created"
	}

	notification := model.Notification{
		Type:    notificationType,
		Title:   title,
		Message: message,
		Metadata: datatypes.JSONMap{
			"action":     action,
			"issue_id":   issue.ID,
			"parents":    issue.Parents,
			"project_id": issue.ProjectID,
			"link":       "/issues/" + issue.ID,
		},
	}

	recipients := make([]string, 0)

	if (settings == nil || settings.NotifyOnAssignment) &&
		issue.AssigneeID != nil &&
		*issue.AssigneeID != user.ID {
		recipients = append(recipients, *issue.AssigneeID)
	}

	for _, userID := range recipients {
		notification.UserID = userID
		if err := s.notifRepo.Create(&notification); err != nil {
			logger.Errorf("Failed to create notification for user %s: %v", userID, err)
			continue
		}
		s.emit(userID, "notification:push", notification)
	}
}

func (s *NotificationService) PushComment(user model.User, comment model.Comment) error {
	issue, err := s.issueRepo.GetByID(comment.IssueID)
	if err != nil {
		return err
	}

	recipients := make([]string, 0)

	// a) Issue assignee (if exists and not the commenter)
	if issue.AssigneeID != nil && *issue.AssigneeID != user.ID {
		recipients = append(recipients, *issue.AssigneeID)
	}

	// b) Issue reporter (if not the commenter)
	if issue.ReporterID != nil && *issue.ReporterID != user.ID {
		recipients = append(recipients, *issue.ReporterID)
	}

	// c) Issue creator (if not the commenter)
	if issue.CreatorID != nil && *issue.CreatorID != user.ID {
		recipients = append(recipients, *issue.CreatorID)
	}

	// d) Other commenters on the issue
	ids, err := s.commentRepo.GetUserIDs(issue.ID, user.ID)
	if err != nil {
		return err
	}

	recipients = common.SliceUnique(append(recipients, ids...))
	for _, ID := range recipients {
		notification := model.Notification{
			UserID: ID,
			Type:   "comment",
			Title:  fmt.Sprintf("💬 New comment on %s", issue.Title),
			Message: fmt.Sprintf("%s commented: %s",
				user.Name,
				common.Truncate(comment.Message, 120)),
			Metadata: datatypes.JSONMap{
				"comment_id": comment.ID,
				"issue_id":   issue.ID,
				"project_id": issue.ProjectID,
				"author_id":  user.ID,
			},
		}

		if err := s.notifRepo.Create(&notification); err != nil {
			logger.Errorf("failed to create comment notification: %s to %s", err, ID)
			continue
		}

		s.emit(ID, "notification:push", notification)
	}

	return nil
}

func (s *NotificationService) PushProjectInvite(project *model.Project, sender *model.User, receiver *model.User) error {
	notification := model.Notification{
		UserID: receiver.ID,
		Type:   types.NotificationMessage,
		Title:  fmt.Sprintf("🎉 You're invited to join '%s'!", project.Name),
		Message: fmt.Sprintf(
			"%s has invited you to collaborate on this project. Check your email to accept the invitation.",
			sender.Name),
		Metadata: datatypes.JSONMap{
			"project_id":   project.ID,
			"sender_id":    sender.ID,
			"receiver_id":  receiver.ID,
			"project_name": project.Name,
			"sender_name":  sender.Name,
		},
	}

	if err := s.notifRepo.Create(&notification); err != nil {
		logger.Errorf(
			"failed to create project invitation notification for user %s: %s",
			receiver.ID, err)
		return fmt.Errorf("failed to send project invitation: %w", err)
	}

	s.emit(receiver.ID, "notification:push", notification)

	return nil
}

func (s *NotificationService) PushTeamAccess(user *model.User, userProject *model.UserProject, isRemove bool) error {
	project, err := s.projectRepo.GetByID(userProject.ProjectID)
	if err != nil {
		return fmt.Errorf("failed to get project: %w", err)
	}

	var (
		title   string
		message string
		action  string
	)

	if isRemove {
		title = "Project Access Removed"
		message = fmt.Sprintf(
			"%s has removed your access to the project '%s'. You will no longer be able to contribute to this project.",
			user.Name,
			project.Name)
		action = "access_removed"
	} else {
		title = "Project Access Granted"
		message = fmt.Sprintf(
			"%s has granted you contributor access to the project '%s'. You may now access and contribute to this project.",
			user.Name,
			project.Name)
		action = "access_granted"
	}

	notification := model.Notification{
		UserID:  userProject.UserID,
		Type:    types.NotificationMessage,
		Title:   title,
		Message: message,
		Metadata: datatypes.JSONMap{
			"project_id":   project.ID,
			"sender_id":    user.ID,
			"receiver_id":  userProject.UserID,
			"project_name": project.Name,
			"sender_name":  user.Name,
			"action":       action,
		},
	}

	if err := s.notifRepo.Create(&notification); err != nil {
		return fmt.Errorf("failed to create %s notification: %w", action, err)
	}

	eventType := "access:update"
	if isRemove {
		eventType = "access:remove"
	}

	s.emit(userProject.UserID, "notification:push", notification)

	ids, err := s.userProjectRepo.GetUserIDs(project.ID)
	if err != nil {
		return err
	}

	if isRemove {
		ids = append(ids, userProject.UserID)
	}

	for _, id := range ids {
		s.emit(id, eventType, userProject) // realtime changes
	}

	return nil
}
