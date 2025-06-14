package registry

import (
	"webservices/src/services"

	"github.com/zishang520/socket.io/v2/socket"
)

type Services struct {
	User    *services.UserService
	Project *services.ProjectService
	Issue   *services.IssueService
	Notif   *services.NotificationService
	Comment *services.CommentService
	Item    *services.IssueItemService
	Mail    *services.MailService
	Report  *services.ReportService
}

func NewServices(repos *Repositories, io *socket.Server) *Services {
	return &Services{
		Mail:    services.NewMailService(repos.User, nil),
		User:    services.NewUserService(repos.User),
		Project: services.NewProjectService(io, repos.User, repos.Project, repos.Setting, repos.Activity, repos.UserProject),
		Issue:   services.NewIssueService(repos.Issue, repos.User, repos.Project, repos.Activity),
		Notif:   services.NewNotificationService(io, repos.User, repos.Project, repos.Issue, repos.Comment, repos.Notif, repos.UserProject),
		Comment: services.NewCommentService(repos.User, repos.Comment, repos.Issue, repos.Activity),
		Item:    services.NewIssueItemService(repos.Item, repos.Issue, repos.User, repos.Activity),
		Report:  services.NewReportService(repos.Report),
	}
}
