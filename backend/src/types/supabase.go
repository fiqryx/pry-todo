package types

import (
	"errors"

	"github.com/gin-gonic/gin"
	supabase "github.com/supabase-community/gotrue-go/types"
)

type UserSupabase struct {
	*supabase.UserResponse
}

func (u *UserSupabase) Get(ctx *gin.Context) error {
	context, exist := ctx.Get("user")
	if !exist {
		return errors.New("unauthorized")
	}

	user, ok := context.(*supabase.UserResponse)
	if !ok {
		return errors.New("unauthorized")
	}

	*u = UserSupabase{user}

	return nil
}
