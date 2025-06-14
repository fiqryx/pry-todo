package middleware

import (
	"webservices/src/pkg/logger"
	"webservices/src/repo"
	"webservices/src/types"

	"github.com/gin-gonic/gin"
)

// Exchange supabase user to model user
func Auth(repo *repo.UserRepository) gin.HandlerFunc {
	return func(c *gin.Context) {
		var ctx types.UserSupabase
		if err := ctx.Get(c); err != nil {
			c.AbortWithStatusJSON(401, gin.H{"error": "Unauthorized"})
			return
		}

		user, err := repo.GetDetail(ctx.ID.String())
		if err != nil {
			c.AbortWithStatusJSON(401, gin.H{"error": "Unauthorized"})
			return
		}

		if err := repo.Heartbeat(user.ID); err != nil {
			logger.Errorf("error heartbeat: %s", err.Error())
		}

		c.Set("user", user)
		c.Next()
	}
}
