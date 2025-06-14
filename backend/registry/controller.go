package registry

import "webservices/src/controllers"

type Controllers struct {
	User    *controllers.UserController
	Project *controllers.ProjectController
	Issue   *controllers.IssueController
	Notif   *controllers.NotificationController
	Comment *controllers.CommentController
	Item    *controllers.IssueItemController
	Report  *controllers.ReportController
}

func NewControllers(services *Services) *Controllers {
	return &Controllers{
		User:    controllers.NewUserController(services.User),
		Project: controllers.NewProjectController(services.Project, services.Notif),
		Issue:   controllers.NewIssueController(services.Issue, services.Notif, services.Mail),
		Notif:   controllers.NewNotificationController(services.Mail, services.Project, services.Notif),
		Comment: controllers.NewCommentController(services.Comment, services.Notif),
		Item:    controllers.NewIssueItemController(services.Item),
		Report:  controllers.NewReportController(services.Report),
	}
}
