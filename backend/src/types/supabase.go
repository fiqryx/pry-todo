package types

import (
	"errors"

	"github.com/gin-gonic/gin"
)

type UserSupabase struct {
	ID string
}

func (u *UserSupabase) Get(ctx *gin.Context) error {
	contextID, exist := ctx.Get("user_id")
	if !exist {
		return errors.New("unauthorized")
	}

	userID, ok := contextID.(string)
	if !ok {
		return errors.New("unauthorized")
	}

	u.ID = userID

	return nil
}
