package middleware

import (
	"webservices/database"
	"webservices/src/repo"

	s "github.com/zishang520/socket.io/v2/socket"
)

func WebSocketAuth(userRepo *repo.UserRepository) s.NamespaceMiddleware {
	return func(socket *s.Socket, next func(*s.ExtendedError)) {
		auth := socket.Handshake().Auth
		if auth == nil {
			next(s.NewExtendedError("unauthorized", nil))
			return
		}

		token, ok := (auth.(map[string]any))["token"].(string)
		if !ok {
			next(s.NewExtendedError("unauthorized", nil))
			return
		}

		supabase := database.Supabase()
		supabaseAuth := supabase.Auth.WithToken(token)

		ctx, err := supabaseAuth.GetUser()
		if err != nil {
			next(s.NewExtendedError("unauthorized", nil))
			return
		}

		user, err := userRepo.GetByID(ctx.ID.String())
		if err != nil {
			next(s.NewExtendedError("unauthorized", nil))
			return
		}

		socket.SetData(map[string]any{"user": user})
		next(nil)
	}
}
