package registry

import (
	"webservices/database/factory"
	"webservices/src/model"
	"webservices/src/pkg/log"
	"webservices/src/pkg/structers"
	"webservices/src/types"

	"gorm.io/gorm"
)

var Database = &structers.DatabaseRegistry{
	Extensions: []string{
		"uuid-ossp",
	},
	Enums: []structers.Enum{
		{
			Name: "project_status",
			Values: []string{
				"active", "inactive", "done",
			},
		},
		{
			Name: "issue_status",
			Values: []string{
				"draft", "todo", "on_progress", "done",
			},
		},
		{
			Name: "issue_priority",
			Values: []string{
				"lowest", "low", "medium", "high", "highest",
			},
		},
		{
			Name: "assignment_method",
			Values: []string{
				"round_robin", "least_busy", "random",
			},
		},
		{
			Name: "time_unit",
			Values: []string{
				"minutes", "hours", "days",
			},
		},
		{
			Name: "issue_item_type",
			Values: []string{
				"attachment", "web_link", "link_work",
			},
		},
		{
			Name: "user_project_role",
			Values: []string{
				"viewer", "editor", "admin", "owner",
			},
		},
		{
			Name: "activity_type",
			Values: func() []string {
				var vals []string
				for _, v := range types.ActivityTypes {
					vals = append(vals, v.String())
				}
				return vals
			}(),
		},
		{
			Name: "notification_type",
			Values: func() []string {
				var vals []string
				for _, v := range types.NotificationTypes {
					vals = append(vals, v.String())
				}
				return vals
			}(),
		},
		{
			Name: "issue_type",
			Values: func() []string {
				var vals []string
				for _, v := range types.IssueTypes {
					vals = append(vals, v.String())
				}
				return vals
			}(),
		},
	},
	Models: []any{
		&model.User{},
		&model.Project{},
		&model.UserProject{},
		&model.ProjectSetting{},
		&model.Issue{},
		&model.Comment{},
		&model.IssueItem{},
		&model.RecentActivity{},
		&model.Notification{},
		&model.Report{},
	},
	Tables: []string{
		"users",
		"projects",
		"user_projects",
		"issues",
		"issue_items",
	},
	Factories: []func(*gorm.DB) error{
		func(db *gorm.DB) error {
			log.Info("Restoring projects data...")
			return factory.NewProjectFactory(db).CreateBatch(1)
		},
		func(db *gorm.DB) error {
			log.Info("Restoring users data...")
			return factory.NewUserFactory(db).CreateBatch(1)
		},
		func(db *gorm.DB) error {
			log.Info("Restoring user projects data...")
			return factory.NewUserProjectFactory(db).CreateBatch(1)
		},
		func(db *gorm.DB) error {
			log.Info("Restoring issues data...")
			return factory.NewIssueFactory(db).CreateBatch(1)
		},
		func(db *gorm.DB) error {
			log.Info("Restoring Issue items data...")
			return factory.NewIssueItemFactory(db).CreateBatch(1)
		},
	},
}
