package registry

import (
	"webservices/src/repo"

	"gorm.io/gorm"
)

type Repositories struct {
	User        *repo.UserRepository
	Project     *repo.ProjectRepository
	Setting     *repo.ProjectSettingRepository
	Activity    *repo.ActivityRepository
	Issue       *repo.IssueRepository
	Notif       *repo.NotificationRepository
	Comment     *repo.CommentRepository
	Item        *repo.IssueItemRepository
	UserProject *repo.UserProjectRepository
	Report      *repo.ReportRepository
}

func NewRepositories(db *gorm.DB) *Repositories {
	return &Repositories{
		User:        repo.NewUserRepository(db),
		Project:     repo.NewProjectRepository(db),
		Setting:     repo.NewProjectSettingRepository(db),
		Activity:    repo.NewActivityRepository(db),
		Issue:       repo.NewIssueRepository(db),
		Notif:       repo.NewNotificationRepository(db),
		Comment:     repo.NewCommentRepository(db),
		Item:        repo.NewIssueItemRepository(db),
		UserProject: repo.NewUserProjectRepository(db),
		Report:      repo.NewReportRepository(db),
	}
}
