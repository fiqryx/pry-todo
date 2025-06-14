package routes

import (
	"time"
	"webservices/registry"
	"webservices/src/middleware"

	"github.com/gin-gonic/gin"
	"github.com/zishang520/socket.io/v2/socket"
	"gorm.io/gorm"
)

func Api(io *socket.Server, db *gorm.DB, r *gin.RouterGroup) {
	// attachment := middleware.NewUploadFile("attachment", 1, 10, false, nil)
	rateLimit := middleware.RateLimiter(5, 1*time.Hour)
	repos := registry.NewRepositories(db)
	services := registry.NewServices(repos, io)
	ctrl := registry.NewControllers(services)

	router := r.Group("/", middleware.SupbaseAuth())
	router.GET("/user", ctrl.User.GetUser)
	router.POST("/user/register", rateLimit, ctrl.User.RegisterUser)

	verify := r.Group("/verify")
	{
		verify.POST("/project", ctrl.Notif.InviteProjectVerify)
	}

	auth := router.Group("/", middleware.Auth(repos.User))
	{
		auth.POST("/user/update", ctrl.User.UpdateUser)
		auth.GET("/notifications", ctrl.Notif.GetNotifications)
		auth.POST("/projects", ctrl.Project.GetProjects)

		project := auth.Group("/project")
		{
			project.GET("/active", ctrl.Project.GetProjectActive)
			project.POST("", ctrl.Project.Upsert)
			project.POST("/:id", ctrl.Project.ChangeProject)
			project.POST("/setting", ctrl.Project.UpdateSetting)
			project.DELETE("/:id", ctrl.Project.Delete)
			project.POST("/invite", rateLimit, ctrl.Notif.InviteProject)
			project.POST("/:id/teams/access", ctrl.Project.ChangeAccess)
			project.DELETE("/:id/teams", ctrl.Project.RemoveTeam)
		}

		issue := auth.Group("/issue")
		{
			issue.GET("", ctrl.Issue.GetIssues)
			issue.GET("/analytic", ctrl.Issue.AnalyticIssues)
			issue.POST("/board", ctrl.Issue.GetIssuesWithFilter)
			issue.GET("/:id", ctrl.Issue.GetIssueByID)
			issue.GET("/:id/activity", ctrl.Issue.GetActivitiesByIssue)
			issue.POST("", ctrl.Issue.Upsert)
			issue.POST("/order", ctrl.Issue.UpdateOrder)
			issue.POST("/move", ctrl.Issue.MoveParent)
			issue.DELETE("/parent/:id", ctrl.Issue.RemoveParent)
			issue.DELETE("/:id", ctrl.Issue.Delete)

			comment := issue.Group("/:id/comment")
			{
				comment.GET("", ctrl.Comment.GetComments)
				comment.POST("/create", ctrl.Comment.Create)
				comment.POST("/:comment_id", ctrl.Comment.Update)
				comment.DELETE("/:comment_id", ctrl.Comment.Delete)
			}

			item := issue.Group("/:id/item")
			{
				item.GET("", ctrl.Item.GetItems)
				item.POST("/create", ctrl.Item.Create)
				item.POST("/:item_id", ctrl.Item.Update)
				item.DELETE("/:item_id", ctrl.Item.Delete)
			}
		}

		report := auth.Group("/report")
		{
			report.GET("", ctrl.Report.GetReports)
			report.GET("/:id", ctrl.Report.GetByID)
			report.POST("", ctrl.Report.Create)
			report.DELETE("/:id", ctrl.Report.Delete)
		}
	}

	r.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok"})
	})
}
